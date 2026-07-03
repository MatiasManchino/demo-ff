// ============ CONST ENUMS (Objects) ============

export const TransportMode = {
  Maritime: 'maritime',
  Air: 'air',
  Land: 'land',
} as const;
export type TransportMode = (typeof TransportMode)[keyof typeof TransportMode];

export const CargoType = {
  General: 'general',
  Refrigerated: 'refrigerated',
  Dangerous: 'dangerous',
  Urgent: 'urgent',
  Valuable: 'valuable',
} as const;
export type CargoType = (typeof CargoType)[keyof typeof CargoType];

export const ClientType = {
  GoodPayer: 'goodPayer',
  BadPayer: 'badPayer',
  UrgentClient: 'urgentClient',
  CreditClient: 'creditClient',
  VeryBadClient: 'veryBadClient',
  ContractClient: 'contractClient',
} as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];

export const AgentPersonality = {
  Flexible: 'flexible',
  Aggressive: 'aggressive',
  Premium: 'premium',
  Reliable: 'reliable',
  Cheap: 'cheap',
} as const;
export type AgentPersonality = (typeof AgentPersonality)[keyof typeof AgentPersonality];

export const TacticType = {
  Pressure: 'pressure',
  Value: 'value',
  Upfront: 'upfront',
  Relationship: 'relationship',
  Urgency: 'urgency',
} as const;
export type TacticType = (typeof TacticType)[keyof typeof TacticType];

export const GameScreen = {
  Welcome: 'welcome',
  HowToPlay: 'howToPlay',
  Main: 'main',
  AgentNegotiation: 'agentNegotiation',
  ClientQuote: 'clientQuote',
  Transit: 'transit',
  Event: 'event',
  GameOver: 'gameOver',
  Victory: 'victory',
} as const;
export type GameScreen = (typeof GameScreen)[keyof typeof GameScreen];

export const CargoStatus = {
  Quoting: 'quoting',
  InTransit: 'inTransit',
  Completed: 'completed',
  Failed: 'failed',
} as const;
export type CargoStatus = (typeof CargoStatus)[keyof typeof CargoStatus];

export const EventSeverity = {
  Mild: 1,
  Moderate: 2,
  Serious: 3,
  Critical: 4,
  Catastrophic: 5,
} as const;
export type EventSeverity = (typeof EventSeverity)[keyof typeof EventSeverity];

// ============ INTERFACES ============

export interface Agent {
  id: string;
  name: string;
  personality: AgentPersonality;
  basePrice: number;
  reliability: number;
  transitTime: number;
  validityDays: number;
  maxPaymentTerm: number;
  description: string;
  emoji: string;
  negotiability: number;
  relationship: number;
}

export interface Client {
  id: string;
  companyName: string;
  clientType: ClientType;
  relationshipLevel: number;
  emoji: string;
  description: string;
  urgency: number;
  serviceValue: number;
  maxMarginTolerance: number;
  acceptsNegotiation: boolean;
  paymentTermPreference: number;
}

export interface Cargo {
  id: string;
  clientId: string;
  clientName: string;
  origin: string;
  destination: string;
  type: CargoType;
  description: string;
  quantity: string;
  mode: TransportMode;
  status: CargoStatus;
  agentCost: number;
  finalPrice: number;
  margin: number;
  paymentTermDays: number;
  transitTime: number;
  agentId: string | null;
  quoteRound: number;
  daysInTransit: number;
  totalDays: number;
}

export interface Quote {
  cargoId: string;
  clientId: string;
  agentCost: number;
  offeredPrice: number;
  margin: number;
  paymentTermDays: number;
  negotiationRound: number;
  tacticsUsed: TacticType[];
}

export interface NegotiationResult {
  accepted: boolean;
  counterOffer: number | null;
  rejected: boolean;
  message: string;
  acceptanceChance: number;
  makesAngry: boolean;
}

export interface TransitEvent {
  id: string;
  name: string;
  description: string;
  severity: EventSeverity;
  extraDays: number;
  cost: number;
  reputationImpact: number;
  options: EventOption[];
}

export interface EventOption {
  label: string;
  cost: number;
  reputationEffect: number;
  successChance: number;
  successText: string;
  failText: string;
}

export interface GameNews {
  id: string;
  headline: string;
  day: number;
  fuelDelta: number;
  demandDelta: number;
  riskDelta: number;
}

export interface GameState {
  screen: GameScreen;
  day: number;
  cash: number;
  fame: number;
  level: number;
  xp: number;
  targetCash: number;
  agents: Agent[];
  availableClients: Client[];
  activeCargos: Cargo[];
  completedCargos: Cargo[];
  news: GameNews[];
  selectedCargoId: string | null;
  selectedAgentId: string | null;
  tactics: Record<TacticType, number>;
  fuelMultiplier: number;
  demandMultiplier: number;
  riskMultiplier: number;
  stats: {
    closed: number;
    lost: number;
    problems: number;
    totalProfit: number;
    totalExpenses: number;
  };
  showTutorial: boolean;
  soundEnabled: boolean;
}

// ============ CONSTANTS ============

export const CARGO_TYPE_MULTIPLIERS: Record<CargoType, number> = {
  [CargoType.General]: 1.0,
  [CargoType.Refrigerated]: 1.4,
  [CargoType.Dangerous]: 1.6,
  [CargoType.Urgent]: 2.0,
  [CargoType.Valuable]: 1.8,
};

export const TRANSPORT_MODE_MULTIPLIERS: Record<TransportMode, number> = {
  [TransportMode.Maritime]: 0.7,
  [TransportMode.Air]: 2.5,
  [TransportMode.Land]: 1.0,
};

