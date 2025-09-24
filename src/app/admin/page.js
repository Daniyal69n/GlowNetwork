'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiLogOut, FiCheck, FiX, FiMenu } from 'react-icons/fi';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Products are now hardcoded in the user dashboard
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (!parsedUser.isAdmin) {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchDashboardData();
    
    // Set up polling for real-time updates
    const pollingInterval = setInterval(() => {
      fetchDashboardData();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(pollingInterval); // Clean up on unmount
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Products are now hardcoded in the user dashboard

  const handleApproval = async (type, id, action) => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      let endpoint, body;
      
      // For dispatch action, use the approve-order endpoint
      if (type === 'order' && action !== 'dispatched') {
        endpoint = `/api/admin/orders`;
        body = JSON.stringify({ 
          orderId: id, 
          status: action 
        });
      } else if (type === 'order' && action === 'dispatched') {
        endpoint = `/api/admin/approve-order`;
        body = JSON.stringify({ 
          orderId: id, 
          action: action 
        });
      } else if (type === 'incentive') {
        endpoint = `/api/admin/incentives`;
        // id for incentives is the incentive application ID
        body = JSON.stringify({ incentiveId: id, action: action });
      } else {
        endpoint = `/api/admin/approve-${type}`;
        body = JSON.stringify({ 
          [`${type}Id`]: id, 
          action 
        });
      }
      
      const response = await fetch(endpoint, {
        method: (type === 'order' && action !== 'dispatched') ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        fetchDashboardData(); // Refresh data
      } else {
        setMessage(data.error || 'Failed to process approval');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRankAdminAction = async (approvalId, action) => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/approve-rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approvalId, action })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        fetchDashboardData();
      } else {
        setMessage(data.error || 'Failed to process rank approval');
      }
    } catch (e) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Product management removed - products are now hardcoded in user dashboard

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user || !dashboardData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
              >
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <FiMenu size={24} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-2">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600">Welcome, Admin</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <FiX size={20} />
                </button>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-gray-100"
              >
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs - Desktop */}
        <div className="hidden md:flex space-x-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: FiUsers },
            { id: 'packages', label: 'Package Approvals', icon: FiPackage },
            { id: 'orders', label: 'Order Approvals', icon: FiShoppingBag },
            { id: 'payouts', label: 'Payout Approvals', icon: FiDollarSign },
            { id: 'ranks', label: 'Rank Approvals', icon: FiUsers }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Navigation Tabs - Mobile */}
        <div className="md:hidden grid grid-cols-2 gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: FiUsers },
            { id: 'packages', label: 'Packages', icon: FiPackage },
            { id: 'orders', label: 'Orders', icon: FiShoppingBag },
            { id: 'payouts', label: 'Payouts', icon: FiDollarSign },
            { id: 'ranks', label: 'Ranks', icon: FiUsers }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={20} />
              <span className="mt-1 text-xs">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') || message.includes('approved')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <FiUsers className="text-blue-600 mb-2 md:mb-0" size={24} />
                <div className="md:ml-4">
                  <p className="text-xs md:text-sm text-gray-600">Total Users</p>
                  <p className="text-xl md:text-2xl font-semibold">{dashboardData.statistics.totalUsers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <FiDollarSign className="text-green-600 mb-2 md:mb-0" size={24} />
                <div className="md:ml-4">
                  <p className="text-xs md:text-sm text-gray-600">Total Revenue</p>
                  <p className="text-xl md:text-2xl font-semibold">₨{dashboardData.statistics.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <FiPackage className="text-purple-600 mb-2 md:mb-0" size={24} />
                <div className="md:ml-4">
                  <p className="text-xs md:text-sm text-gray-600">Pending Packages</p>
                  <p className="text-xl md:text-2xl font-semibold">{dashboardData.pendingApprovals.packages.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <FiShoppingBag className="text-orange-600 mb-2 md:mb-0" size={24} />
                <div className="md:ml-4">
                  <p className="text-xs md:text-sm text-gray-600">Pending Orders</p>
                  <p className="text-xl md:text-2xl font-semibold">{dashboardData.pendingApprovals.orders.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Package Approvals</h2>
            {dashboardData.pendingApprovals.packages.length === 0 ? (
              <p className="text-gray-600">No pending package approvals.</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.pendingApprovals.packages.map((transaction) => (
                  <div key={transaction._id} className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="mb-3 md:mb-0">
                        <h3 className="font-semibold">{transaction.userId.username}</h3>
                        <p className="text-sm text-gray-600">Phone: {transaction.userId.phone}</p>
                        <p className="text-sm text-gray-600">
                          Package: ₨{transaction.packageType.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Net Amount: ₨{transaction.netAmount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval('package', transaction._id, 'approved')}
                          disabled={loading}
                          className="flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 md:py-1 rounded hover:bg-green-700 disabled:opacity-50 flex-1 md:flex-initial"
                        >
                          <FiCheck size={14} className="hidden md:block" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleApproval('package', transaction._id, 'rejected')}
                          disabled={loading}
                          className="flex items-center justify-center space-x-1 bg-red-600 text-white px-3 py-2 md:py-1 rounded hover:bg-red-700 disabled:opacity-50 flex-1 md:flex-initial"
                        >
                          <FiX size={14} className="hidden md:block" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ranks' && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Rank Approvals</h2>
            {(!dashboardData.pendingApprovals.rankApprovals || dashboardData.pendingApprovals.rankApprovals.length === 0) ? (
              <p className="text-gray-600">No pending rank approvals.</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.pendingApprovals.rankApprovals.map((req) => (
                  <div key={req._id} className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="mb-3 md:mb-0">
                        <h3 className="font-semibold">{req.userId.username}</h3>
                        <p className="text-sm text-gray-600">Phone: {req.userId.phone}</p>
                        <p className="text-sm text-gray-600">Current Rank: {req.currentRank || '-'}</p>
                        <p className="text-sm text-gray-600">Target Rank: {req.targetRank}</p>
                        <p className="text-xs text-gray-500">Requested: {new Date(req.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            await handleRankAdminAction(req._id, 'approved');
                          }}
                          disabled={loading}
                          className="flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 md:py-1 rounded hover:bg-green-700 disabled:opacity-50 flex-1 md:flex-initial"
                        >
                          <FiCheck size={14} className="hidden md:block" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={async () => {
                            await handleRankAdminAction(req._id, 'rejected');
                          }}
                          disabled={loading}
                          className="flex items-center justify-center space-x-1 bg-red-600 text-white px-3 py-2 md:py-1 rounded hover:bg-red-700 disabled:opacity-50 flex-1 md:flex-initial"
                        >
                          <FiX size={14} className="hidden md:block" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'packages' && dashboardData && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Incentive Approvals</h2>
            {(!dashboardData.pendingApprovals.incentives || dashboardData.pendingApprovals.incentives.length === 0) ? (
              <p className="text-gray-600">No pending incentive approvals.</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.pendingApprovals.incentives.map((incentive) => (
                  <div key={incentive._id} className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="mb-3 md:mb-0">
                        <h3 className="font-semibold">{incentive.userId?.username || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-600">Phone: {incentive.userId?.phone || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Rank: {incentive.userId?.rank || 'N/A'}</p>
                        <p className="text-sm text-gray-600">
                          Incentive: <span className="font-medium capitalize">
                            {incentive.type === 'umrahTicket' ? 'Umrah Ticket' :
                             incentive.type === 'carPlan' ? 'Car Plan' :
                             incentive.type === 'monthlySalary' ? `Monthly Salary (${incentive.month})` : incentive.type}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Applied: {new Date(incentive.appliedAt).toLocaleDateString()}
                        </p>
                        {incentive.type === 'carPlan' && (
                          <p className="text-sm text-blue-600">
                            Direct Directors: {incentive.eligibilityData?.directDirectors || 'N/A'}
                          </p>
                        )}
                        {incentive.type === 'monthlySalary' && (
                          <p className="text-sm text-purple-600">
                            Direct S.Managers this month: {incentive.eligibilityData?.directSManagersInMonth || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApproval('incentive', incentive._id, 'approved')}
                            className="px-4 py-2 rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproval('incentive', incentive._id, 'rejected')}
                            className="px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                        {incentive.type === 'monthlySalary' && (
                          <div className="text-xs text-gray-500 text-center">
                            Amount: ₹40,000
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Order Management</h2>
            
            {/* Pending Orders */}
            <div className="mb-6 md:mb-8">
              <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">Pending Approvals</h3>
              {dashboardData.pendingApprovals.orders.length === 0 ? (
                <p className="text-gray-600">No pending order approvals.</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.pendingApprovals.orders.map((order) => (
                    <div key={order._id} className="border rounded-lg p-3 md:p-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div className="space-y-3 w-full md:w-3/4 mb-3 md:mb-0">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-blue-800 text-sm md:text-base">User Details</h4>
                            <p className="text-xs md:text-sm font-medium">Name: {order.userName || order.userId.username}</p>
                            <p className="text-xs md:text-sm">Phone: {order.userPhone || order.userId.phone}</p>
                            <p className="text-xs md:text-sm">Rank: {order.userId.rank || 'Assistant'}</p>
                            <p className="text-xs md:text-sm">Balance: ₨{(order.userId.packagePurchased || 0).toLocaleString()}</p>
                          </div>
                          
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <h4 className="font-semibold text-purple-800 text-sm md:text-base">Order Details</h4>
                            <p className="text-xs md:text-sm font-medium">Total Amount: ₨{order.totalAmount.toLocaleString()}</p>
                            <p className="text-xs md:text-sm">Address: {order.orderDetails.address}</p>
                            <p className="text-xs md:text-sm">Phone: {order.orderDetails.phone}</p>
                            <p className="text-xs md:text-sm">Order Date: {new Date(order.createdAt).toLocaleString()}</p>
                            
                            {/* Product List */}
                            <div className="mt-2">
                              <h5 className="text-xs md:text-sm font-semibold">Products:</h5>
                              <ul className="text-xs space-y-1 mt-1">
                                {order.products.map((product, index) => (
                                  <li key={index}>
                                    {product.name} - ₨{product.price.toLocaleString()} x {product.quantity}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                          <button
                            onClick={() => handleApproval('order', order._id, 'approved')}
                            disabled={loading}
                            className="flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 md:py-1 rounded hover:bg-green-700 disabled:opacity-50 flex-1 md:flex-initial"
                          >
                            <FiCheck size={14} className="hidden md:block" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleApproval('order', order._id, 'rejected')}
                            disabled={loading}
                            className="flex items-center justify-center space-x-1 bg-red-600 text-white px-3 py-2 md:py-1 rounded hover:bg-red-700 disabled:opacity-50 flex-1 md:flex-initial"
                          >
                            <FiX size={14} className="hidden md:block" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Orders - Ready for Dispatch */}
            <div>
              <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4">Ready for Dispatch</h3>
              {dashboardData.approvedOrders?.length === 0 || !dashboardData.approvedOrders ? (
                <p className="text-gray-600">No orders ready for dispatch.</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.approvedOrders.map((order) => (
                    <div key={order._id} className="border rounded-lg p-3 md:p-4 bg-green-50">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div className="space-y-2 w-full md:w-3/4 mb-3 md:mb-0">
                          <div className="flex flex-col md:flex-row md:justify-between">
                            <div>
                              <h4 className="font-semibold text-sm md:text-base">Order #{order._id.substring(order._id.length - 6)}</h4>
                              <p className="text-xs md:text-sm text-gray-600">{order.userId.username} - {order.userId.phone}</p>
                            </div>
                            <span className="text-xs md:text-sm font-medium text-green-600 mt-1 md:mt-0">₨{order.totalAmount.toLocaleString()}</span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">Address: {order.orderDetails.address}</p>
                        </div>
                        <button
                          onClick={() => handleApproval('order', order._id, 'dispatched')}
                          disabled={loading}
                          className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-center"
                        >
                          Dispatch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Payout Approvals</h2>
            {dashboardData.pendingApprovals.payouts.length === 0 ? (
              <p className="text-gray-600">No pending payout approvals.</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.pendingApprovals.payouts.map((payout) => (
                  <div key={payout._id} className="border rounded-lg p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="mb-3 md:mb-0">
                        <h3 className="font-semibold text-sm md:text-base">{payout.userId.username}</h3>
                        <p className="text-xs md:text-sm text-gray-600">Phone: {payout.userId.phone}</p>
                        <p className="text-xs md:text-sm text-gray-600">
                          Type: {payout.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          Amount: ₨{payout.amount.toLocaleString()}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          From: {payout.sourceUserId.username}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval('payout', payout._id, 'approved')}
                          disabled={loading}
                          className="flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 md:py-1 rounded hover:bg-green-700 disabled:opacity-50 flex-1 md:flex-initial"
                        >
                          <FiCheck size={14} className="hidden md:block" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleApproval('payout', payout._id, 'rejected')}
                          disabled={loading}
                          className="flex items-center justify-center space-x-1 bg-red-600 text-white px-3 py-2 md:py-1 rounded hover:bg-red-700 disabled:opacity-50 flex-1 md:flex-initial"
                        >
                          <FiX size={14} className="hidden md:block" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products tab removed - products are now hardcoded in user dashboard */}
      </div>
    </div>
  );
}
