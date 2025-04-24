import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const Sidebar = ({ mobileOpen, handleDrawerToggle, open }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <HomeIcon className="w-5 h-5" />,
      path: '/',
      visible: true,
    },
    {
      text: 'All Invoices',
      icon: <DescriptionIcon className="w-5 h-5" />,
      path: '/invoices',
      visible: true,
    },
    {
      text: 'Create Invoice',
      icon: <AddIcon className="w-5 h-5" />,
      path: '/invoices/create',
      visible: true,
    },
    { type: 'divider', visible: true },
    {
      text: 'Pending',
      icon: <AccessTimeIcon className="w-5 h-5" />,
      path: '/invoices?status=pending',
      visible: true,
    },
    {
      text: 'Approved',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      path: '/invoices?status=approved',
      visible: true,
    },
    {
      text: 'Rejected',
      icon: <CancelIcon className="w-5 h-5" />,
      path: '/invoices?status=rejected',
      visible: true,
    },
    {
      text: 'Paid',
      icon: <CreditCardIcon className="w-5 h-5" />,
      path: '/invoices?status=paid',
      visible: true,
    },
    { type: 'divider', visible: user?.role === 'admin' },
    {
      text: 'User Management',
      icon: <PeopleIcon className="w-5 h-5" />,
      path: '/users',
      visible: user?.role === 'admin',
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-primary-main">Invoice Tracker</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-1">
          {menuItems
            .filter((item) => item.visible)
            .map((item, index) => {
              if (item.type === 'divider') {
                return <hr key={`divider-${index}`} className="my-4 border-gray-200 dark:border-gray-700" />;
              }

              return (
                <a
                  key={item.text}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                    if (mobileOpen) {
                      handleDrawerToggle();
                    }
                  }}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium
                    ${isActive(item.path) 
                      ? 'bg-gray-100 text-primary-main dark:bg-gray-700 dark:text-primary-light' 
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'}
                  `}
                >
                  <span className={`mr-3 ${isActive(item.path) ? 'text-primary-main dark:text-primary-light' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.icon}
                  </span>
                  {item.text}
                </a>
              );
            })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div 
        className={`
          md:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300
          ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={handleDrawerToggle}
      />

      <div
        className={`
          md:hidden fixed inset-y-0 left-0 z-40 w-64 transition duration-300 transform
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div
        className={`
          hidden md:block fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 transform
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar; 