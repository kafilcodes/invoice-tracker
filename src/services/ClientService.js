import { FirestoreService } from '../firebase/firestore';
import { Client } from '../models/Client';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { rtdb } from '../firebase/config';

const COLLECTION_NAME = 'clients';

/**
 * Service for handling client operations
 */
export class ClientService {
  constructor() {
    this.firestoreService = new FirestoreService();
  }

  /**
   * Create a new client
   * @param {Client|Object} clientData - Client data or instance
   * @returns {Promise<Object>} - Response with success status and data
   */
  async createClient(clientData) {
    try {
      // Ensure we're working with a Client instance
      const client = clientData instanceof Client 
        ? clientData 
        : new Client(clientData);
      
      // Validate client data
      const validation = client.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Client validation failed',
            details: validation.errors
          }
        };
      }

      // Convert to plain object for storage
      const clientObject = client.toObject();
      
      // Save to Firestore
      const result = await this.firestoreService.setDocument(
        COLLECTION_NAME,
        client.id,
        clientObject
      );
      
      return {
        success: true,
        data: client
      };
    } catch (error) {
      console.error('Error creating client:', error);
      return {
        success: false,
        error: {
          code: 'create_client_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Get a client by ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} - Response with success status and data
   */
  async getClientById(clientId) {
    try {
      const result = await this.firestoreService.getDocument(COLLECTION_NAME, clientId);
      
      if (!result.success) {
        return result;
      }
      
      // Convert to Client instance
      const client = Client.fromFirestore(result.data);
      
      return {
        success: true,
        data: client
      };
    } catch (error) {
      console.error('Error getting client:', error);
      return {
        success: false,
        error: {
          code: 'get_client_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Get clients for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {boolean} options.activeOnly - Filter for active clients only (default: true)
   * @param {string} options.sortBy - Field to sort by (default: 'name')
   * @param {boolean} options.sortDesc - Sort in descending order (default: false)
   * @param {number} options.limit - Maximum number of clients to return (optional)
   * @param {string} options.startAfter - Start after document ID (for pagination)
   * @returns {Promise<Object>} - Response with success status and data
   */
  async getUserClients(userId, options = {}) {
    try {
      const {
        activeOnly = true,
        sortBy = 'name',
        sortDesc = false,
        limit,
        startAfter
      } = options;
      
      // Build the query
      let queryConstraints = [where('userId', '==', userId)];
      
      // Add active filter if requested
      if (activeOnly) {
        queryConstraints.push(where('isActive', '==', true));
      }
      
      // Add sorting
      queryConstraints.push(orderBy(sortBy, sortDesc ? 'desc' : 'asc'));
      
      // Get documents
      const result = await this.firestoreService.getDocuments(
        COLLECTION_NAME,
        queryConstraints,
        { limit, startAfter }
      );
      
      if (!result.success) {
        return result;
      }
      
      // Convert to Client instances
      const clients = result.data.map(doc => Client.fromFirestore(doc));
      
      return {
        success: true,
        data: clients,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Error getting user clients:', error);
      return {
        success: false,
        error: {
          code: 'get_user_clients_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Update an existing client
   * @param {string} clientId - Client ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Response with success status and data
   */
  async updateClient(clientId, updateData) {
    try {
      // Get the current client
      const currentClientResult = await this.getClientById(clientId);
      
      if (!currentClientResult.success) {
        return currentClientResult;
      }
      
      const currentClient = currentClientResult.data;
      
      // Apply updates
      Object.assign(currentClient, updateData);
      
      // Validate updated client
      const validation = currentClient.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Client validation failed',
            details: validation.errors
          }
        };
      }
      
      // Convert to plain object for storage
      const clientObject = currentClient.toObject();
      
      // Update in Firestore
      const result = await this.firestoreService.updateDocument(
        COLLECTION_NAME,
        clientId,
        clientObject
      );
      
      return {
        success: true,
        data: currentClient
      };
    } catch (error) {
      console.error('Error updating client:', error);
      return {
        success: false,
        error: {
          code: 'update_client_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Delete a client
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} - Response with success status
   */
  async deleteClient(clientId) {
    try {
      const result = await this.firestoreService.deleteDocument(COLLECTION_NAME, clientId);
      return result;
    } catch (error) {
      console.error('Error deleting client:', error);
      return {
        success: false,
        error: {
          code: 'delete_client_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Set a client's active status
   * @param {string} clientId - Client ID
   * @param {boolean} isActive - Whether the client is active
   * @returns {Promise<Object>} - Response with success status and data
   */
  async setClientActiveStatus(clientId, isActive) {
    try {
      return await this.updateClient(clientId, { isActive });
    } catch (error) {
      console.error('Error updating client status:', error);
      return {
        success: false,
        error: {
          code: 'update_client_status_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Subscribe to changes on a specific client
   * @param {string} clientId - Client ID
   * @param {Function} onSnapshot - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToClient(clientId, onSnapshot) {
    return this.firestoreService.subscribeToDocument(
      COLLECTION_NAME,
      clientId,
      (result) => {
        if (result.success) {
          const client = Client.fromFirestore(result.data);
          onSnapshot({
            success: true,
            data: client
          });
        } else {
          onSnapshot(result);
        }
      }
    );
  }

  /**
   * Subscribe to a user's clients
   * @param {string} userId - User ID
   * @param {Object} options - Query options (see getUserClients)
   * @param {Function} onSnapshot - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToUserClients(userId, options = {}, onSnapshot) {
    const {
      activeOnly = true,
      sortBy = 'name',
      sortDesc = false,
      limit
    } = options;
    
    // Build the query
    let queryConstraints = [where('userId', '==', userId)];
    
    // Add active filter if requested
    if (activeOnly) {
      queryConstraints.push(where('isActive', '==', true));
    }
    
    // Add sorting
    queryConstraints.push(orderBy(sortBy, sortDesc ? 'desc' : 'asc'));
    
    // Subscribe to query
    return this.firestoreService.subscribeToQuery(
      COLLECTION_NAME,
      queryConstraints,
      { limit },
      (result) => {
        if (result.success) {
          const clients = result.data.map(doc => Client.fromFirestore(doc));
          onSnapshot({
            success: true,
            data: clients,
            metadata: result.metadata
          });
        } else {
          onSnapshot(result);
        }
      }
    );
  }

  /**
   * Search clients by name or email
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @param {Object} options - Additional search options
   * @returns {Promise<Object>} - Response with success status and data
   */
  async searchClients(userId, searchTerm, options = {}) {
    try {
      // Get all the user's clients
      const result = await this.getUserClients(userId, {
        activeOnly: options.activeOnly,
        sortBy: 'name',
        sortDesc: false
      });
      
      if (!result.success) {
        return result;
      }
      
      // Perform client-side search
      // Note: For larger datasets, this should be done with a proper search index
      const searchTermLower = searchTerm.toLowerCase();
      
      const filteredClients = result.data.filter(client => {
        return (
          client.name.toLowerCase().includes(searchTermLower) ||
          client.email.toLowerCase().includes(searchTermLower) ||
          client.company.toLowerCase().includes(searchTermLower)
        );
      });
      
      return {
        success: true,
        data: filteredClients
      };
    } catch (error) {
      console.error('Error searching clients:', error);
      return {
        success: false,
        error: {
          code: 'search_clients_error',
          message: error.message
        }
      };
    }
  }
} 