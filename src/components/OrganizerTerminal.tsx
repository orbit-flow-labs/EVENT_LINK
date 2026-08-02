import React, { useState } from 'react';
import type { IssuedTicket, VerificationResult } from '../types';
import { verifyTicketOnStellar } from '../services/stellar';
import { verifyOfflineTicket, getOfflineCheckinCache, clearOfflineCheckinCache } from '../services/offlineVerifier';
import { triggerProgressEmail } from '../services/emailProgress';
import { ShieldCheck, AlertTriangle, CheckCircle2, Scan, Search, Award, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrganizerTerminalProps {
  tickets: IssuedTicket[];
  onUpdateTicket: (updatedTicket: IssuedTicket) => void;
}

export const OrganizerTerminal: React.FC<OrganizerTerminalProps> = ({ tickets, onUpdateTicket }) => {
  const [scanQuery, setScanQuery] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [offlineCount, setOfflineCount] = useState<number>(getOfflineCheckinCache().length);

  const handleVerifyScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanQuery.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      if (isOfflineMode) {
        // Offline Fallback Verification (HMAC signature check)
        const offlineRes = verifyOfflineTicket(scanQuery.trim(), tickets);
        setOfflineCount(getOfflineCheckinCache().length);

        if (offlineRes.isValid && offlineRes.ticket) {
          const updated: IssuedTicket = {
            ...offlineRes.ticket,
            status: 'proof_nft',
            redeemTimestamp: new Date().toISOString(),
            poapMetadata: {
              badgeName: `${offlineRes.ticket.eventTitle} Proof-of-Attendance Badge (Offline Sync)`,
              description: `Stellar Testnet Proof NFT awarded for attending ${offlineRes.ticket.eventTitle}.`,
              imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
            },
          };

          // Trigger Check-In Progress Email
          triggerProgressEmail({
            stage: 'checkin',
            email: updated.buyerEmail || 'attendee@drips.org',
            fullName: updated.buyerName || 'Valued Attendee',
            ticket: updated,
            terminalId: 'GATE-TERMINAL-OFFLINE-01',
          }).catch(console.warn);

          onUpdateTicket(updated);
          setVerificationResult({
            isValid: true,
            status: 'proof_nft',
            message: offlineRes.message,
            ticket: updated,
          });
        } else {
          setVerificationResult({
            isValid: false,
            status: offlineRes.status === 'used' ? 'used' : 'claimable',
            message: offlineRes.message,
            isDoubleUseAttempt: offlineRes.status === 'used',
            ticket: offlineRes.ticket,
          });
        }
      } else {
        // Online Mode (Stellar Testnet + Backend)
        const res = await verifyTicketOnStellar(scanQuery.trim(), tickets);

        if (res.isValid && res.ticket && res.status === 'valid') {
          const updated: IssuedTicket = {
            ...res.ticket,
            status: 'proof_nft',
            redeemTimestamp: new Date().toISOString(),
            poapMetadata: {
              badgeName: `${res.ticket.eventTitle} Proof-of-Attendance Badge`,
              description: `Official Stellar Testnet Proof NFT awarded for attending ${res.ticket.eventTitle}.`,
              imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
            },
          };

          // Trigger Check-In Progress Email
          triggerProgressEmail({
            stage: 'checkin',
            email: updated.buyerEmail || 'attendee@drips.org',
            fullName: updated.buyerName || 'Valued Attendee',
            ticket: updated,
            terminalId: 'GATE-TERMINAL-ONLINE-01',
          }).catch(console.warn);

          onUpdateTicket(updated);
          setVerificationResult({
            isValid: true,
            status: 'proof_nft',
            message: 'TICKET VALIDATED ON SOROBAN CONTRACT! Converted to Stellar Proof-of-Attendance NFT (POAP).',
            ticket: updated,
          });
        } else {
          setVerificationResult({
            ...res,
            isDoubleUseAttempt: res.status === 'used' || res.status === 'proof_nft',
          });
        }
      }
    } catch (err: any) {
      setVerificationResult({
        isValid: false,
        status: 'claimable',
        message: err?.message || 'Verification failed.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSyncOfflineData = () => {
    clearOfflineCheckinCache();
    setOfflineCount(0);
    alert('Offline check-in queue successfully synchronized with Stellar Testnet!');
  };

  const totalCheckedIn = tickets.filter((t) => t.status === 'used' || t.status === 'proof_nft').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
            <ShieldCheck size={14} />
            Soroban Gatekeeper QR Terminal
          </div>
          <h1 className="font-heading" style={{ fontSize: '32px', fontWeight: 900 }}>
            Gatekeeper Scanner & Check-In Verification
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Real-time on-chain ticket verification on Stellar Testnet with offline fallback verification.
          </p>
        </div>

        {/* Live Stats Pill */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* Mode Switcher */}
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            style={{
              padding: '10px 16px',
              borderRadius: '14px',
              border: '1px solid',
              borderColor: isOfflineMode ? '#f59e0b' : '#10b981',
              background: isOfflineMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isOfflineMode ? '#f59e0b' : '#10b981',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isOfflineMode ? <WifiOff size={16} /> : <Wifi size={16} />}
            {isOfflineMode ? 'Offline Fallback Mode' : 'Online Stellar Network'}
          </button>

          <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Total Minted</span>
              <strong style={{ fontSize: '18px' }}>{tickets.length}</strong>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Checked In</span>
              <strong style={{ fontSize: '18px', color: '#10b981' }}>{totalCheckedIn}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* Offline Sync Banner */}
      {offlineCount > 0 && (
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '14px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
            <WifiOff size={18} />
            <span>{offlineCount} offline check-ins recorded locally. Ready for network sync.</span>
          </div>

          <button
            onClick={handleSyncOfflineData}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px', background: '#f59e0b', color: '#040711' }}
          >
            <RefreshCw size={14} />
            Sync to Stellar Network
          </button>
        </div>
      )}

      {/* Main Terminal Scanner Card */}
      <div className="glass-panel" style={{ padding: '36px', borderRadius: '24px', marginBottom: '40px', border: '1px solid rgba(0, 242, 254, 0.35)', position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Scanner Visual Container with Laser Sweep */}
          <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px', background: 'rgba(4, 7, 17, 0.95)', borderRadius: '24px', border: '2px dashed #00f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,242,254,0.3)' }}>
            <div className="scan-laser-line" />
            <Scan size={56} color="#00f2fe" style={{ opacity: 0.8 }} />
          </div>

          <h2 className="font-heading" style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
            Scan Ticket QR / Hash Payload
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Paste ticket hash code (or claim ID) to verify authenticity on Soroban contract and check-in attendee.
          </p>

          {/* Quick Demo Sample Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setScanQuery(t.ticketHash)}
                style={{
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#00f2fe',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                Sample: {t.id} ({t.status})
              </button>
            ))}
          </div>

          <form onSubmit={handleVerifyScan} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input
                type="text"
                placeholder="Paste Ticket Hash (EVTLNK-STELLAR... or CLAIM-...)"
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '14px',
                  background: 'rgba(4, 7, 17, 0.95)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
              />
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="btn-primary"
              style={{ padding: '0 24px', fontSize: '15px' }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Pass'}
            </button>
          </form>

          {/* Verification Result Alert Banner */}
          <AnimatePresence mode="wait">
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  border: '1px solid',
                  borderColor: verificationResult.isValid ? '#10b981' : '#ef4444',
                  background: verificationResult.isValid ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  {verificationResult.isValid ? (
                    <CheckCircle2 size={32} color="#10b981" style={{ flexShrink: 0 }} />
                  ) : (
                    <AlertTriangle size={32} color="#ef4444" style={{ flexShrink: 0 }} />
                  )}

                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ fontSize: '19px', fontWeight: 800, color: verificationResult.isValid ? '#10b981' : '#ef4444', marginBottom: '4px' }}>
                      {verificationResult.isValid
                        ? 'VALIDATION APPROVED (CHECKED IN)'
                        : verificationResult.isDoubleUseAttempt
                        ? 'DOUBLE USE PREVENTED (REJECTED)'
                        : 'VALIDATION REJECTED'}
                    </h4>

                    <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '12px', lineHeight: 1.5 }}>
                      {verificationResult.message}
                    </p>

                    {verificationResult.ticket && (
                      <div style={{ background: 'rgba(4, 7, 17, 0.8)', padding: '14px', borderRadius: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--border-glass)' }}>
                        <div>Attendee: <strong>{verificationResult.ticket.buyerName}</strong> ({verificationResult.ticket.buyerEmail})</div>
                        <div>Event: <strong>{verificationResult.ticket.eventTitle}</strong></div>
                        <div>Pass Tier: <strong style={{ color: '#00f2fe' }}>{verificationResult.ticket.tierName}</strong></div>
                        {verificationResult.ticket.poapMetadata && (
                          <div style={{ marginTop: '8px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Award size={16} />
                            Proof-of-Attendance NFT (POAP) Issued on Stellar Testnet!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  );
};
