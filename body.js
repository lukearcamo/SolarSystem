import { Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Vector3, Matrix4, RingGeometry, DoubleSide, Object3D, Euler } from "three";
import { ellipseGeo, AU_TO_m, TO_RADIANS, mod } from "./utils.js";

const ringMaterial = new MeshBasicMaterial({ color: 0x665544, side: DoubleSide });
const sunMass = 1.989e30;

export class Body {
    constructor(mass, radius, color, tilt=[0, 90, 0, 0], data=[]) {
        this.mass = mass;
        this.radius = radius;
        this.color = color;
        
        // this.ellipse = new Line(ellipseGeo, new LineBasicMaterial({ color }));

        // this.sphere = new Object3D();
        
        this.tilt = tilt;
        this.data = data;

        this.position = new Vector3(); // No more need to do body.sphere.position
        this.orbitMatrix = new Matrix4();
        this.tiltMatrix = new Matrix4();
        this.center = new Vector3();

        this.parent = null;
        this.relativeToEcliptic = true;
    }
    parseData(T) {
        if (this.data.length == 12) { // Planet data format
            this.a =    this.data[0] + T * this.data[6];  // Semi-major axis, AU
            this.e =    this.data[1] + T * this.data[7];  // Eccentricity, unitless
            this.I =    this.data[2] + T * this.data[8];  // Inclination, degrees
            this.L =    this.data[3] + T * this.data[9];  // Mean longitude, degrees
            this.wbar = this.data[4] + T * this.data[10]; // Longitude of perihelion, degrees
            this.O =    this.data[5] + T * this.data[11]; // Longitude of ascending node, degrees
            
            this.b = this.a * Math.sqrt(1 - this.e**2); // Semi-minor axis, AU

            this.w = this.wbar - this.O; // Argument of perihelion, degrees
            this.M = mod(this.L - this.wbar + 180, 360) - 180; // Mean anomaly, degrees
        }
        else { // Small-body and satellites data format
            this.a = this.data[0];  // Semi-major axis, AU
            this.e = this.data[1];  // Eccentricity, unitless
            this.I = this.data[2];  // Inclination, degrees
            this.w = this.data[3];  // Argument of perihelion, degrees
            this.M = this.data[4] + T * 36500 * this.data[6];  // Mean anomaly, degrees & Mean motion, degrees/day
            this.O = this.data[5]; // Longitude of ascending node, degrees

            this.b = this.a * Math.sqrt(1 - this.e**2); // Semi-minor axis, AU

            this.M = mod(this.M + 180, 360) - 180; // Mean anomaly, degrees
        }
    }
    recalculate(T) {
        this.parseData(T);

        // Calculate eccentric anomaly using https://en.wikipedia.org/wiki/Kepler%27s_equation
        var estar = this.e / TO_RADIANS;
        var E = this.M - estar * Math.sin(this.M * TO_RADIANS); // Eccentric anomaly, degrees
        var deltaE = 1;
        while (Math.abs(deltaE) > 1e-6) {
            var deltaM = this.M - (E - estar * Math.sin(E * TO_RADIANS));
            deltaE = deltaM / (1 - this.e * Math.cos(E * TO_RADIANS));
            E += deltaE;
        }
        var xprime = this.a * (Math.cos(E * TO_RADIANS) - this.e);
        var yprime = this.b * Math.sin(E * TO_RADIANS);

        // +x direction is vernal equinox
        // (i.e. the vector from the Earth to the Sun when the Earth is at the vernal equinox (leftmost point))
        // https://en.wikipedia.org/wiki/Orbital_elements#Euler_angle_transformations
        this.orbitMatrix.makeRotationY(this.w * TO_RADIANS);
        this.orbitMatrix.premultiply(new Matrix4().makeRotationX(this.I * TO_RADIANS));
        this.orbitMatrix.premultiply(new Matrix4().makeRotationY(this.O * TO_RADIANS));

        // Heliocentric coordinates
        this.position.set(xprime, 0, -yprime);
        this.position.applyMatrix4(this.orbitMatrix);
        this.position.multiplyScalar(AU_TO_m);

        var focus = Math.sqrt(this.a**2 - this.b**2);
        this.center.set(-focus * AU_TO_m, 0, 0);
    }
    updateTiltMatrix(T, equatorialToEcliptic) {
        var rightAscension = this.tilt[0] + T * this.tilt[2];
        var declination = this.tilt[1] + T * this.tilt[3];

        this.tiltMatrix.makeRotationZ(-(90 - declination) * TO_RADIANS);
        this.tiltMatrix.premultiply(new Matrix4().makeRotationY(rightAscension * TO_RADIANS));
        this.tiltMatrix.premultiply(equatorialToEcliptic); // since RA and Dec are equatorial coords
        // this.tiltMatrix.premultiply(this.orbitMatrix); // since axial tilt is relative to orbital axis
        // body.tiltMatrix.premultiply(bodies["EM_Bary"].orbitMatrix); // Make it actually ecliptic
    }
    getSphereMatrix(matrix) {
        matrix.makeScale(this.radius, this.radius, this.radius);
        matrix.premultiply(this.tiltMatrix);
        matrix.setPosition(this.position);
        if (this.parent) {
            if (!this.relativeToEcliptic) matrix.premultiply(this.parent.tiltMatrix);
            var vec = this.position.clone().add(this.parent.position);
            matrix.setPosition(vec);
        }
    }
    getEllipseMatrix(matrix) {
        matrix.makeScale(this.a, 1, this.b);
        matrix.setPosition(this.center);
        matrix.premultiply(this.orbitMatrix);
        if (this.parent) {
            if (!this.relativeToEcliptic) matrix.premultiply(this.parent.tiltMatrix);
            var vec = new Vector3().setFromMatrixPosition(matrix);
            vec.add(this.parent.position);
            matrix.setPosition(vec);
        }
    }
    hillSphere() {
        // https://astronomy.stackexchange.com/questions/6348/what-is-the-difference-between-sphere-of-influence-and-hill-sphere
        // https://space.stackexchange.com/questions/3015/how-large-is-the-earths-gravitational-sphere-of-influence-and-how-can-it-be-cal
        // FYI the sun's hill sphere is wrt to nearby stars -- it represents the bounds of the entire solar system
        return this.a * (1 - this.e) * Math.cbrt(this.mass / (3 * sunMass)) * AU_TO_m;
    }
    soi(body=null) {
        if (body) {
            var R = this.position.distanceTo(body.position); // meters
            return R * (this.mass / body.mass)**(2/5) * AU_TO_m;
        }
        else {
            return this.a * (this.mass / sunMass)**(2/5) * AU_TO_m;
        }
    }
    addRing(innerRadius, outerRadius) {
        var ringGeometry = new RingGeometry(innerRadius, outerRadius, 30, 1);
        ringGeometry.rotateY(-Math.PI / 2); // idk why y axis works
        this.sphere.add(new Mesh(ringGeometry, ringMaterial));
    }
}
// IGNORE THIS:
// Also includes satellites, not proper definition but idc
// If center is a body, set as parent
// If center is a position vector, orbital elems are relative to ecliptics
// Would it be better to just set the satellite as child of a parent object3d (not mesh)?