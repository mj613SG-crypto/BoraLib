export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  bgRgba: string;
  borderHex: string;
  textClass: string;
}

export const HIGHLIGHT_PRESETS: ColorPreset[] = [
  {
    id: 'yellow',
    name: 'Amarillo Sol',
    hex: '#facc15',
    bgRgba: 'rgba(250, 204, 21, 0.45)',
    borderHex: '#ca8a04',
    textClass: 'text-yellow-300',
  },
  {
    id: 'purple',
    name: 'Púrpura Místico',
    hex: '#c084fc',
    bgRgba: 'rgba(192, 132, 252, 0.45)',
    borderHex: '#9333ea',
    textClass: 'text-purple-300',
  },
  {
    id: 'green',
    name: 'Verde Esmeralda',
    hex: '#4ade80',
    bgRgba: 'rgba(74, 222, 128, 0.45)',
    borderHex: '#16a34a',
    textClass: 'text-emerald-300',
  },
  {
    id: 'pink',
    name: 'Rosa Fucsia',
    hex: '#f472b6',
    bgRgba: 'rgba(244, 114, 182, 0.45)',
    borderHex: '#db2777',
    textClass: 'text-pink-300',
  },
  {
    id: 'blue',
    name: 'Azul Océano',
    hex: '#38bdf8',
    bgRgba: 'rgba(56, 189, 248, 0.45)',
    borderHex: '#0284c7',
    textClass: 'text-sky-300',
  },
  {
    id: 'orange',
    name: 'Naranja Coral',
    hex: '#fb923c',
    bgRgba: 'rgba(251, 146, 60, 0.45)',
    borderHex: '#ea580c',
    textClass: 'text-orange-300',
  },
  {
    id: 'red',
    name: 'Rojo Carmín',
    hex: '#f87171',
    bgRgba: 'rgba(248, 113, 113, 0.45)',
    borderHex: '#dc2626',
    textClass: 'text-red-300',
  },
  {
    id: 'teal',
    name: 'Turquesa Cian',
    hex: '#2dd4bf',
    bgRgba: 'rgba(45, 212, 191, 0.45)',
    borderHex: '#0d9488',
    textClass: 'text-teal-300',
  },
  {
    id: 'lime',
    name: 'Lima Neón',
    hex: '#a3e635',
    bgRgba: 'rgba(163, 230, 53, 0.45)',
    borderHex: '#65a30d',
    textClass: 'text-lime-300',
  },
  {
    id: 'lavender',
    name: 'Lavanda Suave',
    hex: '#e9d5ff',
    bgRgba: 'rgba(233, 213, 255, 0.45)',
    borderHex: '#a855f7',
    textClass: 'text-purple-200',
  },
  {
    id: 'amber',
    name: 'Ámbar Dorado',
    hex: '#fbbf24',
    bgRgba: 'rgba(251, 191, 36, 0.45)',
    borderHex: '#d97706',
    textClass: 'text-amber-300',
  },
  {
    id: 'fuchsia',
    name: 'Fucsia Eléctrico',
    hex: '#e879f9',
    bgRgba: 'rgba(232, 121, 249, 0.45)',
    borderHex: '#c026d3',
    textClass: 'text-fuchsia-300',
  },
];

/**
 * Returns complete styling info for any color (preset id or custom hex string)
 */
export function getHighlightStyle(colorStr: string): {
  id: string;
  name: string;
  hex: string;
  bgRgba: string;
  borderHex: string;
  textClass: string;
} {
  const found = HIGHLIGHT_PRESETS.find((p) => p.id === colorStr || p.hex.toLowerCase() === colorStr.toLowerCase());
  if (found) return found;

  // Custom hex color (e.g. #ff0055)
  if (colorStr.startsWith('#')) {
    const hex = colorStr;
    return {
      id: hex,
      name: `Personalizado (${hex})`,
      hex,
      bgRgba: hexToRgba(hex, 0.45),
      borderHex: hex,
      textClass: 'text-white',
    };
  }

  // Fallback to yellow
  return HIGHLIGHT_PRESETS[0];
}

export function hexToRgba(hex: string, alpha: number = 0.45): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(250, 204, 21, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
