
import React, { useState, useEffect } from 'react';
import { StatusEffect, EditorMode } from '../types';
import { X, Save, Image as ImageIcon, Info } from 'lucide-react';

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (effect: Omit<StatusEffect, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => void;
  initialData?: StatusEffect;
  mode: EditorMode;
}

const EditorModal: React.FC<EditorModalProps> = ({ isOpen, onClose, onSave, initialData, mode }) => {
  const [formData, setFormData] = useState<Omit<StatusEffect, 'id' | 'createdAt'> & { id?: string; createdAt?: number }>({
    name: '',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', description: '', imageUrl: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;
    
    // Auto-generate path if empty
    const finalData = { ...formData };
    if (!finalData.imageUrl) {
      finalData.imageUrl = `images/icons/${formData.name.toLowerCase().replace(/\s+/g, '_')}.png`;
    }

    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(225,29,72,0.1)]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/10 rounded-lg text-rose-500">
              <ImageIcon size={20} />
            </div>
            <h2 className="heading-font text-lg font-bold uppercase tracking-widest text-white">
              {mode === 'create' ? 'Central Data Entry' : 'Entry Calibration'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Name</label>
            <input 
              autoFocus
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-rose-500 transition-all font-medium"
              placeholder="e.g., Solar Flare"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Asset Reference (Local Path or URL)</label>
            <div className="flex gap-2">
               <input 
                value={formData.imageUrl}
                onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-rose-400 focus:outline-none focus:border-rose-500 transition-all font-mono text-xs"
                placeholder="images/icons/filename.png"
              />
              <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: `images/icons/${formData.name.toLowerCase().replace(/\s+/g, '_')}.png` }))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold px-3 rounded-xl uppercase transition-colors"
              >
                Auto-Link
              </button>
            </div>
            <p className="text-[9px] text-slate-600 flex items-center gap-1 italic">
              <Info size={10} /> Leave blank to auto-generate from name on save.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Official Description</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-300 focus:outline-none focus:border-rose-500 transition-all resize-none text-sm leading-relaxed"
              placeholder="Paste in-game metadata here..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all"
            >
              Abort
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
            >
              <Save size={14} /> Finalize Archives
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditorModal;
