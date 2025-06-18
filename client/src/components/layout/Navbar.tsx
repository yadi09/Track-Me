import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-semibold text-[#2B3674]">
              Track Yadamzer
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:space-x-8">
            <Link
              to="/dashboard"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                location.pathname === '/dashboard'
                  ? 'bg-[#2B3674] text-white rounded-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                location.pathname === '/projects'
                  ? 'bg-[#2B3674] text-white rounded-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Projects
            </Link>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Hi, Yadamzer</span>
            <button className="text-gray-600 hover:text-gray-900" onClick={handleLogout}>
              Logout
            </button>
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/dashboard'
                  ? 'bg-[#2B3674] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/projects'
                  ? 'bg-[#2B3674] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Projects
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 