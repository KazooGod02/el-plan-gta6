// Businesses you can walk into: clothes, sneakers, restaurants and bars.
// Each one takes over a generic building near `near` (tile coords) when the map is built.
export const SHOPS = [
  // La Colonia (open from the start)
  { id: 'moda', kind: 'ropa', name: 'ROPA LA MODA', sign: 'LA MODA', near: [30, 64], roof: '#f46eaa', awning: '#ff3cc8', owner: 'Chayo' },
  { id: 'veloz', kind: 'zapateria', name: 'TENIS EL VELOZ', sign: 'EL VELOZ', near: [52, 64], roof: '#3c64dc', awning: '#f4f4f0', owner: 'El Flash' },
  { id: 'pollos', kind: 'restaurante', name: 'POLLOS EL ALEGRE', sign: 'POLLOS', near: [12, 84], roof: '#f08c28', awning: '#ffd23f', owner: 'Don Pollo', menu: 'pollo' },
  { id: 'guero', kind: 'bar', name: 'CANTINA EL GÜERO', sign: 'CANTINA', near: [96, 64], roof: '#8c5a32', awning: '#d8323c', owner: 'El Güero' },
  // El Centro
  { id: 'boutique', kind: 'ropa', name: 'BOUTIQUE VICIO', sign: 'BOUTIQUE', near: [30, 36], roof: '#c878f0', awning: '#f4f4f0', owner: 'Madame Lulú', fancy: true },
  { id: 'sushi', kind: 'restaurante', name: 'SUSHI PV', sign: 'SUSHI PV', near: [76, 36], roof: '#d8323c', awning: '#101018', owner: 'Chef Toño', menu: 'sushi' },
  { id: 'sneakers', kind: 'zapateria', name: 'SNEAKERS PV', sign: 'SNEAKERS', near: [12, 40], roof: '#46b450', awning: '#101018', owner: 'Brayan' },
  // El Puerto
  { id: 'ancla', kind: 'restaurante', name: 'MARISCOS EL ANCLA', sign: 'MARISCOS', near: [148, 54], roof: '#28b4a0', awning: '#f4f4f0', owner: 'La Güera', menu: 'mariscos' },
  { id: 'sirena', kind: 'bar', name: 'BAR LA SIRENA', sign: 'LA SIRENA', near: [128, 64], roof: '#1e2c78', awning: '#5adcf0', owner: 'Capitán Chema' },
];

export const OUTFITS = [
  { id: 'normal', name: 'El de siempre', price: 0, shirt: '#e0a82e', pants: '#34466e' },
  { id: 'guayabera', name: 'Guayabera fresca', price: 250, shirt: '#f0ece0', pants: '#b49664' },
  { id: 'hawaiana', name: 'Camisa hawaiana', price: 300, shirt: '#f46eaa', pants: '#f4f4f0' },
  { id: 'pants', name: 'Pants de marca (pirata)', price: 400, shirt: '#d8323c', pants: '#d8323c' },
  { id: 'negro', name: 'Todo de negro (sospechoso)', price: 650, shirt: '#1a1a2e', pants: '#1a1a2e', boutique: true },
  { id: 'traje', name: 'Traje de gerente', price: 1200, shirt: '#2a2a3a', pants: '#2a2a3a', tie: '#c83c3c', boutique: true },
  { id: 'grafitero', name: 'Grafitero (20 grafitis)', price: 0, shirt: '#ff3cc8', pants: '#1a1a2e', locked: 'outfitMarathon' },
];

export const SHOES = [
  { id: 'normal', name: 'Tenis de siempre', price: 0, color: '#f0f0f0', speed: 1 },
  { id: 'chafa', name: 'Tenis "Adidos"', price: 180, color: '#3c64dc', speed: 1.06 },
  { id: 'veloz', name: 'Tenis El Veloz', price: 650, color: '#ffd23f', speed: 1.12 },
  { id: 'pro', name: 'Sneakers edición limitada', price: 1600, color: '#ff3cc8', speed: 1.2 },
];

export const MENUS = {
  pollo: [['Pollo con tortillas', 70, 60], ['Medio pollo con todo', 130, 100], ['Agua de horchata', 20, 15]],
  sushi: [['Rollo "Vicio" (con queso crema, obvio)', 140, 100], ['Sopa miso', 60, 40], ['Té verde', 30, 20]],
  mariscos: [['Coctel de camarón', 110, 80], ['Tostada de ceviche', 50, 35], ['Aguachile (pica)', 90, 70]],
};
