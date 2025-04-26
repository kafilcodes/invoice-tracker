import { Client } from '../models/Client';
import realtimeDB from '../firebase/realtimeDb';

const COLLECTION_NAME = 'clients';

/**
 * Service for handling client operations using Realtime Database
 */
export class ClientRealtimeService {
  constructor() {
    this.rtdb = realtimeDB;
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
      
      // Save to Realtime DB
      const result = await this.rtdb.setData(
        `${COLLECTION_NAME}/${client.id}`,
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
      const result = await this.rtdb.getData(`${COLLECTION_NAME}/${clientId}`);
      
      if (!result.success || !result.exists) {
        return {
          success: false,
          error: {
            code: 'client_not_found',
            message: `Client with ID ${clientId} not found`
          }
        };
      }
      
      // Convert to Client instance
      const client = Client.fromRealtime(result.data);
      
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
   * @returns {Promise<Object>} - Response with success status and data
   */
  async getUserClients(userId, options = {}) {
    try {
      const {
        activeOnly = true,
        sortBy = 'name',
        sortDesc = false
      } = options;
      
      // Get all clients for user - filtering will be done client-side
      const result = await this.rtdb.getItems(COLLECTION_NAME, {
        orderBy: sortBy
      });
      
      if (!result.success) {
        return result;
      }
      
      // Filter client-side
      let clients = result.data.filter(client => client.userId === userId);
      
      // Filter active only if requested
      if (activeOnly) {
        clients = clients.filter(client => client.isActive === true);
      }
      
      // Sort (already ordered by sortBy from DB query, just need to handle direction)
      if (sortDesc) {
        clients.reverse();
      }
      
      // Convert to Client instances
      clients = clients.map(client => Client.fromRealtime(client));
      
      return {
        success: true,
        data: clients
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
      
      // Update in Realtime DB
      const result = await this.rtdb.updateData(
        `${COLLECTION_NAME}/${clientId}`,
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
      const result = await this.rtdb.deleteData(`${COLLECTION_NAME}/${clientId}`);
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
      console.error('Error setting client active status:', error);
      return {
        success: false,
        error: {
          code: 'set_active_status_error',
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
    return this.rtdb.subscribeToData(
      `${COLLECTION_NAME}/${clientId}`,
      (result) => {
        if (result.success && result.exists) {
          const client = Client.fromRealtime(result.data);
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
      sortDesc = false
    } = options;
    
    // Subscribe to all clients and filter in the callback
    return this.rtdb.subscribeToCollection(
      COLLECTION_NAME,
      (result) => {
        if (result.success) {
          // Filter client-side
          let clients = result.data.filter(client => client.userId === userId);
          
          // Apply active filter if requested
          if (activeOnly) {
            clients = clients.filter(client => client.isActive === true);
          }
          
          // Sort by the requested field
          clients.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return sortDesc ? 1 : -1;
            if (a[sortBy] > b[sortBy]) return sortDesc ? -1 : 1;
            return 0;
          });
          
          // Convert to Client instances
          clients = clients.map(client => Client.fromRealtime(client));
          
          onSnapshot({
            success: true,
            data: clients
          });
        } else {
          onSnapshot(result);
        }
      },
      { orderBy: sortBy }
    );
  }

  /**
   * Search clients by name or email
   * @param {string} userId - User ID to filter by
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Response with success status and data
   */
  async searchClients(userId, searchTerm, options = {}) {
    try {
      // Get all clients for the user first
      const result = await this.getUserClients(userId, options);
      
      if (!result.success) {
        return result;
      }
      
      // Filter by search term (client-side)
      const searchTermLower = searchTerm.toLowerCase();
      const filteredClients = result.data.filter(client => {
        const nameMatch = client.name && client.name.toLowerCase().includes(searchTermLower);
        const emailMatch = client.email && client.email.toLowerCase().includes(searchTermLower);
        return nameMatch || emailMatch;
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

// Create and export a singleton instance
const clientRealtimeService = new ClientRealtimeService();
export default clientRealtimeService; 