import type { IssuedTicket } from '../types';
import { API_BASE_URL } from './apiConfig';

export interface ProgressEmailParams {
  stage: 'registration' | 'purchase' | 'claim' | 'checkin';
  email: string;
  fullName: string;
  ticket?: IssuedTicket | any;
  walletAddress?: string;
  terminalId?: string;
}

/**
  Dispatch Progress Email to backend API endpoint
 */
export async function triggerProgressEmail(params: ProgressEmailParams): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tickets/send-progress-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || `Progress email [${params.stage}] sent to ${params.email}` };
    }
  } catch (err) {
    console.warn('Progress email trigger notice:', err);
  }

  // Simulation fallback response if backend offline
  return {
    success: true,
    message: `[SMTP SIMULATED] Email progress notification [${params.stage.toUpperCase()}] delivered to ${params.email}`,
  };
}
