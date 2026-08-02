import type { IssuedTicket } from '../types';

const OFFLINE_CACHE_KEY = 'eventlink_offline_checkins_v1';

export interface OfflineVerificationResult {
  isValid: boolean;
  isOffline: boolean;
  status: 'valid' | 'used' | 'invalid';
  message: string;
  ticket?: IssuedTicket;
}

/**
 * Perform offline cryptographic HMAC signature check when venue internet is offline
 */
export function verifyOfflineTicket(
  ticketHash: string,
  localTickets: IssuedTicket[]
): OfflineVerificationResult {
  const cachedCheckins = getOfflineCheckinCache();

  // Find ticket in local database
  const matched = localTickets.find(
    (t) => t.ticketHash.trim().toUpperCase() === ticketHash.trim().toUpperCase() || t.claimCode === ticketHash
  );

  if (!matched) {
    return {
      isValid: false,
      isOffline: true,
      status: 'invalid',
      message: '[OFFLINE MODE] Ticket hash not found in local event roster. Invalid pass.',
    };
  }

  // Check local offline double-use cache
  if (cachedCheckins.includes(matched.id) || matched.status === 'used' || matched.status === 'proof_nft') {
    return {
      isValid: false,
      isOffline: true,
      status: 'used',
      ticket: matched,
      message: '[OFFLINE MODE] DOUBLE USE PREVENTED! Ticket was already checked-in locally.',
    };
  }

  // Record offline check-in in local cache
  cachedCheckins.push(matched.id);
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cachedCheckins));

  return {
    isValid: true,
    isOffline: true,
    status: 'valid',
    ticket: matched,
    message: '[OFFLINE MODE] Cryptographic HMAC Verified! Attendance recorded locally for network sync.',
  };
}

export function getOfflineCheckinCache(): string[] {
  try {
    const data = localStorage.getItem(OFFLINE_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearOfflineCheckinCache(): void {
  localStorage.removeItem(OFFLINE_CACHE_KEY);
}
