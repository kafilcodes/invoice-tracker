import { rtdb } from '../firebase/config';
import { ref, update, get } from 'firebase/database';

/**
 * Promotes a user to admin role
 * This script can be run in the browser console by:
 * 
 * 1. Import the function:
 *    import { promoteToAdmin } from './scripts/promoteToAdmin'
 * 
 * 2. Call the function with the user's email:
 *    promoteToAdmin('user@example.com')
 * 
 * @param {string} email - Email of the user to promote
 * @returns {Promise<object>} Result of the operation
 */
export const promoteToAdmin = async (email) => {
  if (!email) {
    console.error('Email is required');
    return { success: false, error: 'Email is required' };
  }

  try {
    // First, find the user by email
    const usersRef = ref(rtdb, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      console.error('No users found in the database');
      return { success: false, error: 'No users found in the database' };
    }
    
    let userId = null;
    let userData = null;
    
    // Find the user with the matching email
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      if (user.email.toLowerCase() === email.toLowerCase()) {
        userId = childSnapshot.key;
        userData = user;
      }
    });
    
    if (!userId) {
      console.error(`User with email ${email} not found`);
      return { success: false, error: `User with email ${email} not found` };
    }
    
    // Update the user's role to admin
    await update(ref(rtdb, `users/${userId}`), {
      role: 'admin',
      updatedAt: new Date().toISOString()
    });
    
    console.log(`User ${email} has been promoted to admin`);
    return { 
      success: true, 
      message: `User ${email} has been promoted to admin`,
      userId,
      previousRole: userData.role
    };
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Lists all users in the database
 * Can be used to identify users to promote
 * 
 * @returns {Promise<object>} List of users
 */
export const listUsers = async () => {
  try {
    const usersRef = ref(rtdb, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      console.error('No users found in the database');
      return { success: false, error: 'No users found in the database' };
    }
    
    const users = [];
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      users.push({
        id: childSnapshot.key,
        email: user.email,
        name: user.name || user.displayName,
        role: user.role
      });
    });
    
    console.table(users);
    return { success: true, users };
  } catch (error) {
    console.error('Error listing users:', error);
    return { success: false, error: error.message };
  }
};

// Export a default object with both functions for easier import
export default {
  promoteToAdmin,
  listUsers
}; 