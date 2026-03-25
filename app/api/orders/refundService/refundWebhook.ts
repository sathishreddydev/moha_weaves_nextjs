import crypto from "crypto";
import { refundService } from "./refundService";
import { db } from "@/lib/db";
import { refunds } from "@/shared";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from 'next/server';

export class RefundWebhookService {
  static verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  static async handleWebhook(request: NextRequest): Promise<NextResponse> {
    try {
      const signature = request.headers.get("x-razorpay-signature");
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }

      const body = await request.text();
      
      if (!this.verifyWebhookSignature(body, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }

      const event = JSON.parse(body);
      console.log("Webhook event received:", event.event);

      switch (event.event) {
        case "refund.processed":
          await this.handleRefundProcessed(event.payload.refund.entity);
          break;
        
        case "refund.failed":
          await this.handleRefundFailed(event.payload.refund.entity);
          break;
        
        case "refund.created":
          await this.handleRefundCreated(event.payload.refund.entity);
          break;
        
        default:
          console.log(`Unhandled webhook event: ${event.event}`);
      }

      return NextResponse.json({ status: "ok" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  private static async handleRefundProcessed(refundEntity: any): Promise<void> {
    try {
      const [refund] = await db
        .select()
        .from(refunds)
        .where(eq(refunds.razorpayRefundId, refundEntity.id));

      if (!refund) {
        console.log(`Refund not found for Razorpay ID: ${refundEntity.id}`);
        return;
      }

      await refundService.processRefundManually(refund.id, "completed");
      
      console.log(`Refund ${refund.id} marked as completed via webhook`);
    } catch (error) {
      console.error("Error handling refund processed webhook:", error);
    }
  }

  private static async handleRefundFailed(refundEntity: any): Promise<void> {
    try {
      const [refund] = await db
        .select()
        .from(refunds)
        .where(eq(refunds.razorpayRefundId, refundEntity.id));

      if (!refund) {
        console.log(`Refund not found for Razorpay ID: ${refundEntity.id}`);
        return;
      }

      await db
        .update(refunds)
        .set({
          status: "failed",
          failureReason: refundEntity.error_description || "Refund failed via webhook",
        })
        .where(eq(refunds.id, refund.id));

      console.log(`Refund ${refund.id} marked as failed via webhook`);
    } catch (error) {
      console.error("Error handling refund failed webhook:", error);
    }
  }

  private static async handleRefundCreated(refundEntity: any): Promise<void> {
    try {
      const [refund] = await db
        .select()
        .from(refunds)
        .where(eq(refunds.razorpayRefundId, refundEntity.id));

      if (!refund) {
        console.log(`Refund not found for Razorpay ID: ${refundEntity.id}`);
        return;
      }

      await db
        .update(refunds)
        .set({
          status: "processing",
          razorpayRefundId: refundEntity.id,
          initiatedAt: new Date(),
        })
        .where(eq(refunds.id, refund.id));

      console.log(`Refund ${refund.id} updated with Razorpay details via webhook`);
    } catch (error) {
      console.error("Error handling refund created webhook:", error);
    }
  }

  static async checkPendingRefunds(): Promise<void> {
    try {
      const pendingRefunds = await db
        .select()
        .from(refunds)
        .where(eq(refunds.status, "processing"));

      console.log(`Checking ${pendingRefunds.length} pending refunds...`);

      for (const refund of pendingRefunds) {
        if (refund.razorpayRefundId) {
          await refundService.checkRefundStatus(refund.id);
        }
      }
    } catch (error) {
      console.error("Error checking pending refunds:", error);
    }
  }
}

// Next.js API route handlers
export async function POST(request: NextRequest) {
  return RefundWebhookService.handleWebhook(request);
}

export async function GET() {
  try {
    await RefundWebhookService.checkPendingRefunds();
    return NextResponse.json({ 
      message: "Pending refunds checked successfully" 
    });
  } catch (error) {
    console.error("Error checking pending refunds:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
