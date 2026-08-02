import React, { useEffect, useState } from 'react';
import type { IssuedTicket } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ForgingMintAnimationProps {
  ticket: IssuedTicket;
  onComplete: () => void;
}

export const ForgingMintAnimation: React.FC<ForgingMintAnimationProps> = ({ ticket, onComplete }) => {
  const [forgingStep, setForgingStep] = useState<number>(1);

  useEffect(() => {
    const t1 = setTimeout(() => setForgingStep(2), 1200); // Ledger creation
    const t2 = setTimeout(() => setForgingStep(3), 2400); // Soroban asset forging
    const t3 = setTimeout(() => {
      setForgingStep(4);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        backgroundColor: 'rgba(4, 7, 17, 0.94)',
        backdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%',
          maxWidth: '560px',
          textAlign: 'center',
          padding: '40px 32px',
          borderRadius: '28px',
          background: 'rgba(12, 18, 34, 0.9)',
          border: '1px solid rgba(0, 242, 254, 0.4)',
          boxShadow: '0 0 60px rgba(0, 242, 254, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Holographic Glow Backdrop */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(0, 242, 254, 0.15), transparent 70%)', pointerEvents: 'none' }} />

        {/* 3D Forging Reactor Ring */}
        <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 28px' }}>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px dashed #00f2fe',
              boxShadow: '0 0 25px rgba(0, 242, 254, 0.6)',
            }}
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: '12px',
              borderRadius: '50%',
              border: '2px solid #a855f7',
            }}
          />

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {forgingStep < 4 ? <Cpu size={44} color="#00f2fe" /> : <ShieldCheck size={48} color="#10b981" />}
            </motion.div>
          </div>

        </div>

        {/* Text Progression Feedback */}
        <AnimatePresence mode="wait">
          {forgingStep === 1 && (
            <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="font-heading" style={{ fontSize: '24px', fontWeight: 800, color: '#00f2fe' }}>
                Verifying Fiat Checkout...
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Confirming {ticket.paymentProvider.toUpperCase()} transaction reference.
              </p>
            </motion.div>
          )}

          {forgingStep === 2 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="font-heading" style={{ fontSize: '24px', fontWeight: 800, color: '#a855f7' }}>
                Funding Stellar Testnet Account...
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Provisioning gasless custodial wallet address via Horizon.
              </p>
            </motion.div>
          )}

          {forgingStep === 3 && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="font-heading" style={{ fontSize: '24px', fontWeight: 800, color: '#ffd700' }}>
                Forging Smart Ticket Asset...
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Invoking Soroban contract mint function on Stellar ledger.
              </p>
            </motion.div>
          )}

          {forgingStep === 4 && (
            <motion.div key="s4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <h3 className="font-heading" style={{ fontSize: '26px', fontWeight: 800, color: '#10b981' }}>
                Digital Artifact Forged!
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '6px' }}>
                Ticket pass <strong>{ticket.id}</strong> is active on Stellar Testnet.
              </p>

              <button
                onClick={onComplete}
                className="btn-primary"
                style={{ marginTop: '24px', padding: '12px 28px', fontSize: '15px' }}
              >
                View Holographic Ticket Pass
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stepper Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                width: '40px',
                height: '4px',
                borderRadius: '4px',
                background: s <= forgingStep ? (s === 4 ? '#10b981' : '#00f2fe') : 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

      </motion.div>
    </div>
  );
};
