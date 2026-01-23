"use client";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/context/CartContext";
import FloatingCartBtn from "@/components/FloatingCartBtn";
import Footer from "@/components/Footer";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body
        className={`${beVietnamPro.variable} font-sans antialiased bg-white`}
      >
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { background: "#333", color: "#fff" },
          }}
        />

        <CartProvider>
          {/* Bố cục Flexbox giúp Footer luôn nằm dưới cùng */}
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <FloatingCartBtn />
        </CartProvider>
      </body>
    </html>
  );
}
