import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { LiveChatWidget } from '@/components/chat/LiveChatWidget';
import { cn } from '@/lib/utils';
import { Clock, Sparkles, ArrowRight } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}


export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="fixed inset-y-0 left-0 z-40 w-[280px] hidden lg:block">
        <Sidebar />
      </aside>

      {/* Mobile Header & Sidebar */}
      <MobileBottomNav />

      {/* Main content */}
      <main className="lg:pl-[280px] w-full">
        {/* Add padding top on mobile for header, no bottom padding needed anymore */}
        <div className="min-h-screen pt-16 lg:pt-0 px-3 py-4 sm:px-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
}
