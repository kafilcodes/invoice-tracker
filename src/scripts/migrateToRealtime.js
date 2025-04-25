// This script helps migrate data from Firestore to Realtime Database
// Run it in a browser environment where you have access to Firebase
import { app, rtdb } from '../firebase/config';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

// Initialize Firestore
const firestore = getFirestore(app);

/**
 * Migrate all users from Firestore to Realtime Database
 */
const migrateUsers = async () => {
  console.log('Starting migration of users...');
  const usersSnapshot = await getDocs(collection(firestore, 'users'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    try {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Convert Firestore timestamps to ISO strings for Realtime Database
      const convertedData = {
        ...userData,
        createdAt: userData.createdAt ? new Date(userData.createdAt.toDate()).toISOString() : new Date().toISOString(),
        updatedAt: userData.updatedAt ? new Date(userData.updatedAt.toDate()).toISOString() : new Date().toISOString(),
        lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt.toDate()).toISOString() : new Date().toISOString()
      };
      
      // Write to Realtime Database
      await set(ref(rtdb, `users/${userId}`), convertedData);
      console.log(`Migrated user: ${userId}`);
      successCount++;
    } catch (error) {
      console.error(`Error migrating user ${userDoc.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Migration complete. Success: ${successCount}, Errors: ${errorCount}`);
  return { success: successCount, error: errorCount };
};

/**
 * Migrate all invoices from Firestore to Realtime Database
 */
const migrateInvoices = async () => {
  console.log('Starting migration of invoices...');
  const invoicesSnapshot = await getDocs(collection(firestore, 'invoices'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const invoiceDoc of invoicesSnapshot.docs) {
    try {
      const invoiceData = invoiceDoc.data();
      const invoiceId = invoiceDoc.id;
      
      // Convert Firestore timestamps to ISO strings for Realtime Database
      const convertedData = {
        ...invoiceData,
        id: invoiceId, // Ensure ID is included in the data
        createdAt: invoiceData.createdAt ? new Date(invoiceData.createdAt.toDate()).toISOString() : new Date().toISOString(),
        updatedAt: invoiceData.updatedAt ? new Date(invoiceData.updatedAt.toDate()).toISOString() : new Date().toISOString(),
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate.toDate()).toISOString() : null,
        paidDate: invoiceData.paidDate ? new Date(invoiceData.paidDate.toDate()).toISOString() : null
      };
      
      // Write to Realtime Database
      await set(ref(rtdb, `invoices/${invoiceId}`), convertedData);
      console.log(`Migrated invoice: ${invoiceId}`);
      successCount++;
    } catch (error) {
      console.error(`Error migrating invoice ${invoiceDoc.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Migration complete. Success: ${successCount}, Errors: ${errorCount}`);
  return { success: successCount, error: errorCount };
};

/**
 * Migrate all organizations from Firestore to Realtime Database
 */
const migrateOrganizations = async () => {
  console.log('Starting migration of organizations...');
  const orgSnapshot = await getDocs(collection(firestore, 'organizations'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const orgDoc of orgSnapshot.docs) {
    try {
      const orgData = orgDoc.data();
      const orgId = orgDoc.id;
      
      // Convert Firestore timestamps to ISO strings for Realtime Database
      const convertedData = {
        ...orgData,
        id: orgId, // Ensure ID is included in the data
        createdAt: orgData.createdAt ? new Date(orgData.createdAt.toDate()).toISOString() : new Date().toISOString(),
        updatedAt: orgData.updatedAt ? new Date(orgData.updatedAt.toDate()).toISOString() : new Date().toISOString()
      };
      
      // Write to Realtime Database
      await set(ref(rtdb, `organizations/${orgId}`), convertedData);
      console.log(`Migrated organization: ${orgId}`);
      successCount++;
    } catch (error) {
      console.error(`Error migrating organization ${orgDoc.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Migration complete. Success: ${successCount}, Errors: ${errorCount}`);
  return { success: successCount, error: errorCount };
};

/**
 * Migrate all settings from Firestore to Realtime Database
 */
const migrateSettings = async () => {
  console.log('Starting migration of settings...');
  const settingsSnapshot = await getDocs(collection(firestore, 'settings'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const settingDoc of settingsSnapshot.docs) {
    try {
      const settingData = settingDoc.data();
      const settingId = settingDoc.id;
      
      // Convert Firestore timestamps to ISO strings for Realtime Database
      const convertedData = {
        ...settingData,
        updatedAt: settingData.updatedAt ? new Date(settingData.updatedAt.toDate()).toISOString() : new Date().toISOString()
      };
      
      // Write to Realtime Database
      await set(ref(rtdb, `settings/${settingId}`), convertedData);
      console.log(`Migrated setting: ${settingId}`);
      successCount++;
    } catch (error) {
      console.error(`Error migrating setting ${settingDoc.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Migration complete. Success: ${successCount}, Errors: ${errorCount}`);
  return { success: successCount, error: errorCount };
};

/**
 * Run the full migration
 */
const runFullMigration = async () => {
  if (!confirm('This will migrate all data from Firestore to Realtime Database. Continue?')) {
    return;
  }
  
  try {
    const userResults = await migrateUsers();
    const invoiceResults = await migrateInvoices();
    const orgResults = await migrateOrganizations();
    const settingResults = await migrateSettings();
    
    console.log('Migration Summary:');
    console.log(`Users: ${userResults.success} migrated, ${userResults.error} failed`);
    console.log(`Invoices: ${invoiceResults.success} migrated, ${invoiceResults.error} failed`);
    console.log(`Organizations: ${orgResults.success} migrated, ${orgResults.error} failed`);
    console.log(`Settings: ${settingResults.success} migrated, ${settingResults.error} failed`);
    
    alert('Migration complete! Check console for details.');
  } catch (error) {
    console.error('Migration failed:', error);
    alert('Migration failed! Check console for details.');
  }
};

// Export functions to be callable from the browser console
window.migrateToRealtime = {
  users: migrateUsers,
  invoices: migrateInvoices,
  organizations: migrateOrganizations,
  settings: migrateSettings,
  all: runFullMigration
};

export { 
  migrateUsers, 
  migrateInvoices, 
  migrateOrganizations, 
  migrateSettings, 
  runFullMigration 
}; 