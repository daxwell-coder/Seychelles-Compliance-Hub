import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export const CriticalTasksPanel = ({ tasks = [] }) => {
  const mockTasks = tasks.length > 0 ? tasks : [
    {
      id: 1,
      title: 'FIU Beneficial Ownership Update Required',
      description: 'Update beneficial ownership records for Paradise Holdings Ltd',
      priority: 'CRITICAL',
      dueDate: '2025-01-20',
      assignee: 'Compliance Officer',
      status: 'PENDING'
    },
    {
      id: 2,
      title: 'AML Policy Review Overdue',
      description: 'Annual review of Anti-Money Laundering policies',
      priority: 'HIGH',
      dueDate: '2025-01-25',
      assignee: 'Legal Team',
      status: 'IN_PROGRESS'
    },
    {
      id: 3,
      title: 'Client KYC Documentation Missing',
      description: 'Complete KYC documentation for 3 new clients',
      priority: 'MEDIUM',
      dueDate: '2025-01-30',
      assignee: 'Client Relations',
      status: 'PENDING'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="backdrop-blur-md bg-white/40 border-white/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-red-500">🚨</span>
          <span>Critical Tasks</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTasks.map((task) => (
            <div key={task.id} className="p-4 bg-white/50 rounded-lg border border-white/30">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">Due: {task.dueDate}</span>
                  <span className="text-gray-500">Assignee: {task.assignee}</span>
                </div>
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  Take Action
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CriticalTasksPanel;