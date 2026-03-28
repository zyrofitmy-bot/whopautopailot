import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import {
  Wallet,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Leaf,
  Crown,
  CalendarClock,
  Sparkles,
  Package,
  ChevronRight,
  Zap,
  Activity,
  Eye,
  Heart,
  MessageCircle,
  BarChart3,
  LockKeyhole,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/seo/PageMeta';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { SubscriptionRequestDialog } from '@/components/subscription/SubscriptionRequestDialog';
import { useState } from 'react';

export default function Dashboard() {
  const { user, wallet, profile } = useAuth();
  const { subscription, hasActiveSubscription } = useSubscription();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, service:services(name, category)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: engagementOrders } = useQuery({
    queryKey: ['recent-engagement-orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('engagement_orders')
        .select('*, items:engagement_order_items(engagement_type, quantity, status)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('status, price')
        .eq('user_id', user?.id)
        .limit(1000);


      const { data: engOrders } = await supabase
        .from('engagement_orders')
        .select('status, total_price')
        .eq('user_id', user?.id)
        .limit(1000);


      const totalOrders = (orders?.length || 0) + (engOrders?.length || 0);
      const completedOrders = (orders?.filter(o => o.status === 'completed').length || 0) +
        (engOrders?.filter(o => o.status === 'completed').length || 0);
      const activeOrders = (orders?.filter(o => o.status === 'processing' || o.status === 'pending').length || 0) +
        (engOrders?.filter(o => o.status === 'processing' || o.status === 'pending').length || 0);
      const totalSpent = (orders?.reduce((sum, o) => sum + Number(o.price), 0) || 0) +
        (engOrders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0);

      return { totalOrders, completedOrders, activeOrders, totalSpent };
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      processing: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
      pending: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20',
      failed: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
      paused: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    };
    return config[status] || config.pending;
  };

  const engagementTypeIcon: Record<string, any> = {
    views: Eye,
    likes: Heart,
    comments: MessageCircle,
  };

  return (
    <DashboardLayout>
      <PageMeta title="Dashboard" description="Manage your social media growth orders and track delivery progress." noIndex />
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest mb-1 text-white/30">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-2xl">
                {profile?.full_name || 'User'}
              </h1>
              {hasActiveSubscription && (
                <Badge className="bg-primary text-black font-black flex items-center gap-1 px-3 py-1 shadow-lg shadow-primary/20 text-[10px] uppercase tracking-widest border-none">
                  <Crown className="h-3.5 w-3.5 fill-current" />
                  {subscription?.plan_type === 'lifetime' ? 'Lifetime Member' : 'Pro Console'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="gap-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white/60 font-black text-xs uppercase tracking-widest"
              onClick={() => navigate('/engagement-order')}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Engagement
            </Button>
            <Button
              className="gap-2 h-12 rounded-2xl btn-3d px-6 text-xs"
              onClick={() => navigate('/order')}
            >
              <Zap className="h-4 w-4 fill-current" />
              NEW ORDER
            </Button>
          </div>
        </div>



        {/* Subscription Banner */}
        {hasActiveSubscription && subscription && (
          <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-primary/5 p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 shrink-0">
                  <Crown className="h-9 w-9 text-black fill-current" />
                </div>
                <div>
                  <p className="font-black text-2xl tracking-tighter text-white">
                    {subscription.plan_type === 'lifetime' ? 'Lifetime Member' : 'Pro Member'}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                    {subscription.plan_type === 'lifetime'
                      ? 'UNLIMITED ACCESS FOREVER'
                      : subscription.expires_at
                        ? `Expires ${formatDistanceToNow(new Date(subscription.expires_at), { addSuffix: true })}`
                        : 'Elite Access Active'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Wallet,
              label: 'Balance',
              value: formatPrice(wallet?.balance || 0),
              sub: 'Available funds',
              accent: 'hsl(145 72% 52%)',
            },
            {
              icon: ShoppingCart,
              label: 'Total Orders',
              value: stats?.totalOrders || 0,
              sub: `${stats?.completedOrders || 0} completed`,
              accent: 'hsl(140 60% 95%)',
            },
            {
              icon: Activity,
              label: 'Active Tasks',
              value: stats?.activeOrders || 0,
              sub: 'In progress now',
              accent: 'hsl(145 72% 52%)',
            },
            {
              icon: TrendingUp,
              label: 'Total Spent',
              value: formatPrice(stats?.totalSpent || 0),
              sub: 'All time',
              accent: 'hsl(140 60% 95%)',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="three-d-card p-6"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-primary/10 border border-primary/20 shadow-inner">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-white/20">{stat.label}</p>
                <p className="text-3xl font-black tracking-tighter text-white drop-shadow-xl">{stat.value}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1 w-8 rounded-full bg-primary/20 overflow-hidden">
                    <div className="h-full bg-primary w-1/2 shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
                  </div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{stat.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Engagement Orders - 3 cols */}
          <div className="lg:col-span-3 three-d-card">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="font-black text-sm uppercase tracking-widest text-white/80">Engagement Console</h2>
              </div>
              <Link to="/engagement-orders" className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1 text-primary/40 hover:text-primary transition-colors">
                VIEW LOGS <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {engagementOrders && engagementOrders.length > 0 ? (
                engagementOrders.slice(0, 4).map((order: any) => (
                  <Link
                    key={order.id}
                    to={`/engagement-orders/${order.order_number}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                        <span className="text-xs font-mono text-zinc-400">#{order.order_number}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'hsl(140 60% 90%)' }}>
                          {order.link?.replace('https://', '').slice(0, 35)}...
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {order.items?.slice(0, 3).map((item: any, idx: number) => {
                            const Icon = engagementTypeIcon[item.engagement_type] || Eye;
                            return (
                              <span key={idx} className="text-xs text-zinc-500 flex items-center gap-1">
                                <Icon className="h-3 w-3" />
                                {item.quantity?.toLocaleString()}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={`${getStatusBadge(order.status)} text-[10px] px-2 py-0.5 font-medium`}>
                        {order.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-5 w-5 text-zinc-500" />
                  </div>
                  <p className="text-sm text-zinc-500 mb-3">No engagement orders yet</p>
                  <Button
                    size="sm"
                    className="bg-white text-black hover:bg-zinc-200 text-xs"
                    onClick={() => navigate('/engagement-order')}
                  >
                    Create First Order
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Single Orders - 2 cols */}
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-zinc-950/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Package className="h-4.5 w-4.5 text-zinc-400" />
                <h2 className="font-semibold text-white">Single Orders</h2>
              </div>
              <Link to="/orders" className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.slice(0, 4).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate max-w-[160px]">
                        {order.service?.name || 'Service'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {order.quantity?.toLocaleString()} • {formatPrice(Number(order.price))}
                      </p>
                    </div>
                    <Badge className={`${getStatusBadge(order.status)} text-[10px] px-2 py-0.5 font-medium`}>
                      {order.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="h-5 w-5 text-zinc-500" />
                  </div>
                  <p className="text-sm text-zinc-500 mb-3">No orders yet</p>
                  <Button
                    size="sm"
                    className="bg-white text-black hover:bg-zinc-200 text-xs"
                    onClick={() => navigate('/order')}
                  >
                    Place Order
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, label: 'Full Engagement', desc: 'Views + Likes + Comments', path: '/engagement-order', accent: 'from-violet-500/20 to-purple-500/20 border-violet-500/10 hover:border-violet-500/20' },
            { icon: Wallet, label: 'Add Funds', desc: 'Deposit to wallet', path: '/wallet', accent: 'from-emerald-500/20 to-green-500/20 border-emerald-500/10 hover:border-emerald-500/20' },
            { icon: Package, label: 'All Services', desc: 'Browse catalog', path: '/services', accent: 'from-sky-500/20 to-blue-500/20 border-sky-500/10 hover:border-sky-500/20' },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.path}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${action.accent} p-5 transition-all duration-300`}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{action.label}</p>
                  <p className="text-xs text-zinc-400">{action.desc}</p>
                </div>
              </div>
              <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>
      </div>
      <SubscriptionRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        planType={selectedPlan}
      />
    </DashboardLayout>
  );
}
