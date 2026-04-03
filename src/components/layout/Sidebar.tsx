import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  ListOrdered,
  Settings,
  LifeBuoy,
  Shield,
  LogOut,
  Rocket,
  Sparkles,
  ChevronRight,
  X,
  Zap,
  Crown,
  ChevronDown,
  Code2
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useCurrency, CURRENCIES, type CurrencyCode } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  onClose?: () => void;
}

const userNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Rocket, label: 'Full Engagement', path: '/engagement-order', highlight: true },
  { icon: Sparkles, label: 'Engagement Orders', path: '/engagement-orders' },
  { icon: ShoppingCart, label: 'Single Order', path: '/order' },
  { icon: ListOrdered, label: 'Single Orders', path: '/orders' },
  { icon: Package, label: 'Services', path: '/services' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Code2, label: 'API Access', path: '/api-access' },
  { icon: LifeBuoy, label: 'Support', path: '/support' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const adminNavItems = [
  { icon: Shield, label: 'Admin Panel', path: '/admin' },
];

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, signOut, wallet, profile } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const { currency, setCurrency, formatPrice, currencyInfo } = useCurrency();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="h-full w-full overflow-hidden bg-background/50 backdrop-blur-xl border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.2)]">
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo Section */}
        <div className="flex h-[80px] items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-black/50 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-black text-[15px] tracking-tight text-white leading-none">Whopautopailot</h1>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60 mt-1">Pro Console</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden h-8 w-8 text-white/40"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Profile Mini */}
        {profile && (
          <div className="mx-4 mb-3 flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 bg-white/[0.05] border border-white/[0.1] text-primary shadow-sm">
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black truncate flex items-center gap-1.5 text-white/90">
                {profile.full_name || 'User'}
                {hasActiveSubscription && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
              </p>
              <p className="text-[10px] font-bold truncate text-white/30">{profile.email}</p>
            </div>
          </div>
        )}

        {/* Balance Card Section */}
        <div className="mx-4 relative group/balance perspective-1000">
          <div className="rounded-[2.5rem] p-6 bg-gradient-to-br from-[#12121e] to-[#0a0a0f] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden border border-white/10">
            {/* Glossy Accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full -mr-16 -mt-16" />

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-inner">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[9px] font-black tracking-[0.2em] uppercase text-white/30">Console Wallet</p>
            </div>

            <p className="text-2xl font-[1000] tracking-tighter leading-none text-white mb-4 drop-shadow-xl">
              {formatPrice(wallet?.balance || 0)}
            </p>

            <Link
              to="/wallet"
              onClick={handleNavClick}
              className="w-full h-11 btn-3d flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-black"
            >
              <Zap className="h-3 w-3 fill-current" />
              RECHARGE
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 pt-6 pb-3 overflow-y-auto scrollbar-thin">
          <p className="px-4 mb-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
            Console Menu
          </p>
          {userNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isHighlight = (item as any).highlight;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  'group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-[12px] font-black mb-1',
                  isActive
                    ? 'bg-primary/10 text-white border border-primary/20'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-xl",
                  isActive ? "bg-white/10" : "bg-transparent group-hover:bg-white/5"
                )}>
                  <item.icon className={cn("h-[15px] w-[15px]", isActive ? "text-white" : "text-inherit")} />
                </div>
                <span className="flex-1">{item.label}</span>
                {isHighlight && !isActive && (
                  <span className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                    Elite
                  </span>
                )}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="my-4 mx-3 border-t border-[#f1f5f9]" />
              <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1a1a2e]/30">
                Admin
              </p>
              {adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest',
                      isActive
                        ? 'bg-primary/20 text-white border border-primary/30'
                        : 'text-white/30 hover:text-white/80 hover:bg-white/5'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg',
                      isActive ? 'bg-white/10' : 'bg-white/5'
                    )}>
                      <item.icon className={cn('h-[15px] w-[15px]', isActive ? 'text-white' : 'text-primary')} />
                    </div>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Currency Switcher */}
        <div className="px-3 pb-2 relative">
          <button
            onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[12px] font-black text-white/40 hover:bg-white/5"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{currencyInfo.flag}</span>
              <span className="uppercase tracking-widest">{currencyInfo.code}</span>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5", showCurrencyPicker && "rotate-180")} />
          </button>

          {showCurrencyPicker && (
            <div className="absolute bottom-full left-3 right-3 mb-1 rounded-xl overflow-hidden z-50 bg-[#12121a] border border-white/10 shadow-2xl backdrop-blur-xl">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setShowCurrencyPicker(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold transition-all',
                    currency === c.code
                      ? 'bg-primary/10 text-primary'
                      : 'text-white/40 hover:bg-white/5'
                  )}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1 text-left">{c.code}</span>
                  <span className="text-[10px] opacity-30">{c.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => signOut()}
            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-black text-white/30 hover:bg-white/5"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
