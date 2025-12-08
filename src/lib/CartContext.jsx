import { createContext, useState, useContext } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // NEW: State for the popup notification
  const [notification, setNotification] = useState(null);

  const addToCart = (product, variant) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === product.id && item.variantId === variant.id
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        return [
          ...prevItems,
          {
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            size: variant.size_label,
            price: variant.price,
            quantity: 1,
          },
        ];
      }
    });

    // NEW: Show toast instead of alert
    setNotification(`Added ${product.name} (${variant.size_label}) to cart`);

    // Hide it automatically after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, cartCount, notification }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
