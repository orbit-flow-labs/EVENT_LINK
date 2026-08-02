import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  provider: 'email' | 'google' | 'github';
  custodialPublicKey: string;
  custodialSecretKey: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String },
  fullName: { type: String, required: true },
  provider: { type: String, enum: ['email', 'google', 'github'], default: 'email' },
  custodialPublicKey: { type: String, required: true },
  custodialSecretKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
