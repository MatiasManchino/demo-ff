import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, TrendingUp, Star, Target, DollarSign } from 'lucide-react';

export default function VictoryScreen() {
  const { stats, day, fame, level, cash, resetGame } = useGameStore();

  const rating = fame >= 80 ? 'S' : fame >= 50 ? 'A' : fame >= 0 ? 'B' : fame >= -30 ? 'C' : 'D';
  const ratingColor = rating === 'S' ? 'text-yellow-400' : rating === 'A' ? 'text-green-400' : rating === 'B' ? 'text-blue-400' : rating === 'C' ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 mb-6"
        >
          <Trophy className="w-12 h-12 text-yellow-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent mb-2"
        >
          ¡Meta Alcanzada!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 mb-6"
        >
          Llegaste a ₦{cash.toLocaleString()}. Tu empresa es un éxito.
        </motion.p>

        {/* Rating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="text-sm text-slate-500 mb-1">Rating</div>
          <div className={`text-6xl font-black ${ratingColor}`}>{rating}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-8 space-y-3"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Días
            </span>
            <span className="text-slate-300 font-semibold">{day}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Fama final
            </span>
            <span className="text-yellow-400 font-semibold">{fame}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Cargas cerradas
            </span>
            <span className="text-slate-300 font-semibold">{stats.closed}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Profit total
            </span>
            <span className="text-green-400 font-semibold">₦{stats.totalProfit.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Nivel alcanzado</span>
            <span className="text-blue-400 font-semibold">{level}</span>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={resetGame}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Jugar de Nuevo
        </motion.button>
      </motion.div>
    </div>
  );
}
