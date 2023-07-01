import javax.swing.*;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.event.*;
public class mandy extends JPanel{
    private static final int numthreads = Runtime.getRuntime().availableProcessors();
    private final int width = 1000;
    private final int height = 1000;
    private double minreal = -2.0;
    private double maxreal = 1.0;
    private double minimag = -2;
    private double maximag = 2;
    private double selectionStartX;
    private double selectionStartY;
    private double selectionEndX;
    private double selectionEndY;
    private boolean undoRequested = false;
    public mandy() {
        setPreferredSize(new Dimension(width, height));
        addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                if (e.getButton() == MouseEvent.BUTTON1) {
                    selectionStartX = map(e.getX(), width, minreal, maxreal);
                    selectionStartY = map(e.getY(), height, minimag, maximag);
                } else if (e.getButton() == MouseEvent.BUTTON3) {
                    undoRequested = true;
                    repaint();
                }
            }

            @Override
            public void mouseReleased(MouseEvent e) {
                if (e.getButton() == MouseEvent.BUTTON1) {
                    selectionEndX = map(e.getX(), width, minreal, maxreal);
                    selectionEndY = map(e.getY(), height, minimag, maximag);
                    zoomIn();
                }
            }
        });
        addMouseMotionListener(new MouseMotionAdapter() {
            @Override
            public void mouseDragged(MouseEvent e) {
                if (e.getModifiersEx() == MouseEvent.BUTTON1_DOWN_MASK) {
                    selectionEndX = map(e.getX(), width, minreal, maxreal);
                    selectionEndY = map(e.getY(), height, minimag, maximag);
                    repaint();
                }
            }
        });
    }
    private void zoomIn() {
        double screenAspectRatio = (double) width / height;
        double newMinReal = Math.min(selectionStartX, selectionEndX);
        double newMaxReal = Math.max(selectionStartX, selectionEndX);
        double newMinImaginary = Math.min(selectionStartY, selectionEndY);
        double newMaxImaginary = Math.max(selectionStartY, selectionEndY);
        double currentAspectRatio = (newMaxReal - newMinReal) / (newMaxImaginary - newMinImaginary);
        if (currentAspectRatio > screenAspectRatio) {
            double center = (newMinReal + newMaxReal) / 2.0;
            double realHeight = (newMaxImaginary - newMinImaginary) * screenAspectRatio;
            newMinReal = center - realHeight / 2.0;
            newMaxReal = center + realHeight / 2.0;
        } else {
            double center = (newMinImaginary + newMaxImaginary) / 2.0;
            double imagWidth = (newMaxReal - newMinReal) / screenAspectRatio;
            newMinImaginary = center - imagWidth / 2.0;
            newMaxImaginary = center + imagWidth / 2.0;
        }
        minreal = newMinReal;
        maxreal = newMaxReal;
        minimag = newMinImaginary;
        maximag = newMaxImaginary;
        repaint();
        System.out.println("Real Width: " + Math.abs(minreal - maxreal));
        System.out.println("Imaginary Height: " + Math.abs(minimag - maximag));
    }
    private void resetZoom() {
        minreal = -2.0;
        maxreal = 1.0;
        minimag = -2;
        maximag = 2;
        repaint();
        System.out.println("Fractal reset to original view");
    }
    private void drawMandy(Graphics2D g2d) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Thread[] threads = new Thread[numthreads];
        int chunkWidth = width / numthreads;
        for (int i = 0; i < numthreads; i++) {
            int startx = i * chunkWidth;
            int endx = startx + chunkWidth;
            MandelbrotRenderer renderer = new MandelbrotRenderer(startx, endx, image);
            threads[i] = new Thread(renderer);
            threads[i].start();
        }
        try {
            for (Thread thread : threads) {
                if (thread != null) {
                    thread.join();
                }
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        g2d.drawImage(image, 0, 0, null);
    }
    private class MandelbrotRenderer implements Runnable{
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
            //System.out.println("startx = "  + startx + ", endx: " + endx);  //temporary test for redundancy in threads' operations
            for(int x = startx; x < endx; x++){
                for(int y = 0; y < height; y++){
                    double real = map(x, width, minreal, maxreal);
                    double imaginary = map(y, height, minimag, maximag);
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
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g;
        if (undoRequested) {
            resetZoom();
            undoRequested = false;
        } else {
            drawMandy(g2d);
        }
    }
    private double map(double value, double stop1, double start2, double stop2) {
        return start2 + (value / stop1) * (stop2 - start2);
    }
}