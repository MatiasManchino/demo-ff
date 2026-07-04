import type { Cargo, Client, Agent, NegotiationResult, TransportMode, AgentPersonality } from '@/types/game';
import { TacticType } from '@/types/game';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

// ============ AGENT PRICING (por RUTA, no precio fijo) ============
// El precio de cada agente sale del costo base de la ruta × su multiplicador de personalidad,
// y el tiempo de tránsito de la distancia real × su velocidad. Antes eran números fijos:
// OceanLink cobraba lo mismo por São Paulo→BA (1.700 km) que por Shanghái→BA (19.500 km).

const PRICE_FACTOR: Record<AgentPersonality, number> = {
  cheap: 0.80, aggressive: 0.90, flexible: 1.00, reliable: 1.06, premium: 1.15,
};
const SPEED_FACTOR: Record<AgentPersonality, number> = {
  premium: 0.80, reliable: 0.90, flexible: 1.00, aggressive: 1.10, cheap: 1.25,
};
const KM_PER_DAY: Record<TransportMode, number> = {
  maritime: 700, air: 2500, land: 450,
};

export function getAgentQuote(agent: Agent, cargo: Cargo): { price: number; days: number } {
  const price = Math.round(cargo.baseCost * PRICE_FACTOR[agent.personality]);
  const days = Math.max(2, Math.ceil((cargo.distance / KM_PER_DAY[cargo.mode]) * SPEED_FACTOR[agent.personality]));
  return { price, days };
}

// Piso de mercado: lo más barato que ESTA carga se puede conseguir (el agente más económico).
// Es la referencia contra la que el cliente juzga tu precio — NO tu costo real.
export function marketFloor(cargo: Cargo): number {
  return Math.round(cargo.baseCost * PRICE_FACTOR.cheap);
}

// Precio máximo que el cliente considera "justo" para esta carga.
export function clientWillingness(cargo: Cargo, client: Client): number {
  return Math.round(marketFloor(cargo) * (1 + Math.max(0.05, client.maxMarginTolerance)));
}

// ============ AGENT NEGOTIATION ============

export interface AgentNegotiationState {
  round: number;
  currentPrice: number;
  originalPrice: number;
  agentMood: 'calm' | 'annoyed' | 'angry' | 'happy';
  bestPossiblePrice: number;
  patience: number;
}

export function startAgentNegotiation(agent: Agent, routePrice: number): AgentNegotiationState {
  return {
    round: 0,
    currentPrice: routePrice,
    originalPrice: routePrice,
    agentMood: 'calm',
    bestPossiblePrice: Math.round(routePrice * (1 - agent.negotiability)),
    patience: 100,
  };
}

export function negotiateWithAgent(
  agent: Agent,
  state: AgentNegotiationState,
  playerOffer: number,
): { newState: AgentNegotiationState; accepted: boolean; message: string } {
  const newRound = state.round + 1;
  const ratio = playerOffer / state.originalPrice;
  let accepted = false;
  let message = '';
  let newMood = state.agentMood;
  let newPatience = state.patience - 15;

  const acceptThresholds: Record<Agent['personality'], number> = {
    flexible: 0.82,
    aggressive: 0.95,
    premium: 0.90,
    reliable: 0.85,
    cheap: 0.75,
  };

  const threshold = acceptThresholds[agent.personality];

  if (playerOffer >= state.originalPrice) {
    accepted = true;
    message = 'Acepto al precio publicado. Un gusto hacer negocios.';
    newMood = 'happy';
    newPatience = 100;
  } else if (ratio >= threshold) {
    accepted = true;
    message = `Me parece bien. Cerramos a ₦${playerOffer}.`;
    newMood = 'happy';
    newPatience = 100;
  } else if (ratio >= threshold - 0.1 && newPatience > 30) {
    const counter = Math.round(state.currentPrice * 0.95);
    newMood = 'calm';
    newPatience = Math.max(0, newPatience);
    return {
      newState: {
        ...state,
        round: newRound,
        currentPrice: counter,
        agentMood: newMood,
        patience: newPatience,
      },
      accepted: false,
      message: `No llego a tanto. ¿Qué te parece ₦${counter}?`,
    };
  } else {
    if (newPatience <= 0) {
      newMood = 'angry';
      message = 'Me estás tomando el pelo. Chau.';
    } else if (newPatience < 40) {
      newMood = 'annoyed';
      const counter = Math.round(state.currentPrice * 0.97);
      return {
        newState: {
          ...state,
          round: newRound,
          currentPrice: counter,
          agentMood: newMood,
          patience: newPatience,
        },
        accepted: false,
        message: `Es lo último que te ofrezco: ₦${counter}.`,
      };
    } else {
      newMood = 'calm';
      const counter = Math.round(state.currentPrice * 0.93);
      return {
        newState: {
          ...state,
          round: newRound,
          currentPrice: counter,
          agentMood: newMood,
          patience: newPatience,
        },
        accepted: false,
        message: `Podemos negociar. Te ofrezco ₦${counter}.`,
      };
    }
  }

  return {
    newState: {
      ...state,
      round: newRound,
      currentPrice: playerOffer,
      agentMood: newMood,
      patience: newPatience,
    },
    accepted,
    message,
  };
}

