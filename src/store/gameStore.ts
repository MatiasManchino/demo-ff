import { create } from 'zustand';
import type { GameState, Cargo } from '@/types/game';
import { GameScreen, TacticType, CargoStatus } from '@/types/game';
import { AGENTS } from '@/data/agents';
import { generateClient } from '@/data/clients';
import { getRandomRoute, CARGO_DESCRIPTIONS, QUANTITIES } from '@/data/routes';

interface GameActions {
  setScreen: (screen: GameScreen) => void;
  startGame: () => void;
  generateNewCargo: () => Cargo | null;
  selectCargo: (cargoId: string | null) => void;
  selectAgent: (agentId: string | null) => void;
  setAgentCost: (cargoId: string, agentCost: number, agentId: string, transitTime: number) => void;
  submitQuote: (cargoId: string, finalPrice: number, paymentTermDays: number) => void;
  resolveQuote: (cargoId: string, accepted: boolean, counterOffer: number | null) => void;
  advanceDay: () => void;
  resolveTransit: (cargoId: string) => void;
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
  targetCash: 2000,
  agents: AGENTS.map(a => ({ ...a })),
  availableClients: [],
  activeCargos: [],
  completedCargos: [],
  news: [],
  selectedCargoId: null,
  selectedAgentId: null,
  tactics: {
    [TacticType.Pressure]: 3,
    [TacticType.Value]: 3,
    [TacticType.Upfront]: 2,
    [TacticType.Relationship]: 2,
    [TacticType.Urgency]: 2,
  },
  fuelMultiplier: 1,
  demandMultiplier: 1,
  riskMultiplier: 1,
  stats: { closed: 0, lost: 0, problems: 0, totalProfit: 0, totalExpenses: 0 },
  showTutorial: true,
  soundEnabled: true,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...INITIAL_STATE,

  setScreen: (screen) => set({ screen }),

  startGame: () => {
    const clients = Array.from({ length: 3 }, (_, i) => generateClient(i + 1));
    set({
      screen: GameScreen.Main,
      day: 1,
      cash: 600,
      fame: 0,
      level: 1,
      xp: 0,
      targetCash: 2000,
      agents: AGENTS.map(a => ({ ...a })),
      availableClients: clients,
      activeCargos: [],
      completedCargos: [],
      news: [],
      selectedCargoId: null,
      selectedAgentId: null,
      tactics: {
        [TacticType.Pressure]: 3,
        [TacticType.Value]: 3,
        [TacticType.Upfront]: 2,
        [TacticType.Relationship]: 2,
        [TacticType.Urgency]: 2,
      },
      fuelMultiplier: 1,
      demandMultiplier: 1,
      riskMultiplier: 1,
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
      agentCost: 0,
      finalPrice: 0,
      margin: 0,
      paymentTermDays: 0,
      transitTime: 0,
      agentId: null,
      quoteRound: 0,
      daysInTransit: 0,
      totalDays: 0,
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
      const profit = cargo.finalPrice - cargo.agentCost;
      set(state => ({
        cash: state.cash - cargo.agentCost + cargo.finalPrice,
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

  advanceDay: () => {
    const state = get();
    const newDay = state.day + 1;

    const updatedCargos = state.activeCargos.map(c => {
      if (c.status === CargoStatus.InTransit) {
        return { ...c, daysInTransit: c.daysInTransit + 1 };
      }
      return c;
    });

    const newFuel = Math.max(0.6, Math.min(2.5, state.fuelMultiplier + (Math.random() - 0.4) * 0.1));
    const newDemand = Math.max(0.5, Math.min(2.0, state.demandMultiplier + (Math.random() - 0.45) * 0.08));
    const newRisk = Math.max(0.7, Math.min(2.0, state.riskMultiplier + (Math.random() - 0.5) * 0.06));

    let newCash = state.cash;
    let newStats = { ...state.stats };
    if (newDay % 30 === 0) {
      const expense = 50 * state.level;
      newCash -= expense;
      newStats.totalExpenses += expense;
    }

    let newScreen = state.screen;
    if (newCash <= 0) {
      newScreen = GameScreen.GameOver;
    } else if (newCash >= state.targetCash) {
      newScreen = GameScreen.Victory;
    }

    let newLevel = state.level;
    let newXp = state.xp;
    if (state.xp >= state.level * 200) {
      newLevel = state.level + 1;
      newXp = 0;
    }

    set({
      day: newDay,
      cash: newCash,
      activeCargos: updatedCargos,
      fuelMultiplier: newFuel,
      demandMultiplier: newDemand,
      riskMultiplier: newRisk,
      screen: newScreen,
      level: newLevel,
      xp: newXp,
      stats: newStats,
    });
  },

  resolveTransit: (cargoId) => {
    set(state => {
      const cargo = state.activeCargos.find(c => c.id === cargoId);
      const bonus = cargo ? cargo.finalPrice * 0.1 : 0;
      return {
        activeCargos: state.activeCargos.filter(c => c.id !== cargoId),
        completedCargos: cargo
          ? [...state.completedCargos, { ...cargo, status: CargoStatus.Completed }]
          : state.completedCargos,
        fame: Math.min(100, state.fame + 8),
        cash: state.cash + bonus,
        xp: state.xp + 30,
      };
    });
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
}));
