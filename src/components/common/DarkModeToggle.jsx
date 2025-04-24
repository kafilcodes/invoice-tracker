import { IconButton, Tooltip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { toggleDarkMode } from '../../redux/slices/uiSlice';

const DarkModeToggle = () => {
  const { darkMode } = useSelector((state) => state.ui);
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(toggleDarkMode());
  };

  return (
    <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton onClick={handleToggle} color="inherit">
        {darkMode ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};

export default DarkModeToggle; 