import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Certificate3D from './components/Certificate3D.jsx';

export default function PremiumApp() {
  const [ragione, setRagione] = useState('');
  const [torto, setTorto] = useState('');
  
  return (
    <div className="min-h-screen bg-[#08080a] text-white flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Sfondo Cyber-Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Pannello Input Animato con Framer Motion */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#12121a] border border-white/5 p-8 lg:p-12 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Next-Gen Refactoring
          </span>
          <h2 className="text-4xl font-serif font-black tracking-tight mt-6 mb-8 bg-gradient-to-r from-white via-amber-200 to-amber-500 bg-clip-text text-transparent">
            Reclama il tuo Trionfo Mentale.
          </h2>

          <div className="space-y-6">
            <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider text-gray-400">Il tuo nome (Il Saggio)</label>
              <input 
                type="text" 
                value={ragione}
                onChange={(e) => setRagione(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 outline-none"
                placeholder="Es. Cesare l'Imbattibile"
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
              <label className="text-xs uppercase font-bold tracking-wider text-gray-400">L'avversario (Il Torto)</label>
              <input 
                type="text" 
                value={torto}
                onChange={(e) => setTorto(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 outline-none"
                placeholder="Es. Bruto l'Ostinato"
              />
            </motion.div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(245, 158, 11, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest text-sm mt-8 transition-all duration-300"
          >
            Genera Verdetto Assoluto
          </motion.button>
        </motion.div>

        {/* Canvas 3D e Anteprima Live Fluidissima */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Qui monta il modulo 3D */}
          <Certificate3D />
          
          {/* Card di Stato Fluida */}
          <div className="bg-[#12121a]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">Risoluzione Real-Time</h4>
            <p className="text-xs text-gray-400">
              I dati inseriti si collegano direttamente alla geometria di renderizzazione del sigillo e della pergamena digitale.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}