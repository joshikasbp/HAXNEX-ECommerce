import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useGetCart, getGetCartQueryKey, useAddToCart, useUpdateCartItem, useRemoveCartItem, useClearCart, Cart, CartItemInput } from "@/lib/api-client";

interface LocalCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
  itemId: string; // pseudo id for local items
}

interface CartContextType {
  cart: Cart;
  addToCart: (item: CartItemInput & { name: string; price: number; image: string }) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [localCart, setLocalCart] = useState<LocalCartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("haxnex_cart");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("haxnex_cart", JSON.stringify(localCart));
  }, [localCart]);

  const { data: serverCart, refetch } = useGetCart({ query: { enabled: !!token, queryKey: getGetCartQueryKey() } });
  const addMutation = useAddToCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();

  const isLogged = !!token;

  const currentCart: Cart = isLogged && serverCart ? serverCart : {
    items: localCart,
    total: localCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  };

  const addToCart = (item: CartItemInput & { name: string; price: number; image: string }) => {
    if (isLogged) {
      addMutation.mutate(
        { data: { productId: item.productId, quantity: item.quantity, size: item.size } },
        { onSuccess: () => refetch() }
      );
    } else {
      setLocalCart(prev => {
        const existing = prev.find(i => i.productId === item.productId && i.size === item.size);
        if (existing) {
          return prev.map(i => i === existing ? { ...i, quantity: i.quantity + item.quantity } : i);
        }
        return [...prev, { ...item, itemId: Math.random().toString(36).substring(7) }];
      });
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (isLogged) {
      updateMutation.mutate(
        { itemId, data: { quantity } },
        { onSuccess: () => refetch() }
      );
    } else {
      setLocalCart(prev => prev.map(i => i.itemId === itemId ? { ...i, quantity } : i));
    }
  };

  const removeFromCart = (itemId: string) => {
    if (isLogged) {
      removeMutation.mutate({ itemId }, { onSuccess: () => refetch() });
    } else {
      setLocalCart(prev => prev.filter(i => i.itemId !== itemId));
    }
  };

  const clearCart = () => {
    if (isLogged) {
      clearMutation.mutate(undefined, { onSuccess: () => refetch() });
    } else {
      setLocalCart([]);
    }
  };

  return (
    <CartContext.Provider value={{ cart: currentCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
