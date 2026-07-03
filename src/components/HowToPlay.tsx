import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/types/game';
import { motion } from 'framer-motion';
import { ArrowLeft, MousePointer, TrendingUp, AlertTriangle, Zap, Shield } from 'lucide-react';

export default function HowToPlay() {
  const setScreen = useGameStore(s => s.setScreen);

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <button
          onClick={() => setScreen(GameScreen.Welcome)}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <h1 className="text-3xl font-bold mb-2">Cómo Jugar</h1>
        <p className="text-slate-400 mb-8">Sos un agente de cargas. Tu negocio es la diferencia.</p>

        <div className="space-y-4">
          <StepCard
            number={1}
            icon={<MousePointer className="w-5 h-5" />}
            title="Llega una consulta"
            desc="Un cliente te dice qué necesita mover. Mirá la ruta, el tipo de carga y la urgencia."
            color="blue"
          />
          <StepCard
            number={2}
            icon={<Zap className="w-5 h-5" />}
            title="Negociá con el agente"
            desc="Elegí un transportista y regateá la tarifa. Cada peso que ahorrás es margen tuyo. Pero cuidado: el más barato suele ser el menos confiable."
            color="amber"
          />
          <StepCard
            number={3}
            icon={<TrendingUp className="w-5 h-5" />}
            title="Cotizá al cliente"
            desc="Poné tu precio con margen. Usá tácticas de negociación (Presión, Valor, Adelanto...) para aumentar la chance de aceptación."
            color="green"
          />
          <StepCard
            number={4}
            icon={<Shield className="w-5 h-5" />}
            title="Cerrá y cobrá"
            desc="Si acepta, la carga se va en tránsito. Cuando llega, cobrás el full. Si falla, perdés plata y fama."
            color="cyan"
          />
          <StepCard
            number={5}
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Cuidá dos cosas"
            desc={
              <>
                <strong>💵 La Caja:</strong> si llega a 0, perdés.<br />
                <strong>⭐ La Fama:</strong> si llega a -100, nadie quiere trabajar con vos.
              </>
            }
            color="red"
          />
        </div>

        <div className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="font-semibold text-slate-200 mb-2">💡 Tips para negociar mejor</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• El agente más barato a veces da más problemas</li>
            <li>• Si hay un problema, podés ayudar al cliente (perdés plata pero ganás fama) o no (guardás plata pero se enoja)</li>
            <li>• A veces lo más inteligente es decir que no a un mal negocio</li>
            <li>• Las tácticas se ganan al completar cargas exitosamente</li>
            <li>• La relación con el cliente afecta la negociación</li>
          </ul>
        </div>

        <button
          onClick={() => setScreen(GameScreen.Welcome)}
          className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-all"
        >
          Entendido 👍
        </button>
      </motion.div>
    </div>
  );
}

function StepCard({ number, icon, title, desc, color }: {
  number: number;
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: number * 0.1 }}
      className={`rounded-xl border p-4 ${colorMap[color]}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm opacity-80">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}
