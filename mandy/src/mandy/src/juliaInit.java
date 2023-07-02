import javax.swing.*;
public class juliaInit extends JFrame{
    julia panel;
    juliaInit(int a, int b, double c, double d){
        panel = new julia(a, b, c, d);
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.add(panel);
        this.pack();
        this.setLocationRelativeTo(null);
        this.setVisible(true);
    }
}