import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useWallet } from '@/hooks/useWallet';
import { useTransactions, type TransactionFilter } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';
import InlineDepositCard from '@/components/wallet/InlineDepositCard';
import RazorpayDepositCard from '@/components/wallet/RazorpayDepositCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  IndianRupee,
  Zap,
} from 'lucide-react';

export default function Wallet() {
  const { wallet } = useWallet();
  const { formatPrice } = useCurrency();
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const { data: transactions } = useTransactions(filter);

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-5 w-5 text-success" />;
      case 'order': return <ArrowUpRight className="h-5 w-5 text-destructive" />;
      case 'refund': return <RefreshCw className="h-5 w-5 text-primary" />;
      default: return <WalletIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-success/10';
      case 'order': return 'bg-destructive/10';
      case 'refund': return 'bg-primary/10';
      default: return 'bg-muted';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-success';
      case 'order': return 'text-destructive';
      case 'refund': return 'text-primary';
      default: return 'text-foreground';
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your balance and transactions.</p>
        </div>

        {/* Balance Card */}
        <div className="glass-premium p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-[80px] animate-pulse-glow" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <WalletIcon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'hsl(145 15% 50%)' }}>Vault Statistics</p>
            </div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Total Available</p>
            <p className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: 'hsl(140 60% 95%)' }}>{formatPrice(wallet?.balance || 0)}</p>

            <div className="grid grid-cols-2 gap-4 pt-4 mt-6 border-t border-white/5">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Revenue Injected</p>
                <p className="text-xl font-black text-primary leading-tight">{formatPrice(wallet?.total_deposited || 0)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Marketing Burn</p>
                <p className="text-xl font-black text-red-500/80 leading-tight">{formatPrice(wallet?.total_spent || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Section */}
        <Tabs defaultValue="upi" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-14 glass-card p-1.5 rounded-2xl border border-white/5">
            <TabsTrigger
              value="upi"
              className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all duration-500"
            >
              <IndianRupee className="h-3.5 w-3.5 mr-2" />
              UPI / Cards
            </TabsTrigger>
            <TabsTrigger
              value="usdt"
              className="rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-500"
            >
              <Zap className="h-3.5 w-3.5 mr-2" />
              USDT (BEP20)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upi" className="mt-0 focus-visible:outline-none">
            <RazorpayDepositCard />
          </TabsContent>

          <TabsContent value="usdt" className="mt-0 focus-visible:outline-none">
            <InlineDepositCard />
          </TabsContent>
        </Tabs>

        {/* Transaction History */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as TransactionFilter)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="deposit">Deposits</TabsTrigger>
                <TabsTrigger value="order">Orders</TabsTrigger>
                <TabsTrigger value="refund">Refunds</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30"
                >
                  {/* Left: icon + info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${getIconBg(tx.type)}`}>
                      {getIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      {/* Description */}
                      <p className="font-medium text-sm leading-tight truncate max-w-[260px]">
                        {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1">
                        {/* Payment method badge */}
                        {tx.payment_method && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                            {tx.payment_method.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        )}
                        {/* Status Badge */}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] py-0 px-1.5 h-4 font-black uppercase tracking-widest border-none",
                            tx.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                              tx.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" :
                                "bg-rose-500/10 text-rose-500"
                          )}
                        >
                          {tx.status}
                        </Badge>
                        {/* Date */}
                        <span className="text-xs text-muted-foreground">{fmtDate(tx.created_at!)}</span>
                        {/* BSCScan link for crypto deposits */}
                        {tx.payment_reference && tx.payment_method === 'usdt_bep20' && (
                          <a
                            href={`https://bscscan.com/tx/${tx.payment_reference}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-0.5"
                          >
                            BSCScan <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: amount + balance after */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`font-bold text-base ${getAmountColor(tx.type)}`}>
                      {tx.type === 'order' ? '−' : '+'}${Math.abs(Number(tx.amount)).toFixed(2)}
                    </p>
                    {tx.balance_after != null && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bal: ${Number(tx.balance_after).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <WalletIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your deposits and spending history will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
