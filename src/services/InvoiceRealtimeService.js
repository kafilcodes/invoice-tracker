import { Invoice } from '../models/Invoice';
import realtimeDB from '../firebase/realtimeDb';

const COLLECTION_NAME = 'invoices';

/**
 * Service for handling invoice operations using Realtime Database
 */
export class InvoiceRealtimeService {
  constructor() {
    this.rtdb = realtimeDB;
  }

  /**
   * Create a new invoice
   * @param {Invoice|Object} invoiceData - Invoice data or instance
   * @returns {Promise<Object>} - Response with success status and data
   */
  async createInvoice(invoiceData) {
    try {
      // Ensure we're working with an Invoice instance
      const invoice = invoiceData instanceof Invoice 
        ? invoiceData 
        : new Invoice(invoiceData);
      
      // Validate invoice data
      const validation = invoice.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Invoice validation failed',
            details: validation.errors
          }
        };
      }

      // Calculate all amounts
      invoice.calculateAmounts();
      
      // Convert to plain object for storage
      const invoiceObject = invoice.toObject();
      
      // Save to Realtime DB
      const result = await this.rtdb.setData(
        `${COLLECTION_NAME}/${invoice.id}`,
        invoiceObject
      );
      
      return {
        success: true,
        data: invoice
      };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return {
        success: false,
        error: {
          code: 'create_invoice_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Get an invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} - Response with success status and data
   */
  async getInvoiceById(invoiceId) {
    try {
      const result = await this.rtdb.getData(`${COLLECTION_NAME}/${invoiceId}`);
      
      if (!result.success || !result.exists) {
        return {
          success: false,
          error: {
            code: 'invoice_not_found',
            message: `Invoice with ID ${invoiceId} not found`
          }
        };
      }
      
      // Convert to Invoice instance
      const invoice = Invoice.fromRealtime(result.data);
      
      return {
        success: true,
        data: invoice
      };
    } catch (error) {
      console.error('Error getting invoice:', error);
      return {
        success: false,
        error: {
          code: 'get_invoice_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Get invoices for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status
   * @param {string} options.clientId - Filter by client ID
   * @param {string} options.sortBy - Field to sort by (default: 'dueDate')
   * @param {boolean} options.sortDesc - Sort in descending order (default: true)
   * @returns {Promise<Object>} - Response with success status and data
   */
  async getUserInvoices(userId, options = {}) {
    try {
      const {
        status,
        clientId,
        sortBy = 'dueDate',
        sortDesc = true
      } = options;
      
      // Get all invoices for user - filtering will be done client-side
      const result = await this.rtdb.getItems(COLLECTION_NAME, {
        orderBy: sortBy
      });
      
      if (!result.success) {
        return result;
      }
      
      // Filter client-side
      let invoices = result.data.filter(invoice => invoice.userId === userId);
      
      // Filter by status if requested
      if (status) {
        invoices = invoices.filter(invoice => invoice.status === status);
      }
      
      // Filter by client if requested
      if (clientId) {
        invoices = invoices.filter(invoice => invoice.clientId === clientId);
      }
      
      // Sort (already ordered by sortBy from DB query, just need to handle direction)
      if (sortDesc) {
        invoices.reverse();
      }
      
      // Convert to Invoice instances
      invoices = invoices.map(invoice => Invoice.fromRealtime(invoice));
      
      return {
        success: true,
        data: invoices
      };
    } catch (error) {
      console.error('Error getting user invoices:', error);
      return {
        success: false,
        error: {
          code: 'get_user_invoices_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Update an existing invoice
   * @param {string} invoiceId - Invoice ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Response with success status and data
   */
  async updateInvoice(invoiceId, updateData) {
    try {
      // Get the current invoice
      const currentInvoiceResult = await this.getInvoiceById(invoiceId);
      
      if (!currentInvoiceResult.success) {
        return currentInvoiceResult;
      }
      
      const currentInvoice = currentInvoiceResult.data;
      
      // Apply updates
      Object.assign(currentInvoice, updateData);
      
      // Recalculate amounts
      currentInvoice.calculateAmounts();
      
      // Validate updated invoice
      const validation = currentInvoice.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Invoice validation failed',
            details: validation.errors
          }
        };
      }
      
      // Convert to plain object for storage
      const invoiceObject = currentInvoice.toObject();
      
      // Update in Realtime DB
      const result = await this.rtdb.updateData(
        `${COLLECTION_NAME}/${invoiceId}`,
        invoiceObject
      );
      
      return {
        success: true,
        data: currentInvoice
      };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return {
        success: false,
        error: {
          code: 'update_invoice_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Delete an invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} - Response with success status
   */
  async deleteInvoice(invoiceId) {
    try {
      const result = await this.rtdb.deleteData(`${COLLECTION_NAME}/${invoiceId}`);
      return result;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return {
        success: false,
        error: {
          code: 'delete_invoice_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Add a payment to an invoice
   * @param {string} invoiceId - Invoice ID
   * @param {Object} payment - Payment data
   * @returns {Promise<Object>} - Response with success status and data
   */
  async addPayment(invoiceId, payment) {
    try {
      // Get the current invoice
      const currentInvoiceResult = await this.getInvoiceById(invoiceId);
      
      if (!currentInvoiceResult.success) {
        return currentInvoiceResult;
      }
      
      const currentInvoice = currentInvoiceResult.data;
      
      // Add payment
      currentInvoice.addPayment(payment);
      
      // Convert to plain object for storage
      const invoiceObject = currentInvoice.toObject();
      
      // Update in Realtime DB
      const result = await this.rtdb.updateData(
        `${COLLECTION_NAME}/${invoiceId}`,
        invoiceObject
      );
      
      return {
        success: true,
        data: currentInvoice
      };
    } catch (error) {
      console.error('Error adding payment:', error);
      return {
        success: false,
        error: {
          code: 'add_payment_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Update invoice status
   * @param {string} invoiceId - Invoice ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Response with success status and data
   */
  async updateInvoiceStatus(invoiceId, status) {
    try {
      // Get the current invoice
      const currentInvoiceResult = await this.getInvoiceById(invoiceId);
      
      if (!currentInvoiceResult.success) {
        return currentInvoiceResult;
      }
      
      const currentInvoice = currentInvoiceResult.data;
      
      // Update status
      currentInvoice.updateStatus(status);
      
      // Convert to plain object for storage
      const invoiceObject = currentInvoice.toObject();
      
      // Update in Realtime DB
      const result = await this.rtdb.updateData(
        `${COLLECTION_NAME}/${invoiceId}`,
        { status }
      );
      
      return {
        success: true,
        data: currentInvoice
      };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return {
        success: false,
        error: {
          code: 'update_status_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Subscribe to changes on a specific invoice
   * @param {string} invoiceId - Invoice ID
   * @param {Function} onSnapshot - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToInvoice(invoiceId, onSnapshot) {
    return this.rtdb.subscribeToData(`${COLLECTION_NAME}/${invoiceId}`, snapshot => {
      if (!snapshot.exists) {
        onSnapshot({
          exists: false,
          data: null
        });
        return;
      }
      
      const invoice = Invoice.fromRealtime(snapshot.val());
      
      onSnapshot({
        exists: true,
        data: invoice
      });
    });
  }

  /**
   * Subscribe to user's invoices
   * @param {string} userId - User ID
   * @param {Object} options - Query options (see getUserInvoices)
   * @param {Function} onSnapshot - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToUserInvoices(userId, options = {}, onSnapshot) {
    return this.rtdb.subscribeToItems(COLLECTION_NAME, snapshot => {
      if (!snapshot.exists) {
        onSnapshot({
          exists: false,
          data: []
        });
        return;
      }
      
      // Convert to array and filter by userId
      let invoices = Object.entries(snapshot.val() || {})
        .map(([id, data]) => ({ id, ...data }))
        .filter(invoice => invoice.userId === userId);
      
      // Apply filters
      const { status, clientId } = options;
      
      if (status) {
        invoices = invoices.filter(invoice => invoice.status === status);
      }
      
      if (clientId) {
        invoices = invoices.filter(invoice => invoice.clientId === clientId);
      }
      
      // Sort
      const { sortBy = 'dueDate', sortDesc = true } = options;
      
      invoices.sort((a, b) => {
        if (a[sortBy] === b[sortBy]) return 0;
        if (sortDesc) {
          return a[sortBy] > b[sortBy] ? -1 : 1;
        } else {
          return a[sortBy] < b[sortBy] ? -1 : 1;
        }
      });
      
      // Convert to Invoice instances
      invoices = invoices.map(invoice => Invoice.fromRealtime(invoice));
      
      onSnapshot({
        exists: true,
        data: invoices
      });
    });
  }
}

// Create and export a singleton instance
const invoiceRealtimeService = new InvoiceRealtimeService();
export default invoiceRealtimeService; 