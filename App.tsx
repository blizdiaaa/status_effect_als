
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StatusEffect, EditorMode, SortOption } from './types';
import { INITIAL_STATUS_EFFECTS } from './constants';
import StatusCard from './components/StatusCard';
import EditorModal from './components/EditorModal';
import AdminLoginModal from './components/AdminLoginModal';
import { 
  Search, Plus, ShieldCheck, ShieldAlert, Zap, Filter, 
  LayoutGrid, Cloud, CloudUpload, RefreshCw, Link as LinkIcon,
  Wifi, WifiOff, Database
} from 'lucide-react';

const STORAGE_KEY = 'als_codex_db_v4';
const CONFIG_KEY = 'als_codex_config';
const ADMIN_PASS = 'ALS_ADMIN_2024';

// User provided Firebase URL
const DEFAULT_DB_URL = 'https://als-codex-default-rtdb.firebaseio.com/';

const App: React.FC = () => {
  const [effects, setEffects] = useState<StatusEffect[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Cloud States
  const [dbUrl, setDbUrl] = useState<string>(DEFAULT_DB_URL);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [currentEffect, setCurrentEffect] = useState<StatusEffect | undefined>();

  // 1. Initial Load from Local & Config
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      setDbUrl(savedConfig);
    } else {
      setDbUrl(DEFAULT_DB_URL);
    }
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      setEffects(JSON.parse(savedData));
    } else {
      setEffects(INITIAL_STATUS_EFFECTS);
    }
  }, []);

  // 2. Cloud Synchronization Engine
  const syncWithCloud = useCallback(async (targetUrl: string = dbUrl) => {
    if (!targetUrl) return;
    
    // Firebase REST API requires .json at the end of the path
    const cleanUrl = targetUrl.replace(/\/$/, '') + '/effects.json';
    
    setIsSyncing(true);
    try {
      const response = await fetch(cleanUrl);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          // Firebase returns objects or arrays depending on how it was saved
          const formattedData = Array.isArray(data) ? data : Object.values(data);
          setEffects(formattedData as StatusEffect[]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedData));
          setIsOnline(true);
          setLastSynced(Date.now());
        } else {
          // If database is empty (null returned), use initial data or leave as is
          if (effects.length === 0) setEffects(INITIAL_STATUS_EFFECTS);
          setIsOnline(true);
        }
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      console.error("Cloud Sync Error:", err);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, [dbUrl, effects.length]);

  // 3. Auto-Polling for Global Updates
  useEffect(() => {
    if (dbUrl) {
      syncWithCloud();
      // Poll every 20 seconds for changes from other users/admins
      const interval = setInterval(() => syncWithCloud(), 20000); 
      return () => clearInterval(interval);
    }
  }, [dbUrl, syncWithCloud]);

  // 4. Push Updates to Global Cloud (Admin only)
  const pushToCloud = async (updatedData: StatusEffect[]) => {
    if (!dbUrl || !isAdmin) return;
    
    const cleanUrl = dbUrl.replace(/\/$/, '') + '/effects.json';
    setIsSyncing(true);
    
    try {
      const response = await fetch(cleanUrl, {
        method: 'PUT', // Firebase PUT replaces the node with the provided array
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      
      if (response.ok) {
        setLastSynced(Date.now());
        setIsOnline(true);
      } else {
        throw new Error("Server rejected update");
      }
    } catch (err) {
      console.error("Cloud Push Error:", err);
      alert("GLOBAL SYNC FAILED: Ensure your Firebase rules allow public read/write or check your internet connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (pass: string) => {
    if (pass === ADMIN_PASS) {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
    } else {
      alert('AUTHENTICATION FAILED: Invalid Administrator Passcode');
    }
  };

  const saveConfig = (url: string) => {
    setDbUrl(url);
    localStorage.setItem(CONFIG_KEY, url);
    syncWithCloud(url);
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

  const handleSave = async (data: Omit<StatusEffect, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => {
    let updated: StatusEffect[];
    if (editorMode === 'create') {
      const newEntry: StatusEffect = {
        ...data,
        id: Date.now().toString(),
        createdAt: Date.now(),
        imageUrl: data.imageUrl || '',
      };
      updated = [newEntry, ...effects];
    } else {
      updated = effects.map(e => e.id === data.id ? { ...e, ...data } : e);
    }
    
    setEffects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    if (dbUrl && isAdmin) {
      await pushToCloud(updated);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("ARE YOU SURE? THIS WILL PERMANENTLY ERASE THE GLOBAL RECORD.")) return;
    
    const updated = effects.filter(item => item.id !== id);
    setEffects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    if (dbUrl && isAdmin) {
      await pushToCloud(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-rose-600/30">
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
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-bold tracking-widest uppercase transition-all ${
                  isOnline 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {isOnline ? 'Network: Online' : 'Network: Standalone'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-xl relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text"
              placeholder="Query Archives..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:border-rose-600 transition-all placeholder:text-slate-700"
            />
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={() => syncWithCloud()}
                disabled={isSyncing}
                title="Force Cloud Refresh"
                className="p-2.5 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              </button>

            <button 
              onClick={() => isAdmin ? setIsAdmin(false) : setIsLoginModalOpen(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                isAdmin 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30' 
                  : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
              }`}
            >
              {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {isAdmin ? 'SYSTEM ADMIN' : 'ADMIN LOGIN'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        
        {/* Admin Cloud Config Panel */}
        {isAdmin && (
          <div className="mb-12 bg-slate-900/50 border border-rose-600/20 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-rose-600/10 px-6 py-3 border-b border-rose-600/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <Database size={16} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Synchronization Terminal</span>
              </div>
              <div className="text-[9px] text-slate-500 uppercase font-mono">Status: {isOnline ? 'GLOBAL_LINK_ACTIVE' : 'LOCAL_REDUNDANCY'}</div>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text"
                  placeholder="Firebase Endpoint URL..."
                  value={dbUrl}
                  onChange={e => saveConfig(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-rose-400 focus:outline-none focus:border-rose-600 transition-all"
                />
              </div>
              <button 
                onClick={() => pushToCloud(effects)}
                disabled={!dbUrl || isSyncing}
                className="bg-slate-800 hover:bg-rose-600 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <CloudUpload size={16} /> Deploy to Global Cloud
              </button>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Filter size={14} className="text-rose-500" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest text-slate-400 focus:outline-none cursor-pointer hover:text-white transition-colors"
              >
                <option value="newest">Latest Records</option>
                <option value="oldest">Legacy Records</option>
                <option value="name-asc">Alphabetical A-Z</option>
                <option value="name-desc">Alphabetical Z-A</option>
              </select>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600">
              <LayoutGrid size={14} />
              Codex Index: <span className="text-rose-500">{effects.length} Effects</span>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            {isAdmin && (
              <button 
                onClick={() => { setEditorMode('create'); setCurrentEffect(undefined); setIsModalOpen(true); }}
                className="flex-1 md:w-auto bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
              >
                <Plus size={16} /> New Marker
              </button>
            )}
          </div>
        </div>

        {/* Sync Status Info */}
        <div className="mb-8 flex items-center justify-between px-4">
           <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
             <Cloud size={14} />
             <span>Active Data Source: <span className="text-rose-400/80 font-mono text-[9px]">{dbUrl.slice(0, 45)}...</span></span>
           </div>
           {lastSynced && (
             <span className="text-[9px] text-slate-600 uppercase tracking-widest italic flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               Last Pulse: {new Date(lastSynced).toLocaleTimeString()}
             </span>
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
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-900/10 border-2 border-dashed border-slate-800/50 rounded-3xl">
            <RefreshCw size={64} className="text-slate-800 mb-6 animate-spin-slow" />
            <h3 className="heading-font text-slate-600 uppercase tracking-[0.3em] font-bold">Connecting to Hive...</h3>
            <p className="text-slate-700 text-xs mt-2 uppercase tracking-widest">Initial global handshake in progress</p>
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
          <p className="heading-font text-[10px] text-slate-700 font-bold uppercase tracking-[0.5em] text-center leading-loose">
            Anime Last Stand &bull; Global Codex Network &bull; Shared Intelligence Database
            <br />
            <span className="text-slate-800">UNAUTHORIZED ACCESS PROHIBITED</span>
          </p>
        </div>
      </footer>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
