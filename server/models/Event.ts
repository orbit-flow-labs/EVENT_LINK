import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  id: string;
  title: string;
  tagline: string;
  category: string;
  date: string;
  time: string;
  location: string;
  venueName: string;
  imageUrl: string;
  organizerName: string;
  organizerStellarAddress: string;
  royaltyPercentage: number;
  isFeatured: boolean;
  tiers: any[];
  stellarTxHash?: string;
  sorobanContractId?: string;
  createdAt: Date;
}

const EventSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  tagline: { type: String },
  category: { type: String },
  date: { type: String, required: true },
  time: { type: String },
  location: { type: String },
  venueName: { type: String },
  imageUrl: { type: String },
  organizerName: { type: String },
  organizerStellarAddress: { type: String },
  royaltyPercentage: { type: Number, default: 5 },
  isFeatured: { type: Boolean, default: false },
  tiers: { type: Array, default: [] },
  stellarTxHash: { type: String },
  sorobanContractId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const EventModel = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
