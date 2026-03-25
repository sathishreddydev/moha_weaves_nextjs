import { create } from 'zustand';

interface Order {
  id: string;
  userId: string;
  totalAmount: string;
  discountAmount: string;
  finalAmount: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  shippingAddress: string;
  phone: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;
  status: string;
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

interface OrderActions {
  fetchOrders: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  clearError: () => void;
}

type OrderStore = OrderState & OrderActions;

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const result = await response.json();
      
      // Handle different response formats
      const orders = Array.isArray(result) ? result : result.data || [];
      
      set({ 
        orders,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        loading: false 
      });
    }
  },

  getOrderById: (id: string) => {
    const { orders } = get();
    return orders.find(order => order.id === id);
  },

  clearError: () => set({ error: null }),
}));
