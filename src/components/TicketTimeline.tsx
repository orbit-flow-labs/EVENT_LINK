import React from 'react';
import type { TicketStatus, PaymentProvider } from '../types';
import { CreditCard, Zap, Wallet, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TicketTimelineProps {
  status: TicketStatus;
  paymentProvider: PaymentProvider;
  currentOwnerAddress: string;
  custodialPublicKey: string;
}

export const TicketTimeline: React.FC<TicketTimelineProps> = ({
  status,
  paymentProvider,
  currentOwnerAddress,
  custodialPublicKey,
}) => {
  const isClaimed = status === 'valid' || status === 'used' || status === 'proof_nft' || currentOwnerAddress !== custodialPublicKey;
  const isUsed = status === 'used' || status === 'proof_nft';

  const steps = [
    {
      id: 1,
      label: 'Purchased',
      detail: `Paid via ${paymentProvider.toUpperCase()}`,
      icon: CreditCard,
      active: true,
      color: '#00f2fe',
    },
    {
      id: 2,
      label: 'Minted on Stellar',
      detail: 'Soroban Asset Testnet',
      icon: Zap,
      active: true,
      color: '#a855f7',
    },
    {
      id: 3,
      label: 'Claimed to Wallet',
      detail: isClaimed ? 'Self-Custody Active' : 'Custodial Storage',
      icon: Wallet,
      active: isClaimed,
      color: '#f59e0b',
    },
    {
      id: 4,
      label: 'Used / POAP NFT',
      detail: isUsed ? 'Checked In & POAP Minted' : 'Ready for Event',
      icon: isUsed ? Award : Clock,
      active: isUsed,
      color: '#10b981',
    },
  ];

  return (
    <div style={{ background: 'rgba(7, 10, 20, 0.8)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', marginTop: '20px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Ticket Lifecycle Progress
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', position: 'relative' }}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Progress Connector Line */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '18px',
                    left: '50%',
                    width: '100%',
                    height: '2px',
                    background: step.active && steps[index + 1].active ? step.color : 'rgba(255, 255, 255, 0.1)',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Step Circle Node */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: step.active ? `rgba(15, 23, 42, 0.9)` : 'rgba(15, 23, 42, 0.5)',
                  border: '2px solid',
                  borderColor: step.active ? step.color : 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  boxShadow: step.active ? `0 0 12px ${step.color}` : 'none',
                  marginBottom: '8px',
                }}
              >
                <Icon size={16} color={step.active ? step.color : 'var(--text-muted)'} />
              </div>

              <span style={{ fontSize: '12px', fontWeight: 700, color: step.active ? '#fff' : 'var(--text-muted)' }}>
                {step.label}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {step.detail}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
