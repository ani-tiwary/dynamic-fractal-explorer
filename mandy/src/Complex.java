public class Complex {
    double real;
    double imaginary;
    public Complex(double real, double imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }
    public Complex add(Complex theotherone) {
        double realSum = this.real + theotherone.real;
        double imaginarySum = this.imaginary + theotherone.imaginary;
        return new Complex(realSum, imaginarySum);
    }
    public Complex multiply(Complex theotherone) {
        double realProduct = this.real * theotherone.real - this.imaginary * theotherone.imaginary;
        double imaginaryProduct = this.real * theotherone.imaginary + this.imaginary * theotherone.real;
        return new Complex(realProduct, imaginaryProduct);
    }
    public double abs() {
        return Math.sqrt(real * real + imaginary * imaginary);
    }
}