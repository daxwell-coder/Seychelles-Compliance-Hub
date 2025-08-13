import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export const QuickActionsPanel = () => {
  const actions = [
    {
      title: 'New Client Onboarding',
      description: 'Start IBC registration process',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      action: () => console.log('Starting client onboarding...')
    },
    {
      title: 'Generate STR Report',
      description: 'Create suspicious transaction report',
      icon: '📄',
      color: 'from-purple-500 to-pink-500',
      action: () => console.log('Generating STR report...')
    },
    {
      title: 'Risk Assessment',
      description: 'Perform client risk evaluation',
      icon: '🔍',
      color: 'from-green-500 to-emerald-500',
      action: () => console.log('Starting risk assessment...')
    },
    {
      title: 'FIU Submission',
      description: 'Submit to FIU database',
      icon: '🏛️',
      color: 'from-orange-500 to-red-500',
      action: () => console.log('Submitting to FIU...')
    },
    {
      title: 'Compliance Check',
      description: 'Run automated compliance scan',
      icon: '✅',
      color: 'from-indigo-500 to-purple-500',
      action: () => console.log('Running compliance check...')
    },
    {
      title: 'Generate Report',
      description: 'Create compliance report',
      icon: '📊',
      color: 'from-teal-500 to-cyan-500',
      action: () => console.log('Generating report...')
    }
  ];

  return (
    <Card className="backdrop-blur-md bg-white/40 border-white/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-green-500">🚀</span>
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`w-full p-4 h-auto bg-gradient-to-r ${action.color} text-white hover:scale-105 transition-all duration-200 shadow-lg`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{action.icon}</span>
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;