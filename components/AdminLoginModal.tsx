
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (passcode: string) => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [passcode, setPasscode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    onLogin(passcode);
    setPasscode('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500">
            <Lock size={20} />
            <h2 className="heading-font font-bold uppercase tracking-widest">Admin Access</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-wider font-semibold">
            Please enter the encrypted passcode to unlock editor privileges.
          </p>
          
          <div className="relative">
            <input 
              type="password" 
              autoFocus
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
              }}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-rose-600 transition-all text-center tracking-[0.5em] text-lg font-mono"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg uppercase tracking-widest transition-all transform active:scale-95 shadow-lg shadow-rose-900/20"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginModal;
