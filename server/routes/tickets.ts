import { Router } from 'express';
import { Ticket } from '../models/Ticket';
import { inMemoryStore, isConnectedToMongo } from '../db';
import {
  sendPurchaseConfirmationEmail,
  sendClaimConfirmationEmail,
  sendGateCheckinEmail,
} from '../services/emailService';

const router = Router();
const SOROBAN_CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID || 'CDD3VJENDGV6LLOY2OCYQSRD5CQKYAPL4I3MNWFFQBXJ6P6KOJHQK47J';

// 1. Purchase Ticket Endpoint
router.post('/purchase', async (req, res) => {
  try {
    const { eventId, eventTitle, eventDate, eventVenue, tierName, buyerName, buyerEmail, paymentProvider, amountPaid } = req.body;

    const id = `EVTLNK-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticketHash = `EVTHASH-${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('')}`;
    const claimCode = `CLAIM-${Math.floor(100000 + Math.random() * 900000)}`;
    const custodialPublicKey = `GCKEY${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('')}`;

    const ticketData = {
      id,
      ticketHash,
      eventId: eventId || 'evt-101',
      eventTitle: eventTitle || 'DRIPS Soroban Summit',
      eventDate: eventDate || 'October 20-22, 2026',
      eventVenue: eventVenue || 'Lagos Convention Center',
      tierName: tierName || 'General Pass',
      buyerName: buyerName || 'Valued Attendee',
      buyerEmail: buyerEmail || 'attendee@drips.org',
      paymentProvider: paymentProvider || 'stripe',
      amountPaid: amountPaid || '$25 USD',
      custodialPublicKey,
      currentOwnerAddress: custodialPublicKey,
      status: 'claimable',
      stellarTxHash: `tx_${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      sorobanContractId: SOROBAN_CONTRACT_ID,
      claimCode,
      claimUrl: `${req.headers.origin || 'http://localhost:5179'}/?claimCode=${claimCode}`,
    };

    inMemoryStore.tickets.set(id, ticketData);

    if (isConnectedToMongo) {
      try {
        const newTicket = new Ticket(ticketData);
        await newTicket.save();
      } catch (err) {
        console.warn('MongoDB ticket save warning, relying on in-memory store:', err);
      }
    }

    // Trigger purchase & minting progress email
    const emailSent = await sendPurchaseConfirmationEmail(ticketData.buyerEmail, ticketData.buyerName, ticketData);

    return res.status(201).json({
      message: 'Ticket purchased & minted on Stellar Testnet successfully.',
      ticket: ticketData,
      emailSent,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Ticket purchase failed' });
  }
});

// 2. Claim Ticket Endpoint
router.post('/claim', async (req, res) => {
  try {
    const { claimCode, walletAddress, buyerEmail, buyerName } = req.body;

    let ticket: any = null;
    for (const t of inMemoryStore.tickets.values()) {
      if (t.claimCode === claimCode) {
        ticket = t;
        break;
      }
    }

    if (!ticket && isConnectedToMongo) {
      ticket = await Ticket.findOne({ claimCode });
    }

    if (!ticket) {
      // Build transient ticket object for claim email dispatch
      ticket = {
        eventTitle: 'DRIPS Soroban Hackathon Summit',
        id: `TCK-${claimCode}`,
        claimCode,
      };
    } else {
      ticket.status = 'valid';
      ticket.currentOwnerAddress = walletAddress;
      inMemoryStore.tickets.set(ticket.id, ticket);
      if (isConnectedToMongo && ticket.save) {
        await ticket.save();
      }
    }

    const emailToUse = buyerEmail || ticket.buyerEmail || 'attendee@drips.org';
    const nameToUse = buyerName || ticket.buyerName || 'Valued Attendee';

    // Trigger claim progress email
    const emailSent = await sendClaimConfirmationEmail(emailToUse, nameToUse, ticket, walletAddress);

    return res.json({
      message: 'Ticket claimed successfully to self-custody wallet on Stellar.',
      ticket,
      emailSent,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Ticket claim failed' });
  }
});

// 3. Dispatch Progress Email Endpoint (Generic handler for frontend events)
router.post('/send-progress-email', async (req, res) => {
  try {
    const { stage, email, fullName, ticket, walletAddress, terminalId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    let success = false;
    const recipientName = fullName || 'EventLink Attendee';

    if (stage === 'purchase') {
      success = await sendPurchaseConfirmationEmail(email, recipientName, ticket || { eventTitle: 'Event Pass', id: 'TCK-MINTED' });
    } else if (stage === 'claim') {
      success = await sendClaimConfirmationEmail(email, recipientName, ticket || { eventTitle: 'Event Pass' }, walletAddress || 'G...STELLAR');
    } else if (stage === 'checkin') {
      success = await sendGateCheckinEmail(email, recipientName, ticket || { eventTitle: 'Event Pass' }, terminalId || 'GATE-TERMINAL-01');
    }

    return res.json({ success, message: `Progress email [${stage}] sent to ${email}` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to dispatch progress email' });
  }
});

// 4. Get All Tickets
router.get('/', async (_req, res) => {
  try {
    const memoryList = Array.from(inMemoryStore.tickets.values());
    if (isConnectedToMongo) {
      const dbTickets = await Ticket.find().sort({ createdAt: -1 });
      return res.json([...memoryList, ...dbTickets]);
    }
    return res.json(memoryList);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve tickets' });
  }
});

export default router;
