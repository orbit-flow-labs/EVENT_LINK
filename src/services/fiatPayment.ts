import type { EventItem, TicketTier, PaymentFormState, IssuedTicket } from '../types';
import { mintStellarTicket, SOROBAN_CONTRACT_ID } from './stellar';
import { triggerProgressEmail } from './emailProgress';

export interface CheckoutResult {
  success: boolean;
  ticket: IssuedTicket;
  paymentReference: string;
}

/**
 * Process Fiat or Web3 Payment and automatically mint Stellar Ticket
 */
export async function processPaymentAndMintTicket(
  event: EventItem,
  tier: TicketTier,
  paymentDetails: PaymentFormState
): Promise<CheckoutResult> {
  // Simulate network delay for fiat provider API (Stripe or Flutterwave)
  await new Promise((resolve) => setTimeout(resolve, 1800));

  let amountPaidFormatted = `$${tier.priceUSD.toFixed(2)}`;
  let paymentReference = '';

  if (paymentDetails.provider === 'stripe') {
    paymentReference = `pi_stripe_${Math.random().toString(36).substring(2, 12)}`;
    amountPaidFormatted = `$${tier.priceUSD.toFixed(2)} USD`;
  } else if (paymentDetails.provider === 'flutterwave') {
    paymentReference = `flw_tx_${Math.random().toString(36).substring(2, 12)}`;
    amountPaidFormatted = `₦${tier.priceNGN.toLocaleString()} NGN`;
  } else if (paymentDetails.provider === 'stellar') {
    paymentReference = `xlm_pay_${Math.random().toString(36).substring(2, 12)}`;
    amountPaidFormatted = `${tier.priceXLM} XLM`;
  }

  const cleanEmail = paymentDetails.email || 'attendee@eventlink.app';
  const cleanName = paymentDetails.fullName || cleanEmail.split('@')[0].toUpperCase();

  // Mint Stellar Ticket asset
  const mintInfo = await mintStellarTicket(
    cleanName,
    cleanEmail,
    event.id,
    tier.name
  );

  const issuedTicket: IssuedTicket = {
    id: `TCK-${Math.floor(100000 + Math.random() * 900000)}`,
    ticketHash: mintInfo.ticketHash,
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    eventVenue: event.venueName,
    tierName: tier.name,
    buyerName: cleanName,
    buyerEmail: cleanEmail,
    paymentProvider: paymentDetails.provider,
    amountPaid: amountPaidFormatted,
    custodialPublicKey: mintInfo.custodialPublicKey,
    custodialSecretKey: mintInfo.custodialSecretKey,
    currentOwnerAddress: paymentDetails.freighterAddress || mintInfo.custodialPublicKey,
    status: paymentDetails.freighterAddress ? 'valid' : 'claimable',
    stellarTxHash: mintInfo.stellarTxHash,
    sorobanContractId: SOROBAN_CONTRACT_ID,
    claimCode: mintInfo.claimCode,
    claimUrl: mintInfo.claimUrl,
    isListedResale: false,
    mintTimestamp: mintInfo.mintTimestamp,
  };

  // Dispatch progress email via Nodemailer SMTP Backend
  try {
    await triggerProgressEmail({
      stage: 'purchase',
      email: cleanEmail,
      fullName: cleanName,
      ticket: issuedTicket,
    });
  } catch (emailErr) {
    console.warn('Purchase notification email dispatch warning:', emailErr);
  }

  return {
    success: true,
    ticket: issuedTicket,
    paymentReference,
  };
}
