import { v4 as uuidv4 } from 'uuid';

/**
 * Invoice Status Enum
 */
export const InvoiceStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

/**
 * Invoice Model Class
 */
export class Invoice {
  /**
   * Create a new Invoice instance
   * @param {Object} data - Invoice data
   */
  constructor(data = {}) {
    // Required fields
    this.id = data.id || uuidv4();
    this.userId = data.userId || '';
    this.clientId = data.clientId || '';
    this.invoiceNumber = data.invoiceNumber || '';
    this.status = data.status || InvoiceStatus.DRAFT;
    this.issueDate = data.issueDate || new Date().toISOString().split('T')[0];
    this.dueDate = data.dueDate || '';
    this.items = data.items || [];
    
    // Optional fields with defaults
    this.subtotal = data.subtotal || 0;
    this.taxRate = data.taxRate || 0;
    this.taxAmount = data.taxAmount || 0;
    this.discountRate = data.discountRate || 0;
    this.discountAmount = data.discountAmount || 0;
    this.total = data.total || 0;
    this.notes = data.notes || '';
    this.terms = data.terms || '';
    
    // Payment tracking
    this.amountPaid = data.amountPaid || 0;
    this.outstandingAmount = data.outstandingAmount || 0;
    this.paymentHistory = data.paymentHistory || [];
    
    // Metadata
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Validate the invoice data
   * @returns {Object} - Validation result with isValid and errors
   */
  validate() {
    const errors = {};

    // Required field validation
    if (!this.userId) errors.userId = 'User ID is required';
    if (!this.clientId) errors.clientId = 'Client ID is required';
    if (!this.invoiceNumber) errors.invoiceNumber = 'Invoice number is required';
    if (!this.issueDate) errors.issueDate = 'Issue date is required';
    if (!this.dueDate) errors.dueDate = 'Due date is required';
    
    // Items validation
    if (!this.items || this.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      const itemErrors = [];
      this.items.forEach((item, index) => {
        const itemError = {};
        if (!item.description) itemError.description = 'Description is required';
        if (!item.quantity || item.quantity <= 0) itemError.quantity = 'Valid quantity is required';
        if (!item.price || item.price < 0) itemError.price = 'Valid price is required';
        
        if (Object.keys(itemError).length > 0) {
          itemErrors[index] = itemError;
        }
      });
      
      if (itemErrors.length > 0) {
        errors.items = itemErrors;
      }
    }
    
    // Date validation
    if (this.issueDate && this.dueDate) {
      const issueDate = new Date(this.issueDate);
      const dueDate = new Date(this.dueDate);
      
      if (dueDate < issueDate) {
        errors.dueDate = 'Due date cannot be before issue date';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Calculate all invoice amounts
   * Updates subtotal, taxAmount, discountAmount, total, and outstandingAmount
   * @returns {Invoice} - The updated invoice instance
   */
  calculateAmounts() {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.price || 0);
      return sum + itemTotal;
    }, 0);
    
    // Calculate tax amount
    this.taxAmount = this.subtotal * (this.taxRate / 100);
    
    // Calculate discount amount
    this.discountAmount = this.subtotal * (this.discountRate / 100);
    
    // Calculate total
    this.total = this.subtotal + this.taxAmount - this.discountAmount;
    
    // Calculate outstanding amount
    this.outstandingAmount = this.total - this.amountPaid;
    
    return this;
  }

  /**
   * Add a payment to the invoice
   * @param {Object} payment - Payment details
   * @param {number} payment.amount - Payment amount
   * @param {string} payment.date - Payment date
   * @param {string} payment.method - Payment method
   * @param {string} payment.notes - Payment notes (optional)
   * @returns {Invoice} - The updated invoice instance
   */
  addPayment(payment) {
    if (!payment.amount || payment.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }
    
    if (!payment.date) {
      throw new Error('Payment date is required');
    }
    
    if (!payment.method) {
      throw new Error('Payment method is required');
    }
    
    // Add payment to history
    this.paymentHistory.push({
      id: uuidv4(),
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      notes: payment.notes || '',
      createdAt: new Date().toISOString()
    });
    
    // Update amount paid
    this.amountPaid += payment.amount;
    
    // Update outstanding amount
    this.outstandingAmount = this.total - this.amountPaid;
    
    // Update status if fully paid
    if (this.outstandingAmount <= 0) {
      this.status = InvoiceStatus.PAID;
    } else if (this.status === InvoiceStatus.DRAFT) {
      this.status = InvoiceStatus.PENDING;
    }
    
    return this;
  }

  /**
   * Update the invoice status
   * @param {string} newStatus - The new status (use InvoiceStatus enum)
   * @returns {Invoice} - The updated invoice instance
   */
  updateStatus(newStatus) {
    if (!Object.values(InvoiceStatus).includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }
    
    this.status = newStatus;
    return this;
  }

  /**
   * Check if the invoice is overdue
   * @returns {boolean} - True if invoice is overdue
   */
  isOverdue() {
    if (this.status === InvoiceStatus.PAID || this.status === InvoiceStatus.CANCELLED) {
      return false;
    }
    
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    
    return today > dueDate && this.outstandingAmount > 0;
  }

  /**
   * Convert the invoice to a plain object for storage
   * @returns {Object} - Plain object representation of the invoice
   */
  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      clientId: this.clientId,
      invoiceNumber: this.invoiceNumber,
      status: this.status,
      issueDate: this.issueDate,
      dueDate: this.dueDate,
      items: this.items,
      subtotal: this.subtotal,
      taxRate: this.taxRate,
      taxAmount: this.taxAmount,
      discountRate: this.discountRate,
      discountAmount: this.discountAmount,
      total: this.total,
      notes: this.notes,
      terms: this.terms,
      amountPaid: this.amountPaid,
      outstandingAmount: this.outstandingAmount,
      paymentHistory: this.paymentHistory
    };
  }

  /**
   * Create an Invoice instance from Realtime DB data
   * @param {Object} data - Realtime DB data
   * @returns {Invoice} - New Invoice instance
   */
  static fromRealtime(data) {
    return new Invoice(data);
  }
} 