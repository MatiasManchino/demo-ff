import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Cargo, Notice } from '@/types/game';
import { GameScreen, TacticType, CargoStatus, INITIAL_TACTICS } from '@/types/game';
import { AGENTS } from '@/data/agents';
import { generateClient } from '@/data/clients';
import { getRandomEvent, TRANSIT_EVENTS } from '@/data/events';
import { getRandomRoute, CARGO_DESCRIPTIONS, QUANTITIES } from '@/data/routes';

// Metas progresivas de la empresa: al alcanzar una, sube la siguiente. La última es la victoria.
export const CASH_TARGETS = [2000, 5000, 12000];
// Game over por DEUDA (pagás a los agentes al contado; el cliente te paga a plazo — la caja manda).
export const GAME_OVER_DEBT = -500;

interface GameActions {
  setScreen: (screen: GameScreen) => void;
  startGame: () => void;
  generateNewCargo: () => Cargo | null;
  selectCargo: (cargoId: string | null) => void;
  selectAgent: (agentId: string | null) => void;
  setAgentCost: (cargoId: string, agentCost: number, agentId: string, transitTime: number) => void;
  submitQuote: (cargoId: string, finalPrice: number, paymentTermDays: number) => void;
  resolveQuote: (cargoId: string, accepted: boolean, counterOffer: number | null) => void;
  advanceDay: () => Notice[];
  resolveEventOption: (optionIndex: number) => Notice | null;
  extendTransit: (cargoId: string, extraDays: number) => void;
  adjustClientRelationship: (clientId: string, delta: number) => void;
  useTactic: (tactic: TacticType) => boolean;
  grantTactic: (tactic: TacticType) => void;
  addCash: (amount: number) => void;
  addFame: (amount: number) => void;
  addXp: (amount: number) => void;
  updateStats: (updates: Partial<GameState['stats']>) => void;
  toggleSound: () => void;
  resetGame: () => void;
}

