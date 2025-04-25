import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemSecondaryAction,
  CircularProgress,
  Chip,
  Paper,
  FormHelperText
} from '@mui/material';
import { 
  AttachFile as AttachFileIcon, 
  Delete as DeleteIcon, 
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

/**
 * File uploader component with preview and validation
 * 
 * @param {Object} props
 * @param {Array} props.files - Array of current files
 * @param {Function} props.onChange - Callback when files change
 * @param {Number} props.maxFiles - Maximum files allowed
 * @param {Number} props.maxSizeInMb - Maximum file size in MB
 * @param {Array} props.acceptedFileTypes - Array of accepted file types
 * @param {Boolean} props.error - Whether there is an error
 * @param {String} props.helperText - Helper text to display
 */
const FileUploader = ({
  files = [],
  onChange,
  maxFiles = 5,
  maxSizeInMb = 10,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/gif'],
  error = false,
  helperText = ''
}) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const maxSizeInBytes = maxSizeInMb * 1024 * 1024;
  
  // Process files for upload
  const processFiles = (selectedFiles) => {
    if (!selectedFiles || !selectedFiles.length) return;
    
    // Don't process if we've reached the max files
    if (files.length >= maxFiles) {
      return;
    }
    
    setLoading(true);
    
    const filesToProcess = Array.from(selectedFiles).slice(0, maxFiles - files.length);
    const newFiles = [];
    const fileReadPromises = [];
    
    filesToProcess.forEach(file => {
      // Check file size
      if (file.size > maxSizeInBytes) {
        alert(`File "${file.name}" exceeds the maximum file size of ${maxSizeInMb}MB`);
        return;
      }
      
      // Check file type
      if (!acceptedFileTypes.includes(file.type)) {
        alert(`File "${file.name}" has an invalid file type. Accepted types are: ${acceptedFileTypes.join(', ')}`);
        return;
      }
      
      // Create a promise to read the file
      const filePromise = new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const fileWithPreview = {
            id: uuidv4(),
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.type.startsWith('image/') ? e.target.result : null
          };
          
          newFiles.push(fileWithPreview);
          resolve();
        };
        
        reader.readAsDataURL(file);
      });
      
      fileReadPromises.push(filePromise);
    });
    
    // Wait for all files to be processed
    Promise.all(fileReadPromises).then(() => {
      onChange([...files, ...newFiles]);
      setLoading(false);
    });
  };
  
  // Handle file selection from input
  const handleFileChange = (event) => {
    processFiles(event.target.files);
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Handle file drop
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    
    if (event.dataTransfer.files) {
      processFiles(event.dataTransfer.files);
    }
  };
  
  // Handle file drag events
  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  // Remove a file from the list
  const handleRemoveFile = (fileId) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    onChange(updatedFiles);
  };
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };
  
  // Get the appropriate icon for a file type
  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <PdfIcon color="error" />;
    } else if (fileType.startsWith('image/')) {
      return <ImageIcon color="primary" />;
    } else {
      return <FileIcon color="action" />;
    }
  };
  
  return (
    <Box>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept={acceptedFileTypes.join(',')}
      />
      
      <Paper
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        elevation={dragActive ? 3 : 1}
        sx={{
          p: 3,
          border: theme => `2px dashed ${dragActive 
            ? theme.palette.primary.main 
            : error 
              ? theme.palette.error.main 
              : theme.palette.divider}`,
          borderRadius: 1,
          background: dragActive ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <AttachFileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          
          <Typography variant="body1" color="textPrimary" gutterBottom>
            Drag and drop files here, or click to select files
          </Typography>
          
          <Typography variant="caption" color="textSecondary">
            Max {maxFiles} files, up to {maxSizeInMb}MB each
          </Typography>
          
          <Box mt={1} display="flex" flexWrap="wrap" gap={0.5} justifyContent="center">
            {acceptedFileTypes.map((type, index) => (
              <Chip
                key={index}
                label={type.replace('image/', '').replace('application/', '')}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
          
          {loading && (
            <CircularProgress size={24} sx={{ mt: 2 }} />
          )}
        </Box>
      </Paper>
      
      {helperText && (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      )}
      
      {files.length > 0 && (
        <List dense sx={{ width: '100%', mt: 2 }}>
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon>
                {getFileIcon(file.type)}
              </ListItemIcon>
              
              <ListItemText
                primary={file.name}
                secondary={formatFileSize(file.size)}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 'medium'
                }}
                secondaryTypographyProps={{
                  variant: 'caption'
                }}
              />
              
              {file.preview && (
                <Box sx={{ mr: 2 }}>
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    style={{ 
                      width: 40, 
                      height: 40, 
                      objectFit: 'cover',
                      borderRadius: 4
                    }} 
                  />
                </Box>
              )}
              
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => handleRemoveFile(file.id)}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      {files.length > 0 && (
        <Box display="flex" justifyContent="space-between" mt={1} alignItems="center">
          <Typography variant="caption" color="textSecondary">
            {files.length} of {maxFiles} files selected
          </Typography>
          
          <Button 
            size="small" 
            variant="outlined" 
            color="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= maxFiles}
          >
            Add More
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FileUploader; 