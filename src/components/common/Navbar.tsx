import React from 'react';
import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from './Button';
import { FileText, LogOut, User, LayoutDashboard, FileSearch } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-lg shadow-lg group-hover:shadow-xl transition-shadow">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Qizz
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>My Forms</span>
                  </Button>
                </Link>
                <Link to="/forms">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <FileSearch className="w-4 h-4" />
                    <span>Browse</span>
                  </Button>
                </Link>

                {/* User Menu */}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/forms">
                  <Button variant="ghost" size="sm">Browse Forms</Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/auth/register">
                  <Button variant="primary" size="sm" className="shadow-md">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
