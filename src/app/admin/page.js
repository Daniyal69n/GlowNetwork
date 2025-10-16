'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiLogOut, FiCheck, FiX, FiMenu, FiEye, FiUserCheck } from 'react-icons/fi';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetPasswordResult, setResetPasswordResult] = useState(null);
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

  // Fetch users when users tab is selected
  useEffect(() => {
    if (activeTab === 'users') {
      fetchAllUsers();
    }
  }, [activeTab]);

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

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setShowPasswordReset(false);
    setNewPassword('');
    setResetPasswordResult(null);
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !selectedUser) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser._id,
          newPassword: newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResetPasswordResult({
          success: true,
          message: data.message,
          newPassword: data.newPassword
        });
        setMessage(`Password reset successful for ${selectedUser.username}`);
      } else {
        setResetPasswordResult({
          success: false,
          message: data.error
        });
      }
    } catch (error) {
      setResetPasswordResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
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
            { id: 'users', label: 'All Users', icon: FiUserCheck },
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
        <div className="md:hidden grid grid-cols-3 gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: FiUsers },
            { id: 'users', label: 'Users', icon: FiUserCheck },
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

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold">All Users</h2>
              <button
                onClick={fetchAllUsers}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
            {allUsers.length === 0 ? (
              <p className="text-gray-600">Loading users...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.username}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{user.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">₨{(user.packagePurchased || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.rank === 'Director' ? 'bg-purple-100 text-purple-800' :
                            user.rank === 'S.Manager' ? 'bg-blue-100 text-blue-800' :
                            user.rank === 'Manager' ? 'bg-green-100 text-green-800' :
                            user.rank === 'S.Executive' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.rank || 'Assistant'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleUserClick(user)}
                            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            <FiEye size={14} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}



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

        
        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
                  <button
                    onClick={closeUserModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Username</label>
                        <p className="text-sm text-gray-900">{selectedUser.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Admin Status</label>
                        <p className="text-sm text-gray-900">{selectedUser.isAdmin ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Details */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-3">Account Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Package Purchased</label>
                        <p className="text-sm text-gray-900">₨{(selectedUser.packagePurchased || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Rank</label>
                        <p className="text-sm text-gray-900">{selectedUser.rank || 'Assistant'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Referral Code</label>
                        <p className="text-sm text-gray-900">{selectedUser.referralCode}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Referred By</label>
                        <p className="text-sm text-gray-900">{selectedUser.referredBy || 'Direct'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Security Information */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-3">Security Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Password</label>
                        <div className="bg-gray-100 p-2 rounded">
                          <p className="text-sm text-gray-500 mb-2">Password is encrypted and cannot be viewed</p>
                          {!showPasswordReset ? (
                            <button
                              onClick={() => setShowPasswordReset(true)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Reset Password
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <input
                                  type="text"
                                  placeholder="Enter new password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Must be 8+ chars with letters, numbers, and symbols
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handlePasswordReset}
                                  disabled={loading || !newPassword}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                >
                                  {loading ? 'Resetting...' : 'Confirm Reset'}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowPasswordReset(false);
                                    setNewPassword('');
                                    setResetPasswordResult(null);
                                  }}
                                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                              {resetPasswordResult && (
                                <div className={`p-2 rounded text-sm ${
                                  resetPasswordResult.success 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  <p className="font-medium">{resetPasswordResult.message}</p>
                                  {resetPasswordResult.success && resetPasswordResult.newPassword && (
                                    <p className="mt-1">
                                      <strong>New Password:</strong> {resetPasswordResult.newPassword}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Account Created</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedUser.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeUserModal}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
