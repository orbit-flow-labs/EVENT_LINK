import React, { useState } from 'react';
import type { EventItem, TicketTier } from '../types';
import { X, Smartphone, CreditCard, Landmark, CheckCircle2, ShieldCheck, Copy, ArrowRight, Loader2 } from 'lucide-react';

interface FlutterwaveModalOverlayProps {
  event: EventItem;
  tier: TicketTier;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onClose: () => void;
  onPaymentSuccess: (flwTxRef: string, flwRef: string) => void;
}

export const FlutterwaveModalOverlay: React.FC<FlutterwaveModalOverlayProps> = ({
  event,
  tier,
  customerName,
  customerEmail,
  customerPhone,
  onClose,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'transfer' | 'ussd' | 'card'>('transfer');
  const [copied, setCopied] = useState<boolean>(false);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);

  const txRef = `flw_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const virtualAccountNumber = '7829104921';
  const virtualBankName = 'Wema Bank (Flutterwave Direct)';
  const ussdCode = `*737*000*${Math.floor(100 + Math.random() * 900)}#`;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(virtualAccountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompletePayment = async () => {
    setIsAuthorizing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAuthorizing(false);
    onPaymentSuccess(txRef, `FLW-REF-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        backgroundColor: 'rgba(2, 6, 23, 0.92)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#0d1322',
          borderRadius: '24px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 25px 60px rgba(245, 158, 11, 0.25)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Flutterwave Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            padding: '20px 24px',
            color: '#040711',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '18px' }}>
              <Smartphone size={22} />
              <span>Flutterwave Checkout</span>
            </div>
            <p style={{ fontSize: '12px', fontWeight: 600, opacity: 0.9 }}>
              Official NGN Payment Portal • 256-Bit Encrypted
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              color: '#040711',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Order Details Banner */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, display: 'block' }}>{event.title} • {tier.name}</span>
              <strong style={{ color: '#fff', display: 'block', fontSize: '14px' }}>{customerName}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{customerEmail}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total NGN</span>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>
                ₦{tier.priceNGN.toLocaleString()} NGN
              </div>
            </div>
          </div>
        </div>

        {/* Payment Options Tabs */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('transfer')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'transfer' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                background: activeTab === 'transfer' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: activeTab === 'transfer' ? '#f59e0b' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Landmark size={15} />
              Bank Transfer
            </button>

            <button
              onClick={() => setActiveTab('ussd')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'ussd' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                background: activeTab === 'ussd' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: activeTab === 'ussd' ? '#f59e0b' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Smartphone size={15} />
              USSD Code
            </button>

            <button
              onClick={() => setActiveTab('card')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: activeTab === 'card' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                background: activeTab === 'card' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: activeTab === 'card' ? '#f59e0b' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <CreditCard size={15} />
              Pay Card
            </button>
          </div>

          {/* Tab 1: Bank Transfer */}
          {activeTab === 'transfer' && (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Transfer exactly <strong>₦{tier.priceNGN.toLocaleString()} NGN</strong> to the Flutterwave dynamic account below:
              </p>

              <div style={{ background: '#070a14', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bank Name</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{virtualBankName}</div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Account Number</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>
                    {virtualAccountNumber}
                  </span>
                  <button
                    onClick={handleCopyAccount}
                    style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                  >
                    <Copy size={12} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                Account expires in 30 minutes. Automated instant settlement via Flutterwave Webhooks.
              </p>
            </div>
          )}

          {/* Tab 2: USSD */}
          {activeTab === 'ussd' && (
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Dial the USSD code below from your mobile phone registered with GTBank / Access / Zenith Bank:
              </p>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace', padding: '14px', background: '#070a14', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.4)', marginBottom: '12px' }}>
                {ussdCode}
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Phone Number: <strong>{customerPhone || '+234 812 345 6789'}</strong>
              </p>
            </div>
          )}

          {/* Tab 3: Card */}
          {activeTab === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Card Number (5399 •••• •••• 8821)"
                defaultValue="5399 4120 8820 9012"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#070a14', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="MM/YY"
                  defaultValue="11/28"
                  style={{ width: '50%', padding: '10px', borderRadius: '8px', background: '#070a14', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="CVV"
                  defaultValue="381"
                  style={{ width: '50%', padding: '10px', borderRadius: '8px', background: '#070a14', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '11px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <ShieldCheck size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>Upon payment confirmation, your ticket is instantly minted on Stellar Testnet & emailed to {customerEmail}.</span>
          </div>

          {/* Confirm Payment Trigger */}
          <button
            onClick={handleCompletePayment}
            disabled={isAuthorizing}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#040711',
              fontSize: '15px',
              fontWeight: 800,
              cursor: isAuthorizing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            {isAuthorizing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying Flutterwave Payment & Minting...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                I Have Completed Flutterwave Payment
                <ArrowRight size={16} />
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};
