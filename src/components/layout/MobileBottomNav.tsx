import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileBottomNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile Header - Flush to top edge, slightly taller */}
      <header className="fixed top-0 left-0 right-0 z-40 lg:hidden">
        <div className="flex items-center justify-between h-16 px-5 bg-[#0a0a0c]/80 backdrop-blur-2xl border-b border-white/10 shadow-lg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 active:scale-95 transition-all"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-black border border-white/10 p-1 shadow-lg">
              <img src="/favicon.png" alt="OrganicSMM" className="w-full h-full object-cover rounded-lg" />
            </div>
            <span className="font-[900] text-lg tracking-tight text-white drop-shadow-md">OrganicSMM</span>
          </div>

          <div className="w-11" />
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
