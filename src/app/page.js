'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Phone, Lock, Gift, Eye, ArrowLeft } from 'lucide-react';

// Move components outside to prevent re-creation on each render
const WelcomeScreen = ({ setActiveView }) => (
  <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
    <div className="mb-8 relative w-32 h-32">
      <Image 
        src="/glow-network-logo.png" 
        alt="Glow Network Logo" 
        width={128} 
        height={128} 
        className="object-contain"
      />
    </div>
    <h1 className="text-3xl font-bold mb-12">
      <span className="text-white">GLOW</span> <span className="text-[#0601E4]">NETWORK</span>
    </h1>
    
    <div className="space-y-6 w-full max-w-sm">
      <button
        onClick={() => setActiveView('signin')}
        className="w-full bg-[#0601E4] text-white font-semibold py-4 px-8 rounded-full hover:bg-[#0601C0] transition-colors text-lg shadow-lg"
      >
        SIGN IN
      </button>
      <button
        onClick={() => setActiveView('signup')}
        className="w-full bg-transparent text-[#0601E4] font-semibold py-4 px-8 rounded-full border-2 border-[#0601E4] hover:bg-white/10 transition-colors text-lg shadow-lg"
      >
        SIGN UP
      </button>
    </div>
  </div>
);

const SignInForm = ({ setActiveView, formData, handleChange, handleSubmit, loading, message }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
  <div className="min-h-screen w-full flex flex-col">
    <div className="flex flex-col min-h-screen w-full">
      <div className="p-8 pt-16">
        <button 
          onClick={() => setActiveView('welcome')} 
          className="text-white mb-8 flex items-center hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} /> Back
        </button>
        <h2 className="text-3xl font-bold text-white mb-2">Hello</h2>
        <h3 className="text-2xl font-semibold text-white mb-8">Sign in!</h3>
      </div>
      
      <div className="bg-white rounded-t-3xl flex-grow p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-[#0601E4] text-lg text-gray-800"
                placeholder="Enter your phone number"
              />
              <div className="absolute right-3 top-3 text-green-500">
                {formData.phone && <span>✓</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-[#0601E4] text-lg text-gray-800"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Eye size={20} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#0601E4] to-[#1E40AF] text-white py-4 px-6 rounded-full font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-8"
          >
            {loading ? 'Processing...' : 'SIGN IN'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-lg text-base max-w-md mx-auto ${
            message.includes('successfully') || message.includes('referral code')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center max-w-md mx-auto">
          <p className="text-base text-gray-600">Don't have account?</p>
          <button 
            onClick={() => setActiveView('signup')} 
            className="text-[#0601E4] font-medium text-lg mt-1"
          >
            Sign up
          </button>
        </div>

        
      </div>
    </div>
  </div>
  );
};

const SignUpForm = ({ setActiveView, formData, handleChange, handleSubmit, loading, message }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
  <div className="min-h-screen w-full flex flex-col">
    <div className="flex flex-col min-h-screen w-full">
      <div className="p-8 pt-16">
        <button 
          onClick={() => setActiveView('welcome')} 
          className="text-white mb-8 flex items-center hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} /> Back
        </button>
        <h2 className="text-3xl font-bold text-white mb-2">Create Your</h2>
        <h3 className="text-2xl font-semibold text-white mb-8">Account</h3>
      </div>
      
      <div className="bg-white rounded-t-3xl flex-grow p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-[#0601E4] text-lg text-gray-800"
                placeholder="Enter your full name"
              />
              <div className="absolute right-3 top-3 text-green-500">
                {formData.username && <span>✓</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-[#0601E4] text-lg text-gray-800"
                placeholder="Enter your email address"
              />
              <div className="absolute right-3 top-3 text-green-500">
                {formData.email && <span>✓</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-[#0601E4] text-lg text-gray-800"
                placeholder="Enter your phone number"
              />
              <div className="absolute right-3 top-3 text-green-500">
                {formData.phone && <span>✓</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-[#0601E4] text-lg text-gray-800"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Eye size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Referral Code 
            </label>
            <div className="relative">
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className="w-full pl-10 px-4 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-[#0601E4] text-lg text-gray-800"
                placeholder="Enter referral code (6 digits)"
                maxLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#0601E4] to-[#1E40AF] text-white py-4 px-6 rounded-full font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-8"
          >
            {loading ? 'Processing...' : 'SIGN UP'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-lg text-base max-w-md mx-auto ${
            message.includes('successfully') || message.includes('referral code')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center max-w-md mx-auto">
          <p className="text-base text-gray-600">Already have an account?</p>
          <button 
            onClick={() => setActiveView('signin')} 
            className="text-[#0601E4] font-medium text-lg mt-1"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default function Home() {
  const [activeView, setActiveView] = useState('welcome');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    referralCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }

    // Check for referral code in URL and redirect to signup
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setActiveView('signup');
      setFormData(prev => ({
        ...prev,
        referralCode: refCode
      }));
    }
  }, [router]);

  // Use useCallback to prevent recreation of function on every render
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = activeView === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const payload = activeView === 'signin' 
        ? { phone: formData.phone, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (activeView === 'signin') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          if (data.user.isAdmin) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        } else {
          setMessage(`Account created successfully! Your referral code: ${data.referralCode}`);
          setActiveView('signin');
          setFormData({ username: '', email: '', phone: '', password: '', referralCode: '' });
        }
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeView, formData, router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 z-0">
        <Image
          src="/10.jpg"
          alt="Background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>
      <div className="w-full h-full min-h-screen flex items-center justify-center relative z-10">
        {activeView === 'welcome' && (
          <WelcomeScreen setActiveView={setActiveView} />
        )}
        {activeView === 'signin' && (
          <SignInForm 
            setActiveView={setActiveView}
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            message={message}
          />
        )}
        {activeView === 'signup' && (
          <SignUpForm 
            setActiveView={setActiveView}
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            message={message}
          />
        )}
      </div>
    </div>
  );
}