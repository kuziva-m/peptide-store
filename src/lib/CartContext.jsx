import { createContext, useState, useContext } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, variant) => {
    setCartItems((prevItems) => {
      // Check if this specific item+variant is already in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === product.id && item.variantId === variant.id
      );

      if (existingItemIndex > -1) {
        // Item exists, increase quantity by 1 (simple version for now)
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        // Add new item
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

    // Optional visual feedback
    alert(`Added ${product.name} (${variant.size_label}) to cart`);
  };

  // Calculate total number of items
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
