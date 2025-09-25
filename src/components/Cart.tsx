import { useEffect, useState } from 'react'
import { cartApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { CartItem } from '../types/supabase'

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      loadCartItems()
    }
  }, [user])

  const loadCartItems = async () => {
    try {
      if (!user?.id) return
      const data = await cartApi.getCartItems(user.id)
      setCartItems(data)
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const addToCart = async (productId: string, quantity: number) => {
    try {
      if (!user?.id) return
      await cartApi.addToCart(user.id, productId, quantity)
      await loadCartItems()
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  return (
    <div>
      <h1>Your Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {cartItems.map(item => (
            <li key={item.id}>
              {item.product.name} - Quantity: {item.quantity}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}