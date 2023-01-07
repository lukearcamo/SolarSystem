import { Mesh, SphereGeometry, MeshBasicMaterial, Vector3 } from "three";

export class Ship extends Mesh {
    constructor(mass) {
        super(new SphereGeometry(200, 8, 6), new MeshBasicMaterial({ color: 0x555555 }));

        this.mass = mass;
        this.velocity = new Vector3();
        this.acceleration = new Vector3();
        this.drive = false;

        // Do not scale this because then it will also scale camera position when camera is child of this
        // this.position.copy(position);
        // scene.add(this.obj);
    }
    update(deltaT=1) {
        var force = new Vector3();
        // for (var body of bodies) {
        //     var F = body.mass / (this.position.distanceTo(body.sphere.position))**3;
        //     var direction = body.sphere.position.clone().sub(this.position).multiplyScalar(F);
        //     force.add(direction);
        // }
        // force.multiplyScalar(G); // Not actually force since this omits this.mass to get accel

        var driveForce = new Vector3();
        if (this.drive) {
            camera.getWorldDirection(driveForce);
            // Not actually force since this omits this.mass to get accel
            // Also highly unrealistic for now lol
            driveForce.multiplyScalar(1000000);
            force.add(driveForce);
        }

        this.acceleration.copy(force);

        force.multiplyScalar(deltaT);
        this.velocity.add(force); // dt**2 / 2

        force.copy(this.velocity).multiplyScalar(deltaT);
        this.position.add(force);
    }
}