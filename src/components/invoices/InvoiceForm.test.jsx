import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import InvoiceForm from './InvoiceForm';

// Mock the necessary dependencies
jest.mock('../../firebase/config', () => ({
  db: {}
}));

jest.mock('../../utils/activityLogger', () => ({
  logActivity: jest.fn().mockResolvedValue(true),
  ACTIVITY_TYPES: {
    INVOICE_CREATED: 'Invoice created'
  }
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn().mockResolvedValue({ id: 'mocked-invoice-id' }),
  collection: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn().mockResolvedValue({}),
  serverTimestamp: jest.fn().mockReturnValue('mocked-timestamp')
}));

// Mock the uploadMultipleFiles function from fileUpload utility
jest.mock('../../utils/fileUpload', () => ({
  uploadMultipleFiles: jest.fn().mockResolvedValue([
    {
      name: 'test-file.pdf',
      path: 'mocked-path',
      url: 'mocked-url',
      type: 'application/pdf',
      size: 1024,
      createdAt: new Date().toISOString()
    }
  ])
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = initialState.auth || {}) => state
    },
    preloadedState: initialState
  });
};

const mockInitialState = {
  auth: {
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    organization: {
      id: 'test-org-id',
      name: 'Test Organization'
    }
  }
};

// Component wrapper for testing
const renderWithProviders = (ui, options = {}) => {
  const store = createMockStore(options.initialState || mockInitialState);
  
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  );
};

describe('InvoiceForm Component', () => {
  test('renders the form with initial fields', () => {
    renderWithProviders(<InvoiceForm />);
    
    // Check for main form elements
    expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    expect(screen.getByLabelText(/Vendor Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    
    // Check for different sections
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Custom Fields')).toBeInTheDocument();
    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Reviewers')).toBeInTheDocument();
  });
  
  test('displays validation errors when submitting empty form', async () => {
    renderWithProviders(<InvoiceForm />);
    
    // Submit the form without filling required fields
    const submitButton = screen.getByText('Create Invoice');
    fireEvent.click(submitButton);
    
    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText('Please fix the errors in the form')).toBeInTheDocument();
    });
    
    // Check if specific validation errors are displayed
    expect(screen.getByText('Vendor name is required')).toBeInTheDocument();
    expect(screen.getByText('Valid amount is required')).toBeInTheDocument();
    expect(screen.getByText('At least one reviewer is required')).toBeInTheDocument();
  });
  
  test('allows adding and removing custom fields', () => {
    renderWithProviders(<InvoiceForm />);
    
    // Add a custom field
    const fieldNameInput = screen.getByLabelText('Field Name');
    const fieldValueInput = screen.getByLabelText('Field Value');
    const addButton = screen.getByText('Add Field');
    
    fireEvent.change(fieldNameInput, { target: { value: 'Test Field' } });
    fireEvent.change(fieldValueInput, { target: { value: 'Test Value' } });
    fireEvent.click(addButton);
    
    // Check if the field was added
    expect(screen.getByText('Test Field:')).toBeInTheDocument();
    expect(screen.getByText('Test Value')).toBeInTheDocument();
    
    // Remove the field
    const removeButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(removeButton);
    
    // Check if the field was removed
    expect(screen.queryByText('Test Field:')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Value')).not.toBeInTheDocument();
  });
  
  // More tests can be added here:
  // - Testing file upload functionality
  // - Testing reviewer selection
  // - Testing form submission with valid data
  // - Testing date validation
}); 