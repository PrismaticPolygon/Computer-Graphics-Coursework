# Computer Graphics Coursework

This is my submission for the Computer Graphics coursework of the Software Methdologies module at Durham University, 2019.

## Running

The system was primarily tested on Chrome. Some features appear to be non-functional in Edge, due to a 
differing implementation of `requestAnimationFrame`. 

In order to avoid CORS for textures, it is advised to host this directory locally,
using `python -m http.server`. `index.html` can be then accessed appropriately. 

## Libraries

Although no high-level libraries (like `three.js`) were used, basic helper files can be found in `lib`.

## Interactivity

The system provides the following functionality, detailed in a HUD:

* Move the camera position (i.e. `atX, atY`) using `WASD`
* Move the camera direction (i.e. `lookAtX, lookAtY, lookAtZ`) using the arrow keys
* Raise and lower the camera position (`atZ`) using `SHIFT` and `CTRL` respectively
* Each window is equipped with movable blinds. Blinds may be raised using `Z` and lowered using `X`.
* Textures may be toggled using `1`, and are by default OFF.
* Streetlights may be toggled using `2`, and are by default OFF.
* Whether ambient light is sun- or moon-light may be toggled using `3`, and defaults to sun-light.
* Doors may be toggled opened and closed using `4`.

## Other functionality

* An animated car will periodically pass by the house

## Reference image

A reference image may be found at `textures/reference.jpg`