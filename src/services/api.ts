import { supabase } from '../lib/supabase';
import { cache } from '../utils/cache';
import { queryWithOptions } from '../lib/queryUtils';
import type {
  Product,
  CartItem,
  Order,
  OrderItem,
  Address,
} from '../types/supabase';
import type {
  PaginatedResponse,
  SearchParams,
} from '../types/api';

const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product:${id}`,
  CART: (userId: string) => `cart:${userId}`,
  ORDERS: (userId: string) => `orders:${userId}`,
};

interface ProductQueryOptions {
  category?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export const productApi = {
  async getProducts(options: SearchParams = {}): Promise<PaginatedResponse<Product>> {
    const {
      category,
      query: searchQuery,
      limit = 10,
      page = 1,
      sortBy,
      sortOrder = 'asc'
    } = options;

    const offset = (page - 1) * limit;
    const cacheKey = `products:${JSON.stringify(options)}`;

    return queryWithOptions(
      async () => {
        const query = supabase
          .from('products')
          .select('*, categories(*)', { count: 'exact' });

        if (category) {
          query.eq('category_id', category);
        }

        if (searchQuery) {
          query.ilike('name', `%${searchQuery}%`);
        }

        if (sortBy) {
          query.order(sortBy, { ascending: sortOrder === 'asc' });
        }

        const { data, error, count } = await query
          .limit(limit)
          .range(offset, offset + limit - 1);

        return {
          data: {
            data: data as Product[],
            count: count || 0,
            hasMore: (count || 0) > offset + limit,
            page,
            totalPages: Math.ceil((count || 0) / limit)
          },
          error
        };
      },
      {
        cache: true,
        cacheKey,
        retry: true
      }
    );
  },

  async getProductById(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;

    return queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(*)')
          .eq('id', id)
          .single();

        return { data, error };
      },
      {
        cache: true,
        cacheKey,
        retry: true
      }
    );
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const result = await queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        return { data, error };
      },
      { retry: true }
    );

    // Invalidate related caches
    cache.delete(`product:${id}`);
    cache.delete(`products:`);

    return result;
  }
};

export const cartApi = {
  async getCartItems(userId: string): Promise<CartItem[]> {
    if (!userId) throw new Error('User ID is required');
    
    const cacheKey = `cart:${userId}`;
    
    return queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('cart_items')
          .select('*, product:products(*)')
          .eq('user_id', userId);
          
        return { data, error };
      },
      {
        cache: true,
        cacheKey,
        retry: true
      }
    );
  },

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    if (!userId) throw new Error('User ID is required');
    if (!productId) throw new Error('Product ID is required');
    if (quantity < 1) throw new Error('Quantity must be positive');

    const result = await queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('cart_items')
          .upsert({
            user_id: userId,
            product_id: productId,
            quantity,
            created_at: new Date().toISOString(),
          })
          .select('*, product:products(*)')
          .single();

        return { data, error };
      },
      { retry: true }
    );

    // Invalidate cart cache
    cache.delete(`cart:${userId}`);
    
    return result;
  },

  async updateCartItem(
    userId: string, 
    productId: string, 
    quantity: number
  ): Promise<CartItem> {
    if (!userId) throw new Error('User ID is required');
    if (!productId) throw new Error('Product ID is required');
    if (quantity < 0) throw new Error('Quantity cannot be negative');

    const result = await queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', userId)
          .eq('product_id', productId)
          .select('*, product:products(*)')
          .single();

        return { data, error };
      },
      { retry: true }
    );

    // Invalidate cart cache
    cache.delete(`cart:${userId}`);
    
    return result;
  },

  async removeFromCart(userId: string, productId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required');
    if (!productId) throw new Error('Product ID is required');

    await queryWithOptions(
      async () => {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);

        return { data: null, error };
      },
      { retry: true }
    );

    // Invalidate cart cache
    cache.delete(`cart:${userId}`);
  }
};

export const orderApi = {
  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    const result = await queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('orders')
          .insert([order])
          .select()
          .single();

        return { data, error };
      },
      { retry: true }
    );

    // Invalidate orders cache
    cache.delete(`orders:${order.user_id}`);
    
    return result;
  },

  async getOrders(userId: string): Promise<Order[]> {
    if (!userId) throw new Error('User ID is required');
    
    const cacheKey = `orders:${userId}`;
    
    return queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            delivery_address:addresses(*),
            items:order_items(
              *,
              product:products(*)
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        return { data, error };
      },
      {
        cache: true,
        cacheKey,
        retry: true
      }
    );
  },

  async getOrderById(orderId: string): Promise<Order> {
    if (!orderId) throw new Error('Order ID is required');
    
    const cacheKey = `order:${orderId}`;
    
    return queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            delivery_address:addresses(*),
            items:order_items(
              *,
              product:products(*)
            )
          `)
          .eq('id', orderId)
          .single();

        return { data, error };
      },
      {
        cache: true,
        cacheKey,
        retry: true
      }
    );
  },

  async updateOrderStatus(
    orderId: string, 
    status: Order['status']
  ): Promise<Order> {
    if (!orderId) throw new Error('Order ID is required');
    
    const result = await queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId)
          .select()
          .single();

        return { data, error };
      },
      { retry: true }
    );

    // Invalidate order caches
    cache.delete(`order:${orderId}`);
    // We don't know the user ID here, so we can't invalidate the user's orders cache
    // A more sophisticated caching strategy might be needed
    
    return result;
  }
};