// ============ CLIENT NEGOTIATION (V2 — por prioridades, portado del juego Unity) ============
// El cliente ya NO juzga tu margen (no conoce tu costo): juzga tu PRECIO ABSOLUTO contra el
// piso de mercado. Comprar barato al agente te deja precios que el cliente ama — esa es la
// estrategia central del juego ("comprá barato, vendé caro").

export interface ClientNegotiationPreview {
  acceptanceChance: number;
  expectedProfit: number;
  margin: number;
  fairPrice: number;      // willingness: hasta acá el cliente lo considera razonable
  priceLabel: 'ganga' | 'competitivo' | 'justo' | 'caro' | 'abusivo';
  color: string;
}

export function previewClientAcceptance(
  cargo: Cargo,
  client: Client,
  offeredPrice: number,
  paymentTermDays: number,
  tacticsUsed: TacticType[],
  playerLevel: number,
  playerFame: number,
  demandMultiplier: number,
  negotiationRound = 0,
): ClientNegotiationPreview {
  const margin = (offeredPrice - cargo.agentCost) / offeredPrice;
  const profit = offeredPrice - cargo.agentCost;
  const fairPrice = clientWillingness(cargo, client);
  const ratio = offeredPrice / Math.max(1, fairPrice);

  let priceLabel: ClientNegotiationPreview['priceLabel'] = 'justo';
  let color = '#fbbf24';
  if (ratio <= 0.80) { priceLabel = 'ganga'; color = '#22c55e'; }
  else if (ratio <= 0.95) { priceLabel = 'competitivo'; color = '#4ade80'; }
  else if (ratio <= 1.05) { priceLabel = 'justo'; color = '#fbbf24'; }
  else if (ratio <= 1.25) { priceLabel = 'caro'; color = '#f97316'; }
  else { priceLabel = 'abusivo'; color = '#ef4444'; }

  const chance = computeAcceptanceChance(
    cargo, client, offeredPrice, paymentTermDays,
    tacticsUsed, playerLevel, playerFame, demandMultiplier, negotiationRound,
  );

  return {
    acceptanceChance: chance,
    expectedProfit: profit,
    margin,
    fairPrice,
    priceLabel,
    color,
  };
}

function computeAcceptanceChance(
  cargo: Cargo,
  client: Client,
  offeredPrice: number,
  paymentTermDays: number,
  tacticsUsed: TacticType[],
  playerLevel: number,
  playerFame: number,
  demandMultiplier: number,
  negotiationRound = 0,
): number {
  const fairPrice = clientWillingness(cargo, client);
  const ratio = offeredPrice / Math.max(1, fairPrice);

  // Tope duro: por encima del 125% del precio justo no hay negociación posible.
  if (ratio > 1.25) return 0;

  // Puntajes 0–1 por factor (1 = satisfacés del todo lo que el cliente valora)
  const priceScore = clamp01((1.25 - ratio) / 0.55);   // 1.0 hasta ratio 0.70 · 0 en el tope abusivo
  const trustScore = clamp01(client.relationshipLevel / 100);
  const termScore  = 1 - clamp01(Math.abs(paymentTermDays - client.paymentTermPreference) / 60);
  const fameScore  = clamp01((playerFame + 100) / 200);

  // Promedio ponderado: el precio es lo que más pesa, pero no lo único.
  const ws = 0.40 * priceScore + 0.20 * trustScore + 0.20 * termScore + 0.20 * fameScore;

  let acc = 0.10 + 0.72 * ws;
  acc += Math.min(playerLevel - 1, 9) * 0.01;
  for (const tactic of tacticsUsed) acc += getTacticBonus(tactic, client, demandMultiplier);
  acc += (demandMultiplier - 1) * 0.20;                // demanda ADITIVA (multiplicar saturaba)
  acc -= 0.10 * Math.max(0, negotiationRound);         // insistir cansa

  // Compuerta sobre el precio justo: entre willingness y el tope la aceptación se comprime.
  // Sin esto, la relación/plazo/fama garantizaban cierres a cualquier precio.
  if (ratio > 1) acc *= lerp(1, 0.35, (ratio - 1) / 0.25);

  return clamp01(acc);
}

