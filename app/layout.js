import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
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
  title: "Shop Thời Trang Thúy Nghiệm", // Cập nhật tiêu đề đúng thương hiệu
  description: "Thời trang cao cấp - Trải nghiệm mua sắm tuyệt vời",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        {/* 1. Toaster nên đặt ở cấp cao nhất của body để tránh bị ảnh hưởng bởi CSS của Provider */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            className: "z-[9999]",
            style: {
              background: "#333",
              color: "#fff",
              fontSize: "14px",
              borderRadius: "10px",
              padding: "12px 24px",
            },
            success: {
              iconTheme: {
                primary: "#4ade80",
                secondary: "#fff",
              },
            },
          }}
        />

        <CartProvider>
          {children}
          <FloatingCartBtn />
        </CartProvider>
      </body>
    </html>
  );
}
