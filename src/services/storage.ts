import type { IssuedTicket, UserAccount } from '../types';
import { API_BASE_URL } from './apiConfig';

const STORAGE_KEY_TICKETS = 'eventlink_issued_tickets_v1';
const STORAGE_KEY_USER = 'eventlink_user_account_v1';

export function getStoredUserAccount(): UserAccount | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load user account from storage:', error);
    return null;
  }
}

export function saveStoredUserAccount(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch (error) {
    console.error('Failed to save user account to storage:', error);
  }
}

export async function fetchUserLiveFromDB(email: string): Promise<UserAccount | null> {
  if (!email) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        saveStoredUserAccount(data.user);
        return data.user;
      }
    }
  } catch (err) {
    console.warn('Live DB user fetch notice:', err);
  }
  return getStoredUserAccount();
}

export function getStoredTickets(): IssuedTicket[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load tickets from storage:', error);
    return [];
  }
}

export function saveTickets(tickets: IssuedTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
  } catch (error) {
    console.error('Failed to save tickets to storage:', error);
  }
}

export function addIssuedTicket(ticket: IssuedTicket): IssuedTicket[] {
  const current = getStoredTickets();
  const updated = [ticket, ...current];
  saveTickets(updated);
  return updated;
}

export function updateTicketInStorage(updatedTicket: IssuedTicket): IssuedTicket[] {
  const current = getStoredTickets();
  const updated = current.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
  saveTickets(updated);
  return updated;
}

export async function fetchTicketsLiveFromDB(): Promise<IssuedTicket[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tickets`);
    if (res.ok) {
      const liveTickets = await res.json();
      if (Array.isArray(liveTickets) && liveTickets.length > 0) {
        const localTickets = getStoredTickets();
        const map = new Map<string, IssuedTicket>();
        [...liveTickets, ...localTickets].forEach((t) => {
          if (t && t.id) map.set(t.id, t);
        });
        const merged = Array.from(map.values());
        saveTickets(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Live DB tickets fetch notice:', err);
  }
  return getStoredTickets();
}
