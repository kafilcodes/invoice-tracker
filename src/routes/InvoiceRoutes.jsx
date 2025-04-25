import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InvoiceList from '../components/invoices/InvoiceList';
import InvoiceForm from '../components/invoices/InvoiceForm';
import InvoiceDetail from '../components/invoices/InvoiceDetail';

// This component sets up routes for invoice-related pages
const InvoiceRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<InvoiceList />} />
      <Route path="/new" element={<InvoiceForm />} />
      <Route path="/:id" element={<InvoiceDetail />} />
      <Route path="/:id/edit" element={<InvoiceForm isEdit={true} />} />
      <Route path="*" element={<Navigate to="/invoices" replace />} />
    </Routes>
  );
};

export default InvoiceRoutes; 