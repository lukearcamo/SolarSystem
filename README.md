# Solar System
During the winter break I binged all 6 seasons of The Expanse (it's really good btw).
I loved the attention to detail in the physics of the story and visuals.
However, I couldn't get an impression of the real vast *expanse* of the solar system, which is understandable otherwise the series would take years to watch.

So, I decided to turn this unhealthy activity into something productive.
I took orbital elements from NASA, mixed it with THREE.js, and made this.

Basically there are two main modes: a 3D map of the solar system, and a ship you can drive and is supposed to have gravity but I haven't fixed that yet because school is starting again and I am running out of time :(

This is *really really* unfinished and messy rn, it still even has messy comments everywhere, a list of features to add at the top, etc. I just wanted to make sure weeks of work is backed up.

Anyways the project is accessible (for desktop only) at [https://lukearcamo.github.io/SolarSystem](https://lukearcamo.github.io/SolarSystem).

# Controls Documentation

The command parser essentially uses subset of JavaScript. Press `/` to type commands. Use up/down arrows to traverse command history.

## Variables

Each body object has an accessible `.mass` and `.position` vector, and each component can be accessed by `.x`, `.y`, and `.z`. 
* sun
* mercury
* em_bary
* mars
* jupiter
* saturn
* uranus
* neptune
* ceres
* luna (currently broken)

`ans` -- Variable that stores previous return value.

`AU` -- Conversion factor for AU to m: 1.495978707e11

`ship` -- Ship object.

`true/false` -- Boolean keywords.

## View switching

There are two views: One where you control a ship, and another where you control an orbit camera and see an overview of the solar system.

`control(ship)` -- Switch to ship view.\
`control(orbit)` -- Switch to orbit view.

## Ship Controls
* `w` pitches the ship up
* `s` pitches the ship down
* `a` turns the ship left (yaw)
* `d` turns the ship right (yaw)
* `ArrowLeft` rolls the ship left
* `ArrowRight` rolls the whip right
* Hold `Space` to enable the drive 

## HUD commands

`hillSphere(bool, body)` -- Show/hide the hill sphere of a given body.

`orbit(bool, body)` -- Show/hide the orbit of a given body.

`highlight(point)` -- Highlights the given point on the HUD.

## Calculation commands

`add(a, b)` -- Adds a and b, where a and/or b can be a scalar or vector.

`vec3(x, y, z)` -- Constructs a new vector from three scalars.

`distance(point1, point2)` -- Returns the Euclidean distance between two given 3D point vectors.

`escapeVelocity(body, point=ship.position)` -- Returns the velocity required to escape a body's gravity at a given point.

`tilt(body)` -- Returns the axial tilt, in degrees, of a given body.

## Simulation time commands

`now()` -- Returns the current Unix date.

`setTime(j2000)` -- Sets the simulation time to the epoch (Jan 1, 2000) and recalculates the position of the bodies.\
`setTime(y, month, d, h, m, s)` -- Sets the simulation time and recalculates position of the bodies.

`addTime(y, d, h, m, s)` -- Adds to the simulation time and recalculates the position of the bodies.

`timeSpeed(n)` -- Simulates the passage of time on the positions of all bodies, sped by a factor of *n*. For example:
* n = 1: Real time
* n = 60: 1s IRL = 1 min simulation
* n = -2: Double-speed, in reverse
* n = 0: Paused

## Orbit view-specific commands

`grid(bool)` -- Show/hide the polar grid in orbit view.

`profile(angle, distance=20)` -- Teleport to the specified angle in degrees at a given distance in AU. Angle is relative to the vernal equinox, which is 0 degrees.

`focus(point)` -- Centers the orbit camera on the given point, represented by a 3D vector.

`controls ship/orbit`
Switch between controlling the ship or seeing a solar system overview.

`ecliptic(bool)` -- Show/hide the ecliptic plane.

## Ship view-specific commands

These are more like unrealistic admin commands for now.

`lookAt(point)` -- Makes the ship face a given point. TODO: make the ship turn gradually instead of instantly jumping.

`teleport(x, y, z)` -- Teleports the ship to a given x, y, z coordinate.

`setVelocity(x, y, z)` -- Sets the ship's x, y, and z velocity.

`flip()` -- Faces the ship in the opposite direction. TODO: make the ship turn gradually instead of instantly jumping.

## Advanced

`positionLock` -- Set this variable to a moving point vector to bind the camera's position to it.

`cameraLocal` -- Camera's local position relative to positionLock.

`targetLock` -- Set this variable to a moving point vector to bind the camera's rotation to face it.
