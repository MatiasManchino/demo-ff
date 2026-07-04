import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameScreen, TacticType, TACTIC_CONFIG, type Cargo, type Client } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MessageCircle, CheckCircle2, XCircle,
  Zap, Clock, AlertTriangle, Handshake
} from 'lucide-react';
import {
  previewClientAcceptance, evaluateClientQuote,
  getAcceptanceColor, type ClientNegotiationPreview,
} from '@/engine/negotiation';
import { sfxSuccess, sfxFail, sfxClick } from '@/lib/sfx';
import { CLIENT_DIALOGUES } from '@/types/game';

export default function ClientQuoteScreen() {
  const {
    setScreen, selectedCargoId, activeCargos, availableClients,
    tactics, level, fame, demandMultiplier,
    useTactic, submitQuote, resolveQuote, addFame, adjustClientRelationship,
  } = useGameStore();

  const [price, setPrice] = useState<string>('');
  const [paymentTerm, setPaymentTerm] = useState<number>(15);
  const [activeTactics, setActiveTactics] = useState<TacticType[]>([]);
  const [result, setResult] = useState<{ accepted: boolean; message: string; counterOffer: number | null; makesAngry: boolean } | null>(null);
  const [showTactics, setShowTactics] = useState(false);
  const [clientMessage, setClientMessage] = useState(() =>
    CLIENT_DIALOGUES.initial[Math.floor(Math.random() * CLIENT_DIALOGUES.initial.length)]
  );

  // Si el rechazo elimina la carga del store, esta copia congelada mantiene la pantalla
  // de resultado renderizable (antes quedaba "No hay carga o cliente" sin explicación).
  const [frozen, setFrozen] = useState<{ cargo: Cargo; client: Client } | null>(null);
  const liveCargo = activeCargos.find(c => c.id === selectedCargoId);
  const liveClient = availableClients.find(c => c.id === liveCargo?.clientId);
  const cargo = liveCargo ?? frozen?.cargo;
  const client = liveClient ?? frozen?.client;

  const preview: ClientNegotiationPreview | null = useMemo(() => {
    if (!cargo || !client || !price || parseInt(price) <= 0) return null;
    return previewClientAcceptance(
      cargo, client, parseInt(price), paymentTerm,
      activeTactics, level, fame, demandMultiplier, cargo.quoteRound,
    );
  }, [cargo, client, price, paymentTerm, activeTactics, level, fame, demandMultiplier]);

  const handleUseTactic = (tactic: TacticType) => {
    if (activeTactics.includes(tactic)) {
      setActiveTactics(prev => prev.filter(t => t !== tactic));
      return;
    }
    if (useTactic(tactic)) {
      setActiveTactics(prev => [...prev, tactic]);
    }
  };

  const handleSubmit = () => {
    if (!cargo || !client || !price) return;
    const offeredPrice = parseInt(price);
    if (offeredPrice <= 0) return;
    setFrozen({ cargo, client });   // preserva el render del resultado si la carga se elimina

    submitQuote(cargo.id, offeredPrice, paymentTerm);

    const evaluation = evaluateClientQuote(
      cargo, client, offeredPrice, paymentTerm,
      activeTactics, level, fame, demandMultiplier,
      cargo.quoteRound,
    );

    if (evaluation.accepted) {
      sfxSuccess();
      resolveQuote(cargo.id, true, null);
      setClientMessage(evaluation.message);
      setResult({ accepted: true, message: evaluation.message, counterOffer: null, makesAngry: false });
    } else if (evaluation.counterOffer) {
      sfxClick();
      setPrice(evaluation.counterOffer.toString());
      setClientMessage(evaluation.message);
      setResult({ accepted: false, message: evaluation.message, counterOffer: evaluation.counterOffer, makesAngry: false });
    } else {
      sfxFail();
      resolveQuote(cargo.id, false, null);
      if (evaluation.makesAngry) {
        addFame(-10);
        adjustClientRelationship(cargo.clientId, -10);   // el cliente ofendido se acuerda de vos
      }
      setClientMessage(evaluation.message);
      setResult({ accepted: false, message: evaluation.message, counterOffer: null, makesAngry: evaluation.makesAngry });
    }
  };

  const handleAcceptCounter = () => {
    if (!cargo || !client || !result?.counterOffer) return;
    sfxSuccess();
    submitQuote(cargo.id, result.counterOffer, paymentTerm);
    resolveQuote(cargo.id, true, null);
    setResult({ accepted: true, message: 'Aceptamos tu contraoferta. ¡Trato hecho! 🤝', counterOffer: null, makesAngry: false });
    setClientMessage('Aceptamos tu contraoferta. ¡Trato hecho! 🤝');
  };

  const handleBack = () => {
    setScreen(GameScreen.Main);
  };

  if (!cargo || !client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">No hay carga o cliente</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300"
        >
          ← Volver al escritorio
        </button>
      </div>
    );
  }

  const profit = preview ? preview.expectedProfit : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => !result ? setScreen(GameScreen.AgentNegotiation) : handleBack()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {!result ? 'Agentes' : 'Escritorio'}
          </button>
          <span className="text-sm font-semibold text-slate-300">Cotizar al Cliente</span>
          <div className="w-16" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Client Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{client.emoji}</span>
              <div>
                <div className="font-semibold text-slate-200">{client.companyName}</div>
                <div className="text-xs text-slate-500">{client.description}</div>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300 italic">"{clientMessage}"</p>
              </div>
            </div>
          </motion.div>

          {/* Cargo Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4"
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Ruta</div>
                <div className="text-slate-300">{cargo.origin} → {cargo.destination}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Carga</div>
                <div className="text-slate-300">{cargo.description}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tu costo</div>
                <div className="text-amber-400 font-semibold">₦{cargo.agentCost}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Transporte</div>
                <div className="text-slate-300">{cargo.mode === 'maritime' ? '🚢 Marítimo' : cargo.mode === 'air' ? '✈️ Aéreo' : '🚛 Terrestre'}</div>
              </div>
            </div>
          </motion.div>

          {/* Result overlay */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl border p-4 ${
                  result.accepted
                    ? 'bg-green-900/20 border-green-500/30'
                    : result.makesAngry
                    ? 'bg-red-900/20 border-red-500/30'
                    : 'bg-amber-900/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {result.accepted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : result.makesAngry ? (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-amber-400" />
                  )}
                  <span className={`font-semibold ${
                    result.accepted ? 'text-green-400' : result.makesAngry ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {result.accepted ? '¡Cerrado!' : result.makesAngry ? 'Rechazado (ofensivo)' : result.counterOffer ? 'Contraoferta' : 'Rechazado'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-3">{result.message}</p>

                {result.counterOffer && (
                  <button
                    onClick={handleAcceptCounter}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
                  >
                    Aceptar contraoferta de ₦{result.counterOffer}
                  </button>
                )}

                <button
                  onClick={handleBack}
                  className="mt-2 w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-all"
                >
                  {result.accepted ? 'Volver al escritorio' : result.counterOffer ? 'Seguir negociando' : 'Volver al escritorio'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quote Form */}
          {!result && (
            <>
              {/* Price Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="text-sm font-medium text-slate-300 mb-2 block">Tu precio de venta</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">₦</span>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold focus:outline-none focus:border-blue-500 text-white"
                    placeholder={`Mínimo: ₦${cargo.agentCost}`}
                    min={cargo.agentCost}
                  />
                </div>

                {/* Live Preview */}
                {preview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Margen:</span>
                      <span style={{ color: preview.color }} className="font-semibold">
                        {(preview.margin * 100).toFixed(1)}% ({preview.priceLabel})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Precio justo (mercado):</span>
                      <span className="text-slate-400">~₦{preview.fairPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Profit estimado:</span>
                      <span className="text-green-400 font-semibold">₦{profit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Chance de aceptación:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            animate={{
                              width: `${preview.acceptanceChance * 100}%`,
                              backgroundColor: getAcceptanceColor(preview.acceptanceChance),
                            }}
                          />
                        </div>
                        <span style={{ color: getAcceptanceColor(preview.acceptanceChance) }} className="font-semibold text-sm">
                          {(preview.acceptanceChance * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Payment Term */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Plazo de pago</span>
                </div>
                <div className="flex gap-2">
                  {[0, 7, 15, 30, 45, 60].map(term => (
                    <button
                      key={term}
                      onClick={() => setPaymentTerm(term)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        paymentTerm === term
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {term === 0 ? 'Contado' : `${term}d`}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Tactics */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={() => setShowTactics(!showTactics)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3"
                >
                  <Zap className="w-4 h-4" />
                  Tácticas de Negociación
                  <span className="text-xs text-slate-500">({activeTactics.length} activas)</span>
                </button>

                <AnimatePresence>
                  {showTactics && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-2">
                        {(Object.entries(TACTIC_CONFIG) as [TacticType, typeof TACTIC_CONFIG[TacticType]][]).map(([type, config]) => {
                          const isActive = activeTactics.includes(type);
                          const stock = tactics[type];
                          return (
                            <button
                              key={type}
                              onClick={() => handleUseTactic(type)}
                              disabled={stock === 0 && !isActive}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                isActive
                                  ? 'bg-blue-900/30 border-blue-500/50'
                                  : stock > 0
                                  ? 'bg-slate-800/50 border-slate-700/40 hover:border-slate-600'
                                  : 'bg-slate-800/20 border-slate-800/30 opacity-50'
                              }`}
                            >
                              <span className="text-lg">{config.emoji}</span>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-200">{config.name}</div>
                                <div className="text-xs text-slate-500">{config.description}</div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xs font-semibold ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                  {isActive ? 'Activa' : `x${stock}`}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleSubmit}
                disabled={!price || parseInt(price) <= 0}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Handshake className="w-5 h-5" />
                Enviar Cotización
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
