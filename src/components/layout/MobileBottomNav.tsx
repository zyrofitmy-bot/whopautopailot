import { useState } from 'react';
import { Menu, Zap } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileBottomNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile Header - Flush to top edge, slightly taller */}
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="flex items-center justify-between h-14 px-4 bg-[#04060c]/85 backdrop-blur-3xl border-b border-white/10 shadow-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-black/50 border border-white/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Zap className="w-4 h-4 text-[#0ea5e9]" />
            </div>
            <span className="font-[900] text-base tracking-tight text-white">Whopautopailot</span>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* Sidebar overlay — instant toggle */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
