"use client";
import { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Khởi tạo là mảng rỗng [] để tránh lỗi undefined
  const [cartItems, setCartItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  // 1. Load từ LocalStorage
  useEffect(() => {
    const storedCart = localStorage.getItem("shopping_cart");
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        setCartItems([]);
      }
    }
    setMounted(true);
  }, []);

  // 2. Lưu vào LocalStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("shopping_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, mounted]);

  // 3. Thêm vào giỏ
  const addToCart = (product, quantity = 1, attributes = {}) => {
    setCartItems((prevItems) => {
      const uniqueId = `${product.id}-${JSON.stringify(attributes)}`;
      const existingItem = prevItems.find((item) => item.uniqueId === uniqueId);

      let newCart;
      if (existingItem) {
        newCart = prevItems.map((item) =>
          item.uniqueId === uniqueId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prevItems, { ...product, uniqueId, quantity, attributes }];
      }
      return newCart;
    });
    toast.success("Đã thêm vào giỏ hàng!");
  };

  // 4. Xóa khỏi giỏ (MỚI)
  const removeFromCart = (uniqueId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.uniqueId !== uniqueId));
    toast.success("Đã xóa sản phẩm");
  };

  // 5. Cập nhật số lượng (MỚI)
  const updateQuantity = (uniqueId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.uniqueId === uniqueId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // 6. Xóa hết giỏ (MỚI - dùng khi thanh toán xong)
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("shopping_cart");
  };

  // Tính tổng số lượng
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Tính tổng tiền
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems, // Tên chuẩn là cartItems
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);