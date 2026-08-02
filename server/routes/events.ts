import { Router, Request, Response } from 'express';
import { inMemoryStore, isConnectedToMongo } from '../db';
import { EventModel } from '../models/Event';

const router = Router();

const INITIAL_EVENTS = [
  {
    id: 'evt-001',
    title: 'DRIPS Soroban Web3 Hack Summit 2026',
    tagline: 'Building the next generation of decentralized infrastructure on Stellar Soroban.',
    category: 'Tech & Crypto',
    date: 'August 18-20, 2026',
    time: '09:00 AM WAT',
    location: 'Lagos, Nigeria',
    venueName: 'Landmark Event Centre, Victoria Island',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    organizerName: 'DRIPS Protocol Foundation',
    organizerStellarAddress: 'GCSOROBANORGANIZER2026EVENTLINKMINTKEYSTELLAR101',
    royaltyPercentage: 5,
    isFeatured: true,
    tiers: [
      {
        id: 'tier-01',
        name: 'General Access',
        priceUSD: 25,
        priceNGN: 37500,
        priceXLM: 180,
        perks: ['Full Conference Access', 'Swag Bag', 'On-Chain POAP NFT', 'Networking Lounge'],
        totalAvailable: 500,
        remaining: 142,
      },
      {
        id: 'tier-02',
        name: 'VIP Builder Pass',
        priceUSD: 85,
        priceNGN: 127500,
        priceXLM: 600,
        perks: ['VIP Front Row Seats', 'Exclusive Founder & VC Dinner', '1-on-1 Grant Mentorship', 'Custom Stellar NFT Badge'],
        totalAvailable: 100,
        remaining: 18,
      },
    ],
  },
  {
    id: 'evt-002',
    title: 'Afrobeats On-Chain Fest 2026',
    tagline: 'The world’s first Web3 music festival powered by Stellar smart ticket passes.',
    category: 'Music & Concerts',
    date: 'September 12, 2026',
    time: '05:00 PM WAT',
    location: 'Lagos, Nigeria',
    venueName: 'Eko Atlantic Concert Arena',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    organizerName: 'AfroSound Web3 Labs',
    organizerStellarAddress: 'GAFROBEATSMUSICEVENTLINKORGANIZERSTELLAR2026',
    royaltyPercentage: 7.5,
    isFeatured: true,
    tiers: [
      {
        id: 'tier-03',
        name: 'Early Bird Regular',
        priceUSD: 15,
        priceNGN: 22500,
        priceXLM: 110,
        perks: ['General Admission Entry', 'Festival Wristband', 'Collectible Soroban Badge'],
        totalAvailable: 1000,
        remaining: 412,
      },
    ],
  },
];

// Seed initial events into memory
INITIAL_EVENTS.forEach((evt) => {
  inMemoryStore.events.set(evt.id, evt);
});

/**
 * GET /api/events - Retrieve all events live from database
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const memoryList = Array.from(inMemoryStore.events.values());

    if (isConnectedToMongo) {
      const dbEvents = await EventModel.find().sort({ createdAt: -1 });
      const combinedMap = new Map();
      memoryList.forEach((e) => combinedMap.set(e.id, e));
      dbEvents.forEach((e) => combinedMap.set(e.id, e.toObject()));
      return res.json(Array.from(combinedMap.values()));
    }

    return res.json(memoryList);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch events' });
  }
});

/**
 * POST /api/events - Create new event & save persistently to database
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const eventData = req.body;

    if (!eventData.title || !eventData.date) {
      return res.status(400).json({ error: 'Title and Date are required' });
    }

    const eventId = eventData.id || `evt-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullEvent = {
      ...eventData,
      id: eventId,
      createdAt: new Date().toISOString(),
    };

    // Save in memory store
    inMemoryStore.events.set(eventId, fullEvent);

    // Save in MongoDB if connected
    if (isConnectedToMongo) {
      try {
        const newEventObj = new EventModel(fullEvent);
        await newEventObj.save();
      } catch (dbErr) {
        console.warn('MongoDB event save warning:', dbErr);
      }
    }

    console.log(`[DB EVENT SAVED] Created event "${fullEvent.title}" (ID: ${eventId})`);

    return res.status(201).json({
      message: 'Event created and saved persistently in database.',
      event: fullEvent,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to save event' });
  }
});

export default router;
