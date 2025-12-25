import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

// Import CartProvider và Nút nổi
import { CartProvider } from "@/context/CartContext";
import FloatingCartBtn from "@/components/FloatingCartBtn";

// Cấu hình font Be Vietnam Pro (Hỗ trợ tiếng Việt tốt nhất)
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam", // Biến CSS để Tailwind sử dụng
  display: "swap",
});

export const metadata = {
  title: "Shop Thời Trang",
  description: "Website bán hàng demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      {/* Thêm biến font vào body. 
        Class 'font-sans' sẽ kích hoạt font này nhờ cấu hình trong tailwind.config.js 
        Class 'antialiased' giúp font chữ sắc nét hơn trên trình duyệt
      */}
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
          <FloatingCartBtn />
        </CartProvider>
      </body>
    </html>
  );
}