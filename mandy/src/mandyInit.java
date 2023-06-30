import javax.swing.*;
public class mandyInit extends JFrame{
    mandy panel;
    mandyInit(){
        panel = new mandy();
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.add(panel);
        this.pack();
        this.setLocationRelativeTo(null);
        this.setVisible(true);
    }
}