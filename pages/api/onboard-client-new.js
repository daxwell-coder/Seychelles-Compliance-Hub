// Seychelles Compliance Hub - Client Onboarding API
// This endpoint handles IBC registration and client onboarding

// In-memory database simulation (shared with dashboard API)
let mockDatabase = {
  clients: [],
  tasks: [],
  events: []
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const { companyName, registrationType, contactEmail, businessActivity } = req.body;

    // Validate required fields
    if (!companyName || !registrationType || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Company name, registration type, and contact email are required'
      });
    }

    // Generate unique client ID
    const clientId = `IBC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const registrationDate = new Date().toISOString();

    // Create new client record
    const newClient = {
      id: clientId,
      companyName,
      registrationType,
      contactEmail,
      businessActivity: businessActivity || 'General business activities',
      registrationDate,
      status: 'active',
      complianceScore: Math.floor(Math.random() * 20) + 80, // 80-100
      riskLevel: 'Low', // New clients start with low risk
      nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      documents: [],
      officers: [],
      shareholders: []
    };

    // Add to mock database
    mockDatabase.clients.push(newClient);

    // Generate compliance tasks for new client
    const complianceTasks = [
      {
        id: `TASK-${Date.now()}-1`,
        clientId,
        type: 'document_verification',
        title: 'Document Verification',
        description: 'Verify incorporation documents and business licenses',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: 'compliance-team',
        createdAt: registrationDate
      },
      {
        id: `TASK-${Date.now()}-2`,
        clientId,
        type: 'beneficial_ownership',
        title: 'Beneficial Ownership Review',
        description: 'Complete beneficial ownership disclosure and verification',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: 'legal-team',
        createdAt: registrationDate
      },
      {
        id: `TASK-${Date.now()}-3`,
        clientId,
        type: 'risk_assessment',
        title: 'Initial Risk Assessment',
        description: 'Conduct comprehensive risk assessment for new client',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: 'risk-team',
        createdAt: registrationDate
      }
    ];

    // Add tasks to database
    mockDatabase.tasks.push(...complianceTasks);

    // Create audit event
    const auditEvent = {
      id: `EVENT-${Date.now()}`,
      type: 'client_registration',
      clientId,
      title: 'New Client Registration',
      description: `New IBC registration for ${companyName}`,
      timestamp: registrationDate,
      priority: 'medium',
      userId: 'system',
      metadata: {
        registrationType,
        contactEmail,
        businessActivity: newClient.businessActivity,
        initialRiskLevel: newClient.riskLevel
      }
    };

    // Add event to database
    mockDatabase.events.push(auditEvent);

    // Prepare response data
    const responseData = {
      registration: {
        clientId,
        companyName,
        registrationNumber: clientId,
        registrationDate,
        status: 'registered',
        complianceStatus: 'pending_review'
      },
      complianceTasks: complianceTasks.length,
      nextSteps: [
        'Submit required incorporation documents',
        'Complete beneficial ownership disclosure',
        'Schedule compliance interview',
        'Review and sign service agreements'
      ],
      estimatedProcessingTime: '5-7 business days',
      contactInformation: {
        complianceOfficer: 'compliance@seychelles-hub.com',
        supportPhone: '+248-4-123-456',
        portalAccess: `https://portal.seychelles-hub.com/login?client=${clientId}`
      }
    };

    return res.status(201).json({
      success: true,
      message: 'Client registration completed successfully',
      data: responseData,
      debug: {
        databaseState: {
          totalClients: mockDatabase.clients.length,
          totalTasks: mockDatabase.tasks.length,
          totalEvents: mockDatabase.events.length
        }
      }
    });

  } catch (error) {
    console.error('Client Onboarding API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during client registration. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
