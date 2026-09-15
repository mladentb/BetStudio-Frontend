'use client';

import Link from 'next/link';
import { Trophy, Globe, Zap, LogIn, UserPlus, Play, Shield, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">BetStudio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-gray-600 dark:text-gray-300 hover:text-primary-600 font-medium"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Premium Sports
          <span className="text-primary-600"> Streaming Platform</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
          Purchase exclusive streaming rights for live sports events worldwide.
          Basketball, Football, Volleyball, Handball and more.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="btn-primary px-8 py-3 text-lg flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start Free Trial
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 text-center shadow-lg border border-gray-100 dark:border-dark-700">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Multiple Sports</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Basketball, Football, Volleyball, Handball and more
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 text-center shadow-lg border border-gray-100 dark:border-dark-700">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Globe className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Global Coverage</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Regional pricing for all continents
            </p>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 text-center shadow-lg border border-gray-100 dark:border-dark-700">
            <div className="h-16 w-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Easy Setup</h3>
            <p className="text-gray-600 dark:text-gray-400">
              RTMP/SRT streaming with instant delivery
            </p>
          </div>
        </div>
      </section>

      {/* CTA Cards */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Existing Customer */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <LogIn className="h-6 w-6" />
              <h3 className="text-xl font-bold">Existing Customer</h3>
            </div>
            <p className="text-blue-100 mb-6">
              Sign in to access your account and browse available matches
            </p>
            <Link 
              href="/login" 
              className="w-full bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </Link>
          </div>

          {/* New Customer */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="h-6 w-6" />
              <h3 className="text-xl font-bold">New Customer</h3>
            </div>
            <p className="text-green-100 mb-6">
              Create a new account to start purchasing streaming rights
            </p>
            <Link 
              href="/register" 
              className="w-full bg-white text-green-600 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Why Choose BetStudio?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Platform</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Enterprise-grade security for all transactions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">24/7 Support</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Round-the-clock technical assistance
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Instant Delivery</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Get streaming links immediately after purchase
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-dark-700 mt-16">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} BetStudio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
