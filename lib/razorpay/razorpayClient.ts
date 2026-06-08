import Razorpay from "razorpay";

// Lazy Razorpay client — only initializes when first called at runtime.
let _razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (_razorpay) return _razorpay;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required."
    );
  }

  _razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  return _razorpay;
}

export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    return (getRazorpay() as any)[prop];
  },
});

// Refund related functions
export const createRefund = async (options: {
  paymentId: string;
  amount: number;
  notes?: any;
}) => {
  try {
    const refund = await getRazorpay().payments.refund(options.paymentId, {
      amount: options.amount, // amount in paise
      notes: options.notes || {},
    });
    return refund;
  } catch (error) {
    throw error;
  }
};

export const getRefundStatus = async (refundId: string) => {
  try {
    const refund = await getRazorpay().refunds.fetch(refundId);
    return refund;
  } catch (error) {
    throw error;
  }
};

export const fetchPaymentDetails = async (paymentId: string) => {
  try {
    const payment = await getRazorpay().payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw error;
  }
};
