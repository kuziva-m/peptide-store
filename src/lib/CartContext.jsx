import { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  // 1. Safer Initialization
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("cart");
      // If saved is "null", "undefined", or invalid JSON, return []
      return saved ? JSON.parse(saved) || [] : [];
    } catch (error) {
      console.error("Cart load error:", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // 2. Sync to LocalStorage (Only if cart is valid array)
  useEffect(() => {
    if (Array.isArray(cart)) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);

  // 3. Calculated Total
  const cartTotal = Array.isArray(cart)
    ? cart.reduce((total, item) => total + item.price * item.quantity, 0)
    : 0;

  const cartCount = Array.isArray(cart)
    ? cart.reduce((count, item) => count + item.quantity, 0)
    : 0;

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addToCart = (product, quantity = 1, variant = "Default") => {
    setCart((prevCart) => {
      // Safety check: ensure prevCart is an array
      const currentCart = Array.isArray(prevCart) ? prevCart : [];

      const existingItemIndex = currentCart.findIndex(
        (item) => item.id === product.id && item.variant === variant
      );

      if (existingItemIndex > -1) {
        const newCart = [...currentCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        return [...currentCart, { ...product, quantity, variant }];
      }
    });
    setIsCartOpen(true); // Open cart when adding
  };

  const removeFromCart = (id, variant) => {
    setCart((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      // If variant is provided, match both id and variant, otherwise just id (legacy support)
      if (variant) {
        return current.filter(
          (item) => !(item.id === id && item.variant === variant)
        );
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const updateQuantity = (id, newQuantity, variant) => {
    if (newQuantity < 1) return;
    setCart((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      return current.map((item) => {
        // Match by ID and Variant if possible
        if (item.id === id && (!variant || item.variant === variant)) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart: Array.isArray(cart) ? cart : [], // Always ensure array return
        isCartOpen,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
