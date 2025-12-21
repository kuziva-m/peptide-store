import { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  // 1. SAFER INITIALIZATION (The Sanitizer)
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("cart");
      if (!saved) return [];

      const parsed = JSON.parse(saved);

      // SANITIZE: Loop through saved items and fix "Object" variants
      // This automatically repairs the "poisoned" data causing your crash
      const cleanCart = Array.isArray(parsed)
        ? parsed.map((item) => {
            let cleanVariant = item.variant;

            // If variant is an object (the bug), extract the label
            if (typeof item.variant === "object" && item.variant !== null) {
              cleanVariant =
                item.variant.size_label || item.variant.name || "Standard";
            }

            return {
              ...item,
              variant: cleanVariant || "Standard", // Ensure it's always a string
            };
          })
        : [];

      return cleanCart;
    } catch (error) {
      console.error("Cart corrupted, resetting:", error);
      // If data is totally broken, wipe it to save the app
      localStorage.removeItem("cart");
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // 2. Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // 3. Totals
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addToCart = (product, quantity = 1, variantLabel = "Standard") => {
    setCart((prevCart) => {
      // Ensure we are working with a clean string for the variant
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
            variant: safeVariant, // Storing strict string
          },
        ];
      }
    });
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
