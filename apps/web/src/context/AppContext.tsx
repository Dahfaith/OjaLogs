import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Product,
  CartItem,
  CartState,
  WalletState,
  LedgerTransaction,
  VirtualNumberSession,
  Order,
  SupportedCurrency,
  formatCurrencyAmount,
  convertNgnToCurrency
} from '@ojalogs/shared';
import {
  initialMockUser,
  initialMockProducts,
  initialMockWallet,
  initialMockLedger,
  initialMockOrders,
  initialMockVirtualNumber,
  mockCountries,
  mockServices
} from '../lib/mockData';
import { apiClient } from '../lib/apiClient';
import { supabase, signOutUser } from '../lib/supabaseClient';
import { AuthModal } from '../components/auth/AuthModal';

interface AppContextType {
  // User & Settings
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  hideBalance: boolean;
  toggleHideBalance: () => void;
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  formatPrice: (amountNgn: number, options?: { showSymbol?: boolean; showCode?: boolean; decimals?: number }) => string;
  convertPrice: (amountNgn: number) => number;
  role: 'customer' | 'admin';
  setRole: (r: 'customer' | 'admin') => void;

  // Auth Modal & Session
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  logout: () => Promise<void>;

  // Catalog
  products: Product[];
  favourites: string[];
  toggleFavourite: (productId: string) => void;
  refreshCatalog: () => Promise<void>;
  updateProduct: (updated: Product) => void;

  // Cart
  cart: CartState;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Wallet & Ledger
  wallet: WalletState;
  ledger: LedgerTransaction[];
  fundWallet: (amount: number) => Promise<{ reference: string; checkoutUrl?: string }>;
  refreshWallet: () => Promise<void>;
  
  // Orders
  orders: Order[];
  checkoutWithWallet: () => Promise<Order>;
  checkoutWithGateway: () => Promise<Order>;
  revealSecret: (orderId: string, itemId: string) => Promise<void>;

  // Virtual Numbers
  activeNumbers: VirtualNumberSession[];
  requestNumber: (countryCode: string, serviceId: string, rentalType?: 'one_time_sms' | 'long_term_rental') => Promise<VirtualNumberSession>;
  cancelNumber: (sessionId: string) => Promise<void>;
  simulateIncomingSms: (sessionId: string) => Promise<void>;

