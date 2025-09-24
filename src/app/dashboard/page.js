'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiUser, FiShoppingBag, FiTrendingUp, FiLogOut, FiPackage, FiHome, FiUsers, FiCreditCard } from 'react-icons/fi';
import { IoStatsChart } from 'react-icons/io5';
import { BsGraphUp } from 'react-icons/bs';
import { MdOutlineShoppingCart, MdOutlineLeaderboard } from 'react-icons/md';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rankUpgradeLoading, setRankUpgradeLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cart, setCart] = useState([]);
  const [showProducts, setShowProducts] = useState(false);
  const [teamStats, setTeamStats] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderAddress, setOrderAddress] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('packages');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [userIncentives, setUserIncentives] = useState([]);
  const [incentiveLoading, setIncentiveLoading] = useState(false);
  // Updated products with new information and images
  const [products] = useState([
    {
      _id: 'product1',
      name: 'Whitening Cream',
      description: 'Give your skin a natural glow with our premium whitening cream.',
      price: 4500,
      image: '/products/product1.webp',
      benefits: [
        'Give your skin a natural Glow',
        'Fair Color',
        'Reduces Acne',
        'Minimizes Wrinkles',
        'Removes Freckles',
        'Remove Dark circles'
      ]
    },
    {
      _id: 'product2',
      name: 'Creamy Face Wash',
      description: 'Gentle face wash that smoothes and repairs your skin.',
      price: 3500,
      image: '/products/product2.webp',
      benefits: [
        'Smoothes & repair the skin',
        'Lighten skin',
        'Brighten the skin',
        'Prevent skin aging',
        'Improve the skin texture'
      ]
    },
    {
      _id: 'product3',
      name: 'Hair Fall Shampoo',
      description: 'Professional hair care shampoo for healthy, strong hair.',
      price: 4500,
      image: '/products/product3.webp',
      benefits: [
        'For Hair Growth',
        'For silky hair',
        'For healthy Hair',
        'Anti Hair fall',
        'Anti Hair loss',
        'Strength weak Hair',
        'Repair damage Hair'
      ]
    },
    {
      _id: 'product4',
      name: 'Creamy Sunblock',
      description: 'Protective sunblock that soothes and repairs your skin.',
      price: 3500,
      image: '/products/product4.webp',
      benefits: [
        'Soothes & Repairs the skin',
        'Lighten skin',
        'Brighten the skin',
        'Prevent skin aging',
        'Improve the skin texture'
      ]
    },
    {
      _id: 'product5',
      name: 'Anti Acne Face Wash',
      description: 'Specialized face wash for acne-prone skin.',
      price: 4000,
      image: '/products/product5.webp',
      benefits: [
        'Soothes & Repairs the skin',
        'Lighten skin',
        'Brighten the skin',
        'Prevent skin aging',
        'Improve the skin texture'
      ]
    },
    {
      _id: 'product6',
      name: 'Vitamin C Serum',
      description: 'Powerful vitamin C serum for instant skin brightening.',
      price: 4000,
      image: '/products/product6.webp',
      benefits: [
        'Skin Instant Bright',
        'Reduce pigmentation',
        'Anti aging brighten',
        'Improve skin Elasticity',
        'Reduces acne',
        'Minimizes wrinkles',
        'Removes Freckles',
        'Remove Dark circles'
      ]
    },
    {
      _id: 'product7',
      name: 'Anti Acne Serum',
      description: 'Advanced serum that tightens skin and reduces acne.',
      price: 4500,
      image: '/products/product7.webp',
      benefits: [
        'Tightens Skin',
        'Remove Dark circles',
        'Reduces wrinkles',
        'Treats acne',
        'Removes freckles',
        'Minimize the appearance of enlarged pores & improve skin'
      ]
    },
    {
      _id: 'product8',
      name: 'Herbal Hair Shampoo',
      description: 'Natural herbal shampoo for comprehensive hair care.',
      price: 4000,
      image: '/products/product8.webp',
      benefits: [
        'For Hair Growth',
        'For silky hair',
        'For healthy Hair',
        'Anti Hair fall',
        'Anti Hair loss',
        'Strength weak Hair',
        'Repair damage Hair'
      ]
    },
    {
      _id: 'product9',
      name: 'Skin Polish',
      description: 'Gentle skin polish for a smoother, glowing complexion.',
      price: 4500,
      image: '/products/product9.webp',
      benefits: [
        'Gently removes dead skin cells',
        'Tighten large open pores',
        'Enhances skin tone & texture',
        'Control excess oil & give shine',
        'Brighten dull, tired skin',
        'Prepares skin for better absorption of skincare',
        'Promotes a smoother, glowing complexion'
      ]
    }
  ]);
  const [orders, setOrders] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.isAdmin) {
      router.push('/admin');
      return;
    }

    // Make sure we preserve the hasPendingPackage flag from localStorage
    setUser(parsedUser);
    fetchUserProfile(); // Fetch latest user data
    fetchOrders();
    fetchTeamStats();
    fetchPayouts();
    fetchUserIncentives();
    
    // Set up polling for real-time updates
    const pollingInterval = setInterval(() => {
      fetchUserProfile();
      fetchPayouts();
      fetchUserIncentives();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(pollingInterval); // Clean up on unmount
  }, [router]);
  
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const hasPendingPackageFlag = currentUser.hasPendingPackage;
      
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // If user has a package now, they don't have a pending package anymore
        if (data.user.packagePurchased) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // Use the server's hasPendingPackage truth. If previously pending and now cleared without purchase, show rejection message.
          const serverPending = !!data.user.hasPendingPackage;
          const previouslyPending = !!hasPendingPackageFlag;
          if (previouslyPending && !serverPending) {
            setMessage('Your package request was rejected by admin. You can purchase again.');
          }

          const updatedUser = {
            ...data.user,
            hasPendingPackage: serverPending
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      // Prevent dev overlay by logging as a warning instead of an error
      console.warn('Error fetching user profile:', error);
    }
  };

  // Products are now hardcoded above

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchTeamStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/team-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamStats(data);
        
        // Auto-check for rank upgrade if user is Assistant and has S.Managers in team
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.rank === 'Assistant' && data.sManagerCount > 0) {
          // Automatically trigger rank upgrade
          handleRankUpgrade();
        }
      }
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/payouts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched payouts:', data);
        setPayouts(data.payouts || []);
      } else {
        console.error('Failed to fetch payouts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const fetchUserIncentives = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/incentives/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserIncentives(data.incentives || []);
      }
    } catch (error) {
      console.error('Error fetching user incentives:', error);
    }
  };

  const handlePackagePurchase = async (packageAmount) => {
    // Check if user already has a package or a pending package request
    if (user.packagePurchased) {
      setMessage('You have already purchased a package and cannot purchase another one.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packageAmount })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Package purchase request submitted for admin approval!');
        // Update local user state to reflect pending package
        const updatedUser = { ...user, hasPendingPackage: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        setMessage(data.error || 'Failed to purchase package');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleIncentiveApplication = async (incentiveType) => {
    setIncentiveLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/incentives/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ incentiveType })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`${incentiveType} application submitted successfully!`);
        fetchUserIncentives(); // Refresh incentives
      } else {
        setMessage(data.error || 'Failed to submit application');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIncentiveLoading(false);
    }
  };

  const handleRankUpgrade = async (silent = false) => {
    setRankUpgradeLoading(true);
    if (!silent) setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/rank/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Pending rank approval flow
        if (data.pending) {
          if (!silent) setMessage('Rank approval requested. Waiting for admin approval.');
          const updatedUser = { ...user, pendingRank: data.targetRank, hasPendingRank: true };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          // No immediate refresh needed, but fetch profile to sync
          fetchUserProfile();
          return true;
        }

        if (!silent) setMessage(`Congratulations! ${data.message}`);
        // Update user data (immediate upgrade case)
        const updatedUser = { ...user, rank: data.newRank, pendingRank: null, hasPendingRank: false };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Refresh team stats and user profile
        fetchTeamStats();
        fetchUserProfile();
        return true;
      } else {
        if (!silent) setMessage(data.error || 'Failed to upgrade rank');
        return false;
      }
    } catch (error) {
      if (!silent) setMessage('Network error. Please try again.');
      return false;
    } finally {
      setRankUpgradeLoading(false);
    }
  };

  const addToCart = (product) => {
    // Get current cart total
    const currentCartTotal = getCartTotal();
    const availableAmount = getAvailableAmount();
    
    // Calculate what the total would be after adding this product
    const newTotal = currentCartTotal + product.price;
    
    // Check if adding this product would exceed the available amount
    if (newTotal > availableAmount) {
      setMessage(`Cannot add product. Total would exceed your available balance of ₨${availableAmount.toLocaleString()}.`);
      return;
    }
    
    // Check if product already exists in cart
    const existingProduct = cart.find(item => item._id === product._id);
    
    if (existingProduct) {
      // Update quantity if product already exists
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new product to cart
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // Show remaining amount needed to reach exact balance
    const remainingNeeded = availableAmount - newTotal;
    if (remainingNeeded > 0) {
      setMessage(`${product.name} added to cart. You need to add ₨${remainingNeeded.toLocaleString()} more to match your available balance.`);
    } else if (remainingNeeded === 0) {
      setMessage(`${product.name} added to cart. Your cart total now exactly matches your available balance!`);
    } else {
      setMessage(`${product.name} added to cart. Cart total: ₨${newTotal.toLocaleString()}`);
    }
    
    setTimeout(() => setMessage(''), 3000);
  };
  
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };
  
  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Find the product
    const product = cart.find(item => item._id === productId);
    if (!product) return;
    
    // Calculate what the total would be after updating quantity
    const currentTotal = getCartTotal();
    const availableAmount = getAvailableAmount();
    const productCurrentTotal = product.price * product.quantity;
    const productNewTotal = product.price * quantity;
    const newTotal = currentTotal - productCurrentTotal + productNewTotal;
    
    // Check if updating this product would exceed the available amount
    if (newTotal > availableAmount) {
      setMessage(`Cannot update quantity. Total would exceed your available balance of ₨${availableAmount.toLocaleString()}.`);
      return;
    }
    
    setCart(cart.map(item => 
      item._id === productId 
        ? { ...item, quantity } 
        : item
    ));
  };
  
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const handleCheckout = () => {
    // Check if user has exact balance amount
    const availableAmount = getAvailableAmount();
    const cartTotal = getCartTotal();
    
    if (availableAmount !== cartTotal) {
      if (availableAmount < cartTotal) {
        setMessage(`Insufficient balance. You need ₨${cartTotal.toLocaleString()} to purchase these products.`);
      } else {
        setMessage(`Your order total must be exactly ₨${availableAmount.toLocaleString()}. Current total: ₨${cartTotal.toLocaleString()}`);
      }
      return;
    }
    
    if (cart.length === 0) {
      setMessage('Your cart is empty. Please add products to your cart.');
      return;
    }
    
    // Show order modal for checkout
    setShowOrderModal(true);
  };
  
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      // If checkout from cart
      if (cart.length > 0) {
        // Format cart items as products array
        const products = cart.map(item => ({
          id: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        }));
        
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            products: products,
            totalAmount: getCartTotal(),
            orderDetails: {
              address: orderAddress,
              phone: user.phone
            }
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setMessage('Order placed successfully! Waiting for admin approval.');
          setShowOrderModal(false);
          setCart([]);
          setShowCart(false);
          setOrderAddress('');
          fetchOrders(); // Refresh orders list
          fetchUserProfile(); // Refresh user data to update balance
        } else {
          setMessage(data.error || data.details || 'Failed to place order');
        }
      } 
      // If single product order
      else if (selectedProduct) {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            products: [{
              id: selectedProduct._id,
              name: selectedProduct.name,
              price: selectedProduct.price,
              quantity: 1
            }],
            totalAmount: selectedProduct.price,
            orderDetails: {
              address: orderAddress,
              phone: user.phone
            }
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setMessage('Order placed successfully! Waiting for admin approval.');
          setShowOrderModal(false);
          setSelectedProduct(null);
          setOrderAddress('');
          fetchOrders(); // Refresh orders list
          fetchUserProfile(); // Refresh user data to update balance
        } else {
          setMessage(data.error || data.details || 'Failed to place order');
        }
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getAvailableAmount = () => {
    if (!user?.packagePurchased) return 0;
    const deliveryFees = { 20000: 1000, 50000: 1500, 100000: 2000 };
    // If packagePurchased is not a valid value in the deliveryFees object, or calculation results in NaN, return 0
    if (!deliveryFees[user.packagePurchased] || isNaN(user.packagePurchased)) return 0;
    const amount = user.packagePurchased - deliveryFees[user.packagePurchased];
    return amount > 0 ? amount : 0; // Ensure we never return negative values
  };

  const getNextRank = (currentRank) => {
    const rankOrder = ['No Package', 'Assistant', 'Manager', 'S.Manager', 'D.Manager', 'G.Manager', 'Director'];
    const currentIndex = rankOrder.indexOf(currentRank || 'No Package');
    return currentIndex < rankOrder.length - 1 ? rankOrder[currentIndex + 1] : 'Director';
  };

  const getRankProgress = (user) => {
    if (!user.rank) return 0;
    
    // Define rank requirements (DIRECT REFERRALS ONLY)
    const requirements = {
      'Assistant': { referralValue: 50000 }, // To Manager
      'Manager': { referralValue: 100000 }, // To S.Manager
      'S.Manager': { teamCount: 5, teamRank: 'S.Manager' }, // To D.Manager: 5 DIRECT S.Managers
      'D.Manager': { teamCount: 5, teamRank: 'D.Manager' }, // To G.Manager: 5 DIRECT D.Managers
      'G.Manager': { teamCount: 4, teamRank: 'G.Manager' } // To Director: 4 DIRECT G.Managers
    };
    
    if (user.rank === 'Director') return 100;
    
    const req = requirements[user.rank];
    if (!req) return 0;
    
    // Calculate progress based on referral value (for Assistant/Manager) or direct team count (for higher ranks)
    let valueProgress = 0;
    if (req.referralValue) {
      // Use totalReferralValue instead of referralValue
      valueProgress = Math.min(100, ((user.totalReferralValue || 0) / req.referralValue) * 100);
    }
    
    // If this rank requires direct team members
    if (req.teamCount && teamStats) {
      const directTeamCount = user.rank === 'S.Manager' 
        ? (teamStats.directSManagerCount || 0)  // Direct S.Managers only
        : user.rank === 'D.Manager'
          ? (teamStats.directDManagerCount || 0)  // Direct D.Managers only
          : (teamStats.directGManagerCount || 0); // Direct G.Managers only
      
      const teamProgress = Math.min(100, (directTeamCount / req.teamCount) * 100);
      return Math.floor(teamProgress);
    }
    
    return Math.floor(valueProgress);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 pb-20 md:pb-0">
      {/* Shopping Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Your Shopping Cart</h3>
              <button 
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
                  <MdOutlineShoppingCart size={32} />
                </div>
                <p className="text-gray-700 mb-4">Your cart is empty</p>
                <button
                  onClick={() => setShowCart(false)}
                  className="px-6 py-2 bg-purple-100 text-purple-600 rounded-full font-medium hover:bg-purple-200 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto mb-4">
                  {cart.map(item => (
                    <div key={item._id} className="flex items-center border-b py-4">
                      <div className="w-16 h-16 bg-purple-50 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                        <Image 
                          src={item.image} 
                          alt={item.name} 
                          width={64} 
                          height={64} 
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-purple-600 font-bold">₨{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                        >
                          -
                        </button>
                        <span className="mx-2 w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item._id)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-purple-600">₨{getCartTotal().toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setShowCart(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={handleCheckout}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:opacity-90"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Order Details</h3>
              <button 
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-lg font-bold">Order #{selectedOrder._id.substring(selectedOrder._id.length - 6)}</h4>
                  <p className="text-sm text-gray-600">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedOrder.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedOrder.status === 'dispatched' ? 'bg-green-100 text-green-800' :
                  selectedOrder.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedOrder.status === 'pending' ? 'PENDING APPROVAL' :
                   selectedOrder.status === 'approved' ? 'PROCESSING' :
                   selectedOrder.status === 'dispatched' ? 'DISPATCHED' :
                   selectedOrder.status === 'rejected' ? 'REJECTED' : selectedOrder.status.toUpperCase()}
                </span>
              </div>
              
              {/* Order Timeline */}
              {selectedOrder.status !== 'rejected' && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium mb-3">Order Status</h5>
                  <div className="flex justify-between items-center">
                    <div className={`flex flex-col items-center ${selectedOrder.status !== 'pending' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-4 h-4 rounded-full ${selectedOrder.status !== 'pending' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                      <span className="text-xs mt-1">Ordered</span>
                    </div>
                    <div className="flex-1 h-1 mx-2 bg-gray-200">
                      <div className={`h-full ${selectedOrder.status !== 'pending' ? 'bg-green-500' : 'bg-gray-200'}`} style={{width: '100%'}}></div>
                    </div>
                    <div className={`flex flex-col items-center ${selectedOrder.status === 'approved' || selectedOrder.status === 'dispatched' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-4 h-4 rounded-full ${selectedOrder.status === 'approved' || selectedOrder.status === 'dispatched' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                      <span className="text-xs mt-1">Approved</span>
                    </div>
                    <div className="flex-1 h-1 mx-2 bg-gray-200">
                      <div className={`h-full ${selectedOrder.status === 'dispatched' ? 'bg-green-500' : 'bg-gray-200'}`} style={{width: '100%'}}></div>
                    </div>
                    <div className={`flex flex-col items-center ${selectedOrder.status === 'dispatched' ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-4 h-4 rounded-full ${selectedOrder.status === 'dispatched' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                      <span className="text-xs mt-1">Dispatched</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Order Information</h5>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Total Amount:</span> ₨{selectedOrder.totalAmount.toLocaleString()}</p>
                    <p><span className="font-medium">Payment Status:</span> {selectedOrder.status === 'rejected' ? 'Refunded' : 'Paid'}</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium mb-2">Delivery Information</h5>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {user.username}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.orderDetails?.phone || user.phone}</p>
                    <p><span className="font-medium">Address:</span> {selectedOrder.orderDetails?.address}</p>
                  </div>
                </div>
              </div>
              
              {/* Product List */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder.products && selectedOrder.products.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-right">₨{product.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right">{product.quantity || 1}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">₨{((product.price || 0) * (product.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan="3" className="px-4 py-3 text-sm font-medium text-right">Total:</td>
                      <td className="px-4 py-3 text-sm font-bold text-right">₨{selectedOrder.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowOrderDetails(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Confirmation Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Confirm Your Order</h3>
            
            {/* If checkout from cart */}
            {cart.length > 0 ? (
              <div className="mb-4">
                <div className="bg-purple-50 p-3 rounded-lg mb-3">
                  <h4 className="font-medium text-purple-800 mb-2">Order Summary</h4>
                  <div className="max-h-40 overflow-y-auto mb-2">
                    {cart.map(item => (
                      <div key={item._id} className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded overflow-hidden mr-2">
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              width={32} 
                              height={32} 
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <span className="text-sm">{item.name} x{item.quantity}</span>
                        </div>
                        <span className="text-sm font-medium">₨{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-purple-600">₨{getCartTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : selectedProduct && (
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-lg overflow-hidden mr-4">
                  <Image 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    width={64} 
                    height={64} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-lg font-bold text-purple-600">₨{selectedProduct.price.toLocaleString()}</p>
                </div>
              </div>
            )}
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Order Details:</p>
              <p className="text-sm">Name: {user.username}</p>
              <p className="text-sm">Phone: {user.phone}</p>
              <p className="text-sm">Available Balance: ₨{getAvailableAmount().toLocaleString()}</p>
            </div>
            
            <form onSubmit={handleOrderSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your full delivery address"
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedProduct(null);
                    setOrderAddress('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image 
                src="/glow-network-logo.png" 
                alt="Glow Network"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="ml-3 text-xl font-bold text-black">Glow Network</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Hello, {user.username}</span>
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-purple-100 text-purple-600 p-2 rounded-full hover:bg-purple-200 transition-colors"
              >
                <MdOutlineShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') || message.includes('Congratulations')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex w-full">
            <button 
              onClick={() => setActiveTab('packages')} 
              className={`flex items-center justify-center py-4 px-6 flex-1 font-medium relative ${activeTab === 'packages' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
            >
              <FiPackage size={18} className="mr-2" />
              Packages
              {activeTab === 'packages' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('shop')} 
              className={`flex items-center justify-center py-4 px-6 flex-1 font-medium relative ${activeTab === 'shop' ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}
            >
              <MdOutlineShoppingCart size={18} className="mr-2" />
              Shop
              {activeTab === 'shop' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`flex items-center justify-center py-4 px-6 flex-1 font-medium relative ${activeTab === 'orders' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
            >
              <FiCreditCard size={18} className="mr-2" />
              Orders
              {activeTab === 'orders' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('rank')} 
              className={`flex items-center justify-center py-4 px-6 flex-1 font-medium relative ${activeTab === 'rank' ? 'text-green-600' : 'text-gray-700 hover:text-green-600'}`}
            >
              <MdOutlineLeaderboard size={18} className="mr-2" />
              My Team
              {activeTab === 'rank' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('payouts')} 
              className={`flex items-center justify-center py-4 px-6 flex-1 font-medium relative ${activeTab === 'payouts' ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'}`}
            >
              <FiTrendingUp size={18} className="mr-2" />
              Payouts
              {activeTab === 'payouts' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></span>
              )}
            </button>
          </div>
        </div>
        
        {/* User Profile Summary */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <FiUser size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user.username}</h2>
                  <p className="text-blue-100">Referral: {user.referralCode}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Current Rank</span>
                <span className="font-semibold text-blue-600">{user.rank || 'No Plan'}</span>
              </div>
              {user.hasPendingRank && user.pendingRank && (
                <div className="mt-2 p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                  Rank upgrade to {user.pendingRank} is pending admin approval.
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Investment Plan</span>
                <span className="font-semibold text-blue-600">
                  {user.packagePurchased ? `₨${getAvailableAmount().toLocaleString()} (${user.rank})` : 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Referral Value</span>
                <span className="font-semibold text-blue-600">₨{(user.totalReferralValue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Referral Link</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-blue-600">
                    {typeof window !== 'undefined' ? `${window.location.origin}?ref=${user.referralCode}` : `localhost:3000?ref=${user.referralCode}`}
                  </span>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}?ref=${user.referralCode}`;
                      navigator.clipboard.writeText(link);
                      setMessage('Referral link copied to clipboard!');
                      setTimeout(() => setMessage(''), 3000);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Copy referral link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              {teamStats && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Team Members</span>
                  <span className="font-semibold text-blue-600">{teamStats.totalTeamMembers || 0}</span>
                </div>
              )}
              {teamStats && user.rank === 'S.Manager' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">S.Managers in Team</span>
                  <span className="font-semibold text-blue-600">{teamStats.sManagerCount || 0}/5</span>
                </div>
              )}
              {teamStats && user.rank === 'D.Manager' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">D.Managers in Team</span>
                  <span className="font-semibold text-blue-600">{teamStats.dManagerCount || 0}/5</span>
                </div>
              )}
              {teamStats && user.rank === 'G.Manager' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">G.Managers in Team</span>
                  <span className="font-semibold text-blue-600">{teamStats.gManagerCount || 0}/4</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Rank Progress */}
          <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BsGraphUp className="mr-2 text-blue-600" /> Rank Progress
            </h3>
            <div className="space-y-4">
              {/* Rank Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>{user.rank || 'No Package'}</span>
                  <span>{getNextRank(user.rank)}</span>
                </div>
                <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-800" 
                    style={{ width: `${getRankProgress(user)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-700 mt-1 text-right">{getRankProgress(user)}% Complete</div>
              </div>
              
              {/* Team Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="text-blue-500 mb-1">Direct Referrals</div>
                  <div className="text-2xl font-bold">{teamStats?.directReferrals || 0}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="text-purple-500 mb-1">Team Size</div>
                  <div className="text-2xl font-bold">{teamStats?.teamSize || 0}</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <div className="text-indigo-500 mb-1">Team Volume</div>
                  <div className="text-2xl font-bold">₨{(teamStats?.teamVolume || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Title */}
        <div className="flex items-center mb-6">
          {activeTab === 'packages' && (
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white mr-3">
                <FiPackage size={20} />
              </div>
              <h2 className="text-xl font-bold">Packages</h2>
            </div>
          )}
          {activeTab === 'shop' && (
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 text-white mr-3">
                <MdOutlineShoppingCart size={20} />
              </div>
              <h2 className="text-xl font-bold">Shop</h2>
            </div>
          )}
          {activeTab === 'orders' && (
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 text-white mr-3">
                <FiCreditCard size={20} />
              </div>
              <h2 className="text-xl font-bold">My Orders</h2>
            </div>
          )}
          {activeTab === 'rank' && (
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white mr-3">
                <MdOutlineLeaderboard size={20} />
              </div>
              <h2 className="text-xl font-bold">My Team</h2>
            </div>
          )}
          {activeTab === 'payouts' && (
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white mr-3">
                <FiTrendingUp size={20} />
              </div>
              <h2 className="text-xl font-bold">My Payouts</h2>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') || message.includes('Congratulations')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'packages' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            
            {user.packagePurchased || user.hasPendingPackage ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <FiPackage size={32} />
                </div>
                {user.packagePurchased ? (
                  <>
                    <h3 className="text-xl font-semibold mb-2">Investment Plan Active</h3>
                    <p className="text-gray-800 mb-4">You have already activated an investment plan.</p>
                    <div className="inline-block bg-blue-50 rounded-full px-6 py-3 text-blue-700 font-medium">
                      Available Balance: ₨{getAvailableAmount().toLocaleString()} ({user.rank})
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold mb-2">Investment Plan Pending</h3>
                    <p className="text-gray-800 mb-4">Your investment plan request is pending admin approval.</p>
                    <div className="inline-block bg-yellow-50 rounded-full px-6 py-3 text-yellow-700 font-medium">
                      Status: Waiting for Approval
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { 
                      amount: 20000, 
                      netAmount: 19000,
                      rank: 'Assistant', 
                      fee: 1000, 
                      payout: 30,
                      color: 'from-blue-400 to-blue-600',
                      benefits: ['30% Direct Payout', 'Product Ordering', 'Basic Dashboard']
                    },
                    { 
                      amount: 50000, 
                      netAmount: 48500,
                      rank: 'Manager', 
                      fee: 1500, 
                      payout: 35,
                      color: 'from-purple-400 to-purple-600',
                      benefits: ['35% Direct Payout', 'Passive Income (2 levels)', 'Advanced Dashboard']
                    },
                    { 
                      amount: 100000, 
                      netAmount: 98000,
                      rank: 'S.Manager', 
                      fee: 2000, 
                      payout: 40,
                      color: 'from-indigo-400 to-indigo-600',
                      benefits: ['40% Direct Payout', 'Passive Income (2 levels)', 'Premium Dashboard']
                    }
                  ].map((pkg) => (
                    <div key={pkg.amount} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`bg-gradient-to-r ${pkg.color} p-6 text-white`}>
                        <h3 className="text-xl font-bold mb-1">Investment Plan</h3>
                        <p className="text-3xl font-bold">₨{pkg.netAmount.toLocaleString()}</p>
                        <p className="text-sm text-white/80 mt-1">Rank: {pkg.rank}</p>
                      </div>
                      
                      <div className="p-6">
                        <div className="mb-4">
                          <div className="text-sm text-gray-700 mb-1">Total Investment</div>
                          <div className="text-lg font-semibold">₨{pkg.amount.toLocaleString()} <span className="text-xs text-gray-500">(Includes ₨{pkg.fee} fee)</span></div>
                        </div>
                        
                        <div className="mb-6">
                          <div className="text-sm text-gray-700 mb-2">Benefits</div>
                          <ul className="space-y-2">
                            {pkg.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-center text-sm">
                                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <button
                          onClick={() => handlePackagePurchase(pkg.amount)}
                          disabled={loading}
                          className={`w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r ${pkg.color} hover:opacity-90 disabled:opacity-50 transition-opacity`}
                        >
                          {loading ? 'Processing...' : 'Activate Plan'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mt-6">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-1">Incentives</h3>
              <p className="text-gray-600 mb-6">Apply for special incentives based on your rank and achievements.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Umrah Ticket - Global Manager only */}
                {user && user.rank === 'G.Manager' && (
                  <div className="border rounded-xl p-5">
                    <div className="font-semibold mb-2">Umrah Ticket</div>
                    <div className="text-sm text-gray-600 mb-3">Available for Global Managers (One-time)</div>
                    {userIncentives.find(inc => inc.type === 'umrahTicket' && inc.status === 'approved') ? (
                      <div className="inline-block bg-green-50 rounded-full px-4 py-2 text-green-700 text-sm font-medium mb-3">Approved ✓</div>
                    ) : userIncentives.find(inc => inc.type === 'umrahTicket' && inc.status === 'pending') ? (
                      <div className="inline-block bg-yellow-50 rounded-full px-4 py-2 text-yellow-700 text-sm font-medium mb-3">Pending Approval</div>
                    ) : (
                      <button
                        onClick={() => handleIncentiveApplication('umrahTicket')}
                        disabled={incentiveLoading}
                        className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
                      >
                        {incentiveLoading ? 'Applying...' : 'Apply Now'}
                      </button>
                    )}
                  </div>
                )}

                {/* Car Plan - Director with 2 direct Directors */}
                {user && user.rank === 'Director' && (
                  <div className="border rounded-xl p-5">
                    <div className="font-semibold mb-2">Car Plan</div>
                    <div className="text-sm text-gray-600 mb-3">Requires 2 direct Directors (One-time)</div>
                    {userIncentives.find(inc => inc.type === 'carPlan' && inc.status === 'approved') ? (
                      <div className="inline-block bg-green-50 rounded-full px-4 py-2 text-green-700 text-sm font-medium mb-3">Approved ✓</div>
                    ) : userIncentives.find(inc => inc.type === 'carPlan' && inc.status === 'pending') ? (
                      <div className="inline-block bg-yellow-50 rounded-full px-4 py-2 text-yellow-700 text-sm font-medium mb-3">Pending Approval</div>
                    ) : teamStats && teamStats.directDirectorCount >= 2 ? (
                      <button
                        onClick={() => handleIncentiveApplication('carPlan')}
                        disabled={incentiveLoading}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
                      >
                        {incentiveLoading ? 'Applying...' : 'Apply Now'}
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500">Need {2 - (teamStats?.directDirectorCount || 0)} more direct Directors</div>
                    )}
                  </div>
                )}

                {/* Monthly Salary - Director with 2 direct S.Managers this month */}
                {user && user.rank === 'Director' && (
                  <div className="border rounded-xl p-5">
                    <div className="font-semibold mb-2">Monthly Salary (₹40,000)</div>
                    <div className="text-sm text-gray-600 mb-3">2 direct S.Managers this month (Monthly)</div>
                    {userIncentives.find(inc => inc.type === 'monthlySalary' && inc.status === 'approved' && inc.month === new Date().toISOString().slice(0, 7)) ? (
                      <div className="inline-block bg-green-50 rounded-full px-4 py-2 text-green-700 text-sm font-medium mb-3">Approved for this month ✓</div>
                    ) : userIncentives.find(inc => inc.type === 'monthlySalary' && inc.status === 'pending' && inc.month === new Date().toISOString().slice(0, 7)) ? (
                      <div className="inline-block bg-yellow-50 rounded-full px-4 py-2 text-yellow-700 text-sm font-medium mb-3">Pending Approval</div>
                    ) : teamStats && teamStats.directSManagersThisMonth >= 2 ? (
                      <button
                        onClick={() => handleIncentiveApplication('monthlySalary')}
                        disabled={incentiveLoading}
                        className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
                      >
                        {incentiveLoading ? 'Applying...' : 'Apply for This Month'}
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500">Need {2 - (teamStats?.directSManagersThisMonth || 0)} more direct S.Managers this month</div>
                    )}
                  </div>
                )}

                {/* Show message if no incentives available */}
                {(!user || (user.rank !== 'G.Manager' && user.rank !== 'Director')) && (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-500 mb-2">No incentives available for your current rank</div>
                    <div className="text-sm text-gray-400">
                      {!user?.rank ? 'Purchase a package to unlock incentives' : 
                       user.rank === 'Assistant' ? 'Upgrade to Manager or higher to unlock incentives' :
                       user.rank === 'Manager' ? 'Upgrade to S.Manager or higher to unlock incentives' :
                       user.rank === 'S.Manager' ? 'Upgrade to D.Manager or higher to unlock incentives' :
                       user.rank === 'D.Manager' ? 'Upgrade to G.Manager to unlock Umrah Ticket or Director for all incentives' :
                       'Incentives available at G.Manager and Director ranks'}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Applications */}
              {userIncentives.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-4">Recent Applications</h4>
                  <div className="space-y-2">
                    {userIncentives.slice(0, 5).map((incentive) => (
                      <div key={incentive._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium capitalize">
                            {incentive.type === 'umrahTicket' ? 'Umrah Ticket' :
                             incentive.type === 'carPlan' ? 'Car Plan' :
                             incentive.type === 'monthlySalary' ? `Monthly Salary ${incentive.month}` : incentive.type}
                          </span>
                          <div className="text-sm text-gray-600">
                            Applied: {new Date(incentive.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          incentive.status === 'approved' ? 'bg-green-100 text-green-700' :
                          incentive.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {incentive.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            
            {!user.packagePurchased ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 text-purple-600 mb-4">
                  <MdOutlineShoppingCart size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Package Required</h3>
                <p className="text-gray-800 mb-4">Please purchase a package first to access the shop.</p>
                <button
                  onClick={fetchUserProfile}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Refresh Status
                </button>
              </div>
            ) : orders.length > 0 || user.hasPendingOrder ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <MdOutlineShoppingCart size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Shop Disabled</h3>
                <p className="text-gray-800 mb-4">You have already placed an order. Each user can only place one order.</p>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  View Your Orders
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.length === 0 ? (
                    <div className="col-span-3 text-center py-8">
                      <p className="text-gray-700">No products available at the moment.</p>
                    </div>
                  ) : (
                    products.map((product) => (
                      <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-[28rem] bg-purple-50 flex items-center justify-center overflow-hidden">
                          {/* Product image */}
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={200}
                            height={200}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="p-5">
                          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                          <p className="text-gray-800 text-sm mb-3">{product.description}</p>
                          
                          {/* Benefits List */}
                          <div className="mb-4">
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Benefits:</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {product.benefits?.slice(0, 4).map((benefit, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-purple-500 mr-1 mt-0.5">•</span>
                                  <span>{benefit}</span>
                                </li>
                              ))}
                              {product.benefits?.length > 4 && (
                                <li className="text-purple-600 font-medium">+{product.benefits.length - 4} more benefits</li>
                              )}
                            </ul>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <p className="text-lg font-bold text-purple-600">₨{product.price.toLocaleString()}</p>
                            <button 
                              onClick={() => addToCart(product)}
                              className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                  <FiCreditCard size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
                <p className="text-gray-800 mb-4">You haven't placed any orders yet.</p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Browse Shop
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {/* Order Status Indicator */}
                        <div className={`w-full md:w-2 flex-shrink-0 bg-gradient-to-b ${order.status === 'approved' || order.status === 'dispatched' ? 'from-green-400 to-green-600' : order.status === 'pending' ? 'from-yellow-400 to-yellow-600' : 'from-red-400 to-red-600'}`}></div>
                        
                        <div className="p-5 w-full">
                          <div className="flex flex-wrap justify-between items-center mb-3">
                            <div className="flex items-center space-x-2 mb-2 md:mb-0">
                              <span className="text-lg font-bold">Order #{order._id.slice(-6)}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'dispatched' ? 'bg-green-100 text-green-800' :
                                order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status === 'pending' ? 'PENDING APPROVAL' :
                                 order.status === 'approved' ? 'PROCESSING' :
                                 order.status === 'dispatched' ? 'DISPATCHED' :
                                 order.status === 'rejected' ? 'REJECTED' : order.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap justify-between items-center mb-4">
                            <div>
                              <div className="text-sm text-gray-700 mb-1">Total Amount</div>
                              <div className="text-lg font-semibold text-indigo-600">₨{order.totalAmount.toLocaleString()}</div>
                            </div>
                            
                            <button 
                              onClick={() => handleViewOrderDetails(order)}
                              className="mt-2 md:mt-0 bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                          
                          {/* Order Progress Bar */}
                          {order.status !== 'rejected' && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Ordered</span>
                                <span>Processing</span>
                                <span>Dispatched</span>
                              </div>
                              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600" 
                                  style={{ 
                                    width: order.status === 'pending' ? '33%' : 
                                           order.status === 'approved' ? '66%' : 
                                           order.status === 'dispatched' ? '100%' : '0%' 
                                  }}
                                ></div>
                                <div className="absolute top-0 left-0 w-full flex justify-between">
                                  <div className={`w-2 h-2 rounded-full -mt-0 -ml-1 ${order.status !== 'pending' ? 'bg-indigo-600' : 'bg-gray-400'}`}></div>
                                  <div className={`w-2 h-2 rounded-full -mt-0 ${order.status === 'approved' || order.status === 'dispatched' ? 'bg-indigo-600' : 'bg-gray-400'}`}></div>
                                  <div className={`w-2 h-2 rounded-full -mt-0 -mr-1 ${order.status === 'dispatched' ? 'bg-indigo-600' : 'bg-gray-400'}`}></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {payouts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 text-orange-600 mb-4">
                  <FiTrendingUp size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Payouts Yet</h3>
                <p className="text-gray-800 mb-4">You haven't earned any payouts from referrals yet.</p>
                <button
                  onClick={() => setActiveTab('rank')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Check My Team
                </button>
              </div>
            ) : (
              <div className="p-6">
                {/* Payout Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-orange-50 p-4 rounded-xl">
                    <div className="text-orange-500 mb-1">Total Earned</div>
                    <div className="text-2xl font-bold">₨{payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <div className="text-green-500 mb-1">Approved</div>
                    <div className="text-2xl font-bold">₨{payouts.filter(p => p.status === 'approved').reduce((sum, payout) => sum + (payout.amount || 0), 0).toLocaleString()}</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl">
                    <div className="text-yellow-500 mb-1">Pending</div>
                    <div className="text-2xl font-bold">₨{payouts.filter(p => p.status === 'pending').reduce((sum, payout) => sum + (payout.amount || 0), 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* Payouts List */}
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        {/* Status Indicator */}
                        <div className={`w-full md:w-2 flex-shrink-0 bg-gradient-to-b ${
                          payout.status === 'approved' ? 'from-green-400 to-green-600' : 
                          payout.status === 'pending' ? 'from-yellow-400 to-yellow-600' : 
                          'from-red-400 to-red-600'
                        }`}></div>
                        
                        <div className="p-5 w-full">
                          <div className="flex flex-wrap justify-between items-center mb-3">
                            <div className="flex items-center space-x-2 mb-2 md:mb-0">
                              <span className="text-lg font-bold">
                                {payout.type === 'direct_payout' ? 'Direct Payout' : 'Passive Income'}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                payout.status === 'approved' ? 'bg-green-100 text-green-800' :
                                payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {payout.status === 'pending' ? 'PENDING' :
                                 payout.status === 'approved' ? 'APPROVED' :
                                 payout.status === 'rejected' ? 'REJECTED' : payout.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700">
                              {new Date(payout.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap justify-between items-center mb-4">
                            <div>
                              <div className="text-sm text-gray-700 mb-1">Amount</div>
                              <div className="text-lg font-semibold text-orange-600">₨{payout.amount.toLocaleString()}</div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-gray-700 mb-1">From Package</div>
                              <div className="text-sm font-medium">₨{payout.packageAmount.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">{payout.percentage}% commission</div>
                            </div>
                          </div>
                          
                          {payout.sourceUserId && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Source:</span> Referral purchase
                              {payout.level > 1 && ` (Level ${payout.level})`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rank' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            
            <div className="p-6">
              {/* Current Rank Card */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-full text-white mr-4">
                      <MdOutlineLeaderboard size={28} />
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-700">Current Rank</h3>
                      <p className="text-2xl font-bold text-gray-800">{user.rank || 'No Package'}</p>
                    </div>
                  </div>
                  
                  {user.rank && user.rank !== 'Director' && (
                    <button
                      onClick={handleRankUpgrade}
                      disabled={rankUpgradeLoading}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-full font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {rankUpgradeLoading ? 'Processing...' : 'Check Rank Upgrade'}
                    </button>
                  )}
                  
                  {user.rank === 'Director' && (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                      Maximum Rank Achieved
                    </div>
                  )}
                </div>
              </div>
              
              {/* Rank Path Visualization */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Your Rank Journey</h3>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-0 w-full h-1 bg-blue-100 rounded-full"></div>
                  
                  {/* Rank Steps */}
                  <div className="flex justify-between relative">
                    {['Assistant', 'Manager', 'S.Manager', 'D.Manager', 'G.Manager', 'Director'].map((rank, index) => {
                      const rankOrder = ['No Package', 'Assistant', 'Manager', 'S.Manager', 'D.Manager', 'G.Manager', 'Director'];
                      const currentRankIndex = rankOrder.indexOf(user.rank || 'No Package');
                      const isCompleted = currentRankIndex > index;
                      const isCurrent = user.rank === rank;
                      
                      return (
                        <div key={rank} className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${isCurrent 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                            : isCompleted 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-700'}`}>
                            {index + 1}
                          </div>
                          <p className={`text-xs mt-2 font-medium ${isCurrent ? 'text-green-600' : isCompleted ? 'text-green-500' : 'text-gray-700'}`}>
                            {rank}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Rank Requirements */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h3 className="font-semibold text-gray-700">Rank Requirements</h3>
                </div>
                <div className="divide-y">
                  <div className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">Assistant → Manager</p>
                      <p className="text-sm text-gray-700">₨50,000 referral value</p>
                    </div>
                    {user.rank === 'Assistant' && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        Current Goal
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">Manager → S.Manager</p>
                      <p className="text-sm text-gray-700">₨100,000 referral value</p>
                    </div>
                    {user.rank === 'Manager' && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        Current Goal
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">S.Manager → D.Manager</p>
                      <p className="text-sm text-gray-700">5 S.Managers in downline</p>
                    </div>
                    {user.rank === 'S.Manager' && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        Current Goal
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">D.Manager → G.Manager</p>
                      <p className="text-sm text-gray-700">5 D.Managers in downline</p>
                    </div>
                    {user.rank === 'D.Manager' && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        Current Goal
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">G.Manager → Director</p>
                      <p className="text-sm text-gray-700">4 G.Managers in downline</p>
                    </div>
                    {user.rank === 'G.Manager' && (
                      <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        Current Goal
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Team Overview */}
              <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h3 className="font-semibold text-gray-700">Team Overview</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <div className="text-blue-500 mb-1 text-sm font-medium">Assistants</div>
                      <div className="text-2xl font-bold text-blue-600">{teamStats?.assistantCount || 0}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl text-center">
                      <div className="text-purple-500 mb-1 text-sm font-medium">Managers</div>
                      <div className="text-2xl font-bold text-purple-600">{teamStats?.managerCount || 0}</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-xl text-center">
                      <div className="text-indigo-500 mb-1 text-sm font-medium">S.Managers</div>
                      <div className="text-2xl font-bold text-indigo-600">{teamStats?.sManagerCount || 0}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <div className="text-green-500 mb-1 text-sm font-medium">D.Managers</div>
                      <div className="text-2xl font-bold text-green-600">{teamStats?.dManagerCount || 0}</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl text-center">
                      <div className="text-yellow-500 mb-1 text-sm font-medium">G.Managers</div>
                      <div className="text-2xl font-bold text-yellow-600">{teamStats?.gManagerCount || 0}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl text-center">
                      <div className="text-red-500 mb-1 text-sm font-medium">Directors</div>
                      <div className="text-2xl font-bold text-red-600">{teamStats?.directorCount || 0}</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                      <div className="text-gray-700 mb-1 text-sm font-medium">Direct Referrals</div>
                      <div className="text-2xl font-bold text-blue-600">{teamStats?.directReferrals || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">Users you directly referred</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl">
                      <div className="text-gray-700 mb-1 text-sm font-medium">Total Team Size</div>
                      <div className="text-2xl font-bold text-green-600">{teamStats?.totalTeamMembers || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">All team members in your downline</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl">
                      <div className="text-gray-700 mb-1 text-sm font-medium">Team Volume</div>
                      <div className="text-2xl font-bold text-purple-600">₨{(teamStats?.teamVolume || 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">Total investment from your team</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-40">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('packages')} 
            className={`flex flex-col items-center justify-center py-3 w-1/4 relative ${activeTab === 'packages' ? 'text-blue-600' : 'text-gray-700'}`}
          >
            <div className="relative">
              {activeTab === 'packages' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500"></span>
              )}
              <FiPackage size={20} />
            </div>
            <span className="text-xs mt-1">Packages</span>
            {activeTab === 'packages' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-t-full"></span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('shop')} 
            className={`flex flex-col items-center justify-center py-3 w-1/4 relative ${activeTab === 'shop' ? 'text-purple-600' : 'text-gray-700'}`}
          >
            <div className="relative">
              {activeTab === 'shop' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500"></span>
              )}
              <FiShoppingBag size={20} />
            </div>
            <span className="text-xs mt-1">Shop</span>
            {activeTab === 'shop' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-purple-500 rounded-t-full"></span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`flex flex-col items-center justify-center py-3 w-1/4 relative ${activeTab === 'orders' ? 'text-indigo-600' : 'text-gray-700'}`}
          >
            <div className="relative">
              {activeTab === 'orders' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500"></span>
              )}
              <FiCreditCard size={20} />
            </div>
            <span className="text-xs mt-1">Orders</span>
            {activeTab === 'orders' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-indigo-500 rounded-t-full"></span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('rank')} 
            className={`flex flex-col items-center justify-center py-3 w-1/4 relative ${activeTab === 'rank' ? 'text-green-600' : 'text-gray-700'}`}
          >
            <div className="relative">
              {activeTab === 'rank' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500"></span>
              )}
              <MdOutlineLeaderboard size={20} />
            </div>
            <span className="text-xs mt-1">My Team</span>
            {activeTab === 'rank' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-green-500 rounded-t-full"></span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('payouts')} 
            className={`flex flex-col items-center justify-center py-3 w-1/4 relative ${activeTab === 'payouts' ? 'text-orange-600' : 'text-gray-700'}`}
          >
            <div className="relative">
              {activeTab === 'payouts' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500"></span>
              )}
              <FiTrendingUp size={20} />
            </div>
            <span className="text-xs mt-1">Payouts</span>
            {activeTab === 'payouts' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-orange-500 rounded-t-full"></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
