import { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { EventGrid } from './components/EventGrid';
import { EventDetailModal } from './components/EventDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { TicketPassModal } from './components/TicketPassModal';
import { ClaimWalletModal } from './components/ClaimWalletModal';
import { WebhookSimulatorModal } from './components/WebhookSimulatorModal';
import { ForgingMintAnimation } from './components/ForgingMintAnimation';
import { AdminDashboard } from './components/AdminDashboard';
import { MyTicketsView } from './components/MyTicketsView';
import { UserAuthModal } from './components/UserAuthModal';

import { MOCK_EVENTS } from './data/mockEvents';
import type { EventItem, TicketTier, IssuedTicket, UserAccount } from './types';
import { connectFreighterWallet, type WalletConnectionState } from './services/walletConnect';
import { getStoredTickets, addIssuedTicket, updateTicketInStorage, getStoredUserAccount, saveStoredUserAccount } from './services/storage';

export function App() {
  const [activeTab, setActiveTab] = useState<'events' | 'my-tickets' | 'admin'>('events');
  const [currency, setCurrency] = useState<'USD' | 'NGN' | 'XLM'>('USD');
  const [eventsList, setEventsList] = useState<EventItem[]>(MOCK_EVENTS);
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);

  // User Auth & Wallet State
  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => getStoredUserAccount());
  const [walletState, setWalletState] = useState<WalletConnectionState | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Compute tickets tied strictly to the authenticated user's account
  const userTickets = useMemo(() => {
    if (!userAccount || !userAccount.email) return [];
    const lowerEmail = userAccount.email.toLowerCase().trim();
    return tickets.filter(
      (t) =>
        t.buyerEmail?.toLowerCase().trim() === lowerEmail ||
        (userAccount.custodialPublicKey && t.custodialPublicKey === userAccount.custodialPublicKey) ||
        (userAccount.custodialPublicKey && t.currentOwnerAddress === userAccount.custodialPublicKey)
    );
  }, [tickets, userAccount]);

  // Selected Modals State
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [checkoutEventTier, setCheckoutEventTier] = useState<{ event: EventItem; tier: TicketTier } | null>(null);
  const [activePassModalTicket, setActivePassModalTicket] = useState<IssuedTicket | null>(null);
  const [activeClaimTicket, setActiveClaimTicket] = useState<IssuedTicket | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [isWebhookInspectorOpen, setIsWebhookInspectorOpen] = useState<boolean>(false);
  const [forgingTicket, setForgingTicket] = useState<IssuedTicket | null>(null);

  useEffect(() => {
    const loaded = getStoredTickets();
    setTickets(loaded);

    const savedUser = getStoredUserAccount();
    if (savedUser) {
      setUserAccount(savedUser);
    }

    // Fetch live events from database API endpoint
    fetch('http://localhost:3001/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEventsList(data);
        }
      })
      .catch((err) => console.warn('Live events fetch notice:', err));

    // Check if visiting secret admin route (/admin or ?admin=true)
    const isSecretAdminRoute = window.location.pathname === '/admin' || window.location.search.includes('admin=true');
    if (isSecretAdminRoute) {
      setActiveTab('admin');
    }

    // Parse URL claim link dispatches
    const urlParams = new URLSearchParams(window.location.search);
    const claimCodeParam = urlParams.get('claimCode');
    if (claimCodeParam) {
      const match = loaded.find((t) => t.claimCode === claimCodeParam);
      if (match) {
        setActiveClaimTicket(match);
        setIsClaimModalOpen(true);
      }
    }
  }, []);

  const handleConnectWallet = async () => {
    try {
      const res = await connectFreighterWallet();
      if (res.isConnected) {
        setWalletState(res);
      } else {
        alert('Freighter extension connection was not completed. Please ensure Freighter extension is installed in your browser and unlock it.');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
    }
  };

  const handleDisconnectWallet = () => {
    setWalletState(null);
  };

  const handleCheckoutInitiate = (event: EventItem, tier: TicketTier) => {
    setSelectedEvent(null);
    if (!userAccount) {
      // Require registration before purchase
      setIsAuthModalOpen(true);
    }
    setCheckoutEventTier({ event, tier });
  };

  const handleCheckoutSuccess = (newTicket: IssuedTicket) => {
    const updated = addIssuedTicket(newTicket);
    setTickets(updated);
    setCheckoutEventTier(null);
    setSelectedEvent(null);
    setForgingTicket(newTicket);
  };

  const handleUpdateTicket = (updatedTicket: IssuedTicket) => {
    const updatedList = updateTicketInStorage(updatedTicket);
    setTickets(updatedList);
    if (activePassModalTicket?.id === updatedTicket.id) {
      setActivePassModalTicket(updatedTicket);
    }
  };

  const handleToggleResale = (ticket: IssuedTicket, resalePriceUSD: number) => {
    const updated: IssuedTicket = {
      ...ticket,
      isListedResale: !ticket.isListedResale,
      resalePriceUSD: !ticket.isListedResale ? resalePriceUSD : undefined,
    };
    handleUpdateTicket(updated);
    alert(
      updated.isListedResale
        ? `Ticket listed on secondary market for $${resalePriceUSD} USD. Organizer royalty enforced on sale!`
        : 'Ticket removed from resale listing.'
    );
  };

  const handleClaimSuccess = (claimedTicket: IssuedTicket) => {
    handleUpdateTicket(claimedTicket);
    setIsClaimModalOpen(false);
    setActiveClaimTicket(null);
    setActivePassModalTicket(claimedTicket);
  };

  const handleAddEvent = (newEvent: EventItem) => {
    setEventsList([newEvent, ...eventsList]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        myTicketCount={userAccount ? userTickets.length : 0}
        walletState={walletState}
        userAccount={userAccount}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onLogoutUser={() => {
          setUserAccount(null);
          saveStoredUserAccount(null);
        }}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onOpenWebhookInspector={() => setIsWebhookInspectorOpen(true)}
      />

      {/* Main App Body */}
      <main style={{ flexGrow: 1 }}>
        {activeTab === 'events' && (
          <EventGrid
            events={eventsList}
            currency={currency}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
          />
        )}

        {activeTab === 'my-tickets' && (
          <MyTicketsView
            userAccount={userAccount}
            tickets={userTickets}
            onSelectTicket={(t) => setActivePassModalTicket(t)}
            onOpenClaimModal={(t) => {
              setActiveClaimTicket(t);
              setIsClaimModalOpen(true);
            }}
            onOpenAuthModal={(mode) => {
              setAuthModalMode(mode || 'login');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            events={eventsList}
            tickets={tickets}
            onAddEvent={handleAddEvent}
            onUpdateTicket={handleUpdateTicket}
          />
        )}
      </main>

      {/* Modals */}
      <EventDetailModal
        event={selectedEvent}
        currency={currency}
        onClose={() => setSelectedEvent(null)}
        onProceedToCheckout={handleCheckoutInitiate}
      />

      {checkoutEventTier && (
        <CheckoutModal
          event={checkoutEventTier.event}
          tier={checkoutEventTier.tier}
          currency={currency}
          userAccount={userAccount}
          onClose={() => setCheckoutEventTier(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {activePassModalTicket && (
        <TicketPassModal
          ticket={activePassModalTicket}
          onClose={() => setActivePassModalTicket(null)}
          onOpenClaimModal={(t) => {
            setActivePassModalTicket(null);
            setActiveClaimTicket(t);
            setIsClaimModalOpen(true);
          }}
          onToggleResale={handleToggleResale}
        />
      )}

      {isClaimModalOpen && (
        <ClaimWalletModal
          ticket={activeClaimTicket}
          onClose={() => setIsClaimModalOpen(false)}
          onClaimSuccess={handleClaimSuccess}
        />
      )}

      {isAuthModalOpen && (
        <UserAuthModal
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setUserAccount(user);
            setIsAuthModalOpen(false);
          }}
        />
      )}

      {isWebhookInspectorOpen && (
        <WebhookSimulatorModal
          onClose={() => setIsWebhookInspectorOpen(false)}
          onTicketMinted={handleCheckoutSuccess}
        />
      )}

      {forgingTicket && (
        <ForgingMintAnimation
          ticket={forgingTicket}
          onComplete={() => {
            const ticketToShow = forgingTicket;
            setForgingTicket(null);
            setActivePassModalTicket(ticketToShow);
          }}
        />
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '24px', textAlign: 'center', background: 'rgba(4, 7, 17, 0.95)', color: 'var(--text-muted)', fontSize: '13px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong style={{ color: '#fff' }}>EventLink</strong> — Web2 Fiat Onboarding ✕ Stellar Soroban Smart Passes
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Stellar Testnet Horizon SDK • Soroban Smart Contracts • Stripe & Flutterwave Webhooks</span>
            <button
              onClick={() => setActiveTab(activeTab === 'admin' ? 'events' : 'admin')}
              title="Secret Admin Portal Toggle (/admin)"
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '11px' }}
            >
              🔒
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
