import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, LinearProgress, Paper, IconButton, Tooltip, Stack, Chip } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { 
  isFileTypeAllowed, 
  isFileSizeValid,
  createFilePreview,
  revokeFilePreview,
  formatFileSize
} from '../utils/fileUpload';

const FileUpload = ({ 
  onFileChange, 
  disabled = false,
  maxFiles = 5, 
  maxSize = 20 * 1024 * 1024, 
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'] 
}) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState({});
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(preview => {
        if (preview) {
          revokeFilePreview(preview);
        }
      });
    };
  }, [previews]);
  
  // Handle file selection
  const handleFileChange = (selectedFiles) => {
    // Clear error
    setError(null);
    
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const fileList = Array.from(selectedFiles);
    
    // Check if adding these files would exceed max files limit
    if (files.length + fileList.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }
    
    const newFiles = [];
    const newPreviews = {...previews};
    
    // Validate each file
    for (const file of fileList) {
      // Check file type
      const fileType = file.type.split('/')[1].toLowerCase();
      const isTypeAllowed = acceptedTypes.some(type => 
        type.includes(fileType) || (type === '.jpg' && fileType === 'jpeg')
      );
      
      if (!isTypeAllowed) {
        setError(`Only PDF and image files are allowed.`);
        continue;
      }
      
      // Check file size
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds the maximum size of ${maxSize / (1024 * 1024)}MB.`);
        continue;
      }
      
      // Add valid file
      newFiles.push(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        newPreviews[file.name] = createFilePreview(file);
      }
    }
    
    // Update state with new files
    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      setPreviews(newPreviews);
      onFileChange(updatedFiles);
    }
  };
  
  // Handle file input change
  const handleInputChange = (e) => {
    const selectedFiles = e.target.files;
    handleFileChange(selectedFiles);
  };
  
  // Handle file button click
  const handleButtonClick = () => {
    if (!disabled) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file removal
  const handleRemoveFile = (index) => {
    const file = files[index];
    
    // Revoke preview URL if exists
    if (previews[file.name]) {
      revokeFilePreview(previews[file.name]);
      
      // Remove preview from state
      const newPreviews = {...previews};
      delete newPreviews[file.name];
      setPreviews(newPreviews);
    }
    
    // Remove file from state
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    // Notify parent component
    onFileChange(newFiles);
  };
  
  // Handle remove all files
  const handleRemoveAll = () => {
    // Revoke all preview URLs
    Object.values(previews).forEach(preview => {
      if (preview) {
        revokeFilePreview(preview);
      }
    });
    
    // Clear files state
    setFiles([]);
    setPreviews({});
    fileInputRef.current.value = '';
    
    // Notify parent component
    onFileChange([]);
  };
  
  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!disabled) {
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFileChange(droppedFiles);
      }
    }
  };
  
  // Get file icon based on type
  const getFileIcon = (file) => {
    if (!file) return <InsertDriveFileIcon fontSize="large" />;
    
    if (file.type === 'application/pdf') {
      return <PdfIcon fontSize="large" color="error" />;
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon fontSize="large" color="primary" />;
    } else {
      return <InsertDriveFileIcon fontSize="large" color="action" />;
    }
  };
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
        multiple
        disabled={disabled}
      />
      
      {/* Upload area */}
      <Paper
        variant="outlined"
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          opacity: disabled ? 0.7 : 1,
          '&:hover': {
            borderColor: disabled ? 'divider' : 'primary.main',
            backgroundColor: disabled ? 'background.paper' : 'action.hover'
          }
        }}
        onClick={handleButtonClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Drag & Drop Files Here
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Or click to browse files
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Supported formats: PDF, JPG, PNG
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max {maxFiles} files • Max {maxSize / (1024 * 1024)}MB per file
          </Typography>
        </Box>
        <Button
          variant="contained"
          component="span"
          size="small"
          startIcon={<UploadFileIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleButtonClick();
          }}
          sx={{ mt: 2 }}
          disabled={disabled || files.length >= maxFiles}
        >
          Browse Files
        </Button>
        
        {error && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ display: 'block', mt: 1 }}
          >
            {error}
          </Typography>
        )}
      </Paper>
      
      {/* File list */}
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </Typography>
            <Button 
              size="small" 
              color="error" 
              onClick={handleRemoveAll}
              disabled={disabled}
            >
              Remove All
            </Button>
          </Box>
          
          <Stack spacing={1}>
            {files.map((file, index) => (
              <Paper
                key={`${file.name}-${index}`}
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <Box sx={{ mr: 2, minWidth: 50, textAlign: 'center' }}>
                  {file.type.startsWith('image/') && previews[file.name] ? (
                    <Box
                      component="img"
                      src={previews[file.name]}
                      alt="File preview"
                      sx={{
                        width: 50,
                        height: 50,
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                    />
                  ) : (
                    getFileIcon(file)
                  )}
                </Box>
                
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  <Typography variant="subtitle2" noWrap>
                    {file.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                    <Chip 
                      label={file.type.split('/')[1].toUpperCase()} 
                      size="small" 
                      color={file.type.includes('pdf') ? 'error' : 'primary'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{ flexGrow: 1, mr: 1, height: 4, borderRadius: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Ready
                    </Typography>
                  </Box>
                </Box>
                
                <Tooltip title="Remove file">
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    sx={{ ml: 1 }}
                    disabled={disabled}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload; 