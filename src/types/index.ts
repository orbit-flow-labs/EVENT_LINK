export type PaymentProvider = 'stripe' | 'flutterwave' | 'stellar';
export type TicketStatus = 'claimable' | 'valid' | 'used' | 'proof_nft';

export interface TicketTier {
  id: string;
  name: string;
  priceUSD: number;
  priceNGN: number;
  priceXLM: number;
  perks: string[];
  totalAvailable: number;
  remaining: number;
}

export interface EventItem {
  id: string;
  title: string;
  tagline: string;
  category: 'Tech & Crypto' | 'Music & Concerts' | 'Workshops' | 'Festivals';
  date: string;
  time: string;
  location: string;
  venueName: string;
  imageUrl: string;
  organizerName: string;
  organizerStellarAddress: string;
  royaltyPercentage: number; // e.g. 5%
  tiers: TicketTier[];
  isFeatured?: boolean;
  stellarTxHash?: string;
  sorobanContractId?: string;
}

export interface RewardItem {
  id: string;
  ticketId: string;
  eventTitle: string;
  poapBadgeName: string;
  poapImageUrl: string;
  tokenReward: string; // e.g. "150 LINK Tokens"
  discountVoucher: string; // e.g. "20% OFF Future Summit Passes"
  whitelistPerk: string; // e.g. "VIP Early Access Whitelist"
  earnedTimestamp: string;
}

export interface IssuedTicket {
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
  
  // On-chain Stellar fields
  custodialPublicKey: string;
  custodialSecretKey?: string;
  currentOwnerAddress: string;
  status: TicketStatus;
  stellarTxHash: string;
  sorobanContractId: string;
  
  // Claim Link & Security
  claimCode: string;
  claimUrl: string;
  
  // Resale Marketplace
  isListedResale: boolean;
  resalePriceUSD?: number;
  
  // Proof of Attendance & Rewards
  mintTimestamp: string;
  redeemTimestamp?: string;
  poapMetadata?: {
    badgeName: string;
    description: string;
    imageUrl: string;
  };
  rewardItem?: RewardItem;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  custodialPublicKey: string;
  token?: string;
}

export interface PaymentFormState {
  provider: PaymentProvider;
  email: string;
  fullName: string;
  phone: string;
  country: string;
  bankName?: string;
  freighterAddress?: string;
}

export interface VerificationResult {
  isValid: boolean;
  status: TicketStatus;
  message: string;
  ticket?: IssuedTicket;
  isDoubleUseAttempt?: boolean;
}
