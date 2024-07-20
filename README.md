# interactive-mandelbrot-julia
Interactive viewer for the fractals created by the Mandelbrot and Julia sets. Supports zooming in, resetting view, and returning coordinates in the complex plane.
## Arguments
### Mandelbrot
`mandelbrot`
### Julia
`julia real_component imaginary_component`
## Usage
Zoom in by dragging LMB; selected rectangle will be stretched to fit viewing window. Reset image by clicking RMB. <br>
Coordinates of current screen in the complex plane are printed in the console; they represent the top left and bottom right corners of the screen, respectively. <br>
Suggested arguments for Julia Set constant: `j 0.355534 -0.337292` `j -0.54 0.54` `j 0.35 -0.05` `j 0 0.8`
