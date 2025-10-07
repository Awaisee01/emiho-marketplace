"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Zap, Menu, X, LogOut, User, Store, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
   <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm rounded-lg m-3 sm:m-5' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Emiho</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/marketplace" className="text-slate-600 hover:text-slate-900 transition-colors">
              Marketplace
            </Link>
            <Link href="/docs" className="text-slate-600 hover:text-slate-900 transition-colors">
              Documentation
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  My Dashboard
                </Link>
                <Link href="/profile" className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <Link href="/marketplace" className="block text-slate-600 hover:text-slate-900 transition-colors">
              Marketplace
            </Link>
            <Link href="/docs" className="block text-slate-600 hover:text-slate-900 transition-colors">
              Documentation
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-slate-600 hover:text-slate-900 transition-colors">
                  My Dashboard
                </Link>
                <Link href="/profile" className="block text-slate-600 hover:text-slate-900 transition-colors">
                  Profile
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
   </>
  );
}
