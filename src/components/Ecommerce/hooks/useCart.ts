import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  stock: number;
}

export function useCart() {
  const { companyCode } = useParams<{ companyCode: string }>();
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Company-specific cart storage key
  const CART_STORAGE_KEY = `ecommerce-cart-${companyCode}`;

  // Load cart from localStorage on mount
  useEffect(() => {
    if (companyCode) {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        } catch (error) {
          console.error("Error parsing cart from localStorage:", error);
        }
      }
    }
  }, [companyCode, CART_STORAGE_KEY]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (companyCode) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, companyCode, CART_STORAGE_KEY]);

  const addItem = (product: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product_id === product.product_id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error(`Estoque insuficiente para ${product.product_name}`);
          return currentItems;
        }
        
        toast.success(`Quantidade atualizada no carrinho`);
        return currentItems.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (quantity > product.stock) {
          toast.error(`Estoque insuficiente para ${product.product_name}`);
          return currentItems;
        }
        
        toast.success(`${product.product_name} adicionado ao carrinho`);
        return [...currentItems, { ...product, quantity }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => {
      const item = currentItems.find(item => item.product_id === productId);
      if (item) {
        toast.success(`${item.product_name} removido do carrinho`);
      }
      return currentItems.filter(item => item.product_id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item => {
        if (item.product_id === productId) {
          if (quantity > item.stock) {
            toast.error(`Estoque insuficiente para ${item.product_name}`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    toast.success("Carrinho limpo");
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  const getItemQuantity = (productId: string) => {
    const item = items.find(item => item.product_id === productId);
    return item?.quantity || 0;
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getItemQuantity,
  };
}