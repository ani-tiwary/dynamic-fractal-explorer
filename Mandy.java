import java.awt.*;
import javax.swing.JPanel;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseMotionAdapter;
import java.awt.image.BufferedImage;
public class Mandy extends FractalPanel {
    public Mandy(int width, int height) {
        super(width, height);
    }
    protected Runnable getRenderer(int startx, int endx, BufferedImage image) {
        return new MandelbrotRenderer(startx, endx, image);
    }
    private class MandelbrotRenderer implements Runnable {
        private final int startx;
        private final int endx;
        private final BufferedImage image;
        public MandelbrotRenderer(int startx, int endx, BufferedImage image) {
            this.startx = startx;
            this.endx = endx;
            this.image = image;
        }
        @Override
        public void run(){
            repaint();
            for(int x = startx; x < endx; x++){
                for(int y = 0; y < height; y++){
                    double real = mapToDisplayBounds(x, width, minreal, maxreal);
                    double imaginary = mapToDisplayBounds(y, height, minimag, maximag);
                    Complex c = new Complex(real, imaginary);
                    Complex z = new Complex(0, 0);
                    int iterations = 0;
                    int maxiter = 1024;
                    while (z.abs() < 2 && iterations < maxiter) {
                        z = z.multiply(z).add(c);
                        iterations++;
                    }
                    int color = Color.HSBtoRGB(iterations / 256f, 1, iterations / (iterations + 18f));
                    image.setRGB(x, y, color);
                }
            }
        }
    }
}