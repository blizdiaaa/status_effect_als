
import React, { useState, useEffect, useRef } from 'react';
import { StatusEffect, EditorMode } from '../types';
// Added RefreshCw to imports
import { X, Save, Upload, Trash2, Info, Sparkles, RefreshCw } from 'lucide-react';

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
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', description: '', imageUrl: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Image Compression Logic for Global Sync Efficiency
  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 128; // Standard game icon size
        const MAX_HEIGHT = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Output as highly optimized PNG or WEBP
        resolve(canvas.toDataURL('image/png', 0.7));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({ ...prev, imageUrl: compressed }));
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(225,29,72,0.1)]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/10 rounded-lg text-rose-500">
              <Sparkles size={20} />
            </div>
            <h2 className="heading-font text-lg font-bold uppercase tracking-widest text-white">
              {mode === 'create' ? 'Global Archive Entry' : 'Update Record'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Effect Identification</label>
            <input 
              autoFocus
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-rose-500 transition-all font-medium"
              placeholder="e.g., Black Spark"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visual Marker</label>
            <div className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative">
                {isCompressing && (
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                    <RefreshCw className="text-rose-500 animate-spin" size={20} />
                  </div>
                )}
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-contain" alt="Preview" />
                ) : (
                  <Upload size={24} className="text-slate-700" />
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-rose-600 text-white text-[10px] font-bold py-2.5 px-4 rounded-lg uppercase transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> {formData.imageUrl ? 'Change Icon' : 'Upload Icon'}
                </button>
                {formData.imageUrl && (
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="text-rose-500 hover:text-rose-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors justify-center"
                  >
                    <Trash2 size={12} /> Purge Asset
                  </button>
                )}
              </div>
            </div>
            <p className="text-[9px] text-slate-600 flex items-center gap-1 italic px-1">
              <Info size={10} /> Auto-Optimizer: High-res images will be downscaled to 128px for global performance.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Codex Description</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-300 focus:outline-none focus:border-rose-500 transition-all resize-none text-sm leading-relaxed"
              placeholder="Enter official game description..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all"
            >
              Discard
            </button>
            <button 
              type="submit"
              disabled={isCompressing}
              className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={14} /> Commit to Global Server
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditorModal;
