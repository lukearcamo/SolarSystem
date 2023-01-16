import { SphereGeometry, EllipseCurve, Vector3, BufferGeometry } from "three";

// ===== Constants =====

export const G = 6.674e-11;
export const TO_RADIANS = Math.PI / 180;
export const AU_TO_m = 1.495978707e11;
export const ms_TO_CENTURIES = 3.1688088e-13;
export const j2000_UTC = 9.46728e11;

// ===== Reusable geometries =====

export const sphereGeo = new SphereGeometry(1, 8, 6); // Lowres temporarily
sphereGeo.rotateZ(-Math.PI / 2); // Begin axial tilt pointing towards vernal equinox

var ellipseCurve = new EllipseCurve();
var ellipsePoints = ellipseCurve.getPoints(1000);
ellipsePoints.push(new Vector3(0.95, 0, 0)); // Show perihelion (closest point)

export const ellipseGeo = new BufferGeometry();
ellipseGeo.setFromPoints(ellipsePoints);
ellipseGeo.scale(AU_TO_m, AU_TO_m, AU_TO_m);

// ===== Functions =====

// Returns the number of centuries past J2000. Set to J2000 for now so we can compare to existing orbit viewer
// export function centuries(msUTC) { return (msUTC - 946728000000) * 3.1688088e-13; }
// export function centuriesInv(t) { return t / 3.1688088e-13 + 946728000000; }
export function mod(x, n) { return ((x % n) + n) % n; }