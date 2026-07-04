import { useGameStore } from '@/store/gameStore';
import { GameScreen, CargoStatus, type Notice } from '@/types/game';
import { TRANSIT_EVENTS } from '@/data/events';
import { sfxCoin, sfxAlert, sfxClick } from '@/lib/sfx';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Star, TrendingUp, Package, Users,
  Ship, AlertTriangle, ChevronRight, Volume2, VolumeX,
  Zap, BarChart3, Award, FastForward, Hourglass
} from 'lucide-react';
import { useEffect } from 'react';

// Muestra los avisos del tick de día como toasts (con sonido según el tipo).
function showNotices(notices: Notice[]) {
  for (const n of notices) {
    const show = n.kind === 'good' ? toast.success : n.kind === 'bad' ? toast.warning : toast.info;
    show(n.title, { description: n.desc });
    if (n.title.startsWith('Cobraste')) sfxCoin();
    else if (n.kind === 'bad') sfxAlert();
  }
}

export default function MainScreen() {
  const {
    cash, fame, level, xp, day, targetCash,
    activeCargos, stats, soundEnabled, pendingPayments, pendingEvents,
    setScreen, generateNewCargo, selectCargo, advanceDay, resolveEventOption,
    toggleSound,
  } = useGameStore();

  const pendingEvent = pendingEvents[0] ?? null;
  const eventData = pendingEvent ? TRANSIT_EVENTS.find(e => e.id === pendingEvent.eventId) : null;
  const receivable = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  // Suena la alarma cuando aparece un evento que exige decisión
  useEffect(() => { if (pendingEvent) sfxAlert(); }, [pendingEvent?.eventId, pendingEvent?.cargoId]);

  // Avanza hasta que pase algo (entrega, cobro, evento, meta) o 15 días como tope.
  const fastForward = () => {
    sfxClick();
    for (let i = 0; i < 15; i++) {
      const st = useGameStore.getState();
      if (st.screen !== GameScreen.Main || st.pendingEvents.length > 0) break;
      const notices = st.advanceDay();
      if (notices.length > 0) { showNotices(notices); break; }
    }
  };

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
              <DollarSign className={`w-4 h-4 ${cash < 0 ? 'text-red-400' : 'text-green-400'}`} />
              <span className={`font-bold ${cash < 0 ? 'text-red-400' : 'text-green-400'}`}>₦{cash.toLocaleString()}</span>
              {receivable > 0 && (
                <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded-full">
                  +₦{receivable.toLocaleString()} por cobrar
                </span>
              )}
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
            onClick={() => { sfxClick(); showNotices(advanceDay()); }}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Avanzar Día
          </button>
          <button
            onClick={fastForward}
            disabled={transitCargos.length === 0 && pendingPayments.length === 0}
            title="Avanzar hasta que pase algo (máx. 15 días)"
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FastForward className="w-4 h-4" />
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

      {/* Modal de evento de tránsito: el jugador DECIDE cómo responder */}
      <AnimatePresence>
        {pendingEvent && eventData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Hourglass className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-slate-100">{eventData.name}</span>
                <span className="ml-auto text-xs text-slate-500">
                  {'⚠️'.repeat(eventData.severity as number)}
                </span>
              </div>
              <div className="text-xs text-slate-500 mb-3">{pendingEvent.route}</div>
              <p className="text-sm text-slate-300 mb-4">{eventData.description}</p>
              <div className="space-y-2">
                {eventData.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const notice = resolveEventOption(i);
                      if (notice) showNotices([notice]);
                    }}
                    className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-blue-500/50 rounded-xl transition-all"
                  >
                    <div className="text-sm font-medium text-slate-200">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {opt.cost !== 0 ? `Costo: ₦${Math.abs(opt.cost)} · ` : 'Gratis · '}
                      éxito {(opt.successChance * 100).toFixed(0)}%
                      {opt.reputationEffect !== 0 && ` · fama ${opt.reputationEffect > 0 ? '+' : ''}${opt.reputationEffect}`}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
