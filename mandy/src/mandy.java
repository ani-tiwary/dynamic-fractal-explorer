import javax.swing.*;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.event.*;
public class mandy extends JPanel{
    int width = 1000;
    int height = 1000;
    double minreal = -2.0;
    double maxreal = 1.0;
    double minimag = -2;
    double maximag = 2;
    int maxiter = 1024;
    double selectionStartX;
    double selectionStartY;
    double selectionEndX;
    double selectionEndY;
    public mandy() {
        setPreferredSize(new Dimension(width, height));
        addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                selectionStartX = map(e.getX(), 0, width, minreal, maxreal);
                selectionStartY = map(e.getY(), 0, height, minimag, maximag);
            }

            @Override
            public void mouseReleased(MouseEvent e) {
                selectionEndX = map(e.getX(), 0, width, minreal, maxreal);
                selectionEndY = map(e.getY(), 0, height, minimag, maximag);

                zoomIn();
            }
        });
        addMouseMotionListener(new MouseMotionAdapter() {
            @Override
            public void mouseDragged(MouseEvent e) {
                selectionEndX = map(e.getX(), 0, WIDTH, minreal, maxreal);
                selectionEndY = map(e.getY(), 0, HEIGHT, minimag, maximag);

                repaint();
            }
        });
    }
    private void zoomIn() {
        double newMinReal = Math.min(selectionStartX, selectionEndX);
        double newMaxReal = Math.max(selectionStartX, selectionEndX);
        double newMinImaginary = Math.min(selectionStartY, selectionEndY);
        double newMaxImaginary = Math.max(selectionStartY, selectionEndY);
        minreal = newMinReal;
        maxreal = newMaxReal;
        minimag = newMinImaginary;
        maximag = newMaxImaginary;
        repaint();
    }
    private void drawMandy(Graphics2D g2d) {
        int width = getWidth();
        int height = getHeight();
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                double real = map(x, 0, width, minreal, maxreal);
                double imaginary = map(y, 0, height, minimag, maximag);
                Complex c = new Complex(real, imaginary);
                Complex z = new Complex(0, 0);
                int iterations = 0;
                while (z.abs() < 2 && iterations < maxiter) {
                    z = (z.multiply(z)).add(c);
                    iterations++;
                }
                int color = Color.HSBtoRGB(iterations / 256f, 1, iterations / (iterations + 18f));
                image.setRGB(x, y, color);
            }
        }
        g2d.drawImage(image, 0, 0, null);
    }
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        drawMandy((Graphics2D) g);
    }
    private double map(double value, double start1, double stop1, double start2, double stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }
    public static void main(String[] args) {
        JFrame frame = new JFrame("mandelbrot set");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setResizable(false);
        frame.getContentPane().add(new mandy(), BorderLayout.CENTER);
        frame.pack();
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}