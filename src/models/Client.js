import { v4 as uuidv4 } from 'uuid';

/**
 * Client Model Class
 */
export class Client {
  /**
   * Create a new Client instance
   * @param {Object} data - Client data
   */
  constructor(data = {}) {
    // Required fields
    this.id = data.id || uuidv4();
    this.userId = data.userId || '';
    this.name = data.name || '';
    this.email = data.email || '';
    
    // Optional fields with defaults
    this.company = data.company || '';
    this.phone = data.phone || '';
    this.address = data.address || '';
    this.city = data.city || '';
    this.state = data.state || '';
    this.postalCode = data.postalCode || '';
    this.country = data.country || '';
    this.taxId = data.taxId || '';
    this.notes = data.notes || '';
    
    // Metadata
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.isActive = data.hasOwnProperty('isActive') ? data.isActive : true;
  }

  /**
   * Validate the client data
   * @returns {Object} - Validation result with isValid and errors
   */
  validate() {
    const errors = {};

    // Required field validation
    if (!this.userId) errors.userId = 'User ID is required';
    if (!this.name) errors.name = 'Name is required';
    
    // Email validation
    if (this.email && !this._isValidEmail(this.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Phone validation (optional)
    if (this.phone && !this._isValidPhone(this.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Check if client has complete address
   * @returns {boolean} - True if address is complete
   */
  hasCompleteAddress() {
    return !!(
      this.address && 
      this.city && 
      this.postalCode && 
      this.country
    );
  }

  /**
   * Get formatted full address
   * @returns {string} - Formatted address
   */
  getFormattedAddress() {
    const parts = [
      this.address,
      this.city,
      this.state ? `${this.state} ${this.postalCode}` : this.postalCode,
      this.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Deactivate client
   * @returns {Client} - Updated client instance
   */
  deactivate() {
    this.isActive = false;
    return this;
  }

  /**
   * Activate client
   * @returns {Client} - Updated client instance
   */
  activate() {
    this.isActive = true;
    return this;
  }

  /**
   * Convert the client to a plain object for storage
   * @returns {Object} - Plain object representation of the client
   */
  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      email: this.email,
      company: this.company,
      phone: this.phone,
      address: this.address,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
      taxId: this.taxId,
      notes: this.notes,
      isActive: this.isActive
    };
  }

  /**
   * Create a Client instance from Realtime DB data
   * @param {Object} data - Realtime DB data
   * @returns {Client} - New Client instance
   */
  static fromRealtime(data) {
    return new Client(data);
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid
   */
  _isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Validate phone format
   * @private
   * @param {string} phone - Phone to validate
   * @returns {boolean} - True if valid
   */
  _isValidPhone(phone) {
    // Basic phone validation - can be made more specific based on requirements
    return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(phone);
  }
} 