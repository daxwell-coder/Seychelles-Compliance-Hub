// This file initializes the connection to all Firebase services.

import admin from 'firebase-admin';

// When running in a Google Cloud environment (like Cloud Run), the SDK
// will automatically use the service account associated with the resource.
// For local development, you must set the GOOGLE_APPLICATION_CREDENTIALS
// environment variable to point to your service account JSON file.
// Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/key.json"

try {
  admin.initializeApp();
  console.log('✅ Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Export the initialized Firestore database instance for use in other parts of the app.
export const db = admin.firestore();

// Export the auth service for token verification.
export const auth = admin.auth();