import { create } from 'zustand';
import { UserAddress, InsertUserAddress } from '@/shared';

interface AddressState {
  addresses: UserAddress[];
  loading: boolean;
  error: string | null;
  updating: string | null; // Track which address is being updated
}

interface AddressActions {
  fetchAddresses: () => Promise<void>;
  createAddress: (address: Omit<InsertUserAddress, 'userId'>) => Promise<void>;
  updateAddress: (id: string, data: Partial<InsertUserAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  clearError: () => void;
  getDefaultAddress: () => UserAddress | undefined;
}

type AddressStore = AddressState & AddressActions;

export const useAddressStore = create<AddressStore>((set, get) => ({
  addresses: [],
  loading: false,
  error: null,
  updating: null,

  fetchAddresses: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch('/api/address');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch addresses');
      }
      
      set({ 
        addresses: result.data,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch addresses',
        loading: false 
      });
    }
  },

  createAddress: async (addressData) => {
    try {
      set({ loading: true, error: null });
      
      const response = await fetch('/api/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create address');
      }
      
      set({ 
        addresses: result.data,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create address',
        loading: false 
      });
    }
  },

  updateAddress: async (id, data) => {
    try {
      set({ updating: id, error: null });
      
      const response = await fetch('/api/address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update address');
      }
      
      set({ 
        addresses: result.data,
        updating: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update address',
        updating: null 
      });
    }
  },

  deleteAddress: async (id) => {
    try {
      set({ updating: id, error: null });
      
      const response = await fetch(`/api/address?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete address');
      }
      
      set({ 
        addresses: result.data,
        updating: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete address',
        updating: null 
      });
    }
  },

  setDefaultAddress: async (addressId) => {
    try {
      set({ updating: addressId, error: null });
      
      const response = await fetch('/api/address/default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addressId }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to set default address');
      }
      
      set({ 
        addresses: result.data,
        updating: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set default address',
        updating: null 
      });
    }
  },

  clearError: () => set({ error: null }),

  getDefaultAddress: () => {
    const { addresses } = get();
    return addresses.find(address => address.isDefault);
  },
}));
