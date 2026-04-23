import { NextRequest, NextResponse } from "next/server";
import { orderService } from "../../orderService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import jsPDF from 'jspdf';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    // Verify that the order belongs to the current user
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Generate PDF invoice
    const pdfBuffer = generatePDFInvoice(order);

    // Return PDF response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { message: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

function generatePDFInvoice(order: any): Uint8Array {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Company Header
  doc.setFontSize(20);
  doc.text('Moha Weaves', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`Invoice #${order.id}`, 105, 30, { align: 'center' });
  
  // Order Information
  doc.setFontSize(12);
  doc.text('Order Information', 20, 50);
  doc.setFontSize(10);
  doc.text(`Order ID: #${order.id}`, 20, 58);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 20, 65);
  doc.text(`Status: ${order.status}`, 20, 72);
  doc.text(`Payment Method: ${order.paymentMethod || 'Razorpay'}`, 20, 79);
  
  // Shipping Information
  doc.setFontSize(12);
  doc.text('Shipping Information', 120, 50);
  doc.setFontSize(10);
  const shipping = typeof order.shippingAddress === 'object' ? order.shippingAddress : {};
  doc.text(`Name: ${shipping.name || 'N/A'}`, 120, 58);
  doc.text(`Address: ${shipping.address || 'N/A'}`, 120, 65);
  doc.text(`City: ${shipping.city || 'N/A'}`, 120, 72);
  doc.text(`Pincode: ${shipping.pincode || 'N/A'}`, 120, 79);
  doc.text(`Phone: ${order.phone || 'N/A'}`, 120, 86);
  
  // Items Table Header
  let yPosition = 100;
  doc.setFontSize(12);
  doc.text('Order Items', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.text('Product', 20, yPosition);
  doc.text('Qty', 100, yPosition);
  doc.text('Price', 120, yPosition);
  doc.text('Total', 160, yPosition);
  yPosition += 7;
  
  // Draw line under header
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 5;
  
  // Items
  order.items?.forEach((item: any) => {
    const productName = item.product?.name || 'Product';
    const quantity = item.quantity.toString();
    const price = `₹${parseFloat(item.price).toFixed(2)}`;
    const total = `₹${(parseFloat(item.price) * item.quantity).toFixed(2)}`;
    
    // Split long product names if needed
    const splitName = doc.splitTextToSize(productName, 70);
    
    doc.text(splitName, 20, yPosition);
    doc.text(quantity, 100, yPosition);
    doc.text(price, 120, yPosition);
    doc.text(total, 160, yPosition);
    
    yPosition += splitName.length * 5 + 3;
    
    // Add variant info if available
    if (item.variantId && item.product?.variants) {
      const selectedVariant = item.product.variants.find((v: any) => v.id === item.variantId);
      if (selectedVariant?.size) {
        doc.setFontSize(9);
        doc.text(`Size: ${selectedVariant.size}`, 25, yPosition);
        doc.setFontSize(10);
        yPosition += 5;
      }
    }
  });
  
  // Price Summary
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 8;
  
  doc.text('Price Summary', 140, yPosition);
  yPosition += 8;
  
  const subtotal = order.totalAmount || '0';
  doc.text(`Subtotal: ₹${parseFloat(subtotal).toFixed(2)}`, 140, yPosition);
  yPosition += 6;
  
  if (order.discountAmount && parseFloat(order.discountAmount) > 0) {
    doc.setTextColor(0, 128, 0);
    doc.text(`Discount: -₹${parseFloat(order.discountAmount).toFixed(2)}`, 140, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;
  }
  
  doc.setFontSize(12);
  doc.text(`Total: ₹${parseFloat(order.finalAmount).toFixed(2)}`, 140, yPosition);
  
  // Footer
  yPosition = 270;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your order! This is a computer-generated invoice.', 105, yPosition, { align: 'center' });
  doc.text('For any queries, please contact our customer support.', 105, yPosition + 5, { align: 'center' });
  
  return new Uint8Array(doc.output('arraybuffer'));
}
