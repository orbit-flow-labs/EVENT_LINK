import React, { useState, useEffect } from 'react';
import type { EventItem, TicketTier, PaymentProvider, PaymentFormState, IssuedTicket, UserAccount } from '../types';
import { processPaymentAndMintTicket } from '../services/fiatPayment';
import { getStoredUserAccount } from '../services/storage';
import { triggerProgressEmail } from '../services/emailProgress';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { FlutterwaveModalOverlay } from './FlutterwaveModalOverlay';
import { X, CreditCard, Loader2, Lock, Smartphone, Globe, Zap } from 'lucide-react';

interface CheckoutModalProps {
  event: EventItem | null;
  tier: TicketTier | null;
  currency: 'USD' | 'NGN' | 'XLM';
  userAccount?: UserAccount | null;
  onClose: () => void;
  onSuccess: (ticket: IssuedTicket) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  event,
  tier,
  currency,
  userAccount: propUserAccount,
  onClose,
  onSuccess,
}) => {
  const dialogRef = useAccessibleDialog<HTMLDivElement>(onClose, Boolean(event && tier));
  const storedUser = propUserAccount || getStoredUserAccount();

  const [provider, setProvider] = useState<PaymentProvider>(
    currency === 'NGN' ? 'flutterwave' : currency === 'XLM' ? 'stellar' : 'stripe'
  );

  const [form, setForm] = useState<PaymentFormState>({
    provider,
    email: storedUser?.email || '',
    fullName: storedUser?.fullName || '',
    phone: '+234 812 345 6789',
    cardNumber: '4242 •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '888',
    country: 'Nigeria',
    freighterAddress: '',
  });

  useEffect(() => {
    const liveUser = propUserAccount || getStoredUserAccount();
    if (liveUser) {
      setForm((prev) => ({
        ...prev,
        email: liveUser.email || prev.email,
        fullName: liveUser.fullName || prev.fullName,
      }));
    }
  }, [propUserAccount]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepText, setStepText] = useState<string>('');
  const [showFlwOverlay, setShowFlwOverlay] = useState<boolean>(false);

  if (!event || !tier) return null;

  const getAmountText = () => {
    if (provider === 'stripe') return `$${tier.priceUSD.toFixed(2)} USD`;
    if (provider === 'flutterwave') return `₦${tier.priceNGN.toLocaleString()} NGN`;
    return `${tier.priceXLM} XLM`;
  };

  const handleExecuteMint = async (overrideProvider?: PaymentProvider) => {
    const selectedProvider = overrideProvider || provider;
    setIsProcessing(true);

    try {
      setStepText(`Processing fiat checkout with ${selectedProvider.toUpperCase()}...`);
      await new Promise((r) => setTimeout(r, 800));

      setStepText('Creating & funding Stellar custodial wallet via Horizon Friendbot...');
      await new Promise((r) => setTimeout(r, 800));

      setStepText('Minting smart ticket asset on Soroban Testnet...');
      const result = await processPaymentAndMintTicket(event, tier, { ...form, provider: selectedProvider });

      setStepText('Sending purchase confirmation email...');
      await triggerProgressEmail({
        stage: 'purchase',
        email: form.email,
        fullName: form.fullName,
        ticket: result.ticket,
      });

      setStepText('Ticket pass & claim link generated successfully!');
      await new Promise((r) => setTimeout(r, 400));

      onSuccess(result.ticket);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (provider === 'flutterwave') {
      setShowFlwOverlay(true);
      return;
    }

    await handleExecuteMint();
  };

  const handleFlutterwaveSuccess = async () => {
    setShowFlwOverlay(false);
    await handleExecuteMint('flutterwave');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        backgroundColor: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        ref={dialogRef}
        className="glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Checkout ticket pass"
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: '24px',
          position: 'relative',
          padding: '32px',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 className="font-heading" style={{ fontSize: '22px', fontWeight: 800 }}>
              Checkout Ticket Pass
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {event.title} • <strong style={{ color: '#00f2fe' }}>{tier.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-main)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Payment Method Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Choose Payment Method (No Wallet Required for Fiat)
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setProvider('stripe')}
              style={{
                padding: '12px 10px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: provider === 'stripe' ? '#00f2fe' : 'var(--border-glass)',
                background: provider === 'stripe' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                color: provider === 'stripe' ? '#00f2fe' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <CreditCard size={18} />
              Stripe (Card)
            </button>

            <button
              type="button"
              onClick={() => setProvider('flutterwave')}
              style={{
                padding: '12px 10px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: provider === 'flutterwave' ? '#f59e0b' : 'var(--border-glass)',
                background: provider === 'flutterwave' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                color: provider === 'flutterwave' ? '#f59e0b' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <Smartphone size={18} />
              Flutterwave (NGN)
            </button>

            <button
              type="button"
              onClick={() => setProvider('stellar')}
              style={{
                padding: '12px 10px',
                borderRadius: '12px',
                border: '1px solid',
                borderColor: provider === 'stellar' ? '#7000ff' : 'var(--border-glass)',
                background: provider === 'stellar' ? 'rgba(112, 0, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                color: provider === 'stellar' ? '#a855f7' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <Globe size={18} />
              Stellar (XLM)
            </button>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email Address (Ticket & Claim Link sent here)</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Conditional Provider Fields */}
          {provider === 'stripe' && (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#00f2fe', marginBottom: '10px', fontWeight: 600 }}>
                <Lock size={14} />
                Stripe 256-bit Encrypted Card Payment
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Card Number"
                  value={form.cardNumber}
                  onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                  style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={form.cardExpiry}
                  onChange={(e) => setForm({ ...form, cardExpiry: e.target.value })}
                  style={{ width: '80px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          {provider === 'flutterwave' && (
            <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#f59e0b', marginBottom: '10px', fontWeight: 600 }}>
                <Smartphone size={14} />
                Flutterwave USSD / Mobile Money / Bank Transfer
              </div>
              <input
                type="text"
                placeholder="Phone Number (+234...)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '13px' }}
              />
            </div>
          )}

          {provider === 'stellar' && (
            <div style={{ background: 'rgba(112, 0, 255, 0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(112, 0, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#a855f7', marginBottom: '10px', fontWeight: 600 }}>
                <Zap size={14} />
                Direct Stellar Wallet Payment (Freighter / Address)
              </div>
              <input
                type="text"
                placeholder="Destination / Freighter Public Key (G...)"
                value={form.freighterAddress}
                onChange={(e) => setForm({ ...form, freighterAddress: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '13px' }}
              />
            </div>
          )}

          {/* Total Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)', marginTop: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Due</span>
            <span className="font-heading" style={{ fontSize: '22px', fontWeight: 800, color: '#00f2fe' }}>
              {getAmountText()}
            </span>
          </div>

          {/* Stepper Status Feedback */}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.3)', padding: '12px 16px', borderRadius: '12px', color: '#00f2fe', fontSize: '13px' }}>
              <Loader2 size={18} className="animate-spin" />
              <span>{stepText}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontSize: '16px',
              opacity: isProcessing ? 0.6 : 1,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            {isProcessing ? 'Processing Payment & Minting Ticket...' : `Pay ${getAmountText()} & Mint Ticket Pass`}
          </button>

        </form>

        {showFlwOverlay && (
          <FlutterwaveModalOverlay
            event={event}
            tier={tier}
            customerName={form.fullName}
            customerEmail={form.email}
            customerPhone={form.phone}
            onClose={() => setShowFlwOverlay(false)}
            onPaymentSuccess={handleFlutterwaveSuccess}
          />
        )}

      </div>
    </div>
  );
};
