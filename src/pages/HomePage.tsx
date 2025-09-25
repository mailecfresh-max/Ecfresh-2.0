import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Sparkles, Apple, Carrot, Coffee, Salad, Beef, Fish, Sandwich, Banana } from 'lucide-react';
import { Link } from 'react-router-dom';
import BannerSlider from '../components/common/BannerSlider';
import LoyaltyProgressBar from '../components/common/LoyaltyProgressBar';
import ProductCard from '../components/common/ProductCard';
import PinCodeSelector from '../components/common/PinCodeSelector';
import { sampleBanners, sampleCategories, sampleProducts } from '../data/sampleData';
import { PinCode } from '../types';
import { useAuth } from '../hooks/useAuth';
import { LOCAL_STORAGE_KEYS, getFromLocalStorage } from '../utils/localStorage';
import { productApi } from '../services/api';

const HomePage: React.FC = () => {
  const [isPinSelectorOpen, setIsPinSelectorOpen] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinCode | null>(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productApi.getProducts();
        setProducts(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load products'));
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const savedPin = getFromLocalStorage<PinCode | null>(LOCAL_STORAGE_KEYS.USER_PIN, null);
    if (savedPin) {
      setSelectedPin(savedPin);
    } else {
      // Show PIN selector if no PIN is selected
      setIsPinSelectorOpen(true);
    }
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productApi.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, []);

  const handlePinSelect = (pinCode: PinCode) => {
    setSelectedPin(pinCode);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PIN, JSON.stringify(pinCode));
  };

  const freshTodayProducts = sampleProducts.slice(0, 12);
  const canUseLoyalty = user && user.loyaltyPoints >= 300;

  if (!selectedPin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ECFresh</h2>
          <p className="text-gray-600 mb-6">Please select your delivery location to continue</p>
          <button
            onClick={() => setIsPinSelectorOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Select Your Area
          </button>
        </div>
        <PinCodeSelector
          isOpen={isPinSelectorOpen}
          onClose={() => setIsPinSelectorOpen(false)}
          onSelect={handlePinSelect}
          selectedPin={selectedPin !== null ? selectedPin.pin : undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="px-4 pt-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <BannerSlider banners={sampleBanners} />
          
          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Fresh to your doorstep in {selectedPin.area}
            </h1>
            <p className="text-gray-600">Ready-to-cook vegetables • Cut fruits • Fresh produce</p>
          </motion.div>
        </div>
      </section>

      {/* Loyalty Progress Bar */}
      {user && (
        <section className="px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <LoyaltyProgressBar
                currentPoints={user.loyaltyPoints}
                unlockThreshold={300}
                canUseLoyalty={canUseLoyalty || false}
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="mb-4">
              <h2 className="text-xl font-medium text-gray-900">Categories</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sampleCategories.slice(0, 8).map((category, index) => {
                // Map category names to appropriate icons
                let CategoryIcon;
                let iconColor;
                
                switch(category.name.toLowerCase()) {
                  case 'fresh fruits':
                  case 'cut fruits':
                    CategoryIcon = Apple;
                    iconColor = 'text-red-500';
                    break;
                  case 'fresh vegetables':
                    CategoryIcon = Carrot;
                    iconColor = 'text-green-500';
                    break;
                  case 'curry cuts':
                    CategoryIcon = Beef;
                    iconColor = 'text-amber-700';
                    break;
                  case 'juice cuts':
                    CategoryIcon = Coffee;
                    iconColor = 'text-orange-500';
                    break;
                  case 'mezhukkupuratti cut':
                  case 'thoran cut':
                    CategoryIcon = Sandwich;
                    iconColor = 'text-green-600';
                    break;
                  case 'peeled items':
                    CategoryIcon = Banana;
                    iconColor = 'text-yellow-500';
                    break;
                  case 'salads':
                    CategoryIcon = Salad;
                    iconColor = 'text-green-400';
                    break;
                  case 'grated items':
                    CategoryIcon = Fish;
                    iconColor = 'text-blue-500';
                    break;
                  default:
                    CategoryIcon = Carrot;
                    iconColor = 'text-green-500';
                }
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <Link
                      to={`/shop?category=${category.id}`}
                      className="group block"
                    >
                      <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-200 hover:scale-105">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 flex items-center justify-center mb-2 rounded-full bg-gray-50 group-hover:bg-green-50 transition-colors">
                            <CategoryIcon className={`w-5 h-5 ${iconColor}`} />
                          </div>
                          <h3 className="text-xs font-medium text-gray-800 text-center group-hover:text-green-600 transition-colors truncate w-full">
                            {category.name}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fresh Today */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900">Fresh Today</h2>
              </div>
              <Link
                to="/shop"
                className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {freshTodayProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-center text-white"
          >
            <h3 className="text-2xl font-bold mb-2">Ready to get fresh?</h3>
            <p className="text-green-100 mb-6">We'll pack it fresh & fast. Choose your date & time.</p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 bg-white text-green-600 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <span>Shop Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <PinCodeSelector
        isOpen={isPinSelectorOpen}
        onClose={() => setIsPinSelectorOpen(false)}
        onSelect={handlePinSelect}
        selectedPin={selectedPin !== null ? selectedPin.pin : undefined}
      />
    </div>
  );
};

export default HomePage;