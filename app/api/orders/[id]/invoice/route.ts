import { NextRequest, NextResponse } from "next/server";
import { orderService } from "../../orderService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";

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

    // Generate a simple HTML invoice
    const invoiceHtml = generateInvoiceHTML(order);

    // Convert HTML to PDF response
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${id}.html"`,
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

function generateInvoiceHTML(order: any) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    return `¥${parseFloat(amount).toFixed(2)}`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${order.id}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-number {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .invoice-date {
            color: #666;
            margin-top: 5px;
        }
        .billing-section {
            margin-bottom: 30px;
        }
        .section-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .address {
            color: #666;
            line-height: 1.5;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #f8f9fa;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e5e5e5;
            font-weight: bold;
            color: #333;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e5e5;
        }
        .items-table .text-right {
            text-align: right;
        }
        .summary-section {
            margin-left: auto;
            width: 300px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        .summary-row.total {
            border-top: 2px solid #e5e5e5;
            padding-top: 10px;
            font-weight: bold;
            font-size: 18px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid {
            background-color: #d4edda;
            color: #155724;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo">
                Moha Weaves
            </div>
            <div class="invoice-info">
                <div class="invoice-number">Invoice #${order.id}</div>
                <div class="invoice-date">Date: ${formatDate(order.createdAt)}</div>
            </div>
        </div>

        <div class="billing-section">
            <div class="section-title">Billing Information</div>
            <div class="address">
                <strong>Order Status:</strong> <span class="status-badge ${order.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">${order.paymentStatus}</span><br>
                <strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}<br>
                ${order.razorpayPaymentId ? `<strong>Payment ID:</strong> ${order.razorpayPaymentId}<br>` : ''}
            </div>
        </div>

        <div class="billing-section">
            <div class="section-title">Shipping Information</div>
            <div class="address">
                ${order.shippingAddress}<br>
                <strong>Phone:</strong> ${order.phone}<br>
                ${order.trackingNumber ? `<strong>Tracking Number:</strong> ${order.trackingNumber}<br>` : ''}
                ${order.estimatedDelivery ? `<strong>Estimated Delivery:</strong> ${formatDate(order.estimatedDelivery)}<br>` : ''}
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items?.map((item: any) => `
                    <tr>
                        <td>
                            <strong>${item.product?.name || 'Product'}</strong><br>
                            ${item.product?.category?.name || ''} ${item.product?.color?.name ? `| ${item.product.color.name}` : ''}
                            ${(() => {
                              if (item.variantId && item.product?.variants) {
                                const selectedVariant = item.product.variants.find((v: any) => v.id === item.variantId);
                                return selectedVariant?.size ? `<br>Size: ${selectedVariant.size}` : '';
                              }
                              return '';
                            })()}
                        </td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td class="text-right">${formatCurrency((parseFloat(item.price) * item.quantity).toString())}</td>
                    </tr>
                `).join('') || ''}
            </tbody>
        </table>

        <div class="summary-section">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(order.totalAmount)}</span>
            </div>
            ${order.discountAmount && parseFloat(order.discountAmount) > 0 ? `
                <div class="summary-row">
                    <span>Discount:</span>
                    <span style="color: green;">-${formatCurrency(order.discountAmount)}</span>
                </div>
            ` : ''}
            <div class="summary-row total">
                <span>Total:</span>
                <span>${formatCurrency(order.finalAmount)}</span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for your order! This is a computer-generated invoice and does not require a signature.</p>
            <p>For any queries, please contact our customer support.</p>
        </div>
    </div>
</body>
</html>
  `;
}
