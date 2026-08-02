import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { mintStellarTicket, SOROBAN_CONTRACT_ID } from '../../src/services/stellar';
import { inMemoryStore, isConnectedToMongo } from '../db';
import { Ticket } from '../models/Ticket';
import type { IssuedTicket } from '../../src/types';

const router = Router();

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_stripe_secret_key_eventlink_2026';
const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH || 'flw_sec_hash_eventlink_2026';

const processedEventIds = new Set<string>();

/**
 * Verify Stripe Signature (HMAC SHA-256)
 */
function verifyStripeSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const sigPart = parts.find(p => p.startsWith('v1='));
    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.split('=')[1];
    const expectedSig = sigPart.split('=')[1];

    const signedPayload = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET);
    const computedSig = hmac.update(signedPayload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(expectedSig));
  } catch (error) {
    return false;
  }
}

/**
 * Stripe Webhook Handler
 */
router.post('/stripe', async (req: Request, res: Response) => {
  const sigHeader = req.headers['stripe-signature'] as string;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (!verifyStripeSignature(rawBody, sigHeader) && process.env.NODE_ENV === 'production') {
    return res.status(400).json({ error: 'Invalid Stripe signature' });
  }

  const event = req.body;
  const eventId = event?.id || `evt_stripe_${Date.now()}`;

  if (processedEventIds.has(eventId)) {
    return res.status(200).json({ status: 'ignored', message: 'Duplicate event already processed.' });
  }

  processedEventIds.add(eventId);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data?.object || event.data;
    const metadata = paymentIntent.metadata || {};
    const buyerEmail = metadata.buyerEmail || paymentIntent.receipt_email || 'stripe.buyer@eventlink.app';
    const buyerName = metadata.buyerName || 'Stripe Valued Attendee';
    const eventIdRef = metadata.eventId || 'evt-001';
    const eventTitle = metadata.eventTitle || 'DRIPS Soroban Web3 Hack Summit 2026';
    const tierName = metadata.tierName || 'General Access';

    const mintInfo = await mintStellarTicket(buyerName, buyerEmail, eventIdRef, tierName);
    const ticketId = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: IssuedTicket = {
      id: ticketId,
      ticketHash: mintInfo.ticketHash,
      eventId: eventIdRef,
      eventTitle,
      eventDate: 'August 18-20, 2026',
      eventVenue: 'Landmark Event Centre, Victoria Island',
      tierName,
      buyerName,
      buyerEmail,
      paymentProvider: 'stripe',
      amountPaid: `$${((paymentIntent.amount || 2500) / 100).toFixed(2)} USD`,
      custodialPublicKey: mintInfo.custodialPublicKey,
      custodialSecretKey: mintInfo.custodialSecretKey,
      currentOwnerAddress: mintInfo.custodialPublicKey,
      status: 'claimable',
      stellarTxHash: mintInfo.stellarTxHash,
      sorobanContractId: SOROBAN_CONTRACT_ID,
      claimCode: mintInfo.claimCode,
      claimUrl: mintInfo.claimUrl,
      isListedResale: false,
      mintTimestamp: mintInfo.mintTimestamp,
    };

    inMemoryStore.tickets.set(ticketId, newTicket);
    if (isConnectedToMongo) {
      await Ticket.create(newTicket);
    }

    return res.status(200).json({ success: true, ticket: newTicket });
  }

  res.status(200).json({ received: true });
});

/**
 * Flutterwave Webhook Handler
 */
router.post('/flutterwave', async (req: Request, res: Response) => {
  const signature = req.headers['verif-hash'] as string;
  if (signature !== FLUTTERWAVE_SECRET_HASH && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized Flutterwave signature hash' });
  }

  const payload = req.body;
  const eventId = payload.tx_ref || payload.id || `flw_tx_${Date.now()}`;

  if (processedEventIds.has(String(eventId))) {
    return res.status(200).json({ status: 'ignored', message: 'Duplicate event already processed.' });
  }

  processedEventIds.add(String(eventId));

  if (payload.status === 'successful' || payload.event === 'charge.completed') {
    const customer = payload.customer || {};
    const buyerEmail = customer.email || 'flw.buyer@eventlink.app';
    const buyerName = customer.name || 'Flutterwave Attendee';
    const eventIdRef = payload.meta?.eventId || 'evt-002';
    const eventTitle = payload.meta?.eventTitle || 'Afrobeats On-Chain Fest 2026';
    const tierName = payload.meta?.tierName || 'Early Bird Regular';

    const mintInfo = await mintStellarTicket(buyerName, buyerEmail, eventIdRef, tierName);
    const ticketId = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: IssuedTicket = {
      id: ticketId,
      ticketHash: mintInfo.ticketHash,
      eventId: eventIdRef,
      eventTitle,
      eventDate: 'September 12, 2026',
      eventVenue: 'Eko Atlantic Concert Arena',
      tierName,
      buyerName,
      buyerEmail,
      paymentProvider: 'flutterwave',
      amountPaid: `₦${(payload.amount || 22500).toLocaleString()} NGN`,
      custodialPublicKey: mintInfo.custodialPublicKey,
      custodialSecretKey: mintInfo.custodialSecretKey,
      currentOwnerAddress: mintInfo.custodialPublicKey,
      status: 'claimable',
      stellarTxHash: mintInfo.stellarTxHash,
      sorobanContractId: SOROBAN_CONTRACT_ID,
      claimCode: mintInfo.claimCode,
      claimUrl: mintInfo.claimUrl,
      isListedResale: false,
      mintTimestamp: mintInfo.mintTimestamp,
    };

    inMemoryStore.tickets.set(ticketId, newTicket);
    if (isConnectedToMongo) {
      await Ticket.create(newTicket);
    }

    return res.status(200).json({ success: true, ticket: newTicket });
  }

  res.status(200).json({ received: true });
});

/**
 * Webhook Logs Audit
 */
router.get('/logs', (_req: Request, res: Response) => {
  res.json({
    processedEventsCount: processedEventIds.size,
    processedEventIds: Array.from(processedEventIds),
  });
});

export default router;
