import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'AED';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
];

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: Record<string, number>;
  isLoadingRates: boolean;
  formatPrice: (usdAmount: number, options?: { compact?: boolean; decimals?: number }) => string;
  convertFromUSD: (usdAmount: number) => number;
  currencyInfo: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    // Load from localStorage first for instant UI
    const saved = localStorage.getItem('preferred_currency');
    return (saved as CurrencyCode) || 'USD';
  });

  // Sync from profile on load
  useEffect(() => {
    if (profile?.currency && CURRENCIES.some(c => c.code === profile.currency)) {
      setCurrencyState(profile.currency as CurrencyCode);
      localStorage.setItem('preferred_currency', profile.currency);
    }
  }, [profile?.currency]);

  // Fetch live exchange rates
  const { data: ratesData, isLoading: isLoadingRates } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-exchange-rates');
      if (error) throw error;
      return data as { rates: Record<string, number> };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const rates = ratesData?.rates || { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, AED: 3.67 };

  const setCurrency = useCallback(async (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('preferred_currency', code);

    // Persist to profile
    if (user) {
      await supabase
        .from('profiles')
        .update({ currency: code })
        .eq('user_id', user.id);
    }
  }, [user]);

  const convertFromUSD = useCallback((usdAmount: number): number => {
    // Read the base currency from env, defaulting to USD since prices/wallets are in USD in DB
    const baseCode = import.meta.env.VITE_BASE_CURRENCY || 'USD';
    if (currency === baseCode) return usdAmount; // Prevent unnecessary conversion

    let amountInUsd = usdAmount;
    if (baseCode !== 'USD') {
      const baseRate = rates[baseCode] || 1;
      amountInUsd = usdAmount / baseRate;
    }

    if (currency === 'USD') return amountInUsd;
    return amountInUsd * (rates[currency] || 1);
  }, [currency, rates]);

  const currencyInfo = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const formatPrice = useCallback((usdAmount: number, options?: { compact?: boolean; decimals?: number }): string => {
    const converted = convertFromUSD(usdAmount);
    const { symbol } = currencyInfo;

    // Smart decimal handling
    let decimals = options?.decimals;
    if (decimals === undefined) {
      if (converted === 0) decimals = 2;
      else if (Math.abs(converted) < 0.01) {
        // Find first significant digit for micro-transactions
        const str = Math.abs(converted).toFixed(8);
        const match = str.match(/0\.0*[1-9]/);
        decimals = match ? match[0].length : 8;
      } else if (Math.abs(converted) < 1) decimals = 4;
      else decimals = 2;
    }

    if (options?.compact && converted >= 1000) {
      if (converted >= 1000000) return `${symbol}${(converted / 1000000).toFixed(1)}M`;
      if (converted >= 1000) return `${symbol}${(converted / 1000).toFixed(1)}K`;
    }

    return `${symbol}${converted.toFixed(decimals)}`;
  }, [convertFromUSD, currencyInfo]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      isLoadingRates,
      formatPrice,
      convertFromUSD,
      currencyInfo,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback for components outside provider (like landing page)
    return {
      currency: 'USD' as CurrencyCode,
      setCurrency: () => { },
      rates: { USD: 1 },
      isLoadingRates: false,
      formatPrice: (usdAmount: number) => `$${usdAmount.toFixed(2)}`,
      convertFromUSD: (usdAmount: number) => usdAmount,
      currencyInfo: CURRENCIES[0],
    };
  }
  return context;
}
