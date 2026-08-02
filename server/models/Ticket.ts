import mongoose, { Schema, Document } from 'mongoose';
import type { TicketStatus, PaymentProvider } from '../../src/types';

export interface ITicket extends Document {
  id: string;
  ticketHash: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  tierName: string;
  buyerName: string;
  buyerEmail: string;
  paymentProvider: PaymentProvider;
  amountPaid: string;
  custodialPublicKey: string;
  custodialSecretKey?: string;
  currentOwnerAddress: string;
  status: TicketStatus;
  stellarTxHash: string;
  sorobanContractId: string;
  claimCode: string;
  claimUrl: string;
  isListedResale: boolean;
  resalePriceUSD?: number;
  mintTimestamp: string;
  redeemTimestamp?: string;
  poapMetadata?: {
    badgeName: string;
    description: string;
    imageUrl: string;
  };
}

const TicketSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  ticketHash: { type: String, required: true, unique: true, index: true },
  eventId: { type: String, required: true },
  eventTitle: { type: String, required: true },
  eventDate: { type: String },
  eventVenue: { type: String },
  tierName: { type: String, required: true },
  buyerName: { type: String, required: true },
  buyerEmail: { type: String, required: true, index: true },
  paymentProvider: { type: String, required: true },
  amountPaid: { type: String, required: true },
  custodialPublicKey: { type: String, required: true },
  custodialSecretKey: { type: String },
  currentOwnerAddress: { type: String, required: true },
  status: { type: String, enum: ['claimable', 'valid', 'used', 'proof_nft'], default: 'claimable' },
  stellarTxHash: { type: String, required: true },
  sorobanContractId: { type: String, required: true },
  claimCode: { type: String, required: true, unique: true },
  claimUrl: { type: String, required: true },
  isListedResale: { type: Boolean, default: false },
  resalePriceUSD: { type: Number },
  mintTimestamp: { type: String, required: true },
  redeemTimestamp: { type: String },
  poapMetadata: {
    badgeName: { type: String },
    description: { type: String },
    imageUrl: { type: String },
  },
});

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