export const addressApi = {
  async getAddresses(userId: string): Promise<Address[]> {
    if (!userId) throw new Error('User ID is required');
    
    const cacheKey = `addresses:${userId}`;
    
    return queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });

        return { data, error };
      },
      {
        cache: true,
        cacheKey,
        retry: true
      }
    );
  },

  async addAddress(address: Omit<Address, 'id' | 'created_at'>): Promise<Address> {
    if (!address.user_id) throw new Error('User ID is required');
    
    const result = await queryWithOptions(
      async () => {
        // If this is marked as default, unset other default addresses
        if (address.is_default) {
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', address.user_id);
        }

        const { data, error } = await supabase
          .from('addresses')
          .insert([{
            ...address,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        return { data, error };
      },
      { retry: true }
    );

    // Invalidate addresses cache
    cache.delete(`addresses:${address.user_id}`);
    
    return result;
  },

  async updateAddress(id: string, updates: Partial<Address>): Promise<Address> {
    if (!id) throw new Error('Address ID is required');
    
    const result = await queryWithOptions(
      async () => {
        // If setting as default, unset other default addresses
        if (updates.is_default) {
          const { data: existingAddress } = await supabase
            .from('addresses')
            .select('user_id')
            .eq('id', id)
            .single();

          if (existingAddress) {
            await supabase
              .from('addresses')
              .update({ is_default: false })
              .eq('user_id', existingAddress.user_id)
              .neq('id', id);
          }
        }

        const { data, error } = await supabase
          .from('addresses')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        return { data, error };
      },
      { retry: true }
    );

    // We'll need to fetch the address first to get the user_id for cache invalidation
    const address = await this.getAddressById(id);
    if (address) {
      cache.delete(`addresses:${address.user_id}`);
    }
    
    return result;
  },

  async deleteAddress(id: string): Promise<void> {
    if (!id) throw new Error('Address ID is required');

    // Get the address first for cache invalidation
    const address = await this.getAddressById(id);
    
    await queryWithOptions(
      async () => {
        const { error } = await supabase
          .from('addresses')
          .delete()
          .eq('id', id);

        return { data: null, error };
      },
      { retry: true }
    );

    // Invalidate addresses cache
    if (address) {
      cache.delete(`addresses:${address.user_id}`);
    }
  },

  async getAddressById(id: string): Promise<Address | null> {
    if (!id) throw new Error('Address ID is required');
    
    return queryWithOptions(
      async () => {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', id)
          .single();

        return { data, error };
      },
      { retry: true }
    );
  }
};