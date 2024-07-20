import java.awt.Color;
import java.awt.image.BufferedImage;
public class Julia extends FractalPanel {
    private final double re;
    private final double im;
    public Julia(int width, int height, double re, double im) {
        super(width, height);
        this.re = re;
        this.im = im;
    }
    protected Runnable getRenderer(int startx, int endx, BufferedImage image) {
        return new JuliaRenderer(startx, endx, image);
    }
    private class JuliaRenderer implements Runnable {
        private final int startx;
        private final int endx;
        private final BufferedImage image;
        public JuliaRenderer(int startx, int endx, BufferedImage image) {
            this.startx = startx;
            this.endx = endx;
            this.image = image;
        }
        @Override
        public void run(){
            Complex constant = new Complex(re, im);
            for(int x = startx; x < endx; x++){
                for(int y = 0; y < height; y++){
                    double real = mapToDisplayBounds(x, width, minreal, maxreal);
                    double imaginary = mapToDisplayBounds(y, height, minimag, maximag);
                    Complex z = new Complex(real, imaginary);
                    int iterations = 0;
                    int maxIterations = 1024;
                    while (z.abs() < 2 && iterations < maxIterations) {
                        z = z.multiply(z).add(constant);
                        iterations++;
                    }
                    int color = Color.HSBtoRGB(iterations / 256f, 1, iterations / (iterations + 18f));
                    image.setRGB(x, y, color);
                }
            }
        }
    }
}
