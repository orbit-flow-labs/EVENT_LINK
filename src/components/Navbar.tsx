import React from 'react';
import type { WalletConnectionState } from '../services/walletConnect';
import type { UserAccount } from '../types';
import { Ticket, Wallet, Globe, Zap, LogOut, User } from 'lucide-react';

interface NavbarProps {
  activeTab: 'events' | 'my-tickets' | 'admin';
  setActiveTab: (tab: 'events' | 'my-tickets' | 'admin') => void;
  currency: 'USD' | 'NGN' | 'XLM';
  setCurrency: (currency: 'USD' | 'NGN' | 'XLM') => void;
  myTicketCount: number;
  walletState: WalletConnectionState | null;
  userAccount: UserAccount | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onLogoutUser?: () => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onOpenWebhookInspector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  myTicketCount,
  walletState,
  userAccount,
  onConnectWallet,
  onDisconnectWallet,
  onLogoutUser,
  onOpenAuthModal,
  onOpenWebhookInspector,
}) => {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(4, 7, 17, 0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-glass)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('events')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #00f2fe, #7000ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 242, 254, 0.45)' }}>
            <Ticket size={24} color="#040711" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-heading" style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                Event<span className="gradient-text-cyan">Link</span>
              </span>
              <span style={{ fontSize: '10px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(0, 242, 254, 0.3)', fontWeight: 700 }}>
                Stellar Web2+Web3
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fiat Payments ✦ Soroban Smart Tickets</p>
          </div>
        </div>

        {/* Center User Nav Links (Clean public navigation) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.04)', padding: '6px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setActiveTab('events')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'events' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(112, 0, 255, 0.2))' : 'transparent',
              color: activeTab === 'events' ? '#00f2fe' : 'var(--text-muted)',
              borderBottom: activeTab === 'events' ? '2px solid #00f2fe' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Explore Events
          </button>

          <button
            onClick={() => setActiveTab('my-tickets')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'my-tickets' ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(112, 0, 255, 0.2))' : 'transparent',
              color: activeTab === 'my-tickets' ? '#00f2fe' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
            }}
          >
            <Ticket size={16} />
            My Passes & Achievements
            {myTicketCount > 0 && (
              <span style={{ background: '#00f2fe', color: '#040711', fontSize: '11px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                {myTicketCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions: Top Wallet Connect Pill, Currency Toggle, Webhook Inspector & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <button
            onClick={onOpenWebhookInspector}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px', borderColor: 'rgba(0, 242, 254, 0.4)', color: '#00f2fe' }}
          >
            <Zap size={14} color="#00f2fe" />
            Webhooks
          </button>

          {/* Currency Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
            <Globe size={14} color="var(--text-muted)" style={{ marginRight: '4px' }} />
            {(['USD', 'NGN', 'XLM'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: currency === curr ? '#00f2fe' : 'transparent',
                  color: currency === curr ? '#040711' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {curr === 'USD' ? '$ USD' : curr === 'NGN' ? '₦ NGN' : '✦ XLM'}
              </button>
            ))}
          </div>

          {/* User Account Login/Register Trigger */}
          {userAccount ? (
            <div style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', padding: '6px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={14} color="#00f2fe" />
              <span>{userAccount.fullName.split(' ')[0]}</span>
              {onLogoutUser && (
                <button
                  onClick={onLogoutUser}
                  title="Sign Out"
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 700, marginLeft: '2px' }}
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => onOpenAuthModal('login')}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <User size={14} />
                Sign In
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '6px 12px', background: 'linear-gradient(135deg, #00f2fe, #7000ff)', color: '#040711' }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Top Prominent Web3 Wallet Connection Pill */}
          {walletState?.isConnected ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(112, 0, 255, 0.15))',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 0 15px rgba(0, 242, 254, 0.25)',
              }}
            >
              <Wallet size={15} color="#00f2fe" />
              <span>{walletState.name.split(' ')[0]}: <strong style={{ color: '#00f2fe', fontFamily: 'monospace' }}>{walletState.publicKey.substring(0, 8)}...</strong></span>
              <span style={{ color: '#ffd700', fontSize: '11px' }}>({walletState.balanceXLM} XLM)</span>
              <button
                onClick={onDisconnectWallet}
                title="Disconnect Wallet"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '4px' }}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn-primary"
              style={{ fontSize: '13px', padding: '8px 16px', background: 'linear-gradient(135deg, #7000ff, #00f2fe)', color: '#fff' }}
            >
              <Wallet size={15} />
              Connect Wallet
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
