import { beforeEach, describe, expect, it } from 'vitest';
import type { IssuedTicket } from '../types';
import { getOfflineCheckinCache, verifyOfflineTicket } from './offlineVerifier';

const ticket = {
  id: 'TCK-100001',
  ticketHash: 'EVTLNK-STELLAR-EVT-100',
  claimCode: 'CLAIM-ABC123',
  status: 'valid',
} as IssuedTicket;

describe('offline ticket verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accepts a ticket once and queues its ID for synchronization', () => {
    const result = verifyOfflineTicket(ticket.ticketHash, [ticket]);

    expect(result.isValid).toBe(true);
    expect(result.ticket?.id).toBe(ticket.id);
    expect(getOfflineCheckinCache()).toEqual([ticket.id]);
  });

  it('rejects a repeated offline scan from the local check-in queue', () => {
    verifyOfflineTicket(ticket.ticketHash, [ticket]);

    const result = verifyOfflineTicket(ticket.ticketHash, [ticket]);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe('used');
  });

  it('rejects tickets already marked used in the local roster', () => {
    const usedTicket = { ...ticket, status: 'used' } as IssuedTicket;

    const result = verifyOfflineTicket(usedTicket.ticketHash, [usedTicket]);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe('used');
    expect(getOfflineCheckinCache()).toEqual([]);
  });
});