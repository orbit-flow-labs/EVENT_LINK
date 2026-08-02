import React, { useState } from 'react';
import type { EventItem } from '../types';
import { Calendar, MapPin, Tag, ArrowRight, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventGridProps {
  events: EventItem[];
  currency: 'USD' | 'NGN' | 'XLM';
  onSelectEvent: (event: EventItem) => void;
}

export const EventGrid: React.FC<EventGridProps> = ({ events, currency, onSelectEvent }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Tech & Crypto', 'Music & Concerts', 'Workshops', 'Festivals'];

  const filteredEvents = events.filter((evt) => {
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.organizerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (event: EventItem) => {
    const minUSD = Math.min(...event.tiers.map((t) => t.priceUSD));
    const minNGN = Math.min(...event.tiers.map((t) => t.priceNGN));
    const minXLM = Math.min(...event.tiers.map((t) => t.priceXLM));

    if (currency === 'USD') return `$${minUSD.toFixed(0)}`;
    if (currency === 'NGN') return `₦${minNGN.toLocaleString()}`;
    return `${minXLM} XLM`;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Digital Event Universe Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-panel"
        style={{
          padding: '44px 36px',
          borderRadius: '28px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(12, 18, 34, 0.95), rgba(112, 0, 255, 0.25))',
          border: '1px solid rgba(0, 242, 254, 0.35)',
        }}
      >
        <div style={{ maxWidth: '740px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 242, 254, 0.15)', border: '1px solid rgba(0, 242, 254, 0.35)', color: '#00f2fe', padding: '6px 14px', borderRadius: '30px', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
            <Zap size={16} />
            Web2 Simplicity ✕ Web3 Blockchain Power
          </div>
          
          <h1 className="font-heading" style={{ fontSize: '44px', fontWeight: 900, lineHeight: 1.12, marginBottom: '16px' }}>
            Buy Tickets with <span className="gradient-text-cyan">Fiat</span>.<br />
            Get Smart Passes on <span className="gradient-text-purple">Stellar</span>.
          </h1>

          <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
            Pay with Credit Card (Stripe) or Mobile Money/Bank Transfer (Flutterwave). 
            No crypto wallet required initially — receive an automated Stellar Testnet custodial ticket instantly, and claim to self-custody anytime!
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Zap size={16} color="#00f2fe" />
              <span>Instant Fiat Onboarding</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
              <Shield size={16} color="#10b981" />
              <span>Soroban Anti-Counterfeit</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#00f2fe' : 'var(--border-glass)',
                  background: selectedCategory === cat ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedCategory === cat ? '#00f2fe' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder="Search event, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '12px',
                background: 'rgba(12, 18, 34, 0.8)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Tag size={16} />
            </div>
          </div>

        </div>
      </div>

      {/* Events Grid with Framer Motion Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
        {filteredEvents.map((evt, index) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="glass-panel glass-panel-hover"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
            {/* Event Image */}
            <div style={{ position: 'relative', height: '190px', width: '100%', overflow: 'hidden' }}>
              <img
                src={evt.imageUrl}
                alt={evt.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(12, 18, 34, 0.98) 100%)' }} />

              {/* Category Badge */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(4, 7, 17, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-glass)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#00f2fe' }}>
                {evt.category}
              </div>

              {/* Featured Badge */}
              {evt.isFeatured && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'linear-gradient(135deg, #ffd700, #ffaa00)', color: '#040711', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                  ★ Featured
                </div>
              )}
            </div>

            {/* Event Info */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              
              <h3 className="font-heading" style={{ fontSize: '19px', fontWeight: 800, marginBottom: '8px', lineHeight: 1.3 }}>
                {evt.title}
              </h3>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {evt.tagline}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color="#00f2fe" />
                  <span>{evt.date} • {evt.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color="#7000ff" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.venueName}</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>From</span>
                  <span className="font-heading" style={{ fontSize: '20px', fontWeight: 800, color: '#00f2fe' }}>
                    {formatPrice(evt)}
                  </span>
                </div>

                <button
                  onClick={() => onSelectEvent(evt)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Get Pass
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>

          </motion.div>
        ))}
      </div>

    </div>
  );
};
