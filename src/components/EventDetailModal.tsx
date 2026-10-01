import React, { useEffect, useState } from 'react';
import type { EventItem, TicketTier } from '../types';
import { X, Calendar, MapPin, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import { EventImage } from './EventImage';

interface EventDetailModalProps {
  event: EventItem | null;
  currency: 'USD' | 'NGN' | 'XLM';
  onClose: () => void;
  onProceedToCheckout: (event: EventItem, selectedTier: TicketTier) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  currency,
  onClose,
  onProceedToCheckout,
}) => {
  const [selectedTierId, setSelectedTierId] = useState<string>(event?.tiers[0]?.id || '');

  useEffect(() => {
    setSelectedTierId(event?.tiers[0]?.id || '');
  }, [event?.id, event?.tiers]);

  if (!event) return null;

  const selectedTier = event.tiers.find((t) => t.id === selectedTierId) || event.tiers[0];

  const getDisplayPrice = (tier: TicketTier) => {
    if (currency === 'USD') return `$${tier.priceUSD.toFixed(2)} USD`;
    if (currency === 'NGN') return `₦${tier.priceNGN.toLocaleString()} NGN`;
    return `${tier.priceXLM} XLM`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px',
          position: 'relative',
          border: '1px solid rgba(0, 242, 254, 0.3)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            background: 'rgba(7, 10, 20, 0.7)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-main)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Event Header Hero */}
        <div style={{ position: 'relative', height: '240px', width: '100%' }}>
          <EventImage
            src={event.imageUrl}
            alt={event.title}
            style={{ width: '100%', height: '100%' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 20%, rgba(15, 23, 42, 1) 100%)' }} />

          <div style={{ position: 'absolute', bottom: '20px', left: '24px', right: '24px' }}>
            <span style={{ background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(0, 242, 254, 0.3)' }}>
              {event.category}
            </span>
            <h2 className="font-heading" style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
              {event.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          
          {/* Left Column: Details & Organizer */}
          <div>
            <p style={{ fontSize: '15px', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '24px' }}>
              {event.tagline}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={18} color="#00f2fe" />
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Date & Time</span>
                  <strong style={{ fontSize: '14px' }}>{event.date} • {event.time}</strong>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MapPin size={18} color="#7000ff" />
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Venue Location</span>
                  <strong style={{ fontSize: '14px' }}>{event.venueName} ({event.location})</strong>
                </div>
              </div>
            </div>

            {/* Soroban Contract Specs */}
            <div style={{ background: 'rgba(112, 0, 255, 0.08)', border: '1px solid rgba(112, 0, 255, 0.2)', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <ShieldCheck size={16} />
                Soroban Smart Contract Features
              </div>
              <ul style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Auto-minted unique asset pass on Stellar Testnet</li>
                <li>Claimable link issued post fiat checkout (No wallet needed to buy)</li>
                <li>Royalty Enforcement: {event.royaltyPercentage}% to {event.organizerName} on secondary market resale</li>
                <li>Converts to Proof-of-Attendance NFT (POAP) post check-in</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Ticket Tiers & Checkout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="font-heading" style={{ fontSize: '18px', fontWeight: 700 }}>Select Ticket Pass Tier</h3>

            {event.tiers.map((tier) => {
              const isSelected = tier.id === selectedTierId;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTierId(tier.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: '1px solid',
                    borderColor: isSelected ? '#00f2fe' : 'var(--border-glass)',
                    background: isSelected ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{tier.name}</span>
                    <span className="font-heading" style={{ fontSize: '16px', fontWeight: 800, color: '#00f2fe' }}>
                      {getDisplayPrice(tier)}
                    </span>
                  </div>

                  <ul style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    {tier.perks.map((perk, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={13} color="#10b981" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {tier.remaining} of {tier.totalAvailable} remaining
                  </div>
                </div>
              );
            })}

            {/* Checkout Trigger */}
            <button
              onClick={() => onProceedToCheckout(event, selectedTier)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px', fontSize: '15px' }}
            >
              <CreditCard size={18} />
              Proceed to Checkout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
