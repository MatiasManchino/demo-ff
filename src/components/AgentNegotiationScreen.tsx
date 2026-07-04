import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, TrendingDown, Shield, Clock,
  CreditCard, CheckCircle2, XCircle
} from 'lucide-react';
import {
  startAgentNegotiation, negotiateWithAgent, getAgentQuote,
  getMoodEmoji, getPatienceColor,
  type AgentNegotiationState,
} from '@/engine/negotiation';
import { AGENT_GREETINGS } from '@/types/game';
import { sfxSuccess, sfxFail } from '@/lib/sfx';

export default function AgentNegotiationScreen() {
  const { setScreen, selectedCargoId, activeCargos, agents, setAgentCost } = useGameStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [negotiationStates, setNegotiationStates] = useState<Record<string, AgentNegotiationState>>({});
  const [offerInput, setOfferInput] = useState<string>('');
  const [messages, setMessages] = useState<Record<string, string[]>>({});
  const [dealClosed, setDealClosed] = useState<Record<string, boolean>>({});

  const cargo = activeCargos.find(c => c.id === selectedCargoId);

  const getAgentGreeting = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return '';
    const greetings = AGENT_GREETINGS[agent.personality];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [agents]);

  const handleSelectAgent = (agentId: string) => {
    if (negotiationStates[agentId]) return; // Already negotiating
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !cargo) return;

    setSelectedAgentId(agentId);
    const quote = getAgentQuote(agent, cargo);
    const state = startAgentNegotiation(agent, quote.price);
    setNegotiationStates(prev => ({ ...prev, [agentId]: state }));
    setMessages(prev => ({
      ...prev,
      [agentId]: [getAgentGreeting(agentId)],
    }));
    setOfferInput(Math.round(quote.price * 0.9).toString());
  };

  const handleOffer = () => {
    if (!selectedAgentId || !negotiationStates[selectedAgentId]) return;
    const agent = agents.find(a => a.id === selectedAgentId);
    if (!agent) return;

    const currentState = negotiationStates[selectedAgentId];
    // Pagar de más no tiene sentido: la oferta se capea al precio publicado
    // (antes se aceptaba literal cualquier número — costos de ₦53.000.000.000 incluidos).
    const offer = Math.min(parseInt(offerInput), currentState.originalPrice);
    if (isNaN(offer) || offer <= 0) return;

    const result = negotiateWithAgent(agent, currentState, offer);

    setNegotiationStates(prev => ({ ...prev, [selectedAgentId]: result.newState }));

    const playerMsg = `Vos: Te ofrezco ₦${offer}`;
    const agentMsg = `${agent.name}: ${result.message}`;
    setMessages(prev => ({
      ...prev,
      [selectedAgentId]: [...(prev[selectedAgentId] || []), playerMsg, agentMsg],
    }));

    if (result.accepted) {
      sfxSuccess();
      setDealClosed(prev => ({ ...prev, [selectedAgentId]: true }));
      if (cargo) {
        setAgentCost(cargo.id, offer, agent.id, getAgentQuote(agent, cargo).days);
      }
    } else if (result.newState.patience <= 0) {
      sfxFail();   // el agente se hartó y se fue
    }
  };

  const handleAcceptCounter = () => {
    if (!selectedAgentId || !negotiationStates[selectedAgentId]) return;
    const agent = agents.find(a => a.id === selectedAgentId);
    if (!agent) return;

    const state = negotiationStates[selectedAgentId];
    const counterPrice = state.currentPrice;

    setDealClosed(prev => ({ ...prev, [selectedAgentId]: true }));
    setMessages(prev => ({
      ...prev,
      [selectedAgentId]: [
        ...(prev[selectedAgentId] || []),
        `Vos: Acepto los ₦${counterPrice}`,
        `${agent.name}: ¡Trato hecho! 🤝`,
      ],
    }));

    sfxSuccess();
    if (cargo) {
      setAgentCost(cargo.id, counterPrice, agent.id, getAgentQuote(agent, cargo).days);
    }
  };

  const handleGoToQuote = () => {
    setScreen(GameScreen.ClientQuote);
  };

  if (!cargo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No hay carga seleccionada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => setScreen(GameScreen.Main)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <span className="text-sm font-semibold text-slate-300">Negociar con Agentes</span>
          <div className="w-16" />
        </div>
      </div>

      {/* Cargo info */}
      <div className="px-4 py-3">
        <div className="max-w-lg mx-auto bg-slate-800/30 border border-slate-700/30 rounded-xl p-3">
          <div className="text-xs text-slate-500 mb-1">Carga para {cargo.clientName}</div>
          <div className="text-sm font-medium text-slate-200">{cargo.origin} → {cargo.destination}</div>
          <div className="text-xs text-slate-500 mt-1">{cargo.description} · {cargo.quantity}</div>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-lg mx-auto space-y-3">
          {agents.map(agent => {
            const negState = negotiationStates[agent.id];
            const isSelected = selectedAgentId === agent.id;
            const isClosed = dealClosed[agent.id];
            const agentMessages = messages[agent.id] || [];
            const quote = getAgentQuote(agent, cargo);   // precio y días de ESTE agente para ESTA ruta

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border transition-all ${
                  isClosed
                    ? 'bg-green-900/20 border-green-500/30'
                    : isSelected
                    ? 'bg-slate-800/80 border-blue-500/50'
                    : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600/60'
                }`}
              >
                {/* Agent Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => !isClosed && handleSelectAgent(agent.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{agent.emoji}</div>
                      <div>
                        <div className="font-semibold text-slate-200">{agent.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{agent.description}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            {quote.days}d
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Shield className="w-3 h-3" />
                            {agent.reliability}%
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <CreditCard className="w-3 h-3" />
                            {agent.maxPaymentTerm}d
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-200">₦{quote.price}</div>
                      <div className="text-xs text-slate-500">esta ruta</div>
                    </div>
                  </div>

                  {isClosed && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Tarifa cerrada a ₦{negState?.currentPrice}
                    </div>
                  )}
                </div>

                {/* Negotiation Panel */}
                <AnimatePresence>
                  {isSelected && !isClosed && negState && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
                        {/* Mood & Patience */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getMoodEmoji(negState.agentMood)}</span>
                            <span className="text-xs text-slate-400 capitalize">{negState.agentMood}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Paciencia:</span>
                            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${negState.patience}%`,
                                  backgroundColor: getPatienceColor(negState.patience),
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="bg-slate-900/50 rounded-lg p-3 mb-3 max-h-32 overflow-y-auto space-y-1.5">
                          {agentMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`text-xs ${
                                msg.startsWith('Vos:')
                                  ? 'text-blue-300 ml-3'
                                  : msg.startsWith(agent.name)
                                  ? 'text-slate-300'
                                  : 'text-slate-500 italic'
                              }`}
                            >
                              {msg}
                            </div>
                          ))}
                        </div>

                        {/* Price comparison — la flexibilidad es una pista vaga, no el piso exacto
                            (antes "Mejor posible: ₦X" regalaba el resultado del regateo) */}
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <div className="text-slate-500">
                            Precio publicado: <span className="text-slate-300">₦{negState.originalPrice}</span>
                          </div>
                          <div className="text-slate-500">
                            Flexibilidad: <span className="text-green-400 tracking-widest">
                              {'●'.repeat(Math.min(5, Math.max(1, Math.round(agent.negotiability / 0.05))))}
                              {'○'.repeat(5 - Math.min(5, Math.max(1, Math.round(agent.negotiability / 0.05))))}
                            </span>
                          </div>
                        </div>

                        {/* Input & Actions */}
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₦</span>
                            <input
                              type="number"
                              value={offerInput}
                              onChange={e => setOfferInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleOffer()}
                              className="w-full pl-7 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-white"
                              placeholder="Tu oferta..."
                            />
                          </div>
                          <button
                            onClick={handleOffer}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
                          >
                            <TrendingDown className="w-4 h-4" />
                            Ofertar
                          </button>
                        </div>

                        {negState.round > 0 && (
                          <button
                            onClick={handleAcceptCounter}
                            className="mt-2 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            Aceptar contraoferta actual (₦{negState.currentPrice})
                          </button>
                        )}

                        {negState.patience <= 0 && !isClosed && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-red-400">
                            <XCircle className="w-4 h-4" />
                            El agente se fue. No hay trato.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      {cargo.agentId && (
        <div className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-800 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleGoToQuote}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Cotizar al Cliente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
