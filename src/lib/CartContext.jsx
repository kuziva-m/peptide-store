import { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  // 1. SAFER INITIALIZATION
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);

      const cleanCart = Array.isArray(parsed)
        ? parsed.map((item) => {
            let cleanVariant = item.variant;
            if (typeof item.variant === "object" && item.variant !== null) {
              cleanVariant =
                item.variant.size_label || item.variant.name || "Standard";
            }
            return {
              ...item,
              variant: cleanVariant || "Standard",
            };
          })
        : [];
      return cleanCart;
    } catch (error) {
      console.error("Cart corrupted, resetting:", error);
      localStorage.removeItem("cart");
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // NEW: Notification State for Toasts
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // Helper to show notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product, quantity = 1, variantLabel = "Standard") => {
    setCart((prevCart) => {
      const safeVariant =
        typeof variantLabel === "object"
          ? variantLabel.size_label || "Standard"
          : variantLabel;

      const existingItemIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.variant === safeVariant
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            ...product,
            quantity,
            variant: safeVariant,
          },
        ];
      }
    });

    // Trigger the notification
    showNotification(`${quantity} x ${product.name} added to cart`);
    setIsCartOpen(true);
  };

  const removeFromCart = (id, variant) => {
    setCart((prev) =>
      prev.filter((item) => !(item.id === id && item.variant === variant))
    );
  };

  const updateQuantity = (id, newQuantity, variant) => {
    if (newQuantity < 1) return;
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id && item.variant === variant) {
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
        cart,
        isCartOpen,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        notification, // Exporting this so Toast.jsx can read it
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
