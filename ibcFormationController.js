import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * @description Creates a new IBC formation application.
 * This is the initial step in the automated formation process.
 * It validates the incoming data and creates a new document in the 'ibc_formations' collection.
 * @param {import('express').Request} req The Express request object.
 * @param {import('express').Response} res The Express response object.
 */
export const createIbcFormation = async (req, res) => {
  try {
    // 1. Extract data from the request.
    // The `userId` is attached by our `checkAuth` middleware.
    const userId = req.user.uid;
    const { companyName, applicationData } = req.body;

    // Basic validation
    if (!companyName || !applicationData) {
      return res.status(400).send({ error: 'Missing companyName or applicationData.' });
    }

    // 2. Construct the new formation document based on our data model.
    const newFormation = {
      userId,
      companyName,
      applicationData,
      status: 'pending_analysis', // The initial state for the workflow.
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      aiAnalysis: null, // To be populated by the next step.
      n8n: null,        // To be populated by orchestration steps.
      history: [
        {
          timestamp: FieldValue.serverTimestamp(),
          status: 'pending_analysis',
          action: 'Application submitted by user.',
          actor: `user:${userId}`
        }
      ]
    };

    // 3. Add the new document to the 'ibc_formations' collection.
    const docRef = await db.collection('ibc_formations').add(newFormation);

    // 4. Respond with success.
    res.status(201).send({
      message: 'IBC formation application created successfully.',
      id: docRef.id
    });

  } catch (error) {
    console.error('Error creating IBC formation:', error);
    res.status(500).send({ error: 'An internal server error occurred while creating the application.' });
  }
};