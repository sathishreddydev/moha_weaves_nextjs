import { fetchPaymentDetails } from "@/lib/razorpay/razorpayClient";

export async function paymentInfo({
  razorpayPaymentId,
}: {
  razorpayPaymentId: string;
}) {
  const payment = await fetchPaymentDetails(razorpayPaymentId);

  const mask = (value?: string | null) => {
    if (!value) return "—";
    const trimmed = value.trim();
    if (trimmed.length <= 8) return trimmed;
    return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
  };

  const method = (payment as any).method as string | undefined;
  const card = (payment as any).card;
  const bank = (payment as any).bank;
  const wallet = (payment as any).wallet;
  const vpa = (payment as any).vpa;

  let display = method ? method.toUpperCase() : "—";
  let subtype: string | undefined;

  if (method === "card") {
    const last4 = card?.last4 ? String(card.last4) : "—";
    const network = card?.network ? String(card.network).toUpperCase() : "CARD";
    subtype = card?.type ? String(card.type).toUpperCase() : undefined;
    display = `${network} •••• ${last4}`;
  } else if (method === "upi") {
    display = vpa ? `UPI ${mask(String(vpa))}` : "UPI";
  } else if (method === "netbanking") {
    display = bank ? `NETBANKING ${String(bank).toUpperCase()}` : "NETBANKING";
  } else if (method === "wallet") {
    display = wallet ? `WALLET ${String(wallet).toUpperCase()}` : "WALLET";
  } else if (method === "emi") {
    display = "EMI";
  } else if (method === "paylater") {
    display = "PAY LATER";
  }

  return {
    available: true,
    method,
    display,
    subtype,
    razorpayPaymentId: mask(razorpayPaymentId),
  };
}
