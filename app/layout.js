import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
// 1. Import Toaster từ thư viện react-hot-toast
import { Toaster } from "react-hot-toast"; 
import { CartProvider } from "@/context/CartContext";
import FloatingCartBtn from "@/components/FloatingCartBtn";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
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
          
          {/* 2. Thêm Toaster vào đây để hiển thị thông báo toàn trang */}
          <Toaster 
            position="top-center" 
            reverseOrder={false} 
            toastOptions={{
              // Bạn có thể tùy chỉnh style mặc định ở đây
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}