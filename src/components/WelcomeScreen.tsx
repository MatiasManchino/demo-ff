import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/types/game';
import { motion } from 'framer-motion';
import { Ship, TrendingUp, Users, DollarSign, ArrowRight, BookOpen } from 'lucide-react';

export default function WelcomeScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const startGame = useGameStore(s => s.startGame);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-4 max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30 mb-4">
            <Ship className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent"
        >
          Freight Forwarder
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-slate-400 mb-2"
        >
          El Negociador
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 mb-8 text-sm text-slate-500"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Versión mejorada con negociaciones profundas
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <FeatureCard icon={<Users className="w-5 h-5" />} title="Negocia" desc="Con agentes y clientes" />
          <FeatureCard icon={<DollarSign className="w-5 h-5" />} title="Gana" desc="Comprá barato, vendé caro" />
          <FeatureCard icon={<TrendingUp className="w-5 h-5" />} title="Crece" desc="Subí de nivel y fama" />
          <FeatureCard icon={<Ship className="w-5 h-5" />} title="Superá" desc="Eventos y desafíos" />
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={startGame}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            Empezar a Jugar
          </button>
          <button
            onClick={() => setScreen(GameScreen.HowToPlay)}
            className="w-full py-3 px-6 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl font-medium text-slate-300 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-slate-700/50"
          >
            <BookOpen className="w-5 h-5" />
            Cómo Jugar
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-xs text-slate-600"
        >
          🎮 Demo interactiva · Sin datos personales
        </motion.p>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 text-left hover:bg-slate-800/70 transition-colors">
      <div className="text-blue-400 mb-1">{icon}</div>
      <div className="font-semibold text-sm text-slate-200">{title}</div>
      <div className="text-xs text-slate-500">{desc}</div>
    </div>
  );
}
