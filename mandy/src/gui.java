import javax.swing.*;

public class gui extends JFrame{
    mandy panel;
    gui(){
        panel = new mandy();
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.add(panel);
        this.pack();
        this.setLocationRelativeTo(null);
        this.setVisible(true);
    }
}