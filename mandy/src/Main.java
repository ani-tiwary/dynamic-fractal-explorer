public class Main {
    public static void main(String[] args){
        double re = Double.parseDouble(args[1]);
        double im = Double.parseDouble(args[2]);
        if(args[0].startsWith("m")){
            new mandyInit();
        } else if(args[0].startsWith("j")){
            new juliaInit(re, im);
        } else {System.out.println("Invalid input.");}
    }
}