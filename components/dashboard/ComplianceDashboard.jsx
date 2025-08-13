import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import StatsOverview from './StatsOverview';
import CriticalTasksPanel from './CriticalTasksPanel';
import RiskAssessmentsPanel from './RiskAssessmentsPanel';
import QuickActionsPanel from './QuickActionsPanel';

const ComplianceDashboard = ({ stats, riskAssessments, criticalTasks, user }) => {
  const [loading, setLoading] = useState(false);

  const handleNewAssessment = () => {
    console.log('Starting new risk assessment...');
  };

  const handleClientOnboarding = () => {
    console.log('Starting client onboarding...');
  };

  const handleComplianceReport = () => {
    console.log('Generating compliance report...');
  };

  if (loading) {
    return (
      <div className="paradise-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-100 text-lg">Loading your compliance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="paradise-gradient-bg">
      {/* Premium Header */}
      <header className="glass-effect border-b border-white/20 shadow-xl">
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
              <Button className="paradise-button">
                New Assessment
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 shadow-lg">
                  <AvatarFallback className="text-white text-sm font-bold bg-transparent">
                    {user?.avatar || 'CO'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{user?.name || 'Compliance Officer'}</p>
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
        <StatsOverview stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Critical Tasks Panel */}
          <CriticalTasksPanel tasks={criticalTasks} />

          {/* Recent Risk Assessments */}
          <RiskAssessmentsPanel assessments={riskAssessments} />
        </div>

        {/* Quick Actions Panel */}
        <div className="mt-8">
          <QuickActionsPanel 
            onNewAssessment={handleNewAssessment}
            onClientOnboarding={handleClientOnboarding}
            onComplianceReport={handleComplianceReport}
          />
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;