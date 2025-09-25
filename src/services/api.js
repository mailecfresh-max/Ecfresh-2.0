import { supabase } from '../lib/supabase'

export const productApi = {
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
    if (error) throw error
    return data
  },

  async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }
}

export const cartApi = {
  async getCartItems() {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, products(*)')
    if (error) throw error
    return data
  },

  async addToCart(productId, quantity) {
    const { data, error } = await supabase
      .from('cart_items')
      .upsert({
        product_id: productId,
        quantity,
        user_id: supabase.auth.user()?.id
      })
    if (error) throw error
    return data
  },

  async removeFromCart(productId) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('product_id', productId)
      .eq('user_id', supabase.auth.user()?.id)
    if (error) throw error
  }
}

export const orderApi = {
  async createOrder(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        ...orderData,
        user_id: supabase.auth.user()?.id
      }])
    if (error) throw error
    return data
  },

  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
    if (error) throw error
    return data
  }
}