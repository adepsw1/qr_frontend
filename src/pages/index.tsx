import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [animateCards, setAnimateCards] = useState(false);
  const [counter1, setCounter1] = useState(0);
  const [counter2, setCounter2] = useState(0);
  const [counter3, setCounter3] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if vendor is already logged in
    const token = localStorage.getItem('accessToken');
    const vendorId = localStorage.getItem('vendorId');
    
    if (token && vendorId) {
      // Vendor is logged in, redirect to dashboard
      router.push('/vendor/dashboard');
      return;
    }
    
    setCheckingAuth(false);
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    setAnimateCards(true);
    
    // Animated counters
    const interval = setInterval(() => {
      setCounter1(prev => (prev < 5000 ? prev + 50 : 5000));
      setCounter2(prev => (prev < 50000 ? prev + 500 : 50000));
      setCounter3(prev => (prev < 98 ? prev + 1 : 98));
    }, 10);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [router]);

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>QR-to-Offer Platform - Transform Customer Engagement</title>
        <meta name="description" content="Premium QR to WhatsApp offers platform for modern businesses" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </Head>

      <main className="overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 min-h-screen">
        {/* Fixed Navigation */}
        <nav className="fixed top-0 w-full bg-gradient-to-r from-slate-950/90 via-indigo-950/90 to-slate-950/90 backdrop-blur-xl z-50 border-b border-indigo-500/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5 flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 group-hover:shadow-indigo-500/70 transition">
                <span className="text-white font-bold text-lg sm:text-2xl">✨</span>
              </div>
              <span className="font-black text-base sm:text-xl bg-gradient-to-r from-violet-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
                QR-Offer
              </span>
            </div>
            <div className="hidden md:flex gap-6 lg:gap-8">
              <a href="#features" className="text-indigo-200 hover:text-violet-300 transition font-medium text-sm">Features</a>
              <a href="#how-it-works" className="text-indigo-200 hover:text-violet-300 transition font-medium text-sm">Process</a>
              <a href="#benefits" className="text-indigo-200 hover:text-violet-300 transition font-medium text-sm">Benefits</a>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center">
              <a href="/vendor/login" className="text-indigo-200 hover:text-violet-300 transition font-medium text-xs sm:text-sm px-3 py-2 rounded-lg hover:bg-indigo-900/30">
                Vendor Login
              </a>
              <a href="/vendor/register" className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm transition shadow-lg shadow-indigo-500/50">
                Start Free
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section - Premium with Animations */}
        <section className="pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 lg:pb-32 bg-gradient-to-br from-slate-950 via-indigo-900 to-slate-950 relative overflow-hidden min-h-screen flex items-center">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-violet-500 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-float"></div>
            <div className="absolute -bottom-10 sm:bottom-20 -left-10 sm:left-20 w-48 sm:w-96 h-48 sm:h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-float animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/4 sm:left-1/3 w-48 sm:w-96 h-48 sm:h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float animation-delay-4000"></div>
            
            {/* Grid Background */}
            <div className="absolute inset-0 bg-grid opacity-5"></div>
          </div>

          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-6 sm:space-y-8 animate-slideInLeft">
                <div className="space-y-3 sm:space-y-4">
                  <div className="inline-block">
                    <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-opacity-20 text-violet-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold border border-violet-500/50 backdrop-blur-sm hover:bg-opacity-30 transition cursor-pointer">
                      ✨ PREMIUM PLATFORM
                    </span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight">
                    Transform QR Scans Into
                    <span className="block h-full bg-gradient-to-r from-violet-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent animate-shimmer">
                      Revenue Growth
                    </span>
                  </h1>
                </div>

                <p className="text-base sm:text-lg lg:text-xl text-indigo-100 max-w-lg leading-relaxed font-light">
                  Engage customers instantly with personalized WhatsApp offers. Increase sales, boost loyalty, and scale your business with our premium QR-to-Offer platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-8">
                  <a href="/vendor/register" className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg sm:rounded-xl font-bold overflow-hidden shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/75 transition text-center">
                    <span className="relative z-10">Get Started Free →</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  </a>
                  <button className="group relative px-6 sm:px-8 py-3 sm:py-4 border-2 border-violet-400 text-violet-200 rounded-lg sm:rounded-xl font-bold hover:bg-violet-400 hover:text-slate-950 transition duration-300 flex items-center justify-center gap-2">
                    <span className="relative z-10">Watch Demo</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Stats with Animation */}
                <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-indigo-500/30">
                  <div className="animate-fadeInUp animation-delay-100">
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-violet-400">{counter1.toLocaleString()}+</p>
                    <p className="text-indigo-300 text-xs sm:text-sm font-medium mt-1">Active Vendors</p>
                  </div>
                  <div className="animate-fadeInUp animation-delay-200">
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-indigo-400">{counter2.toLocaleString()}+</p>
                    <p className="text-indigo-300 text-xs sm:text-sm font-medium mt-1">Daily Offers</p>
                  </div>
                  <div className="animate-fadeInUp animation-delay-300">
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-400">{counter3}%</p>
                    <p className="text-indigo-300 text-xs sm:text-sm font-medium mt-1">Engagement</p>
                  </div>
                </div>
              </div>

              {/* Right Side - Premium Card */}
              <div className="relative hidden md:block animate-slideInRight">
                <div className="relative">
                  {/* Floating Cards */}
                  <div className="absolute -top-8 -left-8 w-48 h-48 lg:w-64 lg:h-64 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl blur-3xl animate-pulse"></div>
                  
                  {/* Main Card */}
                  <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-indigo-500/30 shadow-2xl transform hover:scale-105 transition duration-500">
                    <div className="absolute -top-4 -right-4 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-violet-400 to-indigo-400 rounded-full opacity-20 blur-xl animate-blob"></div>
                    
                    <div className="relative space-y-4 lg:space-y-6">
                      <div className="flex items-center justify-between p-3 lg:p-4 bg-indigo-900/50 rounded-lg lg:rounded-xl backdrop-blur-sm border border-indigo-500/30">
                        <div>
                          <p className="text-indigo-300 text-xs">Total Revenue</p>
                          <p className="text-xl lg:text-2xl font-black text-violet-400">$245,890</p>
                        </div>
                        <div className="text-3xl lg:text-4xl">📊</div>
                      </div>

                      <div className="flex items-center justify-between p-3 lg:p-4 bg-indigo-900/50 rounded-lg lg:rounded-xl backdrop-blur-sm border border-indigo-500/30 hover:border-violet-500/50 transition">
                        <div>
                          <p className="text-indigo-300 text-xs">Conversion Rate</p>
                          <p className="text-xl lg:text-2xl font-black text-indigo-400">34.2%</p>
                        </div>
                        <div className="text-3xl lg:text-4xl">⚡</div>
                      </div>

                      <div className="flex items-center justify-between p-3 lg:p-4 bg-indigo-900/50 rounded-lg lg:rounded-xl backdrop-blur-sm border border-indigo-500/30 hover:border-blue-500/50 transition">
                        <div>
                          <p className="text-indigo-300 text-xs">Customer Loyalty</p>
                          <p className="text-xl lg:text-2xl font-black text-blue-400">92%</p>
                        </div>
                        <div className="text-3xl lg:text-4xl">❤️</div>
                      </div>

                      {/* Floating Circle Animation */}
                      <div className="pt-3 lg:pt-4 flex gap-2 justify-center">
                        <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Premium Grid */}
        <section id="features" className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-slate-950 to-indigo-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-5"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20 space-y-3 sm:space-y-4 animate-fadeInUp">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white">
                Premium Features
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-indigo-200 max-w-2xl mx-auto">
                Everything you need to create exceptional customer experiences
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-6">
              {[
                {
                  icon: '🎯',
                  title: 'Smart QR Generation',
                  description: 'Create branded QR codes instantly',
                  gradient: 'from-violet-500 to-indigo-500'
                },
                {
                  icon: '💬',
                  title: 'WhatsApp Integration',
                  description: 'Direct customer engagement',
                  gradient: 'from-indigo-500 to-blue-500'
                },
                {
                  icon: '📊',
                  title: 'Real-time Analytics',
                  description: 'Track every offer interaction',
                  gradient: 'from-blue-500 to-purple-500'
                },
                {
                  icon: '🎨',
                  title: 'Custom Offers',
                  description: 'Flexible discount management',
                  gradient: 'from-violet-600 to-indigo-600'
                },
                {
                  icon: '🔒',
                  title: 'Enterprise Security',
                  description: 'Bank-grade data protection',
                  gradient: 'from-indigo-600 to-blue-600'
                },
                {
                  icon: '⚡',
                  title: 'Lightning Speed',
                  description: 'Sub-second response times',
                  gradient: 'from-blue-600 to-purple-600'
                }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative"
                >
                  <div className={`absolute -inset-1 bg-gradient-to-r ${feature.gradient} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition duration-500`}></div>
                  <div className="relative bg-slate-900 border border-indigo-500/30 group-hover:border-indigo-400/60 rounded-xl sm:rounded-2xl p-6 sm:p-8 transition duration-500 transform group-hover:scale-105">
                    <div className="text-4xl sm:text-5xl mb-4 transform group-hover:scale-125 transition duration-300">{feature.icon}</div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-indigo-200">{feature.description}</p>
                    <div className={`mt-4 h-1 w-8 bg-gradient-to-r ${feature.gradient} rounded-full group-hover:w-full transition duration-500`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Interactive Timeline */}
        <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-indigo-950 to-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-3 sm:mb-4">
                Simple 4-Step Process
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-indigo-200">Get started in minutes, not days</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
              {[
                { num: '01', title: 'Create', desc: 'Design offers in seconds' },
                { num: '02', title: 'Generate', desc: 'Get branded QR codes' },
                { num: '03', title: 'Deploy', desc: 'Share across channels' },
                { num: '04', title: 'Track', desc: 'Monitor real-time results' }
              ].map((step, idx) => (
                <div key={idx} className="group relative animate-slideInUp" style={{animationDelay: `${idx * 100}ms`}}>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-50 blur-xl transition duration-500"></div>
                    
                    <div className="relative bg-slate-900 border-2 border-indigo-500/30 group-hover:border-violet-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 transition duration-500">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-3 sm:mb-4">
                        {step.num}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-sm sm:text-base text-indigo-200">{step.desc}</p>
                      
                      <div className="mt-4 sm:mt-6 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full w-0 group-hover:w-full transition duration-500"></div>
                    </div>
                  </div>
                  
                  {idx < 3 && (
                    <div className="hidden lg:block absolute top-1/3 -right-3 w-6 h-6">
                      <svg className="w-full h-full text-violet-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section - Comparison */}
        <section id="benefits" className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-slate-950 to-indigo-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white text-center mb-12 sm:mb-16 lg:mb-20">
              Why Choose Us?
            </h2>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Left - Benefits List */}
              <div className="space-y-3 sm:space-y-4 animate-slideInLeft">
                {[
                  { icon: '🚀', title: '300% Engagement Boost', desc: 'Proven results' },
                  { icon: '💰', title: '250% Sales Increase', desc: 'Real revenue growth' },
                  { icon: '🎯', title: 'Precision Targeting', desc: 'Right offer, right time' },
                  { icon: '📱', title: 'Mobile Optimized', desc: 'Works everywhere' },
                  { icon: '🔐', title: 'Bank-Grade Security', desc: 'Your data is safe' },
                  { icon: '⚡', title: 'Lightning Fast', desc: 'Sub-second delivery' }
                ].map((item, idx) => (
                  <div key={idx} className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-indigo-900/30 transition cursor-pointer animate-slideInLeft" style={{animationDelay: `${idx * 50}ms`}}>
                    <div className="text-2xl sm:text-3xl group-hover:scale-110 transition flex-shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-base sm:text-lg group-hover:text-violet-400 transition">{item.title}</p>
                      <p className="text-indigo-300 text-xs sm:text-sm">{item.desc}</p>
                    </div>
                    <div className="w-1 h-full bg-gradient-to-b from-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition rounded-full flex-shrink-0"></div>
                  </div>
                ))}
              </div>

              {/* Right - Stats Grid */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 animate-slideInRight">
                {[
                  { value: '↑250%', label: 'Sales Growth', color: 'from-violet-500' },
                  { value: '↑85%', label: 'Customer Loyalty', color: 'from-indigo-500' },
                  { value: '<2s', label: 'Response Time', color: 'from-blue-500' },
                  { value: '99.9%', label: 'Uptime SLA', color: 'from-purple-500' }
                ].map((stat, idx) => (
                  <div key={idx} className={`bg-gradient-to-br ${stat.color} to-transparent p-6 sm:p-8 rounded-lg sm:rounded-2xl text-white group cursor-pointer hover:scale-110 transition`}>
                    <p className="text-xs sm:text-sm opacity-80 mb-2">{stat.label}</p>
                    <p className="text-3xl sm:text-4xl font-black group-hover:scale-125 transition origin-left">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials - Coming Soon */}
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-indigo-950 to-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4">Loved by Industry Leaders</h2>
            <p className="text-base sm:text-lg lg:text-xl text-indigo-200 mb-12 sm:mb-16 lg:mb-16">Join thousands of successful businesses</p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-slate-900 border border-indigo-500/30 rounded-lg sm:rounded-2xl p-6 sm:p-8 hover:border-violet-500/50 transition group">
                  <p className="text-indigo-200 mb-6 italic text-sm sm:text-base">"Exceptional platform that transformed our customer engagement strategy."</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-400 to-indigo-400 rounded-full group-hover:scale-110 transition flex-shrink-0"></div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-white text-sm sm:text-base">Business Owner</p>
                      <p className="text-indigo-300 text-xs sm:text-sm">Success Story #{item}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vendor Portal Section */}
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-950 relative overflow-hidden border-t border-indigo-500/20">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float animation-delay-2000"></div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Side */}
              <div className="space-y-6 sm:space-y-8 animate-slideInLeft">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                    Already a Vendor?
                  </h2>
                  <p className="text-lg text-indigo-200 mb-6">
                    Access your dashboard to manage offers, track analytics, and grow your business with our powerful vendor platform.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-violet-300">Vendor Features:</h3>
                  <ul className="space-y-2">
                    {[
                      '📊 Real-time Analytics Dashboard',
                      '🎯 Advanced Offer Management',
                      '📱 Custom Micro-Web Store',
                      '💳 Payment & Redemption Tracking',
                      '👥 Customer Engagement Tools',
                      '📈 Performance Reports'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-indigo-200">
                        <span className="text-lg">{feature.split(' ')[0]}</span>
                        <span>{feature.split(' ').slice(1).join(' ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <a href="/vendor/login" className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg sm:rounded-xl font-bold overflow-hidden shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/75 transition text-center">
                    <span className="relative z-10">Vendor Login →</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  </a>
                  <a href="/vendor/register" className="group px-6 sm:px-8 py-3 sm:py-4 border-2 border-violet-400 text-violet-200 rounded-lg sm:rounded-xl font-bold hover:bg-violet-400/10 transition text-center">
                    New to QR-Offer?
                  </a>
                </div>
              </div>

              {/* Right Side - Feature Card */}
              <div className="relative animate-slideInRight">
                <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-indigo-500/30 shadow-2xl">
                  <div className="absolute -top-4 -right-4 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-full opacity-20 blur-xl animate-blob"></div>
                  
                  <div className="relative space-y-4 lg:space-y-6">
                    <div className="text-5xl lg:text-6xl mb-4">📦</div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl lg:text-2xl font-black text-white">
                        Vendor Dashboard
                      </h3>
                      <p className="text-indigo-300 text-sm lg:text-base">
                        Complete control over your offers, customer engagement, and business growth metrics.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-indigo-500/30">
                      <div className="flex items-center gap-3 p-3 bg-indigo-900/50 rounded-lg">
                        <span className="text-2xl">📊</span>
                        <div>
                          <p className="text-indigo-300 text-xs">Active Offers</p>
                          <p className="text-lg font-bold text-violet-400">Manage 1000s</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-900/50 rounded-lg">
                        <span className="text-2xl">👥</span>
                        <div>
                          <p className="text-indigo-300 text-xs">Customer Reach</p>
                          <p className="text-lg font-bold text-indigo-400">Unlimited</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-900/50 rounded-lg">
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="text-indigo-300 text-xs">Revenue Tracking</p>
                          <p className="text-lg font-bold text-blue-400">Real-time</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA - Premium */}
        <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-slate-950 via-indigo-900 to-slate-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-violet-500 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-float"></div>
            <div className="absolute -bottom-10 sm:bottom-0 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-float animation-delay-2000"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-4 sm:mb-6 animate-slideInDown">
              Ready to Transform?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-indigo-100 mb-8 sm:mb-12 max-w-2xl mx-auto animate-slideInUp">
              Join leading businesses using our platform to drive growth
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap animate-slideInUp animation-delay-200">
              <a href="/vendor/register" className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg sm:rounded-xl font-bold overflow-hidden shadow-2xl shadow-indigo-500/50 text-center">
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition"></div>
              </a>
              <a href="/admin/login" className="group px-6 sm:px-8 py-3 sm:py-4 border-2 border-violet-400 text-violet-200 rounded-lg sm:rounded-xl font-bold hover:bg-violet-400/10 transition text-center">
                Admin Login
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950 border-t border-indigo-500/20 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
              <div>
                <h3 className="font-bold text-white mb-4 text-sm lg:text-base">Product</h3>
                <ul className="space-y-2 text-indigo-300 text-xs lg:text-sm">
                  <li><a href="#" className="hover:text-violet-400 transition">Features</a></li>
                  <li><a href="#" className="hover:text-violet-400 transition">Pricing</a></li>
                  <li><a href="#" className="hover:text-violet-400 transition">API</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white mb-4 text-sm lg:text-base">Company</h3>
                <ul className="space-y-2 text-indigo-300 text-xs lg:text-sm">
                  <li><a href="#" className="hover:text-violet-400 transition">About</a></li>
                  <li><a href="#" className="hover:text-violet-400 transition">Blog</a></li>
                  <li><a href="#" className="hover:text-violet-400 transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white mb-4 text-sm lg:text-base">Legal</h3>
                <ul className="space-y-2 text-indigo-300 text-xs lg:text-sm">
                  <li><a href="#" className="hover:text-violet-400 transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-violet-400 transition">Terms</a></li>
                  <li><a href="#" className="hover:text-violet-400 transition">Security</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white mb-4 text-sm lg:text-base">Follow</h3>
                <ul className="space-y-2 text-indigo-300 text-xs lg:text-sm">
                  <li><a href="#" className="hover:text-violet-400 transition">Twitter</a></li>
                  <li><a href="#" className="hover:text-violet-400 transition">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-violet-400 transition">GitHub</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-indigo-500/20 pt-8 text-center text-indigo-300 text-xs sm:text-sm">
              <p>&copy; 2026 QR-Offer Platform. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-30px) translateX(10px); }
          50% { transform: translateY(-60px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(20px); }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .bg-grid {
          background-image:
            linear-gradient(0deg, transparent 24%, rgba(55, 65, 81, .05) 25%, rgba(55, 65, 81, .05) 26%, transparent 27%, transparent 74%, rgba(55, 65, 81, .05) 75%, rgba(55, 65, 81, .05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(55, 65, 81, .05) 25%, rgba(55, 65, 81, .05) 26%, transparent 27%, transparent 74%, rgba(55, 65, 81, .05) 75%, rgba(55, 65, 81, .05) 76%, transparent 77%, transparent);
          background-size: 50px 50px;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out;
        }

        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out;
        }

        .animate-slideInDown {
          animation: slideInDown 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }

        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </>
  );
}
