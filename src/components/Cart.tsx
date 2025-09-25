import { useEffect, useState } from 'react'
import { cartApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Cart() {
  const [cartItems, setCartItems] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadCartItems()
    }
  }, [user])

  const loadCartItems = async () => {
    try {
      const data = await cartApi.getCartItems()
      setCartItems(data)
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const addToCart = async (productId, quantity) => {
    try {
      await cartApi.addToCart(productId, quantity)
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
              {item.name} - Quantity: {item.quantity}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}