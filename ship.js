import { Mesh, SphereGeometry, MeshBasicMaterial, Vector3 } from "three";
import { G, TO_RADIANS } from "./utils.js";

const _tmp = new Vector3();

export class Ship extends Mesh {
    constructor(mass) {
        super(new SphereGeometry(200, 8, 6), new MeshBasicMaterial({ color: 0x555555 }));
        // Do not scale the ship because then it will also scale camera position when camera is child of this

        this.mass = mass;
        this.velocity = new Vector3();
        this.acceleration = new Vector3();
        this.drive = false;

        this.angularVelocity = new Vector3(); // degrees/sec
    }
    update(deltaT=1, bodies=[]) {
        this.acceleration.setScalar(0);

        for (var body of Object.values(bodies)) {
            var F = body.mass / (this.position.distanceTo(body.position))**3;
            _tmp.subVectors(body.position, this.position).multiplyScalar(F);
            this.acceleration.add(_tmp);
        }
        this.acceleration.multiplyScalar(G); // Not actually force since this omits this.mass to get accel

        if (this.drive) {
            this.getWorldDirection(_tmp);
            // Not actually force since this omits this.mass to get accel
            // Also highly unrealistic for now lol
            _tmp.multiplyScalar(1e9);
            this.acceleration.add(_tmp);
        }

        _tmp.copy(this.acceleration).multiplyScalar(deltaT);
        this.velocity.add(_tmp);

        _tmp.copy(this.velocity).multiplyScalar(deltaT);
        this.position.add(_tmp);

        this.rotateX(this.angularVelocity.x * TO_RADIANS);
        this.rotateY(this.angularVelocity.y * TO_RADIANS);
        this.rotateZ(this.angularVelocity.z * TO_RADIANS);
    }
    calculateTrajectory(deltaT, n) { // Ordinary Verlet integration
        // Save state
        var a = new Vector3().copy(this.acceleration);
        var v = new Vector3().copy(this.velocity);
        var x = new Vector3().copy(this.position);

        var points = [];
        for (var i = 0; i < n; i++) {
            this.update(deltaT);
            // And update the whole system as well, rmbr to save the original time
            points.push(new Vector3().copy(this.position))
        }
        this.acceleration.copy(a);
        this.velocity.copy(v);
        this.position.copy(x);
        return points;
    }
}