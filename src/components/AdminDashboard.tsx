import React, { useState } from 'react';
import type { EventItem, IssuedTicket, TicketTier } from '../types';
import { OrganizerTerminal } from './OrganizerTerminal';
import { STELLAR_EXPERT_TESTNET_URL, registerEventOnStellar, SOROBAN_CONTRACT_ID } from '../services/stellar';
import { API_BASE_URL } from '../services/apiConfig';
import { PlusCircle, DollarSign, Layers, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminDashboardProps {
  events: EventItem[];
  tickets: IssuedTicket[];
  onAddEvent: (newEvent: EventItem) => void;
  onUpdateTicket: (updatedTicket: IssuedTicket) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  events: _events,
  tickets,
  onAddEvent,
  onUpdateTicket,
}) => {
  const [adminTab, setAdminTab] = useState<'create' | 'payments' | 'nfts' | 'scanner'>('payments');

  // Form State for New Event Creation
  const [title, setTitle] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [category, setCategory] = useState<'Tech & Crypto' | 'Music & Concerts' | 'Workshops' | 'Festivals'>('Tech & Crypto');
  const [date, setDate] = useState<string>('October 20-22, 2026');
  const [time] = useState<string>('10:00 AM WAT');
  const [location] = useState<string>('Lagos, Nigeria');
  const [venueName] = useState<string>('Convention Center');
  const [imageUrl] = useState<string>('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80');
  const [organizerName] = useState<string>('My Event Org');
  const [priceUSD, setPriceUSD] = useState<number>(30);
  const [priceNGN, setPriceNGN] = useState<number>(45000);
  const [priceXLM, setPriceXLM] = useState<number>(200);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isRetryingEventSave, setIsRetryingEventSave] = useState(false);
  const [eventCreationError, setEventCreationError] = useState('');
  const [pendingEventSave, setPendingEventSave] = useState<EventItem | null>(null);

  const saveEventToBackend = async (event: EventItem) => {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error('Event was registered, but the database rejected the save.');
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !tagline.trim()) {
      setEventCreationError('Event title and tagline are required.');
      return;
    }
    if (isCreatingEvent || pendingEventSave) return;
    setEventCreationError('');
    setIsCreatingEvent(true);

    try {
      const newTier: TicketTier = {
        id: `tier-${Math.floor(100 + Math.random() * 900)}`,
        name: 'General Admission',
        priceUSD,
        priceNGN,
        priceXLM,
        perks: ['Full Event Entry', 'Digital Soroban Asset Pass', 'On-Chain POAP NFT'],
        totalAvailable: 500,
        remaining: 500,
      };

      const eventId = `evt-${Math.floor(100 + Math.random() * 900)}`;

      const onChainRes = await registerEventOnStellar(title.trim(), eventId);

      const newEvent: EventItem = {
        id: eventId,
        title: title.trim(),
        tagline: tagline.trim(),
        category,
        date,
        time,
        location,
        venueName,
        imageUrl,
        organizerName,
        organizerStellarAddress: 'GCSOROBANEVENTORGANIZERSTELLARKEY2026',
        royaltyPercentage: 5,
        tiers: [newTier],
        stellarTxHash: onChainRes.stellarTxHash,
        sorobanContractId: SOROBAN_CONTRACT_ID,
      };

      onAddEvent(newEvent);
      try {
        await saveEventToBackend(newEvent);
      } catch (error) {
        setPendingEventSave(newEvent);
        throw error;
      }

      alert(`Event "${title.trim()}" created and saved.\n\nTx Hash: ${onChainRes.stellarTxHash}`);
      setTitle('');
      setTagline('');
      setAdminTab('payments');
    } catch (err) {
      setEventCreationError(err instanceof Error ? err.message : 'Event creation failed. Please retry.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleRetryEventSave = async () => {
    if (!pendingEventSave || isRetryingEventSave) return;
    setEventCreationError('');
    setIsRetryingEventSave(true);
    try {
      await saveEventToBackend(pendingEventSave);
      setPendingEventSave(null);
      setTitle('');
      setTagline('');
      setAdminTab('payments');
    } catch (error) {
      setEventCreationError(error instanceof Error ? error.message : 'Database save failed. Please retry.');
    } finally {
      setIsRetryingEventSave(false);
    }
  };

  // Financial Statistics Calculation
  const totalVolumeUSD = tickets.reduce((acc, t) => {
    if (t.paymentProvider === 'stripe') return acc + 25;
    if (t.paymentProvider === 'flutterwave') return acc + 25;
    return acc + 25;
  }, 0);

  const totalRoyaltiesUSD = (totalVolumeUSD * 0.05).toFixed(2);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(112, 0, 255, 0.15)', color: '#a855f7', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
            <ShieldCheck size={14} />
            Organizer Admin Control Center
          </div>
          <h1 className="font-heading" style={{ fontSize: '32px', fontWeight: 900 }}>
            Event Dashboard & Ledger
          </h1>
        </div>

        {/* Admin Navigation Sub-Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.04)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          {[
            { id: 'payments', label: 'Payments & Revenue', icon: DollarSign },
            { id: 'nfts', label: 'Minted NFTs Roster', icon: Layers },
            { id: 'create', label: 'Create New Event', icon: PlusCircle },
            { id: 'scanner', label: 'Gatekeeper Scanner', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSelected ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(112, 0, 255, 0.2))' : 'transparent',
                  color: isSelected ? '#00f2fe' : 'var(--text-muted)',
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Payments & Financial Analytics */}
      {adminTab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Sales Volume</span>
              <h2 className="font-heading" style={{ fontSize: '32px', fontWeight: 800, color: '#00f2fe' }}>
                ${totalVolumeUSD.toLocaleString()} USD
              </h2>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Across Stripe, Flutterwave & XLM</span>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Stellar Soroban NFTs Minted</span>
              <h2 className="font-heading" style={{ fontSize: '32px', fontWeight: 800, color: '#a855f7' }}>
                {tickets.length} Smart Passes
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>On Stellar Testnet Ledger</span>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Organizer Royalties Earned</span>
              <h2 className="font-heading" style={{ fontSize: '32px', fontWeight: 800, color: '#ffd700' }}>
                ${totalRoyaltiesUSD} USD
              </h2>
              <span style={{ fontSize: '12px', color: '#ffd700', fontWeight: 600 }}>5% Royalty on Secondary Resales</span>
            </div>
          </div>

          {/* Payment Transactions Table */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
            <h3 className="font-heading" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Recent Payment Transactions
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Ticket ID</th>
                  <th style={{ padding: '10px' }}>Buyer Name & Email</th>
                  <th style={{ padding: '10px' }}>Event</th>
                  <th style={{ padding: '10px' }}>Provider</th>
                  <th style={{ padding: '10px' }}>Amount</th>
                  <th style={{ padding: '10px' }}>Stellar Ledger Tx</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#00f2fe' }}>{t.id}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <strong>{t.buyerName}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{t.buyerEmail}</span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>{t.eventTitle}</td>
                    <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: 600, color: '#10b981' }}>{t.paymentProvider}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>{t.amountPaid}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <a
                        href={`${STELLAR_EXPERT_TESTNET_URL}/tx/${t.stellarTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#a855f7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                      >
                        {t.stellarTxHash.substring(0, 10)}...
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </motion.div>
      )}

      {/* Tab 2: Minted NFTs Roster */}
      {adminTab === 'nfts' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 className="font-heading" style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
            Minted Soroban Smart Assets Roster
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {tickets.map((t) => (
              <div key={t.id} style={{ background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#00f2fe', fontFamily: 'monospace', fontWeight: 700 }}>{t.id}</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>{t.status.toUpperCase()}</span>
                </div>

                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{t.eventTitle}</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>{t.buyerName} ({t.buyerEmail})</p>

                <div style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '8px', borderRadius: '8px', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '10px' }}>
                  Custodial Key: {t.custodialPublicKey.substring(0, 14)}...
                </div>

                <a
                  href={`${STELLAR_EXPERT_TESTNET_URL}/tx/${t.stellarTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
                >
                  Verify on Stellar Explorer
                  <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Create New Event Form */}
      {adminTab === 'create' && (
        <motion.form initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreateEventSubmit} className="glass-panel" style={{ padding: '32px', borderRadius: '24px', maxWidth: '720px', margin: '0 auto' }}>
          
          <h2 className="font-heading" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px' }}>
            Publish New Event to Stellar Registry
          </h2>

          {isCreatingEvent && <p role="status" aria-live="polite" style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Registering event and saving details...</p>}
          {eventCreationError && <p role="alert" style={{ marginBottom: '16px', color: '#fca5a5' }}>{eventCreationError}</p>}
          {pendingEventSave && (
            <button type="button" className="btn-secondary" onClick={handleRetryEventSave} disabled={isRetryingEventSave}>
              {isRetryingEventSave ? 'Retrying database save...' : `Retry database save for ${pendingEventSave.title}`}
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Event Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. West Africa Web3 & Soroban Expo 2026"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tagline / Subtitle</label>
              <input
                type="text"
                required
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="The flagship developer conference powered by Stellar smart passes."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '14px' }}
                >
                  <option value="Tech & Crypto">Tech & Crypto</option>
                  <option value="Music & Concerts">Music & Concerts</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Festivals">Festivals</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Price ($ USD)</label>
                <input
                  type="number"
                  value={priceUSD}
                  onChange={(e) => setPriceUSD(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#00f2fe', fontSize: '14px', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Price (₦ NGN)</label>
                <input
                  type="number"
                  value={priceNGN}
                  onChange={(e) => setPriceNGN(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#f59e0b', fontSize: '14px', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Price (✦ XLM)</label>
                <input
                  type="number"
                  value={priceXLM}
                  onChange={(e) => setPriceXLM(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#a855f7', fontSize: '14px', fontWeight: 700 }}
                />
              </div>
            </div>

            <button type="submit" disabled={isCreatingEvent || isRetryingEventSave || Boolean(pendingEventSave)} className="btn-primary" style={{ justifyContent: 'center', padding: '14px', fontSize: '16px', marginTop: '8px' }}>
              <PlusCircle size={18} />
              {isCreatingEvent ? 'Publishing Event...' : 'Publish Event & Deploy Smart Contract Metadata'}
            </button>
          </div>

        </motion.form>
      )}

      {/* Tab 4: Gatekeeper Check-In Scanner */}
      {adminTab === 'scanner' && (
        <OrganizerTerminal tickets={tickets} onUpdateTicket={onUpdateTicket} />
      )}

    </div>
  );
};
