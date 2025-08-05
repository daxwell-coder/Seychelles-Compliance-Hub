import axios from 'axios';
import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

// The webhook URL for your n8n workflow.
// This MUST be set in your environment variables.
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

/**
 * @description Triggers an n8n workflow via a webhook and updates the application status.
 * @param {string} formationId The ID of the Firestore document being processed.
 * @param {object} payload The data to send to the n8n workflow.
 */
export const triggerN8nWorkflow = async (formationId, payload) => {
  if (!N8N_WEBHOOK_URL) {
    console.error('[n8n] N8N_WEBHOOK_URL is not configured. Skipping workflow trigger.');
    // You might want to update the status to an error state here as well.
    return;
  }

  console.log(`[n8n] Triggering workflow for formation ID: ${formationId}`);

  try {
    // Make the POST request to the n8n webhook
    await axios.post(N8N_WEBHOOK_URL, payload);

    console.log(`[n8n] Workflow for ${formationId} triggered successfully.`);

    // Update the Firestore document to log the n8n trigger and advance the status
    const docRef = db.collection('ibc_formations').doc(formationId);
    await docRef.update({
      'n8n.lastWebhookTriggered': 'startInitialReview', // A descriptive name for the workflow
      'n8n.lastWebhookTimestamp': FieldValue.serverTimestamp(),
      status: 'pending_review', // The application is now waiting for the next step from n8n
      updatedAt: FieldValue.serverTimestamp(),
      'history': FieldValue.arrayUnion({
        timestamp: FieldValue.serverTimestamp(),
        status: 'pending_review',
        action: 'n8n workflow triggered for initial review.',
        actor: 'system:mcp-server'
      })
    });

  } catch (error) {
    console.error(`[n8n] Error triggering workflow for ${formationId}:`, error.message);
    // Update the document to reflect the error state
    const docRef = db.collection('ibc_formations').doc(formationId);
    await docRef.update({ status: 'workflow_trigger_failed', updatedAt: FieldValue.serverTimestamp() });
  }
};