export interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    sale_price: number | null;
    image: string;
    category: string;
}