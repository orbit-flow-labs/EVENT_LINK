import type { IssuedTicket } from '../types';
import { mintStellarTicket, SOROBAN_CONTRACT_ID } from './stellar';

export interface WebhookLogEntry {
  id: string;
  timestamp: string;
  provider: 'stripe' | 'flutterwave';
  eventId: string;
  status: 'SUCCESS' | 'DUPLICATE_IGNORED' | 'INVALID_SIGNATURE';
  signatureVerified: boolean;
  ticketId?: string;
  buyerEmail: string;
  amount: string;
  rawPayload: object;
  emailPreviewHTML?: string;
}

// In-Memory Idempotency Tracker for client-side simulator
const processedEventIds = new Set<string>();

/**
 * Simulate Webhook HMAC-SHA256 signature check
 */
export function generateMockStripeSignature(_payloadStr: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const mockHmac = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `t=${timestamp},v1=${mockHmac}`;
}

/**
 * Simulate Webhook dispatch execution with Idempotency & Signature Verification
 */
export async function simulateWebhookDispatch(
  provider: 'stripe' | 'flutterwave',
  buyerName: string,
  buyerEmail: string,
  eventTitle: string,
  amount: string,
  forceDuplicate: boolean = false
): Promise<{ log: WebhookLogEntry; ticket?: IssuedTicket }> {
  // 1. Generate Event ID
  const eventId = forceDuplicate
    ? `evt_test_fixed_duplicate_101`
    : provider === 'stripe'
    ? `evt_stripe_${Math.random().toString(36).substring(2, 10)}`
    : `flw_tx_${Math.random().toString(36).substring(2, 10)}`;

  const timestamp = new Date().toISOString();

  // 2. Idempotency Check
  if (processedEventIds.has(eventId)) {
    const duplicateLog: WebhookLogEntry = {
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp,
      provider,
      eventId,
      status: 'DUPLICATE_IGNORED',
      signatureVerified: true,
      buyerEmail,
      amount,
      rawPayload: {
        event: provider === 'stripe' ? 'payment_intent.succeeded' : 'charge.completed',
        id: eventId,
        note: 'IDEMPOTENCY TRIGGERED: Duplicate payload received & ignored by server.'
      }
    };

    return { log: duplicateLog };
  }

  processedEventIds.add(eventId);

  // 3. Automated Stellar Asset Minting on Testnet
  const mintInfo = await mintStellarTicket(buyerName, buyerEmail, 'evt-001', 'Standard Ticket Pass');
  const ticketId = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
  const claimUrl = `${window.location.origin}?claimCode=${mintInfo.claimCode}`;

  const ticket: IssuedTicket = {
    id: ticketId,
    ticketHash: mintInfo.ticketHash,
    eventId: 'evt-001',
    eventTitle,
    eventDate: 'August 18-20, 2026',
    eventVenue: 'Landmark Event Centre, Victoria Island',
    tierName: 'General Pass',
    buyerName,
    buyerEmail,
    paymentProvider: provider,
    amountPaid: amount,
    custodialPublicKey: mintInfo.custodialPublicKey,
    custodialSecretKey: mintInfo.custodialSecretKey,
    currentOwnerAddress: mintInfo.custodialPublicKey,
    status: 'claimable',
    stellarTxHash: mintInfo.stellarTxHash,
    sorobanContractId: SOROBAN_CONTRACT_ID,
    claimCode: mintInfo.claimCode,
    claimUrl,
    isListedResale: false,
    mintTimestamp: mintInfo.mintTimestamp,
  };

  // 4. Generate Email Template HTML Preview
  const emailPreviewHTML = `
    <div style="font-family: Arial, sans-serif; background: #070a14; color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid rgba(0,242,254,0.3);">
      <h2 style="color: #00f2fe; margin-top: 0;">🎟️ Your EventLink Pass is Ready!</h2>
      <p>Hello <strong>${buyerName}</strong>,</p>
      <p>Your payment of <strong>${amount}</strong> via <strong>${provider.toUpperCase()}</strong> succeeded. Your ticket for <strong>${eventTitle}</strong> has been automatically minted on <strong>Stellar Testnet</strong>!</p>
      
      <div style="background: rgba(15, 23, 42, 0.9); padding: 18px; border-radius: 12px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 4px 0;">Ticket ID: <strong style="color: #00f2fe;">${ticketId}</strong></p>
        <p style="margin: 4px 0;">Claim Code: <strong style="color: #a855f7;">${mintInfo.claimCode}</strong></p>
        <p style="margin: 4px 0;">Stellar Tx: <code style="color: #94a3b8;">${mintInfo.stellarTxHash.substring(0, 20)}...</code></p>
        <div style="margin-top: 14px;">
          <a href="${claimUrl}" target="_blank" style="background: #00f2fe; color: #070a14; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Claim Ticket to Freighter Wallet
          </a>
        </div>
      </div>
    </div>
  `;

  const successLog: WebhookLogEntry = {
    id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
    timestamp,
    provider,
    eventId,
    status: 'SUCCESS',
    signatureVerified: true,
    ticketId,
    buyerEmail,
    amount,
    rawPayload: {
      event: provider === 'stripe' ? 'payment_intent.succeeded' : 'charge.completed',
      id: eventId,
      amount,
      customer: { name: buyerName, email: buyerEmail },
      signature: provider === 'stripe' ? 't=1785501928,v1=9a8f7c...' : 'verif-hash-valid',
      stellarMintedTx: mintInfo.stellarTxHash,
    },
    emailPreviewHTML,
  };

  return { log: successLog, ticket };
}
