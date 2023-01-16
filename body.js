import { Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Vector3, Matrix4, RingGeometry, DoubleSide } from "three";
import { sphereGeo, ellipseGeo, AU_TO_m, TO_RADIANS, mod } from "./utils.js";

const ringMaterial = new MeshBasicMaterial({ color: 0x665544, side: DoubleSide });

export class Body {
    constructor(mass, radius, color, tilt=[0, 90, 0, 0], data=[]) {
        this.mass = mass;
        this.radius = radius;
        
        this.ellipse = new Line(ellipseGeo, new LineBasicMaterial({ color }));

        this.sphere = new Mesh(sphereGeo, new MeshBasicMaterial({ color, wireframe: true })); // new THREE.MeshLambertMaterial({ color })
        this.sphere.scale.setScalar(radius);
        
        this.tilt = tilt;
        this.data = data;

        this.position = new Vector3(); // No more need to do body.sphere.position
        this.matrix = new Matrix4();

        // this.hill = new THREE.Mesh(sphereGeo, hillMaterial);
        // this.soi = new THREE.Mesh(sphereGeo, soiMaterial);
        // this.sphere.add(this.hill);
        // this.sphere.add(this.soi);
    }
    recalculate(T) {
        this.a =    this.data[0] + T * this.data[6];  // Semi-major axis, AU
        this.e =    this.data[1] + T * this.data[7];  // Eccentricity, unitless
        this.I =    this.data[2] + T * this.data[8];  // Inclination, degrees
        this.L =    this.data[3] + T * this.data[9];  // Mean longitude, degrees
        this.wbar = this.data[4] + T * this.data[10]; // Longitude of perihelion, degrees
        this.O =    this.data[5] + T * this.data[11]; // Longitude of ascending node, degrees
        
        this.b = this.a * Math.sqrt(1 - this.e**2); // Semi-minor axis, AU

        this.w = this.wbar - this.O; // Argument of perihelion, degrees
        this.M = mod(this.L - this.wbar + 180, 360) - 180; // Mean anomaly, degrees

        // https://en.wikipedia.org/wiki/Kepler%27s_equation
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
        // The following is the inverse of JPL's transformations (negative angles and flipped order)
        // because they gave the transformation from orbital plane to ecliptic,
        // whereas we need ecliptic to orbital plane
        // https://en.wikipedia.org/wiki/Orbital_elements#Euler_angle_transformations
        this.matrix.makeRotationX(-Math.PI / 2); // Last transform
        this.matrix.multiply(new Matrix4().makeRotationZ(this.O * TO_RADIANS));
        this.matrix.multiply(new Matrix4().makeRotationX(this.I * TO_RADIANS));
        this.matrix.multiply(new Matrix4().makeRotationZ(this.w * TO_RADIANS));

        // Heliocentric coordinates
        this.position = new Vector3(xprime, yprime, 0);
        this.position.applyMatrix4(this.matrix);
        this.position.multiplyScalar(AU_TO_m);
    }
    updateGeometry(T) {
        var rightAscension = this.tilt[0] + T * this.tilt[2];
        var declination = this.tilt[1] + T * this.tilt[3];
        this.sphere.rotation.set(0, rightAscension * TO_RADIANS, declination * TO_RADIANS, "ZYX");
        this.sphere.position.copy(this.position);

        // Confirmed: https://en.wikipedia.org/wiki/Earth%27s_orbit#/media/File:EarthsOrbit_en.png
        var focus = Math.sqrt(this.a**2 - this.b**2);
        this.ellipse.matrix.makeScale(this.a, this.b, 1);
        this.ellipse.matrix.setPosition(-focus * AU_TO_m, 0, 0);
        this.ellipse.matrix.premultiply(this.matrix);
        this.ellipse.matrix.decompose(this.ellipse.position, this.ellipse.quaternion, this.ellipse.scale);
    }
    // updateHillSphere() {
    //     // https://astronomy.stackexchange.com/questions/6348/what-is-the-difference-between-sphere-of-influence-and-hill-sphere
    //     // https://space.stackexchange.com/questions/3015/how-large-is-the-earths-gravitational-sphere-of-influence-and-how-can-it-be-cal
    //     // The sun's hill sphere is wrt to nearby stars -- it represents the bounds of the entire solar system
    //     var hillSphere = this.a * (1 - this.e) * Math.cbrt(this.mass / (3 * sunMass));
    //     this.hill.scale.setScalar(hillSphere * AU_TO_m / this.radius);
    // }
    // soiWithSun() {
    //     var sphereOfInfluence = this.a * (this.mass / sunMass)**(2/5);
    //     this.soi.scale.setScalar(sphereOfInfluence * AU_TO_m / this.radius);
    //     // Assumes constant distance, since ur using semiMajorAxis
    // }
    // soiWithBody(body) {
    //     var R = this.sphere.position.distanceTo(body.sphere.position); // meters
    //     var sphereOfInfluence = R * (this.mass / body.mass)**(2/5);
    //     this.soi.scale.setScalar(sphereOfInfluence / this.radius);
    // }
    addRing(innerRadius, outerRadius) {
        var ringGeometry = new RingGeometry(innerRadius / this.radius, outerRadius / this.radius, 30, 1);
        ringGeometry.rotateY(-Math.PI / 2); // idk why y axis works
        this.sphere.add(new Mesh(ringGeometry, ringMaterial));
    }
}

export class SmallBody extends Body { // Also includes satellites, not proper definition but idc
    constructor(...args) {
        super(...args);
    }
    // setReference(center, ecliptic=false) {
    //     this.center = center; // Body
    //     if (ecliptic) {

    //     }
    //     else {
    //         this.sphere.position.copy()
    //     }
    // }
    recalculate(T) { // Or have a separate smallbody class, especially so u can pick different foci and reference plane; mb it should extend Body
        this.a = this.data[0];  // Semi-major axis, AU
        this.e = this.data[1];  // Eccentricity, unitless
        this.I = this.data[2];  // Inclination, degrees
        this.w = this.data[3];  // Argument of perihelion, degrees
        this.M = this.data[4] + T * 36500 * this.data[6];  // Mean anomaly, degrees & Mean motion, degrees/day
        this.O = this.data[5]; // Longitude of ascending node, degrees

        this.b = this.a * Math.sqrt(1 - this.e**2); // Semi-minor axis, AU

        this.M = mod(this.M + 180, 360) - 180; // Mean anomaly, degrees

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

        this.matrix.makeRotationX(-Math.PI / 2);
        this.matrix.multiply(new Matrix4().makeRotationZ(this.O * TO_RADIANS));
        this.matrix.multiply(new Matrix4().makeRotationX(this.I * TO_RADIANS));
        this.matrix.multiply(new Matrix4().makeRotationZ(this.w * TO_RADIANS));

        this.position = new Vector3(xprime, yprime, 0);
        this.position.applyMatrix4(this.matrix);
        this.position.multiplyScalar(AU_TO_m);
    }
    // updateGeometry(T) {
    //     this.position.add(this.center.position);
    //     super.updateGeometry(T);
    //     this.ellipse.position.add(this.center.position);
    // }
}