function getTacticBonus(tactic: TacticType, client: Client, demandMultiplier: number): number {
  switch (tactic) {
    case TacticType.Pressure:
      return client.urgency > 60 ? 0.18 : -0.12;
    case TacticType.Value:
      return client.serviceValue > 50 ? 0.15 : 0;
    case TacticType.Upfront:
      return 0.10;
    case TacticType.Relationship:
      if (client.relationshipLevel >= 80) return 0.15;
      if (client.relationshipLevel >= 60) return 0.10;
      if (client.relationshipLevel >= 40) return 0.05;
      return -0.05;
    case TacticType.Urgency:
      return demandMultiplier > 1.2 ? 0.12 : 0.02;
    default:
      return 0;
  }
}

export function evaluateClientQuote(
  cargo: Cargo,
  client: Client,
  offeredPrice: number,
  paymentTermDays: number,
  tacticsUsed: TacticType[],
  playerLevel: number,
  playerFame: number,
  demandMultiplier: number,
  negotiationRound: number,
): NegotiationResult {
  const fairPrice = clientWillingness(cargo, client);
  const ratio = offeredPrice / Math.max(1, fairPrice);

  // Tope duro: muy por encima de lo que el cliente paga por ESTA carga → se ofende.
  if (ratio > 1.25) {
    return {
      accepted: false,
      counterOffer: null,
      rejected: true,
      message: '¿Estás loco con ese precio? Me ofendés.',
      acceptanceChance: 0,
      makesAngry: true,
    };
  }

  const chance = computeAcceptanceChance(
    cargo, client, offeredPrice, paymentTermDays,
    tacticsUsed, playerLevel, playerFame, demandMultiplier, negotiationRound,
  );

  const roll = Math.random();

  if (roll < chance) {
    const messages = [
      'Me cierra. Vamos con eso. 🎉',
      'Perfecto, dentro del presupuesto. ✅',
      'Buena propuesta. Cerramos. 🤝',
      'Me gusta. Trato hecho. 💼',
    ];
    return {
      accepted: true,
      counterOffer: null,
      rejected: false,
      message: messages[Math.floor(Math.random() * messages.length)],
      acceptanceChance: chance,
      makesAngry: false,
    };
  }

  if (client.acceptsNegotiation && negotiationRound < 2) {
    // El cliente propone bajar hacia SU precio justo (no conoce tu costo, no baja de ahí).
    const counterPrice = Math.round(
      Math.max(marketFloor(cargo) * 0.95, Math.min(offeredPrice * 0.90, fairPrice * 0.98)),
    );
    return {
      accepted: false,
      counterOffer: counterPrice,
      rejected: false,
      message: `Me parece caro. ¿Podés acercarte a ₦${counterPrice}?`,
      acceptanceChance: chance,
      makesAngry: false,
    };
  }

  const messages = [
    'No, me parece excesivo. Voy a buscar otras opciones.',
    'Fuera de presupuesto. Gracias igual.',
    'No da. La próxima vez será.',
  ];
  return {
    accepted: false,
    counterOffer: null,
    rejected: true,
    message: messages[Math.floor(Math.random() * messages.length)],
    acceptanceChance: chance,
    makesAngry: ratio > 1.15,
  };
}

// ============ UTILITY ============

export function getMoodEmoji(mood: AgentNegotiationState['agentMood']): string {
  switch (mood) {
    case 'calm': return '😊';
    case 'happy': return '😄';
    case 'annoyed': return '😤';
    case 'angry': return '😡';
  }
}

export function getPatienceColor(patience: number): string {
  if (patience > 70) return '#22c55e';
  if (patience > 40) return '#fbbf24';
  if (patience > 20) return '#f97316';
  return '#ef4444';
}

export function getAcceptanceColor(chance: number): string {
  if (chance >= 0.7) return '#22c55e';
  if (chance >= 0.4) return '#fbbf24';
  if (chance >= 0.2) return '#f97316';
  return '#ef4444';
}
