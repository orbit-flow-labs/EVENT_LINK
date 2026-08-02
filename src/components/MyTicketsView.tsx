import React, { useState } from 'react';
import type { IssuedTicket, UserAccount } from '../types';
import { Ticket, Wallet, Calendar, MapPin, Award, Gift, ShieldCheck, Tag, Lock, LogIn, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MyTicketsViewProps {
  userAccount: UserAccount | null;
  tickets: IssuedTicket[];
  onSelectTicket: (ticket: IssuedTicket) => void;
  onOpenClaimModal: (ticket: IssuedTicket) => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  userAccount,
  tickets,
  onSelectTicket,
  onOpenClaimModal,
  onOpenAuthModal,
}) => {
  const [activeTab, setActiveTab] = useState<'passes' | 'rewards'>('passes');

  // 🔒 If user is NOT signed in, show clean authentication lock screen
  if (!userAccount) {
    return (
      <div style={{ maxWidth: '720px', margin: '60px auto', padding: '48px 32px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-glass)', borderRadius: '24px', backdropFilter: 'blur(20px)' }}>
        <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(112, 0, 255, 0.15))', border: '1px solid rgba(0, 242, 254, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Lock size={40} color="#00f2fe" />
        </div>
        <h2 className="font-heading" style={{ fontSize: '30px', fontWeight: 900, marginBottom: '12px', color: '#ffffff' }}>
          Authentication Required
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '500px', margin: '0 auto 28px', lineHeight: 1.6 }}>
          Your ticket passes and Web3 asset credentials are bound strictly to your registered account. Please sign in or create an account to view your passes.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onOpenAuthModal('login')}
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '14px', background: 'linear-gradient(135deg, #00f2fe, #7000ff)', color: '#040711', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <LogIn size={16} />
            Sign In to My Account
          </button>
          <button
            onClick={() => onOpenAuthModal('register')}
            className="btn-secondary"
            style={{ padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Create New Account
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Filter checked-in tickets that unlocked post-event rewards & POAPs
  const rewardedTickets = tickets.filter((t) => t.status === 'used' || t.status === 'proof_nft' || t.poapMetadata);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Header & Sub-Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 className="font-heading" style={{ fontSize: '32px', fontWeight: 900, marginBottom: '4px' }}>
            My Passes & Achievements Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Manage your Stellar smart ticket passes, POAPs, reward tokens, and discount vouchers.
          </p>
        </div>

        {/* Sub Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255, 255, 255, 0.04)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setActiveTab('passes')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'passes' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(112, 0, 255, 0.2))' : 'transparent',
              color: activeTab === 'passes' ? '#00f2fe' : 'var(--text-muted)',
            }}
          >
            <Ticket size={16} />
            Smart Passes ({tickets.length})
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'rewards' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 242, 254, 0.2))' : 'transparent',
              color: activeTab === 'rewards' ? '#10b981' : 'var(--text-muted)',
            }}
          >
            <Gift size={16} />
            Collectibles & Rewards ({rewardedTickets.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Smart Passes */}
      {activeTab === 'passes' && (
        <>
          {tickets.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
              <Ticket size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 className="font-heading" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                No Smart Passes Found
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Purchase an event ticket using fiat or crypto to receive your automated Stellar smart pass.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
              {tickets.map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-panel glass-panel-hover"
                  style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', border: '1px solid rgba(0, 242, 254, 0.25)' }}
                >
                  
                  {/* Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {t.id}
                    </span>

                    {t.status === 'proof_nft' || t.status === 'used' ? (
                      <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        POAP NFT Earned
                      </span>
                    ) : t.status === 'valid' ? (
                      <span style={{ background: 'rgba(0, 242, 254, 0.2)', border: '1px solid rgba(0, 242, 254, 0.4)', color: '#00f2fe', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        Self-Custody Valid
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                        Custodial (Claimable)
                      </span>
                    )}
                  </div>

                  {/* Title & Info */}
                  <h3 className="font-heading" style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px' }}>
                    {t.eventTitle}
                  </h3>

                  <p style={{ fontSize: '13px', color: '#00f2fe', fontWeight: 700, marginBottom: '16px' }}>
                    {t.tierName} • Paid {t.amountPaid}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#00f2fe" />
                      <span>{t.eventDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#7000ff" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.eventVenue}</span>
                    </div>
                  </div>

                  {/* POAP Badge Notification */}
                  {t.poapMetadata && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} color="#10b981" />
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{t.poapMetadata.badgeName}</span>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => onSelectTicket(t)}
                      className="btn-primary"
                      style={{ flexGrow: 1, justifyContent: 'center', padding: '8px', fontSize: '13px' }}
                    >
                      View Holographic Pass
                    </button>

                    {t.status === 'claimable' && (
                      <button
                        onClick={() => onOpenClaimModal(t)}
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px', borderColor: 'rgba(112, 0, 255, 0.4)' }}
                      >
                        <Wallet size={14} color="#a855f7" />
                        Claim
                      </button>
                    )}
                  </div>

                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Collectibles & Achievements / Rewards */}
      {activeTab === 'rewards' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          
          <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(0, 242, 254, 0.12))', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '24px', borderRadius: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Award size={28} color="#10b981" />
              <h2 className="font-heading" style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>
                Post-Event Proof-of-Attendance Rewards Engine
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Check-in at events to unlock verified Stellar Proof NFTs, earn <strong>150 LINK Reward Tokens</strong> on Stellar Testnet, receive <strong>20% Off Vouchers</strong> for future summits, and gain VIP Early Access Whitelist status!
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            
            {/* Reward Card 1: 150 LINK Tokens */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(0, 242, 254, 0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ background: 'rgba(0, 242, 254, 0.2)', color: '#00f2fe', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                  Stellar Asset Token
                </span>
                <span style={{ fontSize: '12px', color: '#ffd700', fontWeight: 800 }}>★ Claimed</span>
              </div>
              <h3 className="font-heading" style={{ fontSize: '20px', fontWeight: 800, color: '#00f2fe', marginBottom: '6px' }}>
                150 LINK Attendance Tokens
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Minted on Stellar Testnet for attending DRIPS Soroban Web3 Hack Summit 2026.
              </p>
              <div style={{ background: 'rgba(4, 7, 17, 0.8)', padding: '10px', borderRadius: '10px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                Token Contract: CCLINKREWARDTOKENS2026STELLAR
              </div>
            </div>

            {/* Reward Card 2: 20% Discount Voucher */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                  Discount Voucher
                </span>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>Active Code</span>
              </div>
              <h3 className="font-heading" style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', marginBottom: '6px' }}>
                20% OFF Future Summit Passes
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Exclusive discount code valid for any upcoming EventLink Web3 conference.
              </p>
              <div style={{ background: 'rgba(4, 7, 17, 0.8)', padding: '10px', borderRadius: '10px', fontSize: '12px', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>VOUCHER: EVENTLINK20OFF</span>
                <Tag size={14} />
              </div>
            </div>

            {/* Reward Card 3: VIP Whitelist Access */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', border: '1px solid rgba(168, 85, 247, 0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                  VIP Access Status
                </span>
                <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: 800 }}>Unlocked</span>
              </div>
              <h3 className="font-heading" style={{ fontSize: '20px', fontWeight: 800, color: '#a855f7', marginBottom: '6px' }}>
                VIP Founder Whitelist Access
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Priority early bird registration and exclusive Founder & VC dinner invitations.
              </p>
              <div style={{ background: 'rgba(4, 7, 17, 0.8)', padding: '10px', borderRadius: '10px', fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} />
                Verified Holder on Stellar Soroban Registry
              </div>
            </div>

          </div>

        </motion.div>
      )}

    </div>
  );
};
