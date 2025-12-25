import "./globals.css";
// Import CartProvider và Nút nổi
import { CartProvider } from "@/context/CartContext";
import FloatingCartBtn from "@/components/FloatingCartBtn";

export const metadata = {
  title: "Shop Thời Trang",
  description: "Website bán hàng demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {/* Bọc toàn bộ ứng dụng trong CartProvider */}
        <CartProvider>
          {children}
          
          {/* Nút giỏ hàng nổi sẽ nằm ở đây, đè lên mọi thứ */}
          <FloatingCartBtn />
        </CartProvider>
      </body>
    </html>
  );
}