import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { mintStellarTicket, SOROBAN_CONTRACT_ID } from './src/services/stellar';

const app = express();
const PORT = process.env.PORT || 3001;

// Secret Keys for Webhook Signature Verification
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_stripe_secret_key_eventlink_2026';
const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH || 'flw_sec_hash_eventlink_2026';

// In-Memory Idempotency Store (Tracks processed Webhook event IDs & payment refs)
const processedEventIds = new Set<string>();
const issuedTicketsStore: any[] = [];
const webhookLogs: any[] = [];

// Middleware for parsing JSON & raw body for Stripe signature
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// CORS middleware
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, stripe-signature, verif-hash');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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
    console.error('Stripe signature verification error:', error);
    return false;
  }
}

/**
 * Verify Flutterwave Signature (verif-hash header match)
 */
function verifyFlutterwaveSignature(hashHeader: string | undefined): boolean {
  if (!hashHeader) return false;
  return hashHeader === FLUTTERWAVE_SECRET_HASH;
}

/**
 * Helper to Generate Confirmation Email HTML
 */
function generateEmailHTML(buyerName: string, ticketId: string, eventTitle: string, claimUrl: string, claimCode: string): string {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #070a14; color: #f8fafc; padding: 30px; border-radius: 16px;">
      <h2 style="color: #00f2fe; margin-bottom: 10px;">🎟️ Your EventLink Pass is Ready!</h2>
      <p>Hello <strong>${buyerName}</strong>,</p>
      <p>Thank you for your purchase. Your ticket for <strong>${eventTitle}</strong> has been automatically minted on the <strong>Stellar Testnet</strong>!</p>
      
      <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(0, 242, 254, 0.3); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0 0 8px;">Ticket ID: <strong style="color: #00f2fe;">${ticketId}</strong></p>
        <p style="margin: 0 0 8px;">Claim Code: <strong style="color: #a855f7;">${claimCode}</strong></p>
        <p style="margin: 0 0 16px;">Soroban Contract: <code>${SOROBAN_CONTRACT_ID}</code></p>
        <a href="${claimUrl}" style="display: inline-block; background: #00f2fe; color: #070a14; padding: 12px 24px; font-weight: bold; border-radius: 8px; text-decoration: none;">
          Claim Ticket to Self-Custody Wallet
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8;">No wallet? No worries! Your custodial pass is secured on Stellar and ready at event check-in.</p>
    </div>
  `;
}

// ------------------- WEBHOOK ENDPOINTS -------------------

/**
 * 1. Stripe Secure Webhook Endpoint
 */
app.post('/api/webhooks/stripe', async (req: Request, res: Response) => {
  const sigHeader = req.headers['stripe-signature'] as string;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // 1. Signature Check
  const isValidSignature = verifyStripeSignature(rawBody, sigHeader);
  if (!isValidSignature && process.env.NODE_ENV === 'production') {
    return res.status(400).json({ error: 'Invalid Stripe signature' });
  }

  const event = req.body;
  const eventId = event?.id || `evt_stripe_${Date.now()}`;

  // 2. Idempotency Check
  if (processedEventIds.has(eventId)) {
    console.log(`[Stripe Webhook] Idempotent hit: Event ${eventId} already processed.`);
    return res.status(200).json({ status: 'ignored', message: 'Duplicate event already processed.' });
  }

  processedEventIds.add(eventId);

  // 3. Process payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data?.object || event.data;
    const metadata = paymentIntent.metadata || {};
    const buyerEmail = metadata.buyerEmail || paymentIntent.receipt_email || 'stripe.buyer@eventlink.app';
    const buyerName = metadata.buyerName || 'Stripe Valued Attendee';
    const eventIdRef = metadata.eventId || 'evt-001';
    const eventTitle = metadata.eventTitle || 'DRIPS Soroban Web3 Hack Summit 2026';
    const tierName = metadata.tierName || 'General Access';

    // 4. Mint Stellar Ticket Asset
    const mintInfo = await mintStellarTicket(buyerName, buyerEmail, eventIdRef, tierName);
    const ticketId = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket = {
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
      emailHTML: generateEmailHTML(buyerName, ticketId, eventTitle, mintInfo.claimUrl, mintInfo.claimCode)
    };

    issuedTicketsStore.push(newTicket);
    webhookLogs.unshift({
      timestamp: new Date().toISOString(),
      provider: 'stripe',
      eventId,
      ticketId,
      status: 'SUCCESS_MINTED_STELLAR',
      buyerEmail
    });

    console.log(`[Stripe Webhook SUCCESS] Issued Ticket ${ticketId} on Stellar Testnet for ${buyerEmail}`);
    return res.status(200).json({ success: true, ticket: newTicket, message: 'Ticket minted on Stellar successfully' });
  }

  res.status(200).json({ received: true });
});

/**
 * 2. Flutterwave Secure Webhook Endpoint
 */
app.post('/api/webhooks/flutterwave', async (req: Request, res: Response) => {
  const signature = req.headers['verif-hash'] as string;

  // 1. Signature Check
  if (signature !== FLUTTERWAVE_SECRET_HASH && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized Flutterwave signature hash' });
  }

  const payload = req.body;
  const eventId = payload.tx_ref || payload.id || `flw_tx_${Date.now()}`;

  // 2. Idempotency Check
  if (processedEventIds.has(String(eventId))) {
    console.log(`[Flutterwave Webhook] Idempotent hit: Reference ${eventId} already processed.`);
    return res.status(200).json({ status: 'ignored', message: 'Duplicate event already processed.' });
  }

  processedEventIds.add(String(eventId));

  // 3. Process charge.completed
  if (payload.status === 'successful' || payload.event === 'charge.completed') {
    const customer = payload.customer || {};
    const buyerEmail = customer.email || 'flw.buyer@eventlink.app';
    const buyerName = customer.name || 'Flutterwave Attendee';
    const eventIdRef = payload.meta?.eventId || 'evt-002';
    const eventTitle = payload.meta?.eventTitle || 'Afrobeats On-Chain Fest 2026';
    const tierName = payload.meta?.tierName || 'Early Bird Regular';

    // 4. Mint Stellar Ticket Asset
    const mintInfo = await mintStellarTicket(buyerName, buyerEmail, eventIdRef, tierName);
    const ticketId = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket = {
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
      emailHTML: generateEmailHTML(buyerName, ticketId, eventTitle, mintInfo.claimUrl, mintInfo.claimCode)
    };

    issuedTicketsStore.push(newTicket);
    webhookLogs.unshift({
      timestamp: new Date().toISOString(),
      provider: 'flutterwave',
      eventId,
      ticketId,
      status: 'SUCCESS_MINTED_STELLAR',
      buyerEmail
    });

    console.log(`[Flutterwave Webhook SUCCESS] Issued Ticket ${ticketId} on Stellar Testnet for ${buyerEmail}`);
    return res.status(200).json({ success: true, ticket: newTicket, message: 'Ticket minted on Stellar successfully' });
  }

  res.status(200).json({ received: true });
});

/**
 * Get Webhook Logs & Idempotency Audit
 */
app.get('/api/webhooks/logs', (_req: Request, res: Response) => {
  res.json({
    processedCount: processedEventIds.size,
    logs: webhookLogs,
    tickets: issuedTicketsStore,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ EventLink Webhook Backend Server running on http://localhost:${PORT}`);
  });
}

export default app;
