import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { IssuedTicket } from '../types';
import { TicketTimeline } from './TicketTimeline';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { STELLAR_EXPERT_TESTNET_URL } from '../services/stellar';
import { X, ExternalLink, ShieldCheck, Wallet, RefreshCw, CheckCircle2, Copy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface TicketPassModalProps {
  ticket: IssuedTicket | null;
  onClose: () => void;
  onOpenClaimModal: (ticket: IssuedTicket) => void;
  onToggleResale: (ticket: IssuedTicket, resalePriceUSD: number) => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  ticket,
  onClose,
  onOpenClaimModal,
  onToggleResale,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dialogRef = useAccessibleDialog<HTMLDivElement>(onClose, Boolean(ticket));

  useEffect(() => {
    if (ticket && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        JSON.stringify({
          ticketHash: ticket.ticketHash,
          claimCode: ticket.claimCode,
          id: ticket.id,
        }),
        {
          width: 180,
          margin: 1,
          color: {
            dark: '#00f2fe',
            light: '#040711',
          },
        },
        (error) => {
          if (error) console.error('QR code error:', error);
        }
      );
    }
  }, [ticket]);

  if (!ticket) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const getStatusBadge = () => {
    if (ticket.status === 'proof_nft' || ticket.status === 'used') {
      return (
        <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#10b981', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} />
          Checked In (Proof-of-Attendance NFT)
        </span>
      );
    }
    if (ticket.status === 'valid') {
      return (
        <span style={{ background: 'rgba(0, 242, 254, 0.2)', border: '1px solid rgba(0, 242, 254, 0.5)', color: '#00f2fe', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} />
          Self-Custody Active (Valid)
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#f59e0b', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <Zap size={14} />
        Custodial Ticket Pass (Claimable)
      </span>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
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
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket pass for ${ticket.eventTitle}`}
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '28px',
          position: 'relative',
          padding: '32px',
          border: '1px solid rgba(0, 242, 254, 0.4)',
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

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ marginBottom: '8px' }}>{getStatusBadge()}</div>
          <h2 className="font-heading" style={{ fontSize: '26px', fontWeight: 800 }}>
            {ticket.eventTitle}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Pass Tier: <strong style={{ color: '#00f2fe' }}>{ticket.tierName}</strong> • ID: <strong>{ticket.id}</strong>
          </p>
        </div>

        {/* 3D Holographic Card Visual */}
        <div className="holographic-card" style={{ padding: '28px', marginBottom: '24px', position: 'relative' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '20px', alignItems: 'center' }}>
            
            {/* Left Ticket Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendee</span>
                <p style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>{ticket.buyerName}</p>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ticket.buyerEmail}</span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Venue & Date</span>
                <p style={{ fontSize: '14px', fontWeight: 700 }}>{ticket.eventVenue}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ticket.eventDate}</p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Provider</span>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                  {ticket.paymentProvider.toUpperCase()} ({ticket.amountPaid})
                </p>
              </div>
            </div>

            {/* Right QR Canvas with Scanning Laser Animation */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(4, 7, 17, 0.95)', padding: '16px', borderRadius: '18px', border: '1px solid var(--border-neon-cyan)', overflow: 'hidden' }}>
              <div className="scan-laser-line" />
              <canvas ref={canvasRef} style={{ width: '160px', height: '160px', borderRadius: '8px' }} />
              <span style={{ fontSize: '10px', color: '#00f2fe', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.5px' }}>
                GATE SCAN QR PASS
              </span>
            </div>

          </div>
        </div>

        {/* Visual Lifecycle Progress Timeline */}
        <TicketTimeline
          status={ticket.status}
          paymentProvider={ticket.paymentProvider}
          currentOwnerAddress={ticket.currentOwnerAddress}
          custodialPublicKey={ticket.custodialPublicKey}
        />

        {/* Stellar Network Proof Bar */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-glass)', padding: '18px', borderRadius: '16px', margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Stellar Testnet Transaction Proof</span>
            <a
              href={`${STELLAR_EXPERT_TESTNET_URL}/tx/${ticket.stellarTxHash}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 700 }}
            >
              Stellar Expert Explorer
              <ExternalLink size={13} />
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(4, 7, 17, 0.9)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '440px', color: 'var(--text-muted)' }}>
              TX: {ticket.stellarTxHash}
            </span>
            <button
              onClick={() => copyToClipboard(ticket.stellarTxHash, 'Stellar Tx Hash')}
              style={{ background: 'transparent', border: 'none', color: '#00f2fe', cursor: 'pointer' }}
            >
              <Copy size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(4, 7, 17, 0.9)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
            <span style={{ color: 'var(--text-muted)' }}>Claim Code: <strong style={{ color: '#a855f7' }}>{ticket.claimCode}</strong></span>
            <button
              onClick={() => copyToClipboard(ticket.claimUrl, 'Claim Link')}
              style={{ background: 'transparent', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Copy size={14} />
              Copy Claim Link
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {ticket.status === 'claimable' && (
            <button
              onClick={() => onOpenClaimModal(ticket)}
              className="btn-primary"
              style={{ flexGrow: 1, justifyContent: 'center' }}
            >
              <Wallet size={16} />
              Claim to Freighter Wallet
            </button>
          )}

          <button
            onClick={() => onToggleResale(ticket, 45)}
            className="btn-secondary"
            style={{ flexGrow: 1, justifyContent: 'center', borderColor: ticket.isListedResale ? '#f59e0b' : 'var(--border-glass)' }}
          >
            <RefreshCw size={16} color={ticket.isListedResale ? '#f59e0b' : '#fff'} />
            {ticket.isListedResale ? 'Cancel Resale Listing' : 'List on Resale Market (With Royalty)'}
          </button>
        </div>

      </motion.div>
    </div>
  );
};
