public class Complex {
    double real;
    double imaginary;
    public Complex(double real, double imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }
    public Complex add(Complex other) {
        double realSum = this.real + other.real;
        double imaginarySum = this.imaginary + other.imaginary;
        return new Complex(realSum, imaginarySum);
    }
    public Complex multiply(Complex other) {
        double realProduct = this.real * other.real - this.imaginary * other.imaginary;
        double imaginaryProduct = this.real * other.imaginary + this.imaginary * other.real;
        return new Complex(realProduct, imaginaryProduct);
    }
    public double abs() {
        return Math.sqrt(real * real + imaginary * imaginary);
    }
    @Override
    public String toString() {
        return "Complex{" + "real=" + real + ", imaginary=" + imaginary + '}';
    }
}