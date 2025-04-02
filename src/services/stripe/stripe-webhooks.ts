import { Request, Response } from 'express';
import Stripe from 'stripe';
import { SubscriptionService } from './subscription.service';
import { EnumCheckoutType } from '../../interfaces/subscriptions.interface';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// This is your Stripe webhook secret, which you obtain from the Stripe dashboard
const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET || '';
const subscriptionService = new SubscriptionService();

export const handleStripeWebhook = async (request: Request, response: Response) => {
  const sig = request.headers['stripe-signature'];
  let event

  try {
    if (!sig || typeof sig !== 'string') throw new Error('Missing Stripe Signature');
    event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
  } catch (error) {
    console.log(`⚠️  Webhook signature verification failed.`, error);
    return response.status(400).send(`Webhook Error: ${error}`);
  }
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      if(event.data.object.metadata.checoutType == EnumCheckoutType.Buycredits){
        await subscriptionService.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      }else{
        await subscriptionService.handlePaymentIntentSucceededForCustomOrder(event.data.object as Stripe.PaymentIntent);
      }
      break;
    case 'payment_intent.payment_failed':
      await subscriptionService.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    // Add more event types here as needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
};
