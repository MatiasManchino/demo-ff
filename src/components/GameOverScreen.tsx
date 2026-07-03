import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Skull, RotateCcw, TrendingDown, AlertTriangle } from 'lucide-react';

export default function GameOverScreen() {
  const { stats, day, resetGame } = useGameStore();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-900/30 border border-red-500/30 mb-6"
        >
          <Skull className="w-10 h-10 text-red-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-red-400 mb-2"
        >
          ¡Quiebra!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 mb-8"
        >
          Te quedaste sin fondos. Tu empresa de freight forwarding cerró sus puertas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-8 space-y-3"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Días sobrevividos
            </span>
            <span className="text-slate-300 font-semibold">{day}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Cargas cerradas
            </span>
            <span className="text-slate-300 font-semibold">{stats.closed}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Profit total</span>
            <span className="text-amber-400 font-semibold">₦{stats.totalProfit.toLocaleString()}</span>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={resetGame}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Intentar de Nuevo
        </motion.button>
      </motion.div>
    </div>
  );
}
