import { TransportMode, CargoType } from '@/types/game';

export interface RouteTemplate {
  origin: string;
  destination: string;
  originFlag: string;
  destinationFlag: string;
  mode: TransportMode;
  baseDistance: number; // affects price
  cargoTypes: CargoType[];
}

export const ROUTES: RouteTemplate[] = [
  { origin: 'Shanghái', destination: 'Buenos Aires', originFlag: '🇨🇳', destinationFlag: '🇦🇷', mode: TransportMode.Maritime, baseDistance: 19500, cargoTypes: [CargoType.General, CargoType.Refrigerated, CargoType.Valuable] },
  { origin: 'Buenos Aires', destination: 'Rotterdam', originFlag: '🇦🇷', destinationFlag: '🇳🇱', mode: TransportMode.Maritime, baseDistance: 10800, cargoTypes: [CargoType.General, CargoType.Refrigerated, CargoType.Dangerous] },
  { origin: 'Shenzhen', destination: 'Miami', originFlag: '🇨🇳', destinationFlag: '🇺🇸', mode: TransportMode.Maritime, baseDistance: 15200, cargoTypes: [CargoType.General, CargoType.Urgent, CargoType.Valuable] },
  { origin: 'Bahía Blanca', destination: 'Hamburgo', originFlag: '🇦🇷', destinationFlag: '🇩🇪', mode: TransportMode.Maritime, baseDistance: 11200, cargoTypes: [CargoType.General, CargoType.Dangerous] },
  { origin: 'São Paulo', destination: 'Buenos Aires', originFlag: '🇧🇷', destinationFlag: '🇦🇷', mode: TransportMode.Land, baseDistance: 1700, cargoTypes: [CargoType.General, CargoType.Refrigerated] },
  { origin: 'Dubai', destination: 'Buenos Aires', originFlag: '🇦🇪', destinationFlag: '🇦🇷', mode: TransportMode.Maritime, baseDistance: 13400, cargoTypes: [CargoType.General, CargoType.Valuable, CargoType.Urgent] },
  { origin: 'Milán', destination: 'Buenos Aires', originFlag: '🇮🇹', destinationFlag: '🇦🇷', mode: TransportMode.Maritime, baseDistance: 10100, cargoTypes: [CargoType.General, CargoType.Valuable] },
  { origin: 'Buenos Aires', destination: 'Hong Kong', originFlag: '🇦🇷', destinationFlag: '🇭🇰', mode: TransportMode.Maritime, baseDistance: 18300, cargoTypes: [CargoType.Refrigerated, CargoType.Urgent] },
  { origin: 'Mumbai', destination: 'Buenos Aires', originFlag: '🇮🇳', destinationFlag: '🇦🇷', mode: TransportMode.Maritime, baseDistance: 14200, cargoTypes: [CargoType.General, CargoType.Urgent] },
  { origin: 'Los Ángeles', destination: 'Lima', originFlag: '🇺🇸', destinationFlag: '🇵🇪', mode: TransportMode.Maritime, baseDistance: 6700, cargoTypes: [CargoType.General, CargoType.Dangerous] },
];

export function getRandomRoute(): RouteTemplate {
  return ROUTES[Math.floor(Math.random() * ROUTES.length)];
}

export const CARGO_DESCRIPTIONS: Record<CargoType, string[]> = {
  [CargoType.General]: ['Contenedores varios', 'Mercadería general', 'Productos manufacturados', 'Bienes de consumo'],
  [CargoType.Refrigerated]: ['Carnes frescas', 'Productos lácteos', 'Frutas y verduras', 'Pescado congelado'],
  [CargoType.Dangerous]: ['Productos químicos', 'Materiales inflamables', 'Baterías de litio', 'Pinturas y solventes'],
  [CargoType.Urgent]: ['Repuestos críticos', 'Medicamentos', 'Documentos urgentes', 'Materiales de obra'],
  [CargoType.Valuable]: ['Electrónica', 'Joyas y relojes', 'Equipos médicos', 'Semiconductores'],
};

export const QUANTITIES = [
  '1x20\'',
  '1x40\'',
  '2x40\'',
  '1x40\' HC',
  '2x40\' HC',
  'Carga suelta',
  '3x20\'',
];
