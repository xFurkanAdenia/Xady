import ProductError from "../error/ProductError";

export default function paymentCallback(username: string, product: string) {
    if(product == "auto_reklam") {

    } else {
        throw new ProductError("Geçersiz Ürün")
    }
}