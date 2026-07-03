import type { TransitEvent, EventOption } from '@/types/game';
import { EventSeverity } from '@/types/game';

const OPTIONS_HELP: EventOption[] = [
  {
    label: 'Ayudar al cliente (pérdida económica)',
    cost: -200,
    reputationEffect: 15,
    successChance: 0.8,
    successText: 'El cliente agradeció tu ayuda. Subió tu reputación.',
    failText: 'Intentaste ayudar, pero el daño era mucho.',
  },
  {
    label: 'No intervenir',
    cost: 0,
    reputationEffect: -10,
    successChance: 1,
    successText: 'Decidiste no gastar. El cliente se molestó.',
    failText: '',
  },
];

export const TRANSIT_EVENTS: TransitEvent[] = [
  {
    id: 'customs_delay',
    name: 'Demora en Aduana',
    description: 'La carga está detenida en aduana por inspección adicional.',
    severity: EventSeverity.Mild,
    extraDays: 3,
    cost: 100,
    reputationImpact: -5,
    options: OPTIONS_HELP,
  },
  {
    id: 'port_congestion',
    name: 'Congestión Portuaria',
    description: 'El puerto está colapsado. Hay demoras de hasta una semana.',
    severity: EventSeverity.Moderate,
    extraDays: 7,
    cost: 250,
    reputationImpact: -10,
    options: OPTIONS_HELP,
  },
  {
    id: 'weather_storm',
    name: 'Tormenta en la Ruta',
    description: 'Una tormenta azota la ruta. El barco tuvo que desviarse.',
    severity: EventSeverity.Serious,
    extraDays: 5,
    cost: 300,
    reputationImpact: -15,
    options: [
      {
        label: 'Pagar seguro adicional',
        cost: -400,
        reputationEffect: 5,
        successChance: 0.9,
        successText: 'El seguro cubrió parte de los daños.',
        failText: 'El seguro no cubrió todo.',
      },
      ...OPTIONS_HELP.slice(1),
    ],
  },
  {
    id: 'damage_minor',
    name: 'Daño Menor en Carga',
    description: 'Parte de la carga sufrió daños leves por mal manejo.',
    severity: EventSeverity.Moderate,
    extraDays: 2,
    cost: 350,
    reputationImpact: -12,
    options: OPTIONS_HELP,
  },
  {
    id: 'documentation_error',
    name: 'Error Documental',
    description: 'Falta un documento. La carga no puede salir del puerto.',
    severity: EventSeverity.Mild,
    extraDays: 4,
    cost: 150,
    reputationImpact: -8,
    options: [
      {
        label: 'Pagar gestor (rápido)',
        cost: -300,
        reputationEffect: 5,
        successChance: 0.95,
        successText: 'El gestor resolvió todo en 1 día.',
        failText: 'Incluso el gestor tardó.',
      },
      ...OPTIONS_HELP.slice(1),
    ],
  },
  {
    id: 'fuel_surcharge',
    name: 'Recargo por Combustible',
    description: 'El agente aplica un recargo inesperado por aumento de combustible.',
    severity: EventSeverity.Mild,
    extraDays: 0,
    cost: 200,
    reputationImpact: -3,
    options: [
      {
        label: 'Negociar con el agente',
        cost: -100,
        reputationEffect: 0,
        successChance: 0.5,
        successText: 'Conseguiste reducir a la mitad el recargo.',
        failText: 'El agente no cedió. Pagás todo.',
      },
      {
        label: 'Pagar sin negociar',
        cost: -200,
        reputationEffect: 0,
        successChance: 1,
        successText: 'Pagaste el recargo completo.',
        failText: '',
      },
    ],
  },
  {
    id: 'carrier_strike',
    name: 'Huelga del Transportista',
    description: 'Los trabajadores del agente están de huelga.',
    severity: EventSeverity.Serious,
    extraDays: 10,
    cost: 500,
    reputationImpact: -20,
    options: [
      {
        label: 'Buscar agente alternativo',
        cost: -600,
        reputationEffect: 10,
        successChance: 0.6,
        successText: 'Encontraste otro agente rápido. Solo 3 días de demora.',
        failText: 'No había alternativas. Tuviste que esperar.',
      },
      {
        label: 'Esperar a que termine',
        cost: 0,
        reputationEffect: -20,
        successChance: 1,
        successText: 'Esperaste los 10 días. El cliente está furioso.',
        failText: '',
      },
    ],
  },
  {
    id: 'theft',
    name: 'Robo Parcial',
    description: 'Parte de la carga fue robada durante el tránsito.',
    severity: EventSeverity.Critical,
    extraDays: 0,
    cost: 800,
    reputationImpact: -25,
    options: [
      {
        label: 'Reemplazar mercadería',
        cost: -1200,
        reputationEffect: 20,
        successChance: 0.7,
        successText: 'Conseguiste reemplazo rápido. El cliente quedó satisfecho.',
        failText: 'No conseguiste reemplazo a tiempo.',
      },
      {
        label: 'Pagar compensación',
        cost: -800,
        reputationEffect: -5,
        successChance: 1,
        successText: 'Pagaste la compensación.',
        failText: '',
      },
    ],
  },
  {
    id: 'smooth_sailing',
    name: 'Viaje Tranquilo',
    description: 'Todo salió perfecto. Sin demoras ni problemas.',
    severity: EventSeverity.Mild,
    extraDays: 0,
    cost: 0,
    reputationImpact: 5,
    options: [
      {
        label: 'Excelente',
        cost: 0,
        reputationEffect: 5,
        successChance: 1,
        successText: '¡Operación perfecta!',
        failText: '',
      },
    ],
  },
  {
    id: 'favorable_winds',
    name: 'Vientos Favorables',
    description: 'Condiciones meteorológicas óptimas. El viaje se aceleró.',
    severity: EventSeverity.Mild,
    extraDays: -3,
    cost: 0,
    reputationImpact: 3,
    options: [
      {
        label: '¡Genial!',
        cost: 0,
        reputationEffect: 3,
        successChance: 1,
        successText: '¡Llegó antes de lo previsto!',
        failText: '',
      },
    ],
  },
];

export function getRandomEvent(): TransitEvent {
  const roll = Math.random();
  if (roll < 0.15) {
    const positive = TRANSIT_EVENTS.filter(e => e.reputationImpact >= 0);
    return positive[Math.floor(Math.random() * positive.length)];
  }
  const negative = TRANSIT_EVENTS.filter(e => e.reputationImpact < 0);
  return negative[Math.floor(Math.random() * negative.length)];
}
