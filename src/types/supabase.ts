export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id: string;
  created_at: string;
  stock?: number;
  unit?: string;
  category?: Category;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: Product;
  created_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product: Product;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  delivery_address_id: string;
  delivery_address?: Address;
  created_at: string;
  items?: OrderItem[];
  payment_status?: 'pending' | 'completed' | 'failed';
  payment_method?: 'cod' | 'online';
}

// Additional helper types
export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type FilterParams = {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type SearchParams = {
  query?: string;
} & PaginationParams & FilterParams;

// Response types
export type ApiResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: ApiError;
};

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  hasMore: boolean;
};