// Note: Using string keys for the config since ClientType values are strings
export const CLIENT_TYPE_CONFIG: Record<ClientType, {
  relationship: number;
  paymentDelay: number;
  earlyPayChance: number;
  latePayChance: number;
  maxMargin: number;
  acceptsNegotiation: boolean;
  emoji: string;
  description: string;
}> = {
  [ClientType.GoodPayer]: {
    relationship: 60, paymentDelay: 0, earlyPayChance: 0.50, latePayChance: 0.02,
    maxMargin: 0.35, acceptsNegotiation: true, emoji: '😊',
    description: 'Confiable. Paga bien, negocia justo.',
  },
  [ClientType.BadPayer]: {
    relationship: 40, paymentDelay: 15, earlyPayChance: 0.05, latePayChance: 0.40,
    maxMargin: 0.15, acceptsNegotiation: false, emoji: '😤',
    description: 'Problemático. Paga tarde, exige precios bajos.',
  },
  [ClientType.UrgentClient]: {
    relationship: 50, paymentDelay: 0, earlyPayChance: 0.80, latePayChance: 0.05,
    maxMargin: 0.50, acceptsNegotiation: true, emoji: '⚡',
    description: 'Apurado. Paga rápido, tolera precios altos.',
  },
  [ClientType.CreditClient]: {
    relationship: 45, paymentDelay: 45, earlyPayChance: 0.10, latePayChance: 0.15,
    maxMargin: 0.20, acceptsNegotiation: true, emoji: '💳',
    description: 'Pide crédito. Paga a 30-60 días.',
  },
  [ClientType.VeryBadClient]: {
    relationship: 30, paymentDelay: 30, earlyPayChance: 0.01, latePayChance: 0.60,
    maxMargin: 0.10, acceptsNegotiation: false, emoji: '👿',
    description: 'Muy difícil. Siempre problemas.',
  },
  [ClientType.ContractClient]: {
    relationship: 55, paymentDelay: 5, earlyPayChance: 0.30, latePayChance: 0.08,
    maxMargin: 0.25, acceptsNegotiation: true, emoji: '📋',
    description: 'Contrato. Volumen regular, buena relación.',
  },
};

export const TACTIC_CONFIG: Record<TacticType, {
  emoji: string;
  name: string;
  description: string;
}> = {
  [TacticType.Pressure]: { emoji: '⏱️', name: 'Presión de Tiempo', description: '+18% si urgencia > 60, sino -12%' },
  [TacticType.Value]: { emoji: '⭐', name: 'Valor Agregado', description: '+15% si valor de servicio > 50' },
  [TacticType.Upfront]: { emoji: '💵', name: 'Pago Adelantado', description: '+10%, baja precio ~8%, plazo 0' },
  [TacticType.Relationship]: { emoji: '🤝', name: 'Apelar a Relación', description: 'Bonus según nivel de relación' },
  [TacticType.Urgency]: { emoji: '🔥', name: 'Escasez de Oferta', description: '+12% si demanda global está alta' },
};

export const INITIAL_TACTICS: Record<TacticType, number> = {
  [TacticType.Pressure]: 3,
  [TacticType.Value]: 3,
  [TacticType.Upfront]: 2,
  [TacticType.Relationship]: 2,
  [TacticType.Urgency]: 2,
};

export const AGENT_GREETINGS: Record<AgentPersonality, string[]> = {
  [AgentPersonality.Flexible]: [
    'Tenemos buenas tarifas hoy. ¿Qué necesitás?',
    'Siempre hay margen para negociar. Vamos a ver...',
    'Para vos, buscamos la mejor opción.',
  ],
  [AgentPersonality.Aggressive]: [
    'Te doy el precio de una. Tomá o dejá.',
    'No tengo todo el día. ¿Sí o no?',
    'Es lo que hay. El mercado está complicado.',
  ],
  [AgentPersonality.Premium]: [
    'Calidad tiene su precio. Pero vale cada centavo.',
    'Servicio premium, sin sorpresas.',
    'Nuestros clientes no se van nunca. ¿Querés ser uno?',
  ],
  [AgentPersonality.Reliable]: [
    'Cumplimos siempre. Eso es lo que pagás.',
    'Precio justo, servicio garantizado.',
    'La confianza se construye operación a operación.',
  ],
  [AgentPersonality.Cheap]: [
    'El más barato del mercado. Sin competencia.',
    '¿Precio bajo? Acá estamos.',
    'Barato, rápido... bueno, dos de tres no está mal.',
  ],
};

export const CLIENT_DIALOGUES = {
  initial: [
    'Buenas. Necesitamos mover esta carga. ¿Qué nos podés ofrecer?',
    'Tenemos una operación importante. Dame tu mejor precio.',
    'Estamos cotizando con varios forwarders. Sorprendeme.',
    'Necesitamos esto urgente. ¿Podés ayudarnos?',
    'Importación complicada. Buscamos alguien confiable.',
  ],
  accept: [
    'Me cierra. Vamos con eso. 🎉',
    'Perfecto, dentro del presupuesto. ✅',
    'Buena propuesta. Cerramos. 🤝',
  ],
  counter: [
    'Me parece caro. ¿Podés mejorar un poco?',
    'Estamos cerca, pero necesito algo más competitivo.',
    'Otro forwarder me ofreció menos. ¿Mejorás?',
  ],
  reject: [
    'No, me parece excesivo. Voy a buscar otras opciones.',
    'Fuera de presupuesto. Gracias igual.',
    'No da. La próxima vez será.',
  ],
  angry: [
    '¿Estás loco con ese precio? No te voy a llamar nunca más.',
    'Es un insulto. Chau.',
    'Perdés el tiempo. Y el mío también.',
  ],
};
