import { NextRequest, NextResponse } from "next/server";
import { orderService } from "../../orderService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { db } from "@/lib/db";
import {
  onlineExchangeItems,
  onlineExchanges,
  refunds,
  returnItems,
  returnRequests,
} from "@/shared";
import { eq, inArray } from "drizzle-orm";
import jsPDF from "jspdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ensure y has room for `needed` mm; add a new page if not. Returns updated y. */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return 18;
  }
  return y;
}

/** Draw a thin horizontal rule */
function hRule(doc: jsPDF, y: number, x1 = 14, x2 = 196): void {
  doc.setDrawColor(200, 200, 200);
  doc.line(x1, y, x2, y);
  doc.setDrawColor(0, 0, 0);
}

/** Capitalise first letter, replace underscores with spaces */
function humanStatus(s: string): string {
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    const order = await orderService.getOrder(id);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // ── Fetch return / exchange info for each item ────────────────────────────
    const orderReturnRequests = await db
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.orderId, id));

    const returnRequestIds = orderReturnRequests.map((r) => r.id);

    const allReturnItems = returnRequestIds.length
      ? await db
          .select()
          .from(returnItems)
          .where(inArray(returnItems.returnRequestId, returnRequestIds))
      : [];

    const allRefunds = returnRequestIds.length
      ? await db
          .select()
          .from(refunds)
          .where(inArray(refunds.returnRequestId, returnRequestIds))
      : [];

    // orderItemId → { returnRequest, refund }
    const itemReturnMap: Record<string, { status: string; refundAmount?: string | null }> = {};
    for (const ri of allReturnItems) {
      const rr = orderReturnRequests.find((r) => r.id === ri.returnRequestId);
      if (!rr || rr.status === "return_cancelled") continue;
      const refund = allRefunds.find((rf) => rf.returnRequestId === rr.id);
      itemReturnMap[ri.orderItemId] = {
        status: rr.status,
        refundAmount: refund?.amount ?? rr.refundAmount,
      };
    }

    const orderExchanges = await db
      .select()
      .from(onlineExchanges)
      .where(eq(onlineExchanges.orderId, id));

    const exchangeIds = orderExchanges.map((e) => e.id);
    const allExchangeItems = exchangeIds.length
      ? await db
          .select()
          .from(onlineExchangeItems)
          .where(inArray(onlineExchangeItems.exchangeId, exchangeIds))
      : [];

    // orderItemId → exchange status
    const itemExchangeMap: Record<string, { status: string }> = {};
    for (const ei of allExchangeItems) {
      const exc = orderExchanges.find((e) => e.id === ei.exchangeId);
      if (!exc || exc.status === "exchange_cancelled") continue;
      itemExchangeMap[ei.orderItemId] = { status: exc.status };
    }

    // ── Generate PDF ──────────────────────────────────────────────────────────
    const pdfBuffer = generatePDFInvoice(order, itemReturnMap, itemExchangeMap);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { message: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

function generatePDFInvoice(
  order: any,
  itemReturnMap: Record<string, { status: string; refundAmount?: string | null }>,
  itemExchangeMap: Record<string, { status: string }>
): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica");

  // jsPDF helvetica does not support ₹ — use Rs.
  const rs = "Rs.";

  const pageW = 210;
  const marginL = 14;
  const marginR = 196;
  const col2 = 110; // right column start

  let y = 14;

  // ── HEADER ─────────────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Urumi", pageW / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Premium Fashion | support@urumibymounika.com",
    pageW / 2,
    y,
    { align: "center" }
  );
  doc.setTextColor(0, 0, 0);
  y += 5;

  hRule(doc, y);
  y += 4;

  // ── INVOICE TITLE + META ───────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", marginL, y);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.text(`Invoice Date: ${invoiceDate}`, marginR, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y += 5;

  // ── TWO-COLUMN: ORDER INFO  |  SHIPPING INFO ───────────────────────────────
  const blockStartY = y;

  // Left — Order details
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("ORDER DETAILS", marginL, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const leftLines: [string, string][] = [
    ["Order ID", `#${order.id}`],
    ["Order Date", orderDate],
    ["Status", humanStatus(order.status)],
    ["Payment", humanStatus(order.paymentMethod || "razorpay")],
  ];

  if (order.razorpayPaymentId) {
    leftLines.push(["Payment ID", order.razorpayPaymentId]);
  }
  if (order.trackingNumber) {
    leftLines.push(["Tracking No.", order.trackingNumber]);
  } else if (order.delhiveryWaybill) {
    leftLines.push(["Waybill", order.delhiveryWaybill]);
  }
  if (order.estimatedDelivery) {
    leftLines.push([
      "Est. Delivery",
      new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    ]);
  }

  let leftY = y;
  for (const [label, value] of leftLines) {
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`${label}:`, marginL, leftY);
    doc.setTextColor(0, 0, 0);
    doc.text(value, marginL + 26, leftY);
    leftY += 4;
  }

  // Right — Shipping address
  let rightY = blockStartY;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("SHIP TO", col2, rightY);
  rightY += 4;

  doc.setFont("helvetica", "normal");
  const shipping =
    typeof order.shippingAddress === "object" && order.shippingAddress !== null
      ? order.shippingAddress
      : {};

  const shipPhone = shipping.phone || order.phone || "";
  const shipLines: string[] = [
    shipping.name || "",
    shipping.address || "",
    [shipping.locality, shipping.city].filter(Boolean).join(", "),
    [shipping.state, shipping.pincode].filter(Boolean).join(" - "),
    shipPhone ? `Ph: ${shipPhone}` : "",
    order.email ? `Email: ${order.email}` : "",
  ].filter(Boolean);

  for (const line of shipLines) {
    doc.setFontSize(6.5);
    doc.text(line, col2, rightY);
    rightY += 3.8;
  }

  y = Math.max(leftY, rightY) + 4;

  hRule(doc, y);
  y += 4;

  // ── ITEMS TABLE ────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");

  // Column positions
  const colProduct = marginL;
  const colSize    = 100;
  const colQty     = 120;
  const colMrp     = 138;
  const colPrice   = 158;
  const colTotal   = 178;

  doc.text("Product", colProduct, y);
  doc.text("Size", colSize, y);
  doc.text("Qty", colQty, y);
  doc.text("MRP", colMrp, y);
  doc.text("Price", colPrice, y);
  doc.text("Total", colTotal, y);
  y += 2;
  hRule(doc, y);
  y += 4;

  doc.setFont("helvetica", "normal");

  for (const item of order.items ?? []) {
    const productName: string = item.product?.name || "Product";
    const splitName: string[] = doc.splitTextToSize(productName, 82);
    const rowH = splitName.length * 3.8 + 3;

    y = ensureSpace(doc, y, rowH + 10);

    const selectedVariant = item.variantId
      ? item.product?.variants?.find((v: any) => v.id === item.variantId)
      : item.product?.variants?.[0];

    const size = selectedVariant?.size || "-";
    const qty = String(item.quantity);
    const mrp = item.productPrice
      ? `${rs} ${parseFloat(item.productPrice).toFixed(2)}`
      : "-";
    const price = `${rs} ${parseFloat(item.price).toFixed(2)}`;
    const total = `${rs} ${(parseFloat(item.price) * item.quantity).toFixed(2)}`;

    doc.setFontSize(6.5);
    doc.text(splitName, colProduct, y);
    doc.text(size, colSize, y);
    doc.text(qty, colQty, y);

    // MRP — strike-through style: grey if discounted
    if (item.productPrice && parseFloat(item.productPrice) !== parseFloat(item.price)) {
      doc.setTextColor(150, 150, 150);
      doc.text(mrp, colMrp, y);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.text("-", colMrp, y);
    }

    doc.text(price, colPrice, y);
    doc.text(total, colTotal, y);

    y += splitName.length * 3.8 + 1;

    // Return / Exchange badge
    const returnEntry = itemReturnMap[item.id];
    const exchangeEntry = itemExchangeMap[item.id];

    if (returnEntry) {
      doc.setFontSize(6);
      doc.setTextColor(180, 60, 0);
      doc.text(
        `[RETURN: ${humanStatus(returnEntry.status)}${
          returnEntry.refundAmount
            ? ` | Refund: ${rs} ${parseFloat(returnEntry.refundAmount).toFixed(2)}`
            : ""
        }]`,
        colProduct + 2,
        y
      );
      doc.setTextColor(0, 0, 0);
      y += 3.5;
    } else if (exchangeEntry) {
      doc.setFontSize(6);
      doc.setTextColor(0, 80, 160);
      doc.text(
        `[EXCHANGE: ${humanStatus(exchangeEntry.status)}]`,
        colProduct + 2,
        y
      );
      doc.setTextColor(0, 0, 0);
      y += 3.5;
    }

    y += 1.5;
    hRule(doc, y, marginL, marginR);
    y += 3;
  }

  // ── PRICE SUMMARY ──────────────────────────────────────────────────────────
  y = ensureSpace(doc, y, 40);
  y += 2;

  const summaryX = 140;
  const summaryValX = marginR;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("PRICE SUMMARY", summaryX, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);

  const subtotal = order.items?.reduce(
    (sum: number, item: any) => sum + parseFloat(item.price) * item.quantity,
    0
  ) ?? 0;

  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal:", summaryX, y);
  doc.setTextColor(0, 0, 0);
  doc.text(`${rs} ${subtotal.toFixed(2)}`, summaryValX, y, { align: "right" });
  y += 4;

  // Item-level savings
  const itemSavings = order.items?.reduce((total: number, item: any) => {
    if (item.productPrice && item.discountedPrice) {
      return (
        total +
        (parseFloat(item.productPrice) - parseFloat(item.discountedPrice)) *
          item.quantity
      );
    }
    return total;
  }, 0) ?? 0;

  if (itemSavings > 0) {
    doc.setTextColor(0, 130, 0);
    doc.text("Item Savings:", summaryX, y);
    doc.text(`- ${rs} ${itemSavings.toFixed(2)}`, summaryValX, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 4;
  }

  // Coupon discount
  const couponDiscount = parseFloat(order.discountAmount || "0");
  if (couponDiscount > 0) {
    const couponLabel = order.couponCode
      ? `Coupon (${order.couponCode}${
          order.couponType === "percentage" && order.couponValue
            ? ` - ${order.couponValue}% off`
            : order.couponType === "fixed" && order.couponValue
            ? ` - ${rs} ${order.couponValue} off`
            : ""
        }):`
      : "Coupon Discount:";

    doc.setTextColor(0, 130, 0);
    doc.text(couponLabel, summaryX, y);
    doc.text(`- ${rs} ${couponDiscount.toFixed(2)}`, summaryValX, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y += 4;
  }

  // Shipping
  const shipping2 =
    parseFloat(order.finalAmount) - subtotal + couponDiscount;
  doc.setTextColor(80, 80, 80);
  doc.text("Shipping:", summaryX, y);
  doc.setTextColor(0, 0, 0);
  doc.text(
    shipping2 > 0.01 ? `${rs} ${shipping2.toFixed(2)}` : "FREE",
    summaryValX,
    y,
    { align: "right" }
  );
  y += 4;

  hRule(doc, y, summaryX, marginR);
  y += 3;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", summaryX, y);
  doc.text(
    `${rs} ${parseFloat(order.finalAmount).toFixed(2)}`,
    summaryValX,
    y,
    { align: "right" }
  );
  y += 2;

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const footerY = 287;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text(
    "Thank you for shopping with Urumi! This is a computer-generated invoice.",
    pageW / 2,
    footerY - 4,
    { align: "center" }
  );
  doc.text(
    "For queries, contact support@urumibymounika.com",
    pageW / 2,
    footerY,
    { align: "center" }
  );

  return new Uint8Array(doc.output("arraybuffer"));
}
