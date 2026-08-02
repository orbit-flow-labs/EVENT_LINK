import React, { useState } from 'react';
import type { IssuedTicket } from '../types';
import { simulateWebhookDispatch, type WebhookLogEntry } from '../services/webhookService';
import { X, Zap, Mail, RefreshCw, CheckCircle2, AlertTriangle, Terminal, Code } from 'lucide-react';

interface WebhookSimulatorModalProps {
  onClose: () => void;
  onTicketMinted: (ticket: IssuedTicket) => void;
}

export const WebhookSimulatorModal: React.FC<WebhookSimulatorModalProps> = ({ onClose, onTicketMinted }) => {
  const [provider, setProvider] = useState<'stripe' | 'flutterwave'>('stripe');
  const [buyerName, setBuyerName] = useState<string>('Sarah Web3');
  const [buyerEmail, setBuyerEmail] = useState<string>('sarah@eventlink.app');
  const [logs, setLogs] = useState<WebhookLogEntry[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<WebhookLogEntry | null>(null);

  const handleSimulateWebhook = async (forceDuplicate: boolean = false) => {
    setIsSimulating(true);

    try {
      const amountStr = provider === 'stripe' ? '$25.00 USD' : '₦37,500 NGN';
      const eventTitle = 'DRIPS Soroban Web3 Hack Summit 2026';

      const res = await simulateWebhookDispatch(
        provider,
        buyerName,
        buyerEmail,
        eventTitle,
        amountStr,
        forceDuplicate
      );

      setLogs((prev) => [res.log, ...prev]);
      setSelectedLog(res.log);

      if (res.ticket) {
        onTicketMinted(res.ticket);
      }
    } catch (err) {
      console.error('Webhook simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        backgroundColor: 'rgba(5, 8, 16, 0.88)',
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
          maxWidth: '900px',
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

        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
            <Zap size={14} />
            Webhook Inspector & Idempotency Engine
          </div>
          <h2 className="font-heading" style={{ fontSize: '26px', fontWeight: 800 }}>
            Stripe & Flutterwave Webhook Live Simulator
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Simulate real-time Webhook dispatches, HMAC signature verification, idempotency duplicate handling, and automated Stellar Testnet ticket minting.
          </p>
        </div>

        {/* Simulation Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px', background: 'rgba(15, 23, 42, 0.7)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
          
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Select Webhook Provider</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setProvider('stripe')}
                style={{
                  flexGrow: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: provider === 'stripe' ? '#00f2fe' : 'var(--border-glass)',
                  background: provider === 'stripe' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  color: provider === 'stripe' ? '#00f2fe' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Stripe (USD)
              </button>

              <button
                type="button"
                onClick={() => setProvider('flutterwave')}
                style={{
                  flexGrow: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: provider === 'flutterwave' ? '#f59e0b' : 'var(--border-glass)',
                  background: provider === 'flutterwave' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: provider === 'flutterwave' ? '#f59e0b' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Flutterwave (NGN)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Attendee Details</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Attendee Name"
                style={{ width: '45%', padding: '6px 10px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '12px' }}
              />
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="Email"
                style={{ flexGrow: 1, padding: '6px 10px', borderRadius: '8px', background: 'rgba(7, 10, 20, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Trigger Buttons */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button
              onClick={() => handleSimulateWebhook(false)}
              disabled={isSimulating}
              className="btn-primary"
              style={{ flexGrow: 1, justifyContent: 'center', padding: '10px' }}
            >
              <Zap size={16} />
              Simulate Webhook Dispatch (Trigger Stellar Mint)
            </button>

            <button
              onClick={() => handleSimulateWebhook(true)}
              disabled={isSimulating}
              className="btn-secondary"
              style={{ flexGrow: 1, justifyContent: 'center', padding: '10px', borderColor: '#f59e0b', color: '#f59e0b' }}
            >
              <RefreshCw size={16} />
              Test Idempotency (Send Duplicate Payload)
            </button>
          </div>

        </div>

        {/* Logs & Payload Inspector */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          
          {/* Left Column: Log Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Webhook Log History ({logs.length})</span>
            {logs.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '20px', textAlign: 'center', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
                No dispatches triggered yet. Click above to send simulated Webhook.
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? '#00f2fe' : 'var(--border-glass)',
                      background: isSelected ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: log.provider === 'stripe' ? '#00f2fe' : '#f59e0b' }}>
                        {log.provider.toUpperCase()}
                      </strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {log.status === 'SUCCESS' ? (
                        <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} />
                          200 OK (Minted)
                        </span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} />
                          200 OK (Idempotent Ignored)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Payload & Email Inspector */}
          <div style={{ background: 'rgba(7, 10, 20, 0.9)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-glass)', maxHeight: '380px', overflowY: 'auto' }}>
            {selectedLog ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#00f2fe', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Code size={14} />
                    Verified HMAC Signature & Payload
                  </span>
                  <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Signature VALID (HMAC SHA-256)
                  </span>
                </div>

                <pre style={{ background: 'rgba(0, 0, 0, 0.6)', padding: '12px', borderRadius: '8px', fontSize: '11px', color: '#a855f7', fontFamily: 'monospace', overflowX: 'auto', marginBottom: '16px' }}>
                  {JSON.stringify(selectedLog.rawPayload, null, 2)}
                </pre>

                {selectedLog.emailPreviewHTML && (
                  <div>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Mail size={14} />
                      Dispatched Email Confirmation HTML Preview
                    </span>
                    <div
                      dangerouslySetInnerHTML={{ __html: selectedLog.emailPreviewHTML }}
                      style={{ borderRadius: '12px', overflow: 'hidden' }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '60px', fontSize: '13px' }}>
                <Terminal size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                Select a log from the left feed to inspect raw webhook dispatches and email dispatches.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
