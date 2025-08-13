/**
 * Existing IBC Onboarding API
 * For companies already incorporated that need compliance services
 */

const simulatedDatabase = {
  existingClients: [],
  complianceProfiles: [],
  migrationTasks: []
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
      registrationNumber,
      incorporationDate,
      currentAgent,
      businessActivity,
      complianceHistory,
      lastFilingDate,
      contactPerson,
      contactEmail,
      urgencyLevel = 'standard'
    } = req.body;

    // Validation for existing IBC onboarding
    if (!companyName || !registrationNumber || !incorporationDate) {
      return res.status(400).json({ 
        error: 'Missing required fields for existing IBC',
        required: ['companyName', 'registrationNumber', 'incorporationDate']
      });
    }

    const clientId = `existing_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Calculate compliance gap analysis
    const incorporationYear = new Date(incorporationDate).getFullYear();
    const yearsOperating = new Date().getFullYear() - incorporationYear;
    const lastFiling = lastFilingDate ? new Date(lastFilingDate) : null;
    const daysSinceLastFiling = lastFiling ? Math.floor((new Date() - lastFiling) / (1000 * 60 * 60 * 24)) : null;
    
    // Risk assessment for existing IBC
    let riskLevel = 'low';
    const urgentTasks = [];
    
    if (daysSinceLastFiling > 365) {
      riskLevel = 'high';
      urgentTasks.push('Overdue compliance filings detected');
    }
    if (yearsOperating > 5 && !complianceHistory) {
      riskLevel = 'medium';
      urgentTasks.push('Historical compliance review required');
    }
    if (!currentAgent || currentAgent.toLowerCase().includes('unknown')) {
      urgentTasks.push('Resident agent verification needed');
    }

    // Create existing client profile
    const existingClient = {
      id: clientId,
      type: 'existing_ibc',
      companyName: companyName.trim(),
      registrationNumber: registrationNumber.trim(),
      incorporationDate,
      yearsOperating,
      currentAgent,
      businessActivity,
      contactPerson,
      contactEmail: contactEmail?.toLowerCase(),
      onboardingStatus: 'compliance_assessment',
      riskLevel,
      urgencyLevel,
      createdAt: new Date().toISOString(),
      lastFilingDate,
      daysSinceLastFiling,
      complianceGaps: urgentTasks
    };

    simulatedDatabase.existingClients.push(existingClient);

    // Create tailored compliance tasks for existing IBC
    const migrationTasks = [
      {
        id: `migration_${Date.now()}_1`,
        clientId,
        title: 'Compliance History Review',
        description: `Review ${yearsOperating} years of compliance history for ${companyName}`,
        type: 'historical_review',
        priority: riskLevel === 'high' ? 'critical' : 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + (urgencyLevel === 'urgent' ? 3 : 7) * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 4,
        assignedTo: 'senior_compliance_officer'
      },
      {
        id: `migration_${Date.now()}_2`,
        clientId,
        title: 'Current Beneficial Ownership Verification',
        description: 'Verify and update beneficial ownership structure',
        type: 'bo_verification',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 2,
        assignedTo: 'compliance_team'
      },
      {
        id: `migration_${Date.now()}_3`,
        clientId,
        title: 'Outstanding Filing Assessment',
        description: 'Identify and prioritize any outstanding regulatory filings',
        type: 'filing_assessment',
        priority: daysSinceLastFiling > 365 ? 'critical' : 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 3,
        assignedTo: 'regulatory_specialist'
      },
      {
        id: `migration_${Date.now()}_4`,
        clientId,
        title: 'Ongoing Compliance Plan Setup',
        description: 'Establish automated compliance monitoring and filing schedule',
        type: 'automation_setup',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 1,
        assignedTo: 'system_admin'
      }
    ];

    simulatedDatabase.migrationTasks.push(...migrationTasks);

    // Calculate pricing for existing IBC services
    const baseOnboardingFee = 750; // Higher than new IBC due to complexity
    const urgencyMultiplier = urgencyLevel === 'urgent' ? 1.5 : 1.0;
    const riskMultiplier = riskLevel === 'high' ? 1.3 : riskLevel === 'medium' ? 1.1 : 1.0;
    const complexityMultiplier = yearsOperating > 3 ? 1.2 : 1.0;
    
    const totalOnboardingFee = Math.round(baseOnboardingFee * urgencyMultiplier * riskMultiplier * complexityMultiplier);
    const monthlyComplianceFee = 150; // Ongoing compliance services

    // Estimated timeline based on complexity
    const estimatedDays = urgencyLevel === 'urgent' ? '3-5 business days' :
                         riskLevel === 'high' ? '7-10 business days' : '5-7 business days';

    return res.status(201).json({
      success: true,
      message: 'Existing IBC onboarding initiated successfully',
      data: {
        clientId,
        onboardingType: 'existing_ibc',
        riskAssessment: {
          riskLevel,
          urgentIssues: urgentTasks,
          yearsOperating,
          daysSinceLastFiling,
          requiresUrgentAttention: riskLevel === 'high' || urgentTasks.length > 2
        },
        tasksCreated: migrationTasks.length,
        estimatedTimeline: estimatedDays,
        pricing: {
          onboardingFee: `$${totalOnboardingFee}`,
          monthlyCompliance: `$${monthlyComplianceFee}/month`,
          breakdown: {
            baseOnboarding: `$${baseOnboardingFee}`,
            urgencyAdjustment: urgencyLevel === 'urgent' ? '+50%' : 'standard',
            riskAdjustment: riskLevel === 'high' ? '+30%' : riskLevel === 'medium' ? '+10%' : 'standard',
            complexityAdjustment: yearsOperating > 3 ? '+20%' : 'standard'
          }
        },
        nextSteps: [
          'Compliance team will conduct initial assessment within 24 hours',
          'Historical filing review will commence immediately',
          'Any urgent compliance issues will be prioritized',
          'Dedicated account manager will be assigned',
          'Ongoing compliance automation will be configured'
        ],
        complianceServices: [
          'Historical compliance gap analysis',
          'Beneficial ownership structure verification',
          'Outstanding filing identification and resolution',
          'Automated ongoing compliance monitoring',
          'Regular regulatory update notifications',
          'Annual compliance health checks'
        ]
      }
    });

  } catch (error) {
    console.error('Existing IBC Onboarding Error:', error);
    return res.status(500).json({ 
      error: 'Existing IBC onboarding failed',
      message: error.message
    });
  }
}
