// ===== Constants =====

export const G = 6.674e-11;
export const TO_RADIANS = Math.PI / 180;
export const AU_TO_m = 1.495978707e11;
export const ms_TO_CENTURIES = 3.1688088e-13;
export const j2000_UTC = 9.46728e11;

// ===== Functions =====

export function mod(x, n) { return ((x % n) + n) % n; }