# Solar System
During the winter break I binged all 6 seasons of The Expanse (it's really good btw).
I loved the attention to detail in the physics of the story and visuals.
However, I couldn't get an impression of the real vast *expanse* of the solar system, which is understandable otherwise the series would take years to watch.

So, I decided to turn this unhealthy activity into something productive.
I took orbital elements from NASA, mixed it with THREE.js, and made this.

Basically there are two main modes: a 3D map of the solar system, and a ship you can drive and is supposed to have gravity but I haven't fixed that yet because school is starting again and I am running out of time :(

This is *really really* unfinished and messy rn, it still even has messy comments everywhere, a list of features to add at the top, etc. I just wanted to make sure weeks of work is backed up.

# Controls Documentation -- OUTDATED:
## `<body>` allowed values:
* Sun
* Mercury
* EM_Bary
* Mars
* Jupiter
* Saturn
* Uranus
* Neptune
* Ceres
* Luna

`controls ship/orbit`
Switch between controlling the ship or seeing a solar system overview.

## Ship Controls
* `w` pitches the ship up
* `s` pitches the ship down
* `a` turns the ship left (yaw)
* `d` turns the ship right (yaw)
* `ArrowLeft` rolls the ship left
* `ArrowRight` rolls the whip right
* Hold `Space` to enable the drive 

# Calculation commands

`distance <body> <body>`\
Outputs the distance between two bodies.

`escapeVelocity <body>`\
Outputs the escape velocity from a body at the ship's current position.

`hillSphere show/hide <body>`\
Visualizes the hill sphere of a body.

`tilt <body>`\
Outputs the axial tilt of a body.

## Orbit Commands
`grid show/hide`\
Shows/hides the grid lines, showing the north/east/south/west directions on the ecliptic, as well as 1 AU spacings.

`profile <ecliptic_longitude> <distance=20>`\
Teleports the orbit camera onto the ecliptic plane, *ecliptic_longitude* degrees from the vernal equinox and *distance* AU away. Default distance is 20 AU.

`focus ship/<body>`\
Teleports the orbit camera above the object and looks at it.

`orbit show/hide all/<body>`\
Shows/hides the lines of the orbit ellipses.

`time set now/j2000/<YYYY-MM-DDTHH:mm:ss.sssZ>`\
Sets all bodies to their current positions, positions at epoch Jan 1, 2000 noon, or positions at an ISO 8601 date.

`time add <n>y/d/h/m/s...`\
Sets all bodies to their position after *n* years/days/hours/months/seconds, where n is a float. Can have multiple arguments, and in any order e.g. "2.4h 25d 6y".

`time speed <n>`\
Simulates the passage of time on the positions of all bodies, sped by a factor of *n*. For example:
* n = 1: real-time
* n = 60: 1s IRL = 1 min simulation
* n = -2: Double-speed, in reverse

## Ship Commands
