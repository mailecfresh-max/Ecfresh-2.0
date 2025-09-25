export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  created_at: string;
}

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own cart"
  ON cart_items
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders"
  ON orders
  USING (auth.uid() = user_id);