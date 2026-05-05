"use client";

import { useState } from "react";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (name: string, email: string) => Promise<void>;
  isSigning: boolean;
  error?: string;
}

export default function SignatureModal({ isOpen, onClose, onSign, isSigning, error }: SignatureModalProps) {
  const [signName, setSignName] = useState("");
  const [signEmail, setSignEmail] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-heading font-extrabold text-primary">Mudarabah Agreement</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Digital Signature Required</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Guide & Instructions */}
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm">menu_book</span>
                Investment Guide
              </h4>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                By signing this, you enter a <strong>Mudarabah Al-Muqayyada</strong> (Restricted Mudarabah) contract. 
                As the Rabb-ul-Maal (Investor), you provide the capital, and FlockFund (Mudarib) provides management.
                Profit is shared 70/30 after all capital and verified costs are recovered.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-800 flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm">info</span>
                Signature Instructions
              </h4>
              <ul className="text-[11px] text-blue-700 space-y-1.5 list-disc list-inside">
                <li>Enter your <strong>Full Name</strong> exactly as it appears in your profile settings.</li>
                <li>Enter your <strong>Account Email</strong> to verify your identity.</li>
                <li>This digital signature is legally binding under the Electronic Transactions Act.</li>
              </ul>
            </div>
          </div>

          {/* The Form */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Signatory Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your full name"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Verification Email</label>
              <input 
                type="email" 
                placeholder="Enter your account email"
                value={signEmail}
                onChange={(e) => setSignEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2">
                <span className="material-symbols-outlined text-rose-500 text-sm mt-0.5">error</span>
                <p className="text-[10px] font-bold text-rose-600 leading-tight">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <button
            onClick={() => onSign(signName, signEmail)}
            disabled={isSigning || !signName || !signEmail}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSigning ? (
              <>
                <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                Verifying & Signing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">draw</span>
                Confirm Digital Signature
              </>
            )}
          </button>
          <p className="text-[9px] text-slate-400 text-center mt-4">
            By clicking above, you agree to the terms of the Mudarabah Agreement and authorize this digital signature.
          </p>
        </div>
      </div>
    </div>
  );
}
