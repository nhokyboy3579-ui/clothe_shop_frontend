import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
// Import CartProvider và Nút nổi
import { CartProvider } from "@/context/CartContext";
import FloatingCartBtn from "@/components/FloatingCartBtn";

// Cấu hình font Be Vietnam Pro (Hỗ trợ tiếng Việt tuyệt đối)
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"], // Quan trọng: Phải có vietnamese
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata = {
  title: "Shop Thời Trang",
  description: "Website bán hàng demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
          <FloatingCartBtn />
        </CartProvider>
      </body>
    </html>
  );
}