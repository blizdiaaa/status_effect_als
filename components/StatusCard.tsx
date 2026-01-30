
import React, { useState } from 'react';
import { StatusEffect } from '../types';
import { Edit2, Trash2, Zap, ImageOff } from 'lucide-react';

interface StatusCardProps {
  effect: StatusEffect;
  isAdmin: boolean;
  onEdit: (effect: StatusEffect) => void;
  onDelete: (id: string) => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ effect, isAdmin, onEdit, onDelete }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(225,29,72,0.15)] flex flex-col min-h-[440px]">
      {/* Asset Display Area */}
      <div className="h-48 bg-slate-950/60 flex items-center justify-center relative p-8">
        {!imageError && effect.imageUrl ? (
          <img 
            src={effect.imageUrl} 
            alt={effect.name}
            onError={() => setImageError(true)}
            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(225,29,72,0.4)]"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-700">
            <div className="relative">
              <ImageOff size={40} strokeWidth={1} />
              <div className="absolute inset-0 animate-pulse bg-rose-500/10 rounded-full blur-xl"></div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Asset Missing</span>
          </div>
        )}
        
        {/* Scanning Line Effect */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent animate-[scan_3s_linear_infinite] opacity-0 group-hover:opacity-100"></div>
        
        <div className="absolute bottom-2 right-3">
          <span className="text-[8px] font-mono text-slate-600 uppercase">
            {effect.imageUrl.startsWith('data:') ? 'Custom Asset' : 'No Asset Linked'}
          </span>
        </div>
      </div>

      {/* Info Block */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <h3 className="heading-font text-xl font-bold text-white tracking-widest uppercase group-hover:text-rose-500 transition-colors">
            {effect.name}
          </h3>
          <Zap size={16} className="text-rose-500 animate-pulse shrink-0 ml-2" />
        </div>

        <div className="bg-slate-950/40 border border-slate-800/50 rounded-lg p-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rose-900/50 mb-4">
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            {effect.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
          <div className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">
            Reference ID: <span className="text-slate-400">{effect.id.slice(-6)}</span>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={() => onEdit(effect)}
                className="p-2 rounded bg-slate-800 hover:bg-rose-600 transition-colors text-slate-400 hover:text-white"
                title="Modify Data"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => onDelete(effect.id)}
                className="p-2 rounded bg-slate-800 hover:bg-rose-900 transition-colors text-slate-400 hover:text-white"
                title="Purge Entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Style Elements */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(192px); }
        }
      `}</style>
    </div>
  );
};

export default StatusCard;
