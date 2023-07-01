public class Main {
    public static void main(String[] args){
        if(args[0].startsWith("m")){
            new mandyInit();
        } else if(args[0].startsWith("j")){
            double re = Double.parseDouble(args[1]);
            double im = Double.parseDouble(args[2]);
            new juliaInit(re, im);
        } else {System.out.println("Invalid input.");}
    }
}