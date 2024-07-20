import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseMotionAdapter;
import java.awt.image.BufferedImage;
import javax.swing.JPanel;
public abstract class FractalPanel extends JPanel {
  abstract protected Runnable getRenderer(int startx, int endx, BufferedImage image); // get renderer for this fractal
  protected static final int numthreads = Runtime.getRuntime().availableProcessors();
  protected int width = 1000;
  protected int height = 1000;
  protected double minreal = -2;
  protected double maxreal = 2;
  protected double minimag = -2;
  protected double maximag = 2;
  protected double selectionStartX;
  protected double selectionStartY;
  protected double selectionEndX;
  protected double selectionEndY;
  protected boolean undoRequested = false;
  public void setDim(int width, int height) {
    this.width = width;
    this.height = height;
  }
  protected void resetZoom() {
    minreal = -2;
    maxreal = 2;
    minimag = -2;
    maximag = 2;
    repaint();
    System.out.println("Fractal reset to original view");
  }
  public FractalPanel(int width, int height) {
    setDim(width, height);
    setPreferredSize(new Dimension(width, height));
    addMouseListener(new MouseAdapter() {
      @Override
      public void mousePressed(MouseEvent e) {
        if (e.getButton() == MouseEvent.BUTTON1) {
          selectionStartX = mapToDisplayBounds(e.getX(), width, minreal, maxreal);
          selectionStartY = mapToDisplayBounds(e.getY(), height, minimag, maximag);
        } else if (e.getButton() == MouseEvent.BUTTON3) {
          undoRequested = true;
          repaint();
        }
      }
      @Override
      public void mouseReleased(MouseEvent e) {
        if (e.getButton() == MouseEvent.BUTTON1) {
          selectionEndX = mapToDisplayBounds(e.getX(), width, minreal, maxreal);
          selectionEndY = mapToDisplayBounds(e.getY(), height, minimag, maximag);
          zoomIn();
        }
      }
    });
    addMouseMotionListener(new MouseMotionAdapter() {
      @Override
      public void mouseDragged(MouseEvent e) {
        if (e.getModifiersEx() == MouseEvent.BUTTON1_DOWN_MASK) {
          selectionEndX = mapToDisplayBounds(e.getX(), width, minreal, maxreal);
          selectionEndY = mapToDisplayBounds(e.getY(), height, minimag, maximag);
          repaint();
        }
      }
    });
  }
  public void zoomIn() {
    double screenAspectRatio = (double)width / height;
    double newMinReal = Math.min(selectionStartX, selectionEndX);
    double newMaxReal = Math.max(selectionStartX, selectionEndX);
    double newMinImaginary = Math.min(selectionStartY, selectionEndY);
    double newMaxImaginary = Math.max(selectionStartY, selectionEndY);
    double currentAspectRatio =
        (newMaxReal - newMinReal) / (newMaxImaginary - newMinImaginary);
    if (currentAspectRatio > screenAspectRatio) {
      double center = (newMinReal + newMaxReal) / 2.0;
      double realHeight =
          (newMaxImaginary - newMinImaginary) * screenAspectRatio;
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
    String idk = " - ";
    if (maximag > 0) {idk = " + ";}
    String idk2 = " - ";
    if (minimag > 0) {idk = " + ";}
    System.out.println("Current coordinates: " + minreal + idk + Math.abs(maximag) + "i  |  " + maxreal + idk2 + Math.abs(minimag) + "i");
  }
  private void draw(Graphics2D g2d) {
    BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
    Thread[] threads = new Thread[numthreads];
    int chunkWidth = width / numthreads;
    for (int i = 0; i < numthreads; i++) {
      int startx = i * chunkWidth;
      int endx = startx + chunkWidth;
      threads[i] = new Thread(getRenderer(startx, endx, image));
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
  @Override
  protected void paintComponent(Graphics g) {
    super.paintComponent(g);
    Graphics2D g2d = (Graphics2D)g;
    if (undoRequested) {
      resetZoom();
      undoRequested = false;
    } else {
      draw(g2d);
    }
  }
  protected double mapToDisplayBounds(double value, double stop1, double start2, double stop2) {
    return start2 + (value / stop1) * (stop2 - start2);
  }
}