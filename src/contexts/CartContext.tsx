'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

interface CartItem {
  id: number;
  game_id: number;
  price: string;
  game: any;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  count: number;
  isLoading: boolean;
  addToCart: (gameId: number) => Promise<void>;
  removeFromCart: (gameId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (paymentMethod: string) => Promise<any>;
  refetch: () => Promise<void>;
  isInCart: (gameId: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setTotal(0);
      return;
    }
    try {
      const { data } = await api.get('/cart');
      setItems(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (gameId: number) => {
    setIsLoading(true);
    try {
      await api.post('/cart', { game_id: gameId });
      await fetchCart();
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (gameId: number) => {
    setIsLoading(true);
    try {
      await api.delete(`/cart/${gameId}`);
      await fetchCart();
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      await api.delete('/cart');
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (paymentMethod: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/cart/checkout', { payment_method: paymentMethod });
      setItems([]);
      setTotal(0);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const isInCart = (gameId: number) => items.some(item => item.game_id === gameId);

  return (
    <CartContext.Provider value={{
      items,
      total,
      count: items.length,
      isLoading,
      addToCart,
      removeFromCart,
      clearCart,
      checkout,
      refetch: fetchCart,
      isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
