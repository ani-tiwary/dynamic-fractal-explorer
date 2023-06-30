import javax.swing.*;
public class juliaInit extends JFrame{
    julia panel;
    juliaInit(double a, double b){
        panel = new julia(a, b);
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.add(panel);
        this.pack();
        this.setLocationRelativeTo(null);
        this.setVisible(true);
    }
}