import java.awt.*;
public class Main {
    public static void main(String[] args){
        Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
        if(args[0].startsWith("m")){
            new mandyInit((int) screenSize.getWidth() - 200, (int) screenSize.getHeight() - 100);
        } else if(args[0].startsWith("j")){
            double re = Double.parseDouble(args[1]);
            double im = Double.parseDouble(args[2]);
            new juliaInit((int) screenSize.getWidth() - 200, (int) screenSize.getHeight() - 100, re, im);
        } else {System.out.println("Invalid input.");}
    }
}