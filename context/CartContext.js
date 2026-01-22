"use client";
import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  // 1. Load từ LocalStorage khi khởi tạo
  useEffect(() => {
    const storedCart = localStorage.getItem("shopping_cart");
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Lỗi parse giỏ hàng:", error);
        setCartItems([]);
      }
    }
    setMounted(true);
  }, []);

  // 2. Lưu vào LocalStorage mỗi khi cartItems thay đổi
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("shopping_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, mounted]);

  // 3. Thêm vào giỏ hàng
  const addToCart = (product, quantity = 1, attributes = {}) => {
    // Tạo mã định danh duy nhất (Unique ID) dựa trên ID sản phẩm và Thuộc tính (Attributes)
    const uniqueId = `${product.id}-${JSON.stringify(attributes)}`;

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.uniqueId === uniqueId);

      if (existingItem) {
        // Nếu đã tồn tại phiên bản SP này (cùng thuộc tính), tăng số lượng
        return prevItems.map((item) =>
          item.uniqueId === uniqueId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Nếu là phiên bản SP mới, thêm mới vào mảng
        return [...prevItems, { ...product, uniqueId, quantity, attributes }];
      }
    });

    // QUAN TRỌNG: Gọi toast bên ngoài callback của setCartItems để tránh lỗi "Cannot update a component while rendering..."
    toast.success("Đã thêm vào giỏ hàng!");
  };

  // 4. Xóa khỏi giỏ
  const removeFromCart = (uniqueId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.uniqueId !== uniqueId)
    );
    // Gọi toast bên ngoài
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  // 5. Cập nhật số lượng trực tiếp
  const updateQuantity = (uniqueId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.uniqueId === uniqueId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // 6. Xóa toàn bộ giỏ (Dùng sau khi thanh toán thành công)
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("shopping_cart");
  };

  // 7. Các biến tính toán (Derived State)
  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Không render children cho đến khi đã load xong từ LocalStorage để tránh lỗi Hydration (Next.js)
  if (!mounted) return null;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
