import type { Cargo, Client, Agent, NegotiationResult } from '@/types/game';
import { TacticType, CLIENT_TYPE_CONFIG, TransportMode } from '@/types/game';

// ============ AGENT NEGOTIATION ============

export interface AgentNegotiationState {
  round: number;
  currentPrice: number;
  originalPrice: number;
  agentMood: 'calm' | 'annoyed' | 'angry' | 'happy';
  bestPossiblePrice: number;
  patience: number;
}

export function startAgentNegotiation(agent: Agent): AgentNegotiationState {
  return {
    round: 0,
    currentPrice: agent.basePrice,
    originalPrice: agent.basePrice,
    agentMood: 'calm',
    bestPossiblePrice: Math.round(agent.basePrice * (1 - agent.negotiability)),
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

// ============ CLIENT NEGOTIATION (IMPROVED V2) ============

export interface ClientNegotiationPreview {
  acceptanceChance: number;
  expectedProfit: number;
  margin: number;
  priceLabel: 'bajo' | 'competitivo' | 'estándar' | 'alto' | 'excesivo';
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
): ClientNegotiationPreview {
  const margin = (offeredPrice - cargo.agentCost) / offeredPrice;
  const profit = offeredPrice - cargo.agentCost;

  let priceLabel: ClientNegotiationPreview['priceLabel'] = 'estándar';
  let color = '#fbbf24';
  if (margin <= 0) { priceLabel = 'bajo'; color = '#ef4444'; }
  else if (margin <= 0.10) { priceLabel = 'competitivo'; color = '#22c55e'; }
  else if (margin <= 0.20) { priceLabel = 'estándar'; color = '#fbbf24'; }
  else if (margin <= 0.30) { priceLabel = 'alto'; color = '#f97316'; }
  else { priceLabel = 'excesivo'; color = '#ef4444'; }

  const chance = computeAcceptanceChance(
    cargo, client, offeredPrice, paymentTermDays,
    tacticsUsed, playerLevel, playerFame, demandMultiplier,
  );

  return {
    acceptanceChance: chance,
    expectedProfit: profit,
    margin,
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
): number {
  const margin = (offeredPrice - cargo.agentCost) / offeredPrice;
  const config = CLIENT_TYPE_CONFIG[client.clientType];

  let base = 0.35;

  const typeModifiers: Record<string, number> = {
    goodPayer: 0.08,
    badPayer: -0.10,
    urgentClient: 0.12,
    creditClient: -0.04,
    veryBadClient: -0.16,
    contractClient: 0.05,
  };
  base += typeModifiers[client.clientType] || 0;

  if (client.relationshipLevel >= 80) base += 0.20;
  else if (client.relationshipLevel >= 60) base += 0.10;
  else if (client.relationshipLevel >= 40) base += 0;
  else if (client.relationshipLevel >= 20) base -= 0.10;
  else base -= 0.20;

  const deliveries = client.relationshipLevel >= 80 ? 20 : client.relationshipLevel >= 60 ? 10 : client.relationshipLevel >= 40 ? 5 : 0;
  if (deliveries >= 20) base += 0.15;
  else if (deliveries >= 10) base += 0.10;
  else if (deliveries >= 5) base += 0.05;

  base += ((playerFame + 50) / 100) * 0.10;
  base += Math.min(playerLevel - 1, 9) * 0.01;

  if (cargo.mode === TransportMode.Maritime) base += 0.05;

  const preferredTerm = config.paymentDelay;
  const termBonus = Math.min(paymentTermDays / 60, 0.10);
  const termPenalty = Math.abs(paymentTermDays - preferredTerm) / 60 * 0.08;
  base += termBonus - termPenalty;

  for (const tactic of tacticsUsed) {
    const bonus = getTacticBonus(tactic, client, demandMultiplier);
    base += bonus;
  }

  const tolerance = config.maxMargin;
  if (margin <= 0) {
    base += 0.45;
  } else if (margin <= tolerance) {
    base += 0.45 * (1 - margin / tolerance);
  } else if (margin <= tolerance + 0.15) {
    base -= ((margin - tolerance) / 0.15) * 0.60;
  } else {
    base -= 0.60;
  }

  base *= demandMultiplier;

  if (margin > tolerance + 0.15) {
    base = -0.5;
  }

  return Math.max(0, Math.min(1, base));
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
  const margin = (offeredPrice - cargo.agentCost) / offeredPrice;
  const config = CLIENT_TYPE_CONFIG[client.clientType];

  if (margin > config.maxMargin + 0.15) {
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
    tacticsUsed, playerLevel, playerFame, demandMultiplier,
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
    const desiredMult = 1 + config.maxMargin * 0.8;
    const counterPrice = Math.round(
      Math.min(
        Math.max(cargo.agentCost * desiredMult * 1.1, cargo.agentCost),
        cargo.agentCost / (1 - config.maxMargin),
      ),
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
    makesAngry: margin > config.maxMargin + 0.05,
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
