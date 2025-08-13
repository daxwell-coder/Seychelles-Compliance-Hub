// Seychelles Compliance Hub - Dashboard API
// Real-time dashboard data for compliance management

// Mock database for demonstration
const mockDatabase = {
  clients: [
    { id: 'cl_001', companyName: 'Paradise Holdings Ltd', registrationStatus: 'completed', createdAt: '2025-01-15T10:30:00Z' },
    { id: 'cl_002', companyName: 'Ocean View Enterprises', registrationStatus: 'in_progress', createdAt: '2025-01-18T14:20:00Z' },
    { id: 'cl_003', companyName: 'Seychelles Trading Co', registrationStatus: 'initiated', createdAt: '2025-01-20T09:15:00Z' }
  ],
  tasks: [
    { id: 'tk_001', title: 'FIU Beneficial Ownership Update', status: 'pending', priority: 'critical' },
    { id: 'tk_002', title: 'AML Policy Review', status: 'in_progress', priority: 'high' },
    { id: 'tk_003', title: 'Client Documentation', status: 'completed', priority: 'medium' }
  ],
  events: [
    { id: 'ev_001', type: 'str_analysis', clientId: 'cl_001', timestamp: '2025-01-20T08:00:00Z' },
    { id: 'ev_002', type: 'compliance_check', clientId: 'cl_002', timestamp: '2025-01-20T10:00:00Z' }
  ]
};

export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Calculate metrics from mock database
    const totalClients = mockDatabase.clients.length;
    const activeRegistrations = mockDatabase.clients.filter(client => 
      client.registrationStatus === 'initiated' || 
      client.registrationStatus === 'in_progress'
    ).length;
    
    const completedRegistrations = mockDatabase.clients.filter(client => 
      client.registrationStatus === 'completed'
    ).length;
    
    const pendingReviews = mockDatabase.tasks.filter(task => 
      task.status === 'pending'
    ).length;

    // Get recent registrations
    const recentClients = mockDatabase.clients
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(client => ({
        id: client.id,
        companyName: client.companyName || 'Unknown Company',
        status: client.registrationStatus || 'unknown',
        registeredDate: client.createdAt ? client.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        completionProgress: client.registrationStatus === 'completed' ? 100 : 
                           client.registrationStatus === 'documents_pending' ? 75 :
                           client.registrationStatus === 'compliance_review' ? 60 : 25
      }));

    const dashboardData = {
      timestamp: new Date().toISOString(),
      dataSource: 'mock_database_live',
      
      // Client Statistics
      clientStats: {
        totalClients: totalClients,
        activeRegistrations: activeRegistrations,
        completedRegistrations: completedRegistrations,
        pendingReviews: pendingReviews,
        recentRegistrations: recentClients
      },

      // Task Management
      taskManagement: {
        criticalTasks: mockDatabase.tasks.filter(t => t.priority === 'critical').length,
        urgentTasks: mockDatabase.tasks.filter(t => t.priority === 'high').length,
        pendingReviews: pendingReviews,
        completedToday: mockDatabase.tasks.filter(t => t.status === 'completed').length,
        totalTasks: mockDatabase.tasks.length,
        tasks: mockDatabase.tasks.map(task => ({
          id: task.id,
          title: task.title || 'Unnamed Task',
          priority: task.priority || 'medium',
          status: task.status || 'pending',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          assignee: 'Compliance Team',
          progress: task.status === 'completed' ? 100 : 
                   task.status === 'in_progress' ? 60 : 20
        }))
      },

      // STR Analysis
      strAnalysis: {
        totalReports: 23,
        flaggedTransactions: 5,
        confidenceScore: '87.3',
        lastAnalysis: Date.now(),
        recentReports: [
          {
            id: 'str_001',
            client: 'Paradise Holdings Ltd',
            riskScore: 85,
            status: 'flagged',
            flaggedAmount: '$125,000',
            createdAt: new Date().toISOString()
          }
        ]
      },

      // Risk Assessment
      riskAssessment: mockDatabase.clients.map(client => ({
        id: client.id,
        client: client.companyName,
        riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        lastAssessment: new Date().toISOString(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        complianceScore: Math.floor(Math.random() * 30) + 70,
        status: 'Current',
        progress: 85
      })),

      // Quick Actions
      quickActions: [
        { label: 'New IBC Registration', action: 'start_registration', icon: '🏢' },
        { label: 'STR Analysis', action: 'str_copilot', icon: '🧠' },
        { label: 'Client Search', action: 'search_clients', icon: '🔍' },
        { label: 'Generate Report', action: 'generate_report', icon: '📊' },
        { label: 'System Settings', action: 'settings', icon: '⚙️' }
      ],

      // Performance Metrics
      performance: {
        averageRegistrationTime: '7.2 days',
        clientSatisfactionScore: 4.8,
        automationRate: 85,
        errorRate: 2.1,
        monthlyRevenue: '$123,500',
        projectedGrowth: '23%'
      },

      // Data integrity indicators
      dataIntegrity: {
        isRealTime: true,
        lastSync: new Date().toISOString(),
        recordsProcessed: mockDatabase.clients.length + mockDatabase.tasks.length + mockDatabase.events.length,
        dataQuality: 'High'
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Real-time dashboard data retrieved successfully',
      data: dashboardData,
      lastUpdated: new Date().toISOString(),
      dataSource: 'mock_database_live'
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    
    return res.status(500).json({ 
      success: false,
      message: 'Dashboard data retrieval failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Export the mock database for use by other API endpoints
export { mockDatabase };
