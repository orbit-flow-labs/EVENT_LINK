import React, { useState } from 'react';
import type { IssuedTicket } from '../types';
import { claimTicketToWallet } from '../services/stellar';
import { triggerProgressEmail } from '../services/emailProgress';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import {
  connectFreighterWallet,
  connectAlbedoWallet,
  connectXBullWallet,
  connectLobstrWallet,
  connectWalletConnectSession,
  validateStellarAddress,
  type WalletProviderType,
} from '../services/walletConnect';
import { X, Wallet, ShieldCheck, Loader2, CheckCircle2, ArrowRight, Smartphone, Key, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClaimWalletModalProps {
  ticket: IssuedTicket | null;
  onClose: () => void;
  onClaimSuccess: (updatedTicket: IssuedTicket) => void;
}

export const ClaimWalletModal: React.FC<ClaimWalletModalProps> = ({
  ticket,
  onClose,
  onClaimSuccess,
}) => {
  const dialogRef = useAccessibleDialog<HTMLDivElement>(onClose);
  const [claimStep, setClaimStep] = useState<number>(1);
  const [claimInputCode, setClaimInputCode] = useState<string>(ticket?.claimCode || '');
  const [selectedProvider, setSelectedProvider] = useState<WalletProviderType>('freighter');
  const [targetWalletAddress, setTargetWalletAddress] = useState<string>('');
  const [connectedWalletName, setConnectedWalletName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimCompleted, setClaimCompleted] = useState<boolean>(false);

  // Step 1: Verify Claim Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInputCode.trim()) {
      alert('Please enter your claim code.');
      return;
    }
    setClaimStep(2);
  };

  // Step 2: Connect External Wallet
  const handleConnectWallet = async (provider: WalletProviderType) => {
    setSelectedProvider(provider);
    setIsConnecting(true);

    try {
      let res: any = null;
      if (provider === 'freighter') {
        res = await connectFreighterWallet();
      } else if (provider === 'albedo') {
        res = await connectAlbedoWallet();
      } else if (provider === 'xbull') {
        res = await connectXBullWallet();
      } else if (provider === 'lobstr') {
        res = await connectLobstrWallet();
      } else if (provider === 'walletconnect') {
        res = await connectWalletConnectSession();
      } else if (provider === 'manual') {
        setConnectedWalletName('Manual Key Entry');
      }

      if (res) {
        if (res.isConnected && res.publicKey) {
          setTargetWalletAddress(res.publicKey);
          setConnectedWalletName(res.name);
        } else {
          alert(`Connection to ${provider.toUpperCase()} failed or was canceled. Please approve the connection in your wallet.`);
        }
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Step 3: Execute Soroban Asset Transfer
  const handleExecuteClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) {
      alert('No valid ticket loaded.');
      return;
    }

    if (!validateStellarAddress(targetWalletAddress)) {
      alert('Please connect or provide a valid Stellar address starting with "G".');
      return;
    }

    setIsClaiming(true);

    try {
      const { transferTxHash } = await claimTicketToWallet(ticket, targetWalletAddress, selectedProvider);

      const updatedTicket: IssuedTicket = {
        ...ticket,
        status: 'valid',
        currentOwnerAddress: targetWalletAddress,
        stellarTxHash: transferTxHash || ticket.stellarTxHash,
      };

      // Trigger Claim Progress Email
      await triggerProgressEmail({
        stage: 'claim',
        email: ticket.buyerEmail || 'attendee@drips.org',
        fullName: ticket.buyerName || 'Valued Attendee',
        ticket: updatedTicket,
        walletAddress: targetWalletAddress,
      });

      setClaimCompleted(true);
      setTimeout(() => {
        onClaimSuccess(updatedTicket);
      }, 1500);
    } catch (error: any) {
      alert(error?.message || 'Claim transfer failed.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        backgroundColor: 'rgba(4, 7, 17, 0.88)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Claim ticket to wallet"
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: '28px',
          position: 'relative',
          padding: '32px',
          border: '1px solid rgba(112, 0, 255, 0.4)',
          boxShadow: '0 0 50px rgba(112, 0, 255, 0.25)',
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
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #7000ff, #00f2fe)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 0 20px rgba(0,242,254,0.4)' }}>
            <Wallet size={24} color="#040711" />
          </div>
          <h2 className="font-heading" style={{ fontSize: '24px', fontWeight: 800 }}>
            Claim Ticket to Self-Custody
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Transfer your ticket NFT from custodial email storage to your personal Stellar Web3 wallet.
          </p>
        </div>

        {/* Stepper Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3].map((stepNum) => (
            <div
              key={stepNum}
              style={{
                height: '4px',
                flexGrow: 1,
                borderRadius: '4px',
                background: stepNum <= claimStep ? (claimCompleted ? '#10b981' : '#00f2fe') : 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {claimCompleted ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <h3 className="font-heading" style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
              Claim Transfer Complete!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Ticket asset ownership transferred to <strong>{targetWalletAddress.substring(0, 12)}...</strong> on Stellar Testnet.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Step 1: Input Claim Code */}
            {claimStep === 1 && (
              <motion.form key="st1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Step 1: Enter Claim Secret Code
                  </label>
                  <input
                    type="text"
                    required
                    value={claimInputCode}
                    onChange={(e) => setClaimInputCode(e.target.value)}
                    placeholder="CLAIM-XXXXXX"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(7, 10, 20, 0.9)',
                      border: '1px solid var(--border-glass)',
                      color: '#00f2fe',
                      fontSize: '15px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }}>
                  Verify Code & Connect Wallet
                  <ArrowRight size={16} />
                </button>
              </motion.form>
            )}

            {/* Step 2: Select & Connect Wallet Provider */}
            {claimStep === 2 && (
              <motion.div key="st2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                  Step 2: Choose Wallet Provider to Receive Ticket
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleConnectWallet('freighter')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: selectedProvider === 'freighter' ? '#00f2fe' : 'var(--border-glass)',
                      background: selectedProvider === 'freighter' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <Wallet size={18} color="#00f2fe" />
                    Freighter Extension
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConnectWallet('albedo')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: selectedProvider === 'albedo' ? '#a855f7' : 'var(--border-glass)',
                      background: selectedProvider === 'albedo' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <Globe size={18} color="#a855f7" />
                    Albedo Web Signer
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConnectWallet('walletconnect')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: selectedProvider === 'walletconnect' ? '#3b82f6' : 'var(--border-glass)',
                      background: selectedProvider === 'walletconnect' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <Smartphone size={18} color="#3b82f6" />
                    WalletConnect v2
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConnectWallet('manual')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: selectedProvider === 'manual' ? '#10b981' : 'var(--border-glass)',
                      background: selectedProvider === 'manual' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <Key size={18} color="#10b981" />
                    Manual Address
                  </button>
                </div>

                {isConnecting ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#00f2fe', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting to {selectedProvider.toUpperCase()}...
                  </div>
                ) : targetWalletAddress ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '10px', fontSize: '12px' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Connected ({connectedWalletName})
                    </span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {targetWalletAddress}
                    </span>
                  </div>
                ) : selectedProvider === 'manual' && (
                  <input
                    type="text"
                    placeholder="Enter Stellar Public Key (G...)"
                    value={targetWalletAddress}
                    onChange={(e) => setTargetWalletAddress(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                )}

                <button
                  type="button"
                  disabled={!targetWalletAddress}
                  onClick={() => setClaimStep(3)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', opacity: !targetWalletAddress ? 0.5 : 1 }}
                >
                  Proceed to Confirm Transfer
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* Step 3: Confirm Transfer */}
            {claimStep === 3 && (
              <motion.form key="st3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleExecuteClaim} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)', fontSize: '13px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Destination Wallet</span>
                    <strong style={{ color: '#00f2fe', fontFamily: 'monospace' }}>{targetWalletAddress}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>Claim Code</span>
                    <strong style={{ color: '#a855f7', fontFamily: 'monospace' }}>{claimInputCode}</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(0, 242, 254, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.2)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#00f2fe" style={{ flexShrink: 0 }} />
                  <span>Invokes Soroban asset transfer function on Stellar Testnet.</span>
                </div>

                <button
                  type="submit"
                  disabled={isClaiming}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
                >
                  {isClaiming ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Executing Soroban Transfer...
                    </>
                  ) : (
                    <>
                      Transfer Ownership to Connected Wallet
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        )}

      </motion.div>
    </div>
  );
};
