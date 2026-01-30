import React, { useState, useEffect, useMemo } from 'react';
import { StatusEffect, EditorMode, SortOption } from './types';
import { INITIAL_STATUS_EFFECTS } from './constants';
import StatusCard from './components/StatusCard';
import EditorModal from './components/EditorModal';
import AdminLoginModal from './components/AdminLoginModal';
import { Search, Plus, ShieldCheck, ShieldAlert, Zap, Filter, LayoutGrid } from 'lucide-react';

const STORAGE_KEY = 'als_codex_database_v3';
const ADMIN_PASS = 'ALS_ADMIN_2024';

const App: React.FC = () => {
  const [effects, setEffects] = useState<StatusEffect[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [currentEffect, setCurrentEffect] = useState<StatusEffect | undefined>();

  // Database Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEffects(JSON.parse(saved));
    } else {
      setEffects(INITIAL_STATUS_EFFECTS);
    }
  }, []);

  useEffect(() => {
    if (effects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(effects));
    }
  }, [effects]);

  const handleLogin = (pass: string) => {
    if (pass === ADMIN_PASS) {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
    } else {
      alert('Access Denied: Invalid Security Passcode');
    }
  };

  const processedEffects = useMemo(() => {
    let result = [...effects];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'oldest': return a.createdAt - b.createdAt;
        default: return b.createdAt - a.createdAt;
      }
    });
    return result;
  }, [effects, searchQuery, sortBy]);

  const handleSave = (data: Omit<StatusEffect, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => {
    if (editorMode === 'create') {
      const newEntry: StatusEffect = {
        ...data,
        id: Date.now().toString(),
        createdAt: Date.now(),
        imageUrl: data.imageUrl || `/icons/question_mark.png`,
      };
      setEffects(prev => [newEntry, ...prev]);
    } else {
      setEffects(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Tactical Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-rose-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(225,29,72,0.4)] rotate-3">
              <Zap className="text-white fill-white" size={24} />
            </div>
            <div>
              <h1 className="heading-font text-2xl font-black tracking-tighter text-white">
                ALS <span className="text-rose-600">CODEX</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-500">Live Database v3.0</p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-xl relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text"
              placeholder="Scan for status markers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:border-rose-600 transition-all placeholder:text-slate-700"
            />
          </div>

          <button 
            onClick={() => isAdmin ? setIsAdmin(false) : setIsLoginModalOpen(true)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              isAdmin 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30' 
                : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
            }`}
          >
            {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            {isAdmin ? 'ADMIN AUTHENTICATED' : 'ADMIN LOGIN'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Filter size={14} className="text-rose-500" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest text-slate-400 focus:outline-none cursor-pointer hover:text-white transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Alphabetical A-Z</option>
                <option value="name-desc">Alphabetical Z-A</option>
              </select>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600">
              <LayoutGrid size={14} />
              Results: <span className="text-rose-500">{processedEffects.length}</span>
            </div>
          </div>

          {isAdmin && (
            <button 
              onClick={() => { setEditorMode('create'); setCurrentEffect(undefined); setIsModalOpen(true); }}
              className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> New Entry
            </button>
          )}
        </div>

        {/* Grid Display */}
        {processedEffects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {processedEffects.map(effect => (
              <StatusCard 
                key={effect.id}
                effect={effect}
                isAdmin={isAdmin}
                onEdit={(e) => { setCurrentEffect(e); setEditorMode('edit'); setIsModalOpen(true); }}
                onDelete={(id) => setEffects(prev => prev.filter(item => item.id !== id))}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-900/10 border-2 border-dashed border-slate-800/50 rounded-3xl">
            <div className="relative mb-6">
              <Search size={64} className="text-slate-800" />
              <div className="absolute inset-0 animate-ping bg-rose-600/5 rounded-full"></div>
            </div>
            <h3 className="heading-font text-slate-600 uppercase tracking-[0.3em] font-bold">No Records Found</h3>
            <p className="text-slate-700 text-xs mt-2 uppercase tracking-widest">Database return null for current query</p>
          </div>
        )}
      </main>

      {/* Modals */}
      <AdminLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLogin} 
      />
      
      <EditorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        mode={editorMode} 
        initialData={currentEffect} 
      />

      {/* Footer Branding */}
      <footer className="border-t border-slate-900 bg-slate-950/50 py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-6 opacity-30">
            <div className="h-[1px] w-20 bg-slate-800"></div>
            <Zap size={16} className="text-rose-600" />
            <div className="h-[1px] w-20 bg-slate-800"></div>
          </div>
          <p className="heading-font text-[10px] text-slate-700 font-bold uppercase tracking-[0.5em]">
            ALS DATA SERVICES &copy; MMXXIV
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;