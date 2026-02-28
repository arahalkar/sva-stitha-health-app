/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Calendar, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Info,
  Flame,
  Brain,
  Heart,
  RefreshCw,
  Database
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';
import { cn } from './lib/utils';
import { INITIAL_DATA, START_DATE, TARGET_DATE } from './constants';
import { Goal } from './types';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App() {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_DATA);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'physical' | 'mental'>('all');

  const timeProgress = useMemo(() => {
    const start = new Date(START_DATE).getTime();
    const end = new Date(TARGET_DATE).getTime();
    const now = new Date().getTime();
    
    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min(Math.max((elapsed / total) * 100, 0), 100);
    
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    
    return { percentage, daysLeft, daysElapsed };
  }, []);

  const filteredGoals = useMemo(() => {
    if (selectedCategory === 'all') return goals;
    return goals.filter(g => g.category === selectedCategory);
  }, [goals, selectedCategory]);

  const stats = useMemo(() => {
    const totalProgress = goals.reduce((acc, goal) => acc + (goal.current / goal.target), 0) / goals.length;
    return {
      averageProgress: totalProgress * 100,
      completedGoals: goals.filter(g => g.current >= g.target).length,
      totalGoals: goals.length
    };
  }, [goals]);

  const chartData = useMemo(() => {
    return goals.map(g => ({
      name: g.name,
      progress: Math.min((g.current / g.target) * 100, 100),
      remaining: Math.max(100 - (g.current / g.target) * 100, 0)
    }));
  }, [goals]);

  const [isSyncing, setIsSyncing] = useState(false);

  const fetchFromGoogleSheets = async () => {
    let sheetId = process.env.VITE_GOOGLE_SHEET_ID || '';
    const apiKey = process.env.VITE_GOOGLE_API_KEY;

    // If user pasted the full URL, extract the ID
    if (sheetId.includes('docs.google.com/spreadsheets/d/')) {
      const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) sheetId = match[1];
    }

    if (!sheetId || !apiKey) {
      alert('Google Sheets configuration missing. Please set VITE_GOOGLE_SHEET_ID and VITE_GOOGLE_API_KEY in your environment.');
      return;
    }

    setIsSyncing(true);
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      // Fetch columns A through E to include Name, Current, Target, Unit, and Category
      const range = 'Sheet1!A2:E50'; 
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const rows = data.values;

      if (!rows || rows.length === 0) {
        alert('No data found in the specified range (Sheet1!A2:E50). Ensure your sheet has data and the tab name is "Sheet1".');
        return;
      }

      const syncedGoals: Goal[] = [];
      let matchCount = 0;

      rows.forEach((row: any[], index: number) => {
        // Skip empty rows or rows without a name
        if (!row[0] || row[0].toString().trim() === '') return;
        
        const nameFromSheet = row[0].toString().trim();
        const currentVal = row[1] ? parseFloat(row[1].toString().replace(/,/g, '')) : 0;

        // Column C: Target (Default to 100 if missing or invalid)
        const targetVal = row[2] ? parseFloat(row[2].toString().replace(/,/g, '')) : 100;
        
        // Column D: Unit (Default to 'Units' if missing)
        const unitVal = row[3] ? row[3].toString().trim() : 'Units';
        
        // Column E: Category (Default to 'physical' if missing or invalid)
        const rawCategory = row[4] ? row[4].toString().trim().toLowerCase() : 'physical';
        const categoryVal: 'physical' | 'mental' | 'other' = 
          ['physical', 'mental', 'other'].includes(rawCategory) 
            ? (rawCategory as 'physical' | 'mental' | 'other') 
            : 'physical';

        syncedGoals.push({
          id: `sheet-${index}-${nameFromSheet.replace(/\s+/g, '-').toLowerCase()}`,
          name: nameFromSheet,
          current: isNaN(currentVal) ? 0 : currentVal,
          target: isNaN(targetVal) ? 100 : targetVal,
          unit: unitVal,
          category: categoryVal
        });
        matchCount++;
      });

      if (syncedGoals.length > 0) {
        setGoals(syncedGoals);
        alert(`Successfully synced! Loaded ${matchCount} goals from your Google Sheet.`);
      } else {
        alert('No valid goal data found in the sheet.');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Sync error:', error);
      if (error.name === 'AbortError') {
        alert('Sync timed out after 15 seconds. Please check your internet connection and ensure the Sheet ID is correct.');
      } else {
        alert(`Sync failed: ${error.message}\n\nCommon fixes:\n1. Make sure the sheet is "Public" (Anyone with link can view)\n2. Verify the API Key is correct\n3. Ensure the tab name is "Sheet1"`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Activity size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">स्व-स्थित</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section / Overall Progress */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">५० @ ५० सर्वांगीण साधना</h2>
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100">
                  Active Challenge
                </span>
              </div>
              <p className="text-slate-500 mb-6 max-w-md">
                Tracking progress towards the ultimate milestone. Every step counts towards the 50th birthday goal.
              </p>
              <div className="mb-8 p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-emerald-900 font-serif italic text-lg leading-relaxed mb-1">
                    "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्"
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-3">
                    — श्रीमद्भगवद्गीता | अध्याय ६, श्लोक ५
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    आपण स्वतःच स्वतःचा उद्धार केला पाहिजे आणि स्वतःला अधोगती पासून वाचवायला पाहिजे.
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-emerald-900">
                  <Activity size={120} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Time Progress</span>
                <span className="text-3xl font-black text-slate-800">{timeProgress.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${timeProgress.percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-inner"
                />
              </div>
              <div className="flex justify-between text-sm font-medium text-slate-500">
                <span>Started: {new Date(START_DATE).toLocaleDateString()}</span>
                <span>{timeProgress.daysLeft} days remaining</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-white/10 rounded-2xl">
                <TrendingUp size={24} className="text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Stats</span>
            </div>
            
            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-emerald-400">{stats.averageProgress.toFixed(0)}%</div>
                <div className="text-sm text-slate-400 leading-tight">Average<br/>Progress</div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats.completedGoals}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalGoals}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Total Goals</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <button 
                onClick={fetchFromGoogleSheets}
                disabled={isSyncing}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white transition-all rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-200"
              >
                {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
                {isSyncing ? 'Updating...' : 'Update dashboard'}
              </button>
            </div>
          </motion.div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-[400px]"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Target size={20} className="text-emerald-500" />
              Goal Completion Distribution
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="progress" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 h-[400px]"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-blue-500" />
              Milestone Breakdown
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Completed (100%)', count: goals.filter(g => (g.current / g.target) >= 1).length, color: 'bg-emerald-500' },
                { label: 'Advanced (75-99%)', count: goals.filter(g => (g.current / g.target) >= 0.75 && (g.current / g.target) < 1).length, color: 'bg-blue-500' },
                { label: 'Steady (50-74%)', count: goals.filter(g => (g.current / g.target) >= 0.5 && (g.current / g.target) < 0.75).length, color: 'bg-indigo-500' },
                { label: 'Starting (1-49%)', count: goals.filter(g => (g.current / g.target) > 0 && (g.current / g.target) < 0.5).length, color: 'bg-orange-500' },
                { label: 'Not Started (0%)', count: goals.filter(g => g.current === 0).length, color: 'bg-slate-300' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-900 font-bold">{item.count} Goals</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / goals.length) * 100}%` }}
                      className={cn("h-full rounded-full", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Goals Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Individual Goals</h3>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              {(['all', 'physical', 'mental'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    selectedCategory === cat 
                      ? "bg-white text-emerald-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredGoals.map((goal, index) => {
                const progress = (goal.current / goal.target) * 100;
                return (
                  <motion.div
                    layout
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn(
                        "p-2.5 rounded-xl",
                        goal.category === 'physical' ? "bg-orange-50 text-orange-600" :
                        goal.category === 'mental' ? "bg-purple-50 text-purple-600" :
                        "bg-blue-50 text-blue-600"
                      )}>
                        {goal.category === 'physical' ? <Flame size={20} /> :
                         goal.category === 'mental' ? <Brain size={20} /> :
                         <Heart size={20} />}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {goal.category}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">
                      {goal.name}
                    </h4>
                    <div className="text-sm text-slate-500 mb-4">
                      <span className="font-bold text-slate-800">{goal.current.toLocaleString()}</span>
                      <span className="mx-1">/</span>
                      <span>{goal.target.toLocaleString()} {goal.unit}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-emerald-600">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          className={cn(
                            "h-full rounded-full",
                            progress >= 100 ? "bg-emerald-500" : "bg-emerald-400"
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-center md:text-left">
              <h3 className="text-2xl font-bold">About स्व-स्थित</h3>
              <p className="text-emerald-100 leading-relaxed">
                "Sva-Sthit" means being situated in one's self. This tracker is designed to help you stay centered and committed to your 50@50 Sankalp. Keep pushing, keep growing.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
                  <Clock size={16} />
                  <span>Next Update: Tomorrow Evening</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
                  <Info size={16} />
                  <span>Data Source: Manual Entry</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-emerald-600 font-black text-2xl shadow-xl">
                  50
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
        <p>© 2026 स्व-स्थित • Crafted for the 50@50 Journey</p>
      </footer>
    </div>
  );
}

