import javax.swing.*;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.event.*;
public class julia extends JPanel{
    private int width = 1000;
    private int height = 1000;
    private double minreal = -1.75;
    private double maxreal = 1.75;
    private double minimag = -1.25;
    private double maximag = 1.25f;
    private int maxiter = 1024;
    private double selectionStartX;
    private double selectionStartY;
    private double selectionEndX;
    private double selectionEndY;
    private static double a;
    private static double b;
    public julia(double a, double b) {
        this.a = a;
        this.b = b;
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
    private void drawJulia(Graphics2D g2d) {
        int width = getWidth();
        int height = getHeight();
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Complex constant = new Complex(-0.8, 0.2);
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                double real = map(x, 0, width, minreal, maxreal);
                double imaginary = map(y, 0, height, minimag, maximag);
                Complex z = new Complex(real, imaginary);
                int iterations = 0;
                while (z.abs() < 2 && iterations < maxiter) {
                    z = (z.multiply(z)).add(constant);
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
        drawJulia((Graphics2D) g);
    }
    private double map(double value, double start1, double stop1, double start2, double stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }
    public static void main(String[] args) {
        JFrame frame = new JFrame("julia set");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setResizable(false);
        frame.getContentPane().add(new julia(a, b), BorderLayout.CENTER);
        frame.pack();
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}