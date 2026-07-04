import { useGameStore } from '@/store/gameStore';
import { GameScreen, CargoStatus } from '@/types/game';
import { getRandomEvent } from '@/data/events';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Star, TrendingUp, Package, Users,
  Ship, AlertTriangle, ChevronRight, Volume2, VolumeX,
  Zap, BarChart3, Award
} from 'lucide-react';
import { useEffect } from 'react';

export default function MainScreen() {
  const {
    cash, fame, level, xp, day, targetCash,
    activeCargos, stats, soundEnabled,
    setScreen, generateNewCargo, selectCargo, advanceDay,
    toggleSound,
  } = useGameStore();

  // Auto-generate new cargo if none available for quoting
  useEffect(() => {
    const quotingCargos = activeCargos.filter(c => c.status === CargoStatus.Quoting);
    if (quotingCargos.length === 0 && activeCargos.filter(c => c.status === CargoStatus.InTransit).length < 3) {
      generateNewCargo();
    }
  }, [activeCargos.length]);

  const quotingCargos = activeCargos.filter(c => c.status === CargoStatus.Quoting);
  const transitCargos = activeCargos.filter(c => c.status === CargoStatus.InTransit);

  const fameEmoji = fame >= 50 ? '🌟' : fame >= 0 ? '🙂' : fame >= -50 ? '😟' : '😰';
  const cashPercent = Math.min(100, (cash / targetCash) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Top Bar */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="font-bold text-green-400">₦{cash.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">{fameEmoji} {fame}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Día {day}</span>
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-slate-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress to target */}
      <div className="px-4 pt-3 pb-1">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">Meta: ₦{targetCash.toLocaleString()}</span>
            <span className="text-slate-500">{cashPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${cashPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-2">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-2">
          <StatBadge icon={<Package className="w-3.5 h-3.5" />} label="Cerrados" value={stats.closed} color="green" />
          <StatBadge icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Perdidos" value={stats.lost} color="red" />
          <StatBadge icon={<Zap className="w-3.5 h-3.5" />} label="Problemas" value={stats.problems} color="amber" />
          <StatBadge icon={<Award className="w-3.5 h-3.5" />} label={`Nivel ${level}`} value={xp} color="blue" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Quoting Cargos */}
          <SectionHeader icon={<Users className="w-4 h-4" />} title="Consultas Pendientes" count={quotingCargos.length} />
          <AnimatePresence>
            {quotingCargos.map(cargo => (
              <motion.div
                key={cargo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
                onClick={() => {
                  selectCargo(cargo.id);
                  setScreen(GameScreen.AgentNegotiation);
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-200 mb-1">{cargo.clientName}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                      <Ship className="w-3 h-3" />
                      {cargo.origin} → {cargo.destination}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-slate-700/50 px-2 py-0.5 rounded">{cargo.description}</span>
                      <span className="bg-slate-700/50 px-2 py-0.5 rounded">{cargo.quantity}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
                {!cargo.agentId && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Falta conseguir tarifa con agente
                  </div>
                )}
                {cargo.agentId && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Tarifa conseguida: ₦{cargo.agentCost}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {quotingCargos.length === 0 && (
            <div className="text-center py-6 text-slate-600 text-sm">
              No hay consultas pendientes
            </div>
          )}

          {/* In Transit */}
          {transitCargos.length > 0 && (
            <>
              <SectionHeader icon={<Ship className="w-4 h-4" />} title="En Tránsito" count={transitCargos.length} />
              {transitCargos.map(cargo => {
                const progress = Math.min(100, (cargo.daysInTransit / cargo.totalDays) * 100);
                return (
                  <motion.div
                    key={cargo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">{cargo.origin} → {cargo.destination}</span>
                      <span className="text-xs text-slate-500">Día {cargo.daysInTransit}/{cargo.totalDays}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Profit potencial: <span className="text-green-400">₦{cargo.finalPrice - cargo.agentCost}</span>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <button
            onClick={() => {
              advanceDay();
              const st = useGameStore.getState();

              // Eventos de tránsito: chance diaria por carga, escalada por la confiabilidad
              // del agente elegido — el barato (45%) sufre el doble de problemas que el premium (97%).
              st.activeCargos
                .filter(c => c.status === CargoStatus.InTransit)
                .forEach(c => {
                  const agent = st.agents.find(a => a.id === c.agentId);
                  const reliability = agent ? agent.reliability : 75;
                  const chance = 0.05 * (1.5 - reliability / 100);
                  if (Math.random() >= chance) return;

                  const ev = getRandomEvent();
                  const cost = Math.round(ev.cost / 2);   // costos a escala demo
                  const isBad = ev.reputationImpact < 0;
                  if (cost) st.addCash(-cost);
                  if (ev.reputationImpact) st.addFame(Math.round(ev.reputationImpact / 3));
                  if (ev.extraDays) st.extendTransit(c.id, ev.extraDays);
                  if (isBad) st.updateStats({ problems: st.stats.problems + 1 });

                  const detail = [
                    ev.description,
                    cost ? `−₦${cost}` : '',
                    ev.extraDays ? `${ev.extraDays > 0 ? '+' : ''}${ev.extraDays} días` : '',
                  ].filter(Boolean).join(' · ');
                  toast[isBad ? 'warning' : 'success'](`${ev.name} — ${c.origin} → ${c.destination}`, {
                    description: detail,
                  });
                });

              // Process transit completions
              const completed = useGameStore.getState().activeCargos.filter(
                c => c.status === CargoStatus.InTransit && c.daysInTransit >= c.totalDays
              );
              completed.forEach(c => {
                useGameStore.getState().resolveTransit(c.id);
                toast.success(`Entregado — ${c.origin} → ${c.destination}`, {
                  description: `+₦${Math.round(c.finalPrice * 0.1)} de bono por entrega · +8 fama`,
                });
              });
            }}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Avanzar Día
          </button>
          <button
            onClick={() => {
              if (quotingCargos.length < 3) {
                generateNewCargo();
              }
            }}
            disabled={quotingCargos.length >= 3}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-400 bg-green-400/10',
    red: 'text-red-400 bg-red-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${colorMap[color]}`}>
      {icon}
      <div>
        <div className="text-[10px] opacity-70 leading-tight">{label}</div>
        <div className="text-xs font-bold leading-tight">{value}</div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        {icon}
        {title}
      </div>
      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{count}</span>
    </div>
  );
}
