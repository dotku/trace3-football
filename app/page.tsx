'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameDayDashboard from './components/dashboard/GameDayDashboard';
import { useEffect } from 'react';
import { socket } from './lib/api/client';
import { useAnalyticsStore } from './lib/store/analytics';

const queryClient = new QueryClient();

export default function Home() {
  const { setAttendance, updateConcessions, updateParking } = useAnalyticsStore();

  useEffect(() => {
    socket.connect();

    socket.on('attendance-update', (data: number) => setAttendance(data));
    socket.on('concessions-update', (data: { sales: number; inventory: Record<string, number> }) => {
      updateConcessions(data.sales, data.inventory);
    });
    socket.on('parking-update', (data: { available: number; occupied: number }) => {
      updateParking(data.available, data.occupied);
    });

    return () => {
      socket.disconnect();
    };
  }, [setAttendance, updateConcessions, updateParking]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        {/* Navigation */}
        <nav className="bg-slate-900/50 backdrop-blur-sm border-b border-indigo-900/50 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl font-bold text-blue-500">Trace3</h1>
                <div className="hidden md:flex space-x-6">
                  <a href="#dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
                  <a href="#solutions" className="text-gray-300 hover:text-white transition-colors">Solutions</a>
                  <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">Game Day Operations</span>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-500/10 backdrop-blur-3xl rounded-full filter blur-3xl transform -translate-y-1/2"></div>
          <div className="relative">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-emerald-200 bg-clip-text text-transparent">
              Trace3 Analytics War Room
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Real-time Game Day Analytics and AI-Powered Predictions for Optimal Stadium Operations
            </p>
          </div>
        </header>

        {/* Dashboard */}
        <section className="container mx-auto px-4 py-8">
          <GameDayDashboard />
        </section>
      </div>
    </QueryClientProvider>
  );
}