const INITIAL_STATE: GameState = {
  screen: GameScreen.Welcome,
  day: 1,
  cash: 600,
  fame: 0,
  level: 1,
  xp: 0,
  targetCash: CASH_TARGETS[0],
  agents: AGENTS.map(a => ({ ...a })),
  availableClients: [],
  activeCargos: [],
  completedCargos: [],
  pendingPayments: [],
  pendingEvents: [],
  news: [],
  selectedCargoId: null,
  selectedAgentId: null,
  tactics: { ...INITIAL_TACTICS },
  fuelMultiplier: 1,
  demandMultiplier: 1,
  riskMultiplier: 1,
  stats: { closed: 0, lost: 0, problems: 0, totalProfit: 0, totalExpenses: 0 },
  showTutorial: true,
  soundEnabled: true,
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setScreen: (screen) => set({ screen }),

      startGame: () => {
        const clients = Array.from({ length: 3 }, (_, i) => generateClient(i + 1));
        set({
          ...INITIAL_STATE,
          screen: GameScreen.Main,
          availableClients: clients,
          agents: AGENTS.map(a => ({ ...a })),
          tactics: { ...INITIAL_TACTICS },
          stats: { closed: 0, lost: 0, problems: 0, totalProfit: 0, totalExpenses: 0 },
          showTutorial: false,
        });
      },

      generateNewCargo: () => {
        const state = get();
        if (state.availableClients.length === 0) return null;

        const client = state.availableClients[Math.floor(Math.random() * state.availableClients.length)];
        const route = getRandomRoute();
        const cargoType = route.cargoTypes[Math.floor(Math.random() * route.cargoTypes.length)];
        const descriptions = CARGO_DESCRIPTIONS[cargoType];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const quantity = QUANTITIES[Math.floor(Math.random() * QUANTITIES.length)];

        const basePrice = Math.round(
          route.baseDistance * 0.03 *
          (route.mode === 'maritime' ? 0.7 : route.mode === 'air' ? 2.5 : 1.0) *
          (cargoType === 'general' ? 1.0 : cargoType === 'refrigerated' ? 1.4 : cargoType === 'dangerous' ? 1.6 : cargoType === 'urgent' ? 2.0 : 1.8) *
          state.fuelMultiplier
        );

        const cargo: Cargo = {
          id: `cargo_${state.day}_${Math.random().toString(36).substr(2, 5)}`,
          clientId: client.id,
          clientName: client.companyName,
          origin: `${route.originFlag} ${route.origin}`,
          destination: `${route.destinationFlag} ${route.destination}`,
          type: cargoType,
          description: `${description}`,
          quantity,
          mode: route.mode,
          status: CargoStatus.Quoting,
          baseCost: basePrice,           // costo de mercado de la RUTA (ancla de precios, nunca se pisa)
          distance: route.baseDistance,  // km — de acá salen los días de tránsito por agente
          agentCost: 0,
          finalPrice: 0,
          margin: 0,
          paymentTermDays: 0,
          transitTime: 0,
          agentId: null,
          quoteRound: 0,
          daysInTransit: 0,
          totalDays: 0,
          eventsHit: 0,
        };

        cargo.agentCost = basePrice;

        set(state => ({
          activeCargos: [...state.activeCargos, cargo],
        }));

        return cargo;
      },

      selectCargo: (cargoId) => set({ selectedCargoId: cargoId }),

      selectAgent: (agentId) => set({ selectedAgentId: agentId }),

      setAgentCost: (cargoId, agentCost, agentId, transitTime) => {
        set(state => ({
          activeCargos: state.activeCargos.map(c =>
            c.id === cargoId ? { ...c, agentCost, agentId, transitTime, totalDays: transitTime } : c
          ),
        }));
      },

      submitQuote: (cargoId, finalPrice, paymentTermDays) => {
        set(state => ({
          activeCargos: state.activeCargos.map(c =>
            c.id === cargoId
              ? { ...c, finalPrice, paymentTermDays, margin: (finalPrice - c.agentCost) / finalPrice }
              : c
          ),
        }));
      },

      resolveQuote: (cargoId, accepted, counterOffer) => {
        const state = get();
        const cargo = state.activeCargos.find(c => c.id === cargoId);
        if (!cargo) return;

        if (accepted) {
          // CASH FLOW REAL: al agente le pagás AHORA; el cliente te paga al ENTREGAR + plazo.
          // El plazo largo sube la aceptación pero te seca la caja — ese es el trade-off.
          const profit = cargo.finalPrice - cargo.agentCost;
          set(state => ({
            cash: state.cash - cargo.agentCost,
            fame: Math.min(100, state.fame + 5),
            xp: state.xp + 50,
            activeCargos: state.activeCargos.map(c =>
              c.id === cargoId ? { ...c, status: CargoStatus.InTransit } : c
            ),
            stats: {
              ...state.stats,
              closed: state.stats.closed + 1,
              totalProfit: state.stats.totalProfit + profit,
            },
          }));
        } else if (counterOffer) {
          set(state => ({
            activeCargos: state.activeCargos.map(c =>
              c.id === cargoId ? { ...c, quoteRound: c.quoteRound + 1 } : c
            ),
          }));
        } else {
          // Cotización perdida: el cliente se enfría un poco con vos.
          get().adjustClientRelationship(cargo.clientId, -3);
          set(state => ({
            activeCargos: state.activeCargos.filter(c => c.id !== cargoId),
            fame: Math.max(-100, state.fame - 5),
            stats: {
              ...state.stats,
              lost: state.stats.lost + 1,
            },
          }));
        }
      },

      // ── Tick del día: TODO pasa acá (tránsitos, eventos, entregas, cobros, metas) ──
      // Devuelve los avisos para que el UI los muestre como toasts.
      advanceDay: () => {
        const notices: Notice[] = [];
        const state = get();
        const newDay = state.day + 1;

        // 1) Avance de tránsitos + eventos (encolados para el modal de decisión, máx. 1 por día)
        const newPendingEvents = [...state.pendingEvents];
        const updatedCargos = state.activeCargos.map(c => {
          if (c.status !== CargoStatus.InTransit) return c;
          const advanced = { ...c, daysInTransit: c.daysInTransit + 1 };
          const alreadyQueued = newPendingEvents.some(e => e.cargoId === c.id);
          // Tope de 2 eventos por viaje: una racha de mala suerte no puede fundirte sola.
          if (!alreadyQueued && newPendingEvents.length === 0 && (c.eventsHit ?? 0) < 2) {
            const agent = state.agents.find(a => a.id === c.agentId);
            const reliability = agent ? agent.reliability : 75;
            const chance = 0.035 * (1.5 - reliability / 100);
            if (Math.random() < chance) {
              const ev = getRandomEvent();
              advanced.eventsHit = (c.eventsHit ?? 0) + 1;
              newPendingEvents.push({ cargoId: c.id, eventId: ev.id, route: `${c.origin} → ${c.destination}` });
            }
          }
          return advanced;
        });

        // 2) Entregas: la confiabilidad del agente juega en el momento de la verdad
        let cash = state.cash;
        let fame = state.fame;
        let xp = state.xp;
        const pendingPayments = [...state.pendingPayments];
        let availableClients = state.availableClients;
        const completedNow = updatedCargos.filter(c => c.status === CargoStatus.InTransit && c.daysInTransit >= c.totalDays);
        const stillActive = updatedCargos.filter(c => !(c.status === CargoStatus.InTransit && c.daysInTransit >= c.totalDays));
        const completedCargos = [...state.completedCargos];

        for (const c of completedNow) {
          const agent = state.agents.find(a => a.id === c.agentId);
          const reliability = agent ? agent.reliability : 75;
          const rough = Math.random() < (1 - reliability / 100) * 0.5;   // entrega "con observaciones"
          fame = Math.min(100, fame + (rough ? 3 : 8));
          xp += 30;
          completedCargos.push({ ...c, status: CargoStatus.Completed });
          // La relación con el cliente crece al cumplirle (y sube la aceptación futura)
          availableClients = availableClients.map(cl =>
            cl.id === c.clientId ? { ...cl, relationshipLevel: Math.min(100, cl.relationshipLevel + 8) } : cl
          );
          // El cobro entra a plazo: día de entrega + término negociado
          const dueDay = newDay + c.paymentTermDays;
          pendingPayments.push({ cargoId: c.id, clientName: c.clientName, amount: c.finalPrice, dueDay });
          notices.push({
            kind: rough ? 'info' : 'good',
            title: `${rough ? 'Entregado con observaciones' : 'Entregado'} — ${c.origin} → ${c.destination}`,
            desc: c.paymentTermDays > 0
              ? `Cobrás ₦${c.finalPrice} en ${c.paymentTermDays} días · +${rough ? 3 : 8} fama`
              : `Cobro al contado en camino · +${rough ? 3 : 8} fama`,
          });
        }

        // 3) Cobros que vencen hoy
        const stillPending: typeof pendingPayments = [];
        for (const p of pendingPayments) {
          if (p.dueDay <= newDay) {
            cash += p.amount;
            notices.push({ kind: 'good', title: `Cobraste ₦${p.amount}`, desc: `Pago de ${p.clientName}` });
          } else {
            stillPending.push(p);
          }
        }

        // 4) Mercado + costos fijos mensuales
        const newFuel = Math.max(0.6, Math.min(2.5, state.fuelMultiplier + (Math.random() - 0.4) * 0.1));
        const newDemand = Math.max(0.5, Math.min(2.0, state.demandMultiplier + (Math.random() - 0.45) * 0.08));
        const newRisk = Math.max(0.7, Math.min(2.0, state.riskMultiplier + (Math.random() - 0.5) * 0.06));

        const newStats = { ...state.stats };
        if (newDay % 30 === 0) {
          const expense = 50 * state.level;
          cash -= expense;
          newStats.totalExpenses += expense;
          notices.push({ kind: 'bad', title: `Gastos fijos del mes: −₦${expense}`, desc: 'Oficina, sueldos y sistemas.' });
        }

        // 5) Nivel (el XP sobrante se conserva)
        let level = state.level;
        let newXp = xp;
        if (newXp >= level * 200) {
          newXp -= level * 200;
          level += 1;
          notices.push({ kind: 'good', title: `¡Subiste a Nivel ${level}!` });
        }

        // 6) Metas progresivas → victoria final / game over por deuda
        let targetCash = state.targetCash;
        let screen = state.screen;
        const tactics = { ...state.tactics };
        if (cash <= GAME_OVER_DEBT) {
          screen = GameScreen.GameOver;
        } else if (cash >= CASH_TARGETS[CASH_TARGETS.length - 1]) {
          screen = GameScreen.Victory;
        } else if (cash >= targetCash) {
          const next = CASH_TARGETS.find(t => t > targetCash) ?? CASH_TARGETS[CASH_TARGETS.length - 1];
          targetCash = next;
          (Object.keys(tactics) as TacticType[]).forEach(t => { tactics[t] += 1; });
          notices.push({ kind: 'good', title: '🏆 ¡Meta alcanzada!', desc: `Nueva meta: ₦${next} · +1 de cada táctica` });
        }

        set({
          day: newDay,
          cash,
          fame,
          xp: newXp,
          level,
          activeCargos: stillActive,
          completedCargos,
          availableClients,
          pendingPayments: stillPending,
          pendingEvents: newPendingEvents,
          fuelMultiplier: newFuel,
          demandMultiplier: newDemand,
          riskMultiplier: newRisk,
          screen,
          targetCash,
          tactics,
          stats: newStats,
        });

        return notices;
      },

      // El jugador eligió una opción del modal de evento. Regla:
      // pagás el costo de la opción y tirás su chance de éxito; si sale bien, zafás del efecto
      // base del evento; si sale mal (o elegiste no intervenir), el efecto base se aplica igual.
      resolveEventOption: (optionIndex) => {
        const state = get();
        const pending = state.pendingEvents[0];
        if (!pending) return null;
        const event = TRANSIT_EVENTS.find(e => e.id === pending.eventId);
        if (!event) { set({ pendingEvents: state.pendingEvents.slice(1) }); return null; }
        const option = event.options[Math.min(optionIndex, event.options.length - 1)];

        let cash = state.cash + option.cost;   // cost negativo = pagás
        let fame = Math.max(-100, Math.min(100, state.fame + Math.round(option.reputationEffect / 2)));
        const success = Math.random() < option.successChance;
        const intervened = option.cost !== 0;
        const dodged = success && intervened;

        if (!dodged) {
          // Efecto base del evento: demora + costo + golpe de reputación (suavizados a escala demo)
          cash -= Math.round(event.cost / 2);
          fame = Math.max(-100, Math.min(100, fame + Math.round(event.reputationImpact / 3)));
          if (event.extraDays) get().extendTransit(pending.cargoId, event.extraDays);
        }

        const isBad = event.reputationImpact < 0;
        set({
          cash,
          fame,
          pendingEvents: state.pendingEvents.slice(1),
          stats: isBad ? { ...state.stats, problems: state.stats.problems + 1 } : state.stats,
        });

        const effects = [
          option.cost ? `−₦${Math.abs(option.cost)}` : '',
          !dodged && event.cost ? `−₦${Math.round(event.cost / 2)}` : '',
          !dodged && event.extraDays ? `${event.extraDays > 0 ? '+' : ''}${event.extraDays} días` : '',
        ].filter(Boolean).join(' · ');

        return {
          kind: dodged || !isBad ? 'good' : 'bad',
          title: success ? option.successText : (option.failText || option.successText),
          desc: effects || undefined,
        };
      },

      // Un evento alarga (o acorta) el viaje. Nunca deja totalDays por debajo de lo ya navegado.
      extendTransit: (cargoId, extraDays) => {
        set(state => ({
          activeCargos: state.activeCargos.map(c =>
            c.id === cargoId
              ? { ...c, totalDays: Math.max(c.daysInTransit, c.totalDays + extraDays) }
              : c
          ),
        }));
      },

      adjustClientRelationship: (clientId, delta) => {
        set(state => ({
          availableClients: state.availableClients.map(c =>
            c.id === clientId
              ? { ...c, relationshipLevel: Math.max(0, Math.min(100, c.relationshipLevel + delta)) }
              : c
          ),
        }));
      },

      useTactic: (tactic) => {
        const state = get();
        if (state.tactics[tactic] > 0) {
          set(state => ({
            tactics: { ...state.tactics, [tactic]: state.tactics[tactic] - 1 },
          }));
          return true;
        }
        return false;
      },

      grantTactic: (tactic) => {
        set(state => ({
          tactics: { ...state.tactics, [tactic]: state.tactics[tactic] + 1 },
        }));
      },

      addCash: (amount) => set(state => ({ cash: state.cash + amount })),
      addFame: (amount) => set(state => ({ fame: Math.max(-100, Math.min(100, state.fame + amount)) })),
      addXp: (amount) => set(state => ({ xp: state.xp + amount })),

      updateStats: (updates) => set(state => ({
        stats: { ...state.stats, ...updates },
      })),

      toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),

      resetGame: () => set({ ...INITIAL_STATE, showTutorial: false }),
    }),
    {
      name: 'ff-negociador-save',   // la partida sobrevive al F5 (localStorage)
      version: 1,
    },
  ),
);
