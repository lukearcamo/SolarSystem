import { Matrix4, Color } from "three";
import { TO_RADIANS, AU_TO_m, ms_TO_CENTURIES, j2000_UTC } from "./utils.js";
import { Body } from "./body.js";

// Note the mass given for EM Bary is actually earths -- fix this later
// Some tilts have no T term, and Neptune has a more complicated axial tilt formula, this one is simplified
// Also these orbital parameters are only valid between like 1800 and 2100 or something
export const bodies = {
    // Name, Mass (kg), Mean radius (m), Color, Tilt, Data [a, e, I, L, wbar, O, ...] for big bodies, [a, e, I, w, M, O, n] for small bodies
    "Mercury": new Body(0.330103e24,   2439400, 0x663300, [281.010, 61.414, -0.033, -0.005], [0.38709927,0.20563593,7.00497902,252.2503235,77.45779628,48.33076593,3.7e-7,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081]), 
    "Venus":   new Body(4.86731e24,    6051800, 0xffbb00, [272.76, 67.16, 0, 0], [0.72333566,0.00677672,3.39467605,181.9790995,131.60246718,76.67984255,0.0000039,-0.00004107,-0.0007889,58517.81538729,0.00268329,-0.27769418]), 
    "Em_bary": new Body(5.97217e24,  6371008.4, 0x00ccff, [0, 90, -0.641, -0.557], [1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0,0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0]), 
    "Mars":    new Body(0.641691e24,   3389500, 0xcc0000, [317.681, 52.887, -0.106, -0.061], [1.52371034,0.0933941,1.84969142,-4.55343205,-23.94362959,49.55953891,0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343]), 
    "Jupiter": new Body(1898.125e24,  69911000, 0xff6600, [268.057, 64.495, -0.006, 0.002], [5.202887,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909,-0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106]), 
    "Saturn":  new Body(568.317e24,   58232000, 0xffddaa, [40.589, 83.537, -0.036, -0.004], [9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448,-0.0012506,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794]), 
    "Uranus":  new Body(86.8099e24,   25362000, 0x00dddd, [257.311, -15.175, 0, 0], [19.18916464,0.04725744,0.77263783,313.23810451,170.9542763,74.01692503,-0.00196176,-0.00004397,-0.00242939,428.48202785,0.40805281,0.04240589]), 
    "Neptune": new Body(102.4092e24,  24622000, 0x0000ff, [299.36, 43.46, 0, 0], [30.06992276,0.00859048,1.77004347,-55.12002969,44.96476227,131.78422574,0.00026291,0.00005105,0.00035372,218.45945325,-0.32241464,-0.00508664]),

    // These have different/lots of missing parameters -- not as accurately studied i guess?
    "Ceres":   new Body(9.393e20,  939400, 0x555555, [0, 90, 0, 0], [2.767181743149466, 0.07881745101960996, 10.58634326912728, 73.47046154424713, 17.21565149614834, 80.26014869058888, 0.214115224389324]),
    // Later find sun orbital parameters around solar system barycenter
    "Sun":     new Body(1.989e30, 696340000, 0xffcc00, [286.13, 63.87, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    // Axial tilt for the Moon taken from https://en.wikipedia.org/wiki/Axial_tilt#Solar_System_bodies
    // - https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
    // n is from Horizons, everything else is from https://ssd.jpl.nasa.gov/sats/elem/
    // Compare to the existing nasa orbit viewer -- idt this looks right
    "Luna":    new Body(7.346e22, 1738100, 0xcccccc, [270, 66.54, 0, 0], [0.00256955529, 0.0554, 5.16, 318.15, 135.27, 125.08, 0.000153]),
    // "Luna":    new SmallBody(7.346e22, 17381000, 0xcccccc, [270, 66.54, 0, 0], [0.00256955529, 0.0554, 5.16, 0, 0, 0, 0]),
};
// IDEA: mb define satellites using nested objects
// ALSO RMBR: Satellites hill spheres will be relative to their parents not the sun

bodies["Luna"].parent = bodies["EM_Bary"];
bodies["Luna"].relativeToEcliptic = false;

const _bodiesValues = Object.values(bodies);
const _matrix = new Matrix4();
const _color = new Color();

export const numBodies = _bodiesValues.length;

export function recalculateSystem(date, bodySpheres, ellipses) {
    var T = (date.getTime() - j2000_UTC) * ms_TO_CENTURIES;
    
    // https://en.wikipedia.org/wiki/Ecliptic#Obliquity_of_the_ecliptic
    // https://en.wikipedia.org/wiki/Ecliptic_coordinate_system#Converting_Cartesian_vectors
    var obliquity = 23.44 - 0.013 * T;
    var equatorialToEcliptic = new Matrix4().makeRotationX(-obliquity * TO_RADIANS);

    for (var i = 0; i < numBodies; i++) {
        // console.log(Object.keys(bodies)[i]); // So it does go in order
        var body = _bodiesValues[i];
        body.recalculate(T);
        body.updateTiltMatrix(T, equatorialToEcliptic);

        _color.setHex(body.color);
        bodySpheres.setColorAt(i, _color);
        ellipses[i].material.color.copy(_color);

        body.getSphereMatrix(_matrix);
        bodySpheres.setMatrixAt(i, _matrix);

        body.getEllipseMatrix(_matrix);
        _matrix.decompose(ellipses[i].position, ellipses[i].quaternion, ellipses[i].scale);
    }
    bodySpheres.instanceMatrix.needsUpdate = true;
}