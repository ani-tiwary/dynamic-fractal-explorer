import javax.swing.*;
import java.awt.*;
public class Main {
    public static void main(String[] args) {
        Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
        int width = (int)screenSize.getWidth() - 100;
        int height = (int)screenSize.getHeight() - 50;
        if (args[0].startsWith("m")) {
            initMandy(width, height);
        } else if (args[0].startsWith("j")) {
            double re = Double.parseDouble(args[1]);
            double im = Double.parseDouble(args[2]);
            initJulia(width, height, re, im);
        } else {
            System.out.println("Invalid input.");
        }
    }
    public static void initMandy(int width, int height) {
        JFrame frame = new JFrame("Mandelbrot Set");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.add(new Mandy(width, height));
        frame.pack();
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
    public static void initJulia(int width, int height, double re, double im) {
        JFrame frame = new JFrame("Julia Set");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.add(new Julia(width, height, re, im));
        frame.pack();
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}