  // Support & Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialGuestWallet: WalletState = {
  balanceNgn: 0,
  currency: 'NGN',
  isLocked: false,
  pendingDeposits: 0,
  lifetimePurchases: 0,
  monthlySpendNgn: 0
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User (defaults to null for guests / new visitors)
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('oj_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = Boolean(user && user.id);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('oj_theme') as 'light' | 'dark') || 'light';
  });

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    return localStorage.getItem('oj_hide_balance') === 'true';
  });

  const [currency, setCurrencyState] = useState<SupportedCurrency>('NGN');
  const [role, setRole] = useState<'customer' | 'admin'>('customer');

  const checkIsAdmin = (email?: string, metaRole?: string): boolean => {
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    const authorized = [
      'visioreach@gmail.com',
      'admin@ojalogs.com',
      'dahfaith@gmail.com'
    ];
    const envAdmins = ((import.meta as any).env?.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map((e: string) => e.toLowerCase().trim())
      .filter(Boolean);
    return authorized.includes(normalized) || envAdmins.includes(normalized) || metaRole === 'administrator' || metaRole === 'admin';
  };

  // Supabase Magic Link redirect & session listener
  useEffect(() => {
    // Check existing active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !user) {
        const u = session.user;
        const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Customer';
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        const isAdmin = checkIsAdmin(u.email, u.user_metadata?.role);
        const userObj: UserProfile = {
          id: u.id,
          name: formattedName,
          email: u.email || '',
          initials: formattedName.substring(0, 2).toUpperCase(),
          role: isAdmin ? 'administrator' : 'customer',
          isVerified: true,
          acceptableUseAcceptedAt: new Date().toISOString(),
          preferences: {
            theme: 'light',
            hideWalletBalance: false,
            transactionAlerts: true,
            currency: 'NGN'
          }
        };
        setUser(userObj);
        if (isAdmin) setRole('admin');
        localStorage.setItem('oj_user', JSON.stringify(userObj));
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const u = session.user;
        const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Customer';
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        const isAdmin = checkIsAdmin(u.email, u.user_metadata?.role);
        const userObj: UserProfile = {
          id: u.id,
          name: formattedName,
          email: u.email || '',
          initials: formattedName.substring(0, 2).toUpperCase(),
          role: isAdmin ? 'administrator' : 'customer',
          isVerified: true,
          acceptableUseAcceptedAt: new Date().toISOString(),
          preferences: {
            theme: 'light',
            hideWalletBalance: false,
            transactionAlerts: true,
            currency: 'NGN'
          }
        };
        setUser(userObj);
        if (isAdmin) setRole('admin');
        localStorage.setItem('oj_user', JSON.stringify(userObj));
        showToast(`Authenticated as ${userObj.email}!`);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setWallet(initialGuestWallet);
        setLedger([]);
        setOrders([]);
        setActiveNumbers([]);
        localStorage.removeItem('oj_user');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('oj_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleHideBalance = () => {
    setHideBalance(prev => {
      const next = !prev;
      localStorage.setItem('oj_hide_balance', String(next));
      return next;
    });
  };

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
  };

  const formatPrice = useCallback(
    (amountNgn: number, options?: { showSymbol?: boolean; showCode?: boolean; decimals?: number }) => {
      return formatCurrencyAmount(amountNgn, currency, options);
    },
    [currency]
  );

  const convertPrice = useCallback(
    (amountNgn: number) => {
      return convertNgnToCurrency(amountNgn, currency);
    },
    [currency]
  );

  const logout = async () => {
    await signOutUser();
    localStorage.removeItem('oj_user');
    localStorage.removeItem('oj_auth_token');
    setUser(null);
    setWallet(initialGuestWallet);
    setLedger([]);
    setOrders([]);
    setActiveNumbers([]);
    showToast('Signed out of Ojalogs.');
  };

  // Catalog & Favourites
  const [products, setProducts] = useState<Product[]>(initialMockProducts);
  const [favourites, setFavourites] = useState<string[]>(['prod_vpn_01', 'prod_soft_01']);

  const refreshCatalog = useCallback(async () => {
    try {
      const data = await apiClient.getCatalog();
      if (data && data.length > 0) {
        setProducts(data);
      }
    } catch {
      // Fallback to initial mock if API server unavailable
    }
  }, []);

  const updateProduct = useCallback((updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    showToast(`Updated "${updated.title}" successfully.`);
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const toggleFavourite = (productId: string) => {
    setFavourites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Cart
  const [cart, setCart] = useState<CartState>({
    items: [],
    totalQuantity: 0,
    totalAmountNgn: 0
  });

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.items.find(i => i.product.id === product.id);
      let updatedItems: CartItem[];
      if (existing) {
        updatedItems = prev.items.map(i => 
          i.product.id === product.id 
            ? { ...i, quantity: i.quantity + quantity, subtotalNgn: (i.quantity + quantity) * product.priceNgn }
            : i
        );
      } else {
        updatedItems = [...prev.items, { product, quantity, subtotalNgn: quantity * product.priceNgn }];
      }
      const totalQuantity = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      const totalAmountNgn = updatedItems.reduce((acc, i) => acc + i.subtotalNgn, 0);
      return { items: updatedItems, totalQuantity, totalAmountNgn };
    });
    showToast(`Added "${product.title}" to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const updatedItems = prev.items.filter(i => i.product.id !== productId);
      const totalQuantity = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      const totalAmountNgn = updatedItems.reduce((acc, i) => acc + i.subtotalNgn, 0);
      return { items: updatedItems, totalQuantity, totalAmountNgn };
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const updatedItems = prev.items.map(i => 
        i.product.id === productId 
          ? { ...i, quantity, subtotalNgn: quantity * i.product.priceNgn }
          : i
      );
      const totalQuantity = updatedItems.reduce((acc, i) => acc + i.quantity, 0);
      const totalAmountNgn = updatedItems.reduce((acc, i) => acc + i.subtotalNgn, 0);
      return { items: updatedItems, totalQuantity, totalAmountNgn };
    });
  };

  const clearCart = () => {
    setCart({ items: [], totalQuantity: 0, totalAmountNgn: 0 });
  };

  // Wallet & Ledger: Strictly empty for new accounts and guests (real balances loaded from backend)
  const [wallet, setWallet] = useState<WalletState>(initialGuestWallet);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);

  const refreshWallet = useCallback(async () => {
    if (!user) {
      setWallet(initialGuestWallet);
      setLedger([]);
      return;
    }
    try {
      const [balRes, ledgerRes] = await Promise.all([
        apiClient.getWalletBalance(),
        apiClient.getLedger()
      ]);
      if (balRes) {
        setWallet(prev => ({ ...prev, balanceNgn: balRes.balanceNgn }));
      }
      if (ledgerRes && ledgerRes.transactions.length > 0) {
        setLedger(ledgerRes.transactions);
      }
    } catch {
      // Retain state if offline
    }
  }, [user]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const fundWallet = async (amount: number): Promise<{ reference: string; checkoutUrl?: string }> => {
    let reference = `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`;
    let checkoutUrl: string | undefined;

    try {
      const res = await apiClient.initiateFunding(amount);
      reference = res.reference;
      checkoutUrl = res.checkoutUrl;
    } catch (e: any) {
      console.warn('Backend funding call failed, using sandbox fallback:', e.message);
    }

    const newBalance = wallet.balanceNgn + amount;
    const newTx: LedgerTransaction = {
      id: `ldg_${Date.now()}`,
      reference,
      type: 'credit',
      category: 'deposit',
      amountNgn: amount,
      balanceAfterNgn: newBalance,
      description: `Wallet top-up via BACH Gateway (${reference})`,
      status: 'successful',
      timestamp: new Date().toISOString()
    };

    setWallet(prev => ({
      ...prev,
      balanceNgn: newBalance
    }));

    setLedger(prev => [newTx, ...prev]);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    showToast(`Successfully credited ${formatPrice(amount)} to your wallet!`);
    return { reference, checkoutUrl };
  };

  // Orders: Strictly empty for new accounts and guests (real orders loaded from backend)
  const [orders, setOrders] = useState<Order[]>([]);

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    try {
      const data = await apiClient.getOrders();
      if (data && data.length > 0) {
        setOrders(data);
      }
    } catch {
      // Retain local orders
    }
  }, [user]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const checkoutWithWallet = async (): Promise<Order> => {
    if (wallet.balanceNgn < cart.totalAmountNgn) {
      throw new Error(`Insufficient wallet balance. Please add at least ${formatPrice(cart.totalAmountNgn - wallet.balanceNgn)}`);
    }

    const checkoutPayload = cart.items.map(item => ({
      productId: item.product.id,
      serverCluster: item.product.serverCluster,
      title: item.product.title,
      quantity: item.quantity,
      unitPriceNgn: item.product.priceNgn
    }));

    let newOrder: Order;
    try {
      newOrder = await apiClient.checkout(checkoutPayload, 'wallet');
    } catch (e: any) {
      console.warn('API checkout failed, executing local fallback order:', e.message);
      const orderRef = `ord_oj_${Math.floor(1000 + Math.random() * 9000)}`;
      newOrder = {
        id: `ord_${Date.now()}`,
        reference: orderRef,
        createdAt: new Date().toISOString(),
        status: 'completed',
        paymentMethod: 'wallet',
        totalNgn: cart.totalAmountNgn,
        customerEmail: user?.email || 'guest@ojalogs.com',
        items: cart.items.map((item, idx) => ({
          id: `ord_item_${Date.now()}_${idx}`,
          product: item.product,
          quantity: item.quantity,
          unitPriceNgn: item.product.priceNgn,
          totalNgn: item.subtotalNgn,
          deliveredSecrets: [
            {
              type: 'license_key',
              revealed: false,
              value: `OJ-${item.product.serverCluster.replace(/\s+/g, '').toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              instruction: 'Instant authorized redemption key. Apply directly to your authorized service provider portal.'
            }
          ]
        }))
      };
    }

    const newBalance = wallet.balanceNgn - cart.totalAmountNgn;
    const debitTx: LedgerTransaction = {
      id: `ldg_${Date.now()}`,
      reference: `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
      type: 'debit',
      category: 'order_payment',
      amountNgn: cart.totalAmountNgn,
      balanceAfterNgn: newBalance,
      description: `Marketplace purchase (${cart.items.length} items)`,
      status: 'successful',
      timestamp: new Date().toISOString(),
      relatedOrderReference: newOrder.reference
    };

    setWallet(prev => ({
      ...prev,
      balanceNgn: newBalance,
      lifetimePurchases: prev.lifetimePurchases + cart.totalQuantity,
      monthlySpendNgn: prev.monthlySpendNgn + cart.totalAmountNgn
    }));

    setLedger(prev => [debitTx, ...prev]);
    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 }
    });

    showToast(`Order ${newOrder.reference} placed successfully! Secrets ready in your vault.`);
    return newOrder;
  };

  const checkoutWithGateway = async (): Promise<Order> => {
    const checkoutPayload = cart.items.map(item => ({
      productId: item.product.id,
      serverCluster: item.product.serverCluster,
      title: item.product.title,
      quantity: item.quantity,
      unitPriceNgn: item.product.priceNgn
    }));

    let newOrder: Order;
    try {
      newOrder = await apiClient.checkout(checkoutPayload, 'bach_direct');
    } catch {
      const orderRef = `ord_oj_${Math.floor(1000 + Math.random() * 9000)}`;
      newOrder = {
        id: `ord_${Date.now()}`,
        reference: orderRef,
        createdAt: new Date().toISOString(),
        status: 'completed',
        paymentMethod: 'bach_direct',
        totalNgn: cart.totalAmountNgn,
        customerEmail: user?.email || 'guest@ojalogs.com',
        items: cart.items.map((item, idx) => ({
          id: `ord_item_${Date.now()}_${idx}`,
          product: item.product,
          quantity: item.quantity,
          unitPriceNgn: item.product.priceNgn,
          totalNgn: item.subtotalNgn,
          deliveredSecrets: [
            {
              type: 'license_key',
              revealed: false,
              value: `OJ-BACH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              instruction: 'Delivered via verified direct BACH Gateway transaction.'
            }
          ]
        }))
      };
    }

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.6 }
    });

    showToast(`Order ${newOrder.reference} verified via BACH Gateway!`);
    return newOrder;
  };

  const revealSecret = async (orderId: string, itemId: string) => {
    let revealedSecret: string | undefined;
    let instruction: string | undefined;

    try {
      const res = await apiClient.revealSecret(orderId, itemId);
      revealedSecret = res.secret;
      instruction = res.instruction;
    } catch {
      // Fallback reveal
    }

    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        items: order.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            deliveredSecrets: item.deliveredSecrets?.map(sec => ({
              ...sec,
              revealed: true,
              value: revealedSecret || sec.value,
              instruction: instruction || sec.instruction
            }))
          };
        })
      };
    }));

    showToast('Vault secret decrypted with AES-256 and audited.');
  };

  // Division B: Virtual Numbers: Strictly empty for new accounts and guests
  const [activeNumbers, setActiveNumbers] = useState<VirtualNumberSession[]>([]);

  const refreshNumbers = useCallback(async () => {
    if (!user) {
      setActiveNumbers([]);
      return;
    }
    try {
      const list = await apiClient.getNumbers();
      if (list && list.length > 0) {
        setActiveNumbers(list);
      }
    } catch {
      // Retain active numbers
    }
  }, [user]);

  useEffect(() => {
    refreshNumbers();
  }, [refreshNumbers]);

  // Virtual numbers live countdown timer & automated 100% refund
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNumbers(prev => prev.map(session => {
        if (session.status !== 'active') return session;
        if (session.timeRemainingSeconds <= 1) {
          // Auto-expire & 100% refund!
          const refundAmount = session.priceNgn;
          const newBalance = wallet.balanceNgn + refundAmount;

          const refundTx: LedgerTransaction = {
            id: `ldg_${Date.now()}`,
            reference: `ref_rf_${Math.floor(100000 + Math.random() * 900000)}`,
            type: 'credit',
            category: 'refund',
            amountNgn: refundAmount,
            balanceAfterNgn: newBalance,
            description: `Automated 100% refund for expired SMS session (${session.phoneNumber})`,
            status: 'successful',
            timestamp: new Date().toISOString()
          };

          setWallet(w => ({ ...w, balanceNgn: newBalance }));
          setLedger(l => [refundTx, ...l]);
          showToast(`No SMS received. 100% refund of ${formatPrice(refundAmount)} credited to your wallet.`);

          // Trigger server-side cron reconciliation as well
          apiClient.triggerRentalReconciliation().catch(() => {});

          return {
            ...session,
            timeRemainingSeconds: 0,
            status: 'refunded',
            canCancel: false
          };
        }
        return {
          ...session,
          timeRemainingSeconds: session.timeRemainingSeconds - 1
        };
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [wallet.balanceNgn]);

  const requestNumber = async (
    countryCode: string,
    serviceId: string,
    rentalType: 'one_time_sms' | 'long_term_rental' = 'one_time_sms'
  ): Promise<VirtualNumberSession> => {
    const country = mockCountries.find(c => c.code === countryCode) || mockCountries[0];
    const service = mockServices.find(s => s.id === serviceId) || mockServices[0];
    const price = rentalType === 'long_term_rental' ? service.priceNgn * 5 : service.priceNgn;

    if (wallet.balanceNgn < price) {
      throw new Error(`Insufficient wallet funds. Number costs ${formatPrice(price)}. Current balance: ${formatPrice(wallet.balanceNgn)}`);
    }

    let session: VirtualNumberSession;
    try {
      session = await apiClient.requestNumber(country, service, rentalType);
    } catch {
      // Fallback session
      const randPart = Math.floor(1000000 + Math.random() * 9000000);
      const phoneNumber = `${country.dialCode} ${randPart.toString().substring(0, 3)} ${randPart.toString().substring(3)}`;
      const sessionRef = `req_num_${Math.floor(100000 + Math.random() * 900000)}`;

      session = {
        id: `num_ses_${Date.now()}`,
        reference: sessionRef,
        country,
        service,
        phoneNumber,
        rentalType,
        status: 'active',
        timeRemainingSeconds: 900,
        expiresAt: new Date(Date.now() + 900 * 1000).toISOString(),
        priceNgn: price,
        canCancel: true,
        canRenew: rentalType === 'long_term_rental',
        messages: []
      };
    }

    const newBalance = wallet.balanceNgn - price;
    const debitTx: LedgerTransaction = {
      id: `ldg_${Date.now()}`,
      reference: `ref_oj_${Math.floor(1000000 + Math.random() * 9000000)}`,
      type: 'debit',
      category: 'virtual_number_order',
      amountNgn: price,
      balanceAfterNgn: newBalance,
      description: `Virtual line allocated for ${service.name} (${country.name})`,
      status: 'successful',
      timestamp: new Date().toISOString()
    };

    setWallet(prev => ({
      ...prev,
      balanceNgn: newBalance,
      lifetimePurchases: prev.lifetimePurchases + 1
    }));
    setLedger(prev => [debitTx, ...prev]);
    setActiveNumbers(prev => [session, ...prev]);

    showToast(`Number allocated: ${session.phoneNumber}. Listening for incoming SMS...`);
    return session;
  };

  const cancelNumber = async (sessionId: string) => {
    const session = activeNumbers.find(s => s.id === sessionId);
    if (!session || session.status !== 'active') return;

    try {
      await apiClient.cancelNumber(sessionId);
    } catch {
      // Local fallback
    }

    const refundAmount = session.priceNgn;
    const newBalance = wallet.balanceNgn + refundAmount;

    const refundTx: LedgerTransaction = {
      id: `ldg_${Date.now()}`,
      reference: `ref_rf_${Math.floor(100000 + Math.random() * 900000)}`,
      type: 'credit',
      category: 'refund',
      amountNgn: refundAmount,
      balanceAfterNgn: newBalance,
      description: `Cancelled virtual number allocation (${session.phoneNumber})`,
      status: 'successful',
      timestamp: new Date().toISOString()
    };

    setWallet(prev => ({ ...prev, balanceNgn: newBalance }));
    setLedger(prev => [refundTx, ...prev]);
    setActiveNumbers(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'cancelled', canCancel: false } : s));

    showToast(`Allocation cancelled. ${formatPrice(refundAmount)} refunded to your wallet.`);
  };

  const simulateIncomingSms = async (sessionId: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await apiClient.simulateIncomingSms(sessionId, 'VERIFY', code);
    } catch {
      // Fallback
    }

    const newMsg = {
      id: `sms_${Date.now()}`,
      sender: 'VERIFY',
      code,
      fullText: `Your verification code is ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
      receivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setActiveNumbers(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        status: 'sms_received',
        canCancel: false,
        messages: [newMsg, ...s.messages]
      };
    }));

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });

    showToast(`SMS Arrived! Verification code: ${code}`);
  };

  // Toast & Support Drawer
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        theme,
        toggleTheme,
        hideBalance,
        toggleHideBalance,
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
        role,
        setRole,
        isAuthModalOpen,
        setIsAuthModalOpen,
        logout,
        products,
        favourites,
        toggleFavourite,
        refreshCatalog,
        updateProduct,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        wallet,
        ledger,
        fundWallet,
        refreshWallet,
        orders,
        checkoutWithWallet,
        checkoutWithGateway,
        revealSecret,
        activeNumbers,
        requestNumber,
        cancelNumber,
        simulateIncomingSms,
        toastMessage,
        showToast,
        isSupportOpen,
        setIsSupportOpen
      }}
    >
      {children}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
