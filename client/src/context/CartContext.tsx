import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartModifier {
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique cart entry id
  menuItemId: string;
  name: string;
  price: number; // unit or portion price
  portionName?: string;
  portionPrice?: number;
  quantity: number;
  modifiers: CartModifier[];
  modifiersCost: number;
  totalPrice: number;
  notes?: string;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  subtotal: 0,
  itemCount: 0,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('customer_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem('customer_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'id' | 'totalPrice'>) => {
    const id = `${newItem.menuItemId}-${newItem.portionName || 'std'}-${JSON.stringify(newItem.modifiers)}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      const unit = newItem.portionPrice !== undefined ? newItem.portionPrice : newItem.price;
      const total = (unit + newItem.modifiersCost) * (existing ? existing.quantity + newItem.quantity : newItem.quantity);

      if (existing) {
        return prev.map((i) =>
          i.id === id
            ? {
                ...i,
                quantity: i.quantity + newItem.quantity,
                totalPrice: total,
                notes: newItem.notes || i.notes,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          ...newItem,
          id,
          totalPrice: (unit + newItem.modifiersCost) * newItem.quantity,
        },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null;
          const unit = i.portionPrice !== undefined ? i.portionPrice : i.price;
          return {
            ...i,
            quantity: newQty,
            totalPrice: (unit + i.modifiersCost) * newQty,
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    sessionStorage.removeItem('customer_cart');
  };

  const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
