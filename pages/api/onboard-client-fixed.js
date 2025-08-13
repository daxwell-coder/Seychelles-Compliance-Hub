/**
 * IBC Registration API - Working Version
 */

// Simulated database (shared with dashboard)
const simulatedDatabase = {
  clients: [],
  tasks: [],
  events: []
};

export default async function handler(req, res) {
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
      authorizedCapital 
    } = req.body;

    if (!companyName || !incorporatorName || !incorporatorEmail || !businessActivity) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['companyName', 'incorporatorName', 'incorporatorEmail', 'businessActivity']
      });
    }

    // Create client record
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const client = {
      id: clientId,
      companyName: companyName.trim(),
      incorporatorName: incorporatorName.trim(),
      incorporatorEmail: incorporatorEmail.trim().toLowerCase(),
      businessActivity: businessActivity.trim(),
      authorizedCapital: authorizedCapital || '1000 USD',
      registrationStatus: 'initiated',
      createdAt: new Date().toISOString(),
      jurisdiction: 'SC',
      entityType: 'IBC'
    };

    // Add to simulated database
    simulatedDatabase.clients.push(client);

    // Create tasks
    const tasks = [
      {
        id: `task_${Date.now()}_1`,
        clientId: clientId,
        title: 'Collect Beneficial Ownership Information',
        type: 'beneficial_ownership_collection',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        assignedTo: 'compliance_team'
      },
      {
        id: `task_${Date.now()}_2`,
        clientId: clientId,
        title: 'Document Verification',
        type: 'document_collection',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        assignedTo: 'admin_team'
      }
    ];

    simulatedDatabase.tasks.push(...tasks);

    // Create events
    const events = [
      {
        id: `event_${Date.now()}_onboard`,
        type: 'client.onboarding.initiated',
        clientId: clientId,
        timestamp: new Date().toISOString(),
        data: { companyName, entityType: 'IBC' },
        source: 'frontend_registration'
      },
      {
        id: `event_${Date.now()}_tasks`,
        type: 'tasks.created',
        clientId: clientId,
        timestamp: new Date().toISOString(),
        data: { taskCount: tasks.length },
        source: 'task_engine'
      }
    ];

    simulatedDatabase.events.push(...events);

    return res.status(201).json({
      success: true,
      message: 'IBC registration initiated successfully',
      data: {
        clientId: clientId,
        registrationNumber: `SC-IBC-${clientId.split('_')[1]}`,
        status: 'initiated',
        tasksCreated: tasks.length,
        nextSteps: [
          'Document collection initiated',
          'Beneficial ownership review scheduled',
          'Compliance team will contact you within 24 hours'
        ],
        estimatedCompletion: '7-14 business days'
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ 
      error: 'Registration failed',
      message: error.message
    });
  }
}
