import javax.swing.*;
public class mandyInit extends JFrame{
    mandy panel;
    private int a;
    private int b;
    mandyInit(int a, int b){
        panel = new mandy(a, b);
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.add(panel);
        this.pack();
        this.setLocationRelativeTo(null);
        this.setVisible(true);
    }
}