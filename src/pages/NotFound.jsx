import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <ErrorOutlineIcon className="w-24 h-24 text-error-main mb-6" />
      
      <h1 className="text-6xl font-bold mb-2">404</h1>
      
      <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      
      <button
        className="btn btn-primary"
        onClick={() => navigate('/')}
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default NotFound; 