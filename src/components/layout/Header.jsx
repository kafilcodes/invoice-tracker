import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { logout } from '../../redux/slices/authSlice';
import { toggleSidebar, toggleDarkMode } from '../../redux/slices/uiSlice';

const Header = ({ handleDrawerToggle, open }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    // Navigate to profile page if implemented
  };

  return (
    <header className="bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700 sticky top-0 z-10">
      <div className="px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            onClick={handleDrawerToggle}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          
          {/* Desktop menu button */}
          <button
            className="hidden md:block p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => dispatch(toggleSidebar())}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          
          <h1 className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">
            Invoice Tracker
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle */}
          <button
            className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => dispatch(toggleDarkMode())}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <WbSunnyIcon className="h-5 w-5" />
            ) : (
              <DarkModeIcon className="h-5 w-5" />
            )}
          </button>
          
          {/* Notifications */}
          <button
            className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            title="Notifications"
          >
            <NotificationsIcon className="h-5 w-5" />
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button
              className="flex items-center p-0.5 rounded-full bg-gray-200 dark:bg-gray-700 focus:outline-none"
              onClick={handleMenuToggle}
              aria-expanded={menuOpen}
            >
              {user?.name ? (
                <span className="h-8 w-8 rounded-full text-white bg-primary-main flex items-center justify-center text-sm font-medium uppercase">
                  {user.name.charAt(0)}
                </span>
              ) : (
                <AccountCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              )}
            </button>
            
            {menuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={handleProfile}
                    className="flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    <PersonIcon className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    <LogoutIcon className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 