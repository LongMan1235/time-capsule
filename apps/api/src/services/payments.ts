import Stripe from "stripe";
import { env } from "../config/env.js";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : null;

export async function createPaymentIntent(userId: string, eventId: string, amountCents: number) {
  if (!stripe) {
    return {
      provider: "mock",
      clientSecret: `mock_secret_${eventId}`,
      amountCents
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { userId, eventId, type: "early_unlock" }
  });

  return {
    provider: "stripe",
    clientSecret: intent.client_secret,
    amountCents
  };
}
