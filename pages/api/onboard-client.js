/**
 * IBC Registration API Endpoint
 * Connects frontend registration form to backend onboarding function
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'seychelles-compliance-hub'
    });
  } catch (error) {
    console.warn('Firebase admin initialization warning:', error.message);
  }
}

export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      companyName, 
      incorporatorName, 
      incorporatorEmail, 
      businessActivity, 
      authorizedCapital,
      incorporatorAddress,
      incorporatorPhone,
      incorporatorNationality 
    } = req.body;

    // Validate required fields
    if (!companyName || !incorporatorName || !incorporatorEmail || !businessActivity) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['companyName', 'incorporatorName', 'incorporatorEmail', 'businessActivity']
      });
    }

    // Create client data structure matching backend expectations
    const clientData = {
      id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      companyName: companyName.trim(),
      incorporatorName: incorporatorName.trim(),
      incorporatorEmail: incorporatorEmail.trim().toLowerCase(),
      businessActivity: businessActivity.trim(),
      authorizedCapital: authorizedCapital || '1000 USD',
      incorporatorAddress: incorporatorAddress || '',
      incorporatorPhone: incorporatorPhone || '',
      incorporatorNationality: incorporatorNationality || 'Unknown',
      registrationStatus: 'initiated',
      createdAt: new Date().toISOString(),
      jurisdiction: 'SC', // Seychelles
      entityType: 'IBC',
      complianceStatus: 'pending_review',
      riskLevel: 'medium'
    };

    // Save to Firestore
    const db = admin.firestore();
    const clientRef = db.collection('clients').doc(clientData.id);
    await clientRef.set(clientData);

    // Create initial compliance tasks
    const initialTasks = [
      {
        id: `task_${Date.now()}_1`,
        clientId: clientData.id,
        type: 'beneficial_ownership_collection',
        title: 'Collect Beneficial Ownership Information',
        description: 'Gather complete beneficial ownership details as required by BO Act 2020',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        createdAt: new Date().toISOString(),
        assignedTo: 'compliance_team',
        regulatoryReference: 'BO Act 2020'
      },
      {
        id: `task_${Date.now()}_2`,
        clientId: clientData.id,
        type: 'document_collection',
        title: 'Collect Required Documentation',
        description: 'Gather passport copies, proof of address, and business documentation',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        createdAt: new Date().toISOString(),
        assignedTo: 'admin_team',
        regulatoryReference: 'IBC Act 2016'
      }
    ];

    // Save tasks to Firestore
    const tasksRef = db.collection('tasks');
    for (const task of initialTasks) {
      await tasksRef.doc(task.id).set(task);
    }

    // Emit onboarding event (for audit trail)
    try {
      const eventData = {
        id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'client.onboarding.initiated',
        clientId: clientData.id,
        timestamp: new Date().toISOString(),
        data: {
          companyName: clientData.companyName,
          entityType: 'IBC',
          jurisdiction: 'SC'
        },
        source: 'frontend_registration',
        userId: 'anonymous_user'
      };

      await db.collection('events').doc(eventData.id).set(eventData);
    } catch (eventError) {
      console.warn('Event logging failed:', eventError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'IBC registration initiated successfully',
      data: {
        clientId: clientData.id,
        registrationNumber: `SC-IBC-${clientData.id.split('_')[1]}`,
        status: 'initiated',
        nextSteps: [
          'Document collection initiated',
          'Beneficial ownership review scheduled',
          'Compliance team will contact you within 24 hours'
        ],
        estimatedCompletion: '7-14 business days',
        tasksCreated: initialTasks.length
      }
    });

  } catch (error) {
    console.error('IBC Registration Error:', error);
    return res.status(500).json({ 
      error: 'Registration failed',
      message: 'Please try again or contact support',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
