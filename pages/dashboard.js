import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [criticalTasks, setCriticalTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRisks: 0,
    criticalRisks: 0,
    activeTasks: 0,
    overdueTasks: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from deployed APIs
      try {
        const response = await fetch('https://critical-task-summary-6kqt2eklra-uc.a.run.app');
        if (response.ok) {
          const data = await response.json();
          setCriticalTasks(data.tasks || []);
        }
      } catch (error) {
        console.log('Using mock data - API not accessible:', error.message);
      }

      // Mock realistic data for demo
      setStats({
        totalRisks: 47,
        criticalRisks: 3,
        activeTasks: 12,
        overdueTasks: 2
      });

      setRiskAssessments([
        {
          id: 'risk-001',
          riskLevel: 'CRITICAL',
          confidence: 0.94,
          title: 'New AML Beneficial Ownership Requirements',
          affectedObligations: ['AML.001', 'BO.002', 'RPT.003'],
          createdAt: '2025-08-12T09:30:00Z',
          status: 'ACTIVE',
          description: 'FSA Circular 2025-03: Enhanced beneficial ownership disclosure requirements effective immediately'
        },
        {
          id: 'risk-002', 
          riskLevel: 'HIGH',
          confidence: 0.87,
          title: 'Updated International Tax Reporting Standards',
          affectedObligations: ['TAX.005', 'RPT.007'],
          createdAt: '2025-08-11T14:15:00Z',
          status: 'UNDER_REVIEW',
          description: 'OECD CRS updates require system modifications for automatic exchange of information'
        },
        {
          id: 'risk-003',
          riskLevel: 'MEDIUM',
          confidence: 0.72,
          title: 'Enhanced Customer Due Diligence Procedures',
          affectedObligations: ['CDD.001', 'KYC.004'],
          createdAt: '2025-08-10T11:45:00Z',
          status: 'COMPLETED',
          description: 'Updated guidance on enhanced due diligence for politically exposed persons'
        }
      ]);

      setCriticalTasks([
        {
          id: 'task-001',
          title: 'URGENT: Update BO disclosure forms and system validation',
          riskLevel: 'CRITICAL',
          dueDate: '2025-08-12T17:00:00Z',
          confidence: 0.94,
          status: 'OPEN',
          assignee: 'Compliance Officer',
          description: 'Immediate action required to implement new beneficial ownership disclosure requirements',
          estimatedHours: 8
        },
        {
          id: 'task-002',
          title: 'Review and update CRS reporting templates',
          riskLevel: 'HIGH', 
          dueDate: '2025-08-15T12:00:00Z',
          confidence: 0.87,
          status: 'IN_PROGRESS',
          assignee: 'Tax Compliance Specialist',
          description: 'Update automated reporting templates for international tax compliance',
          estimatedHours: 16
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch(level) {
      case 'CRITICAL': return { bg: '#dc2626', text: '#fee2e2', border: '#fecaca' };
      case 'HIGH': return { bg: '#ea580c', text: '#fed7aa', border: '#fdba74' };
      case 'MEDIUM': return { bg: '#ca8a04', text: '#fef3c7', border: '#fde68a' };
      case 'LOW': return { bg: '#16a34a', text: '#dcfce7', border: '#bbf7d0' };
      default: return { bg: '#6b7280', text: '#f3f4f6', border: '#d1d5db' };
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#16a34a';
    if (confidence >= 0.6) return '#ca8a04'; 
    return '#dc2626';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN': return { bg: '#dc2626', text: '#ffffff' };
      case 'IN_PROGRESS': return { bg: '#ea580c', text: '#ffffff' };
      case 'UNDER_REVIEW': return { bg: '#ca8a04', text: '#ffffff' };
      case 'COMPLETED': return { bg: '#16a34a', text: '#ffffff' };
      default: return { bg: '#6b7280', text: '#ffffff' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-100 text-lg">Loading your compliance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Premium Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🇸🇨</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-inter">
                  Seychelles Compliance Hub
                </h1>
                <span className="text-sm font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  AI-Powered Risk Assessment Dashboard
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105">
                New Assessment
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">CO</span>
                </div>
                <div>
                  <p className="text-white font-medium">Compliance Officer</p>
                  <p className="text-cyan-200 text-sm">Active Session</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        
        {/* Premium Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md overflow-hidden shadow-xl rounded-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-cyan-100 truncate">
                      Total Risk Assessments
                    </dt>
                    <dd className="text-2xl font-bold text-white">
                      {stats.totalRisks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md overflow-hidden shadow-xl rounded-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">🚨</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-red-100 truncate">
                      Critical Risks
                    </dt>
                    <dd className="text-2xl font-bold text-red-300">
                      {stats.criticalRisks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md overflow-hidden shadow-xl rounded-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-emerald-100 truncate">
                      Active Tasks
                    </dt>
                    <dd className="text-2xl font-bold text-emerald-300">
                      {stats.activeTasks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md overflow-hidden shadow-xl rounded-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">⏰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-orange-100 truncate">
                      Overdue Tasks
                    </dt>
                    <dd className="text-2xl font-bold text-orange-300">
                      {stats.overdueTasks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Critical Tasks Panel - Premium Design */}
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg">🚨</span>
                </div>
                <h3 className="text-xl leading-6 font-bold text-white">
                  Critical Tasks Requiring Immediate Attention
                </h3>
              </div>
              <div className="space-y-4">
                {criticalTasks.map((task) => {
                  const riskColors = getRiskLevelColor(task.riskLevel);
                  const statusColors = getStatusColor(task.status);
                  return (
                    <div key={task.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-red-400/30 shadow-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <h4 className="text-lg font-bold text-white mr-3">
                              {task.title}
                            </h4>
                            <span 
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                              style={{
                                backgroundColor: statusColors.bg,
                                color: statusColors.text
                              }}
                            >
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <p className="text-cyan-100 mb-4 leading-relaxed">
                            {task.description}
                          </p>
                          
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center">
                              <span className="text-cyan-200 mr-2">Due:</span>
                              <span className="text-white font-medium">
                                {new Date(task.dueDate).toLocaleDateString()} at {new Date(task.dueDate).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-cyan-200 mr-2">Assignee:</span>
                              <span className="text-white font-medium">{task.assignee}</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span 
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                                style={{
                                  backgroundColor: riskColors.bg + '30',
                                  color: riskColors.text,
                                  border: `1px solid ${riskColors.border}40`
                                }}
                              >
                                {task.riskLevel}
                              </span>
                              <div className="flex items-center">
                                <span className="text-xs text-cyan-200 mr-2">AI Confidence:</span>
                                <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                                  <div 
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${task.confidence * 100}%`,
                                      backgroundColor: getConfidenceColor(task.confidence)
                                    }}
                                  />
                                </div>
                                <span className="ml-2 text-xs font-bold text-white">
                                  {Math.round(task.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                            
                            <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                              Take Action →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Risk Assessments - Premium Design */}
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg">📈</span>
                </div>
                <h3 className="text-xl leading-6 font-bold text-white">
                  Recent AI Risk Assessments
                </h3>
              </div>
              <div className="space-y-4">
                {riskAssessments.map((assessment) => {
                  const riskColors = getRiskLevelColor(assessment.riskLevel);
                  return (
                    <div key={assessment.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-2">
                            {assessment.title}
                          </h4>
                          <p className="text-cyan-100 text-sm leading-relaxed mb-3">
                            {assessment.description}
                          </p>
                          <div className="flex items-center text-sm text-cyan-200 mb-3">
                            <span className="mr-2">Affected Obligations:</span>
                            <div className="flex flex-wrap gap-1">
                              {assessment.affectedObligations.map((obligation, idx) => (
                                <span key={idx} className="px-2 py-1 bg-white/10 rounded-md text-xs font-medium text-white">
                                  {obligation}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col items-end space-y-2">
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                            style={{
                              backgroundColor: riskColors.bg,
                              color: riskColors.text
                            }}
                          >
                            {assessment.riskLevel}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            assessment.status === 'COMPLETED' ? 'bg-green-500/20 text-green-200' :
                            assessment.status === 'UNDER_REVIEW' ? 'bg-yellow-500/20 text-yellow-200' :
                            'bg-blue-500/20 text-blue-200'
                          }`}>
                            {assessment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <span className="text-xs text-cyan-200 mr-2">AI Confidence:</span>
                            <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${assessment.confidence * 100}%`,
                                  backgroundColor: getConfidenceColor(assessment.confidence)
                                }}
                              />
                            </div>
                            <span className="ml-2 text-xs font-bold text-white">
                              {Math.round(assessment.confidence * 100)}%
                            </span>
                          </div>
                          <span className="text-xs text-cyan-200">
                            {new Date(assessment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200">
                          Review Details →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-8 text-center">
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-300 transform hover:scale-105">
                  View All Assessments →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel - Premium Design */}
        <div className="mt-8 bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20">
          <div className="px-6 py-6 sm:p-8">
            <h3 className="text-xl leading-6 font-bold text-white mb-6 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center mr-3">
                🚀
              </span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="group p-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/50 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h4 className="font-bold text-white text-lg mb-2">New Risk Assessment</h4>
                  <p className="text-cyan-100 text-sm">Analyze regulatory changes with AI</p>
                </div>
              </button>
              
              <button className="group p-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-purple-400/50 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h4 className="font-bold text-white text-lg mb-2">Client Onboarding</h4>
                  <p className="text-purple-100 text-sm">Register new financial entity</p>
                </div>
              </button>
              
              <button className="group p-6 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-emerald-400/50 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h4 className="font-bold text-white text-lg mb-2">Compliance Report</h4>
                  <p className="text-emerald-100 text-sm">Generate audit trail report</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Styles */}
      <style jsx>{`
        .font-inter { font-family: 'Inter', sans-serif; }
        .backdrop-blur-md { backdrop-filter: blur(16px); }
        .backdrop-blur-sm { backdrop-filter: blur(8px); }
      `}</style>
    </div>
  );
}
