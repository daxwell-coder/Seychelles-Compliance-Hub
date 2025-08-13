import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const StatsOverview = ({ metrics }) => {
  const stats = [
    {
      title: 'Active Clients',
      value: metrics?.activeClients || 247,
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      change: '+12%'
    },
    {
      title: 'Pending Reviews',
      value: metrics?.pendingReviews || 12,
      icon: '📋',
      color: 'from-orange-500 to-red-500',
      change: '-8%'
    },
    {
      title: 'Critical Tasks',
      value: metrics?.criticalTasks || 3,
      icon: '🚨',
      color: 'from-red-500 to-pink-500',
      change: '+2'
    },
    {
      title: 'Compliance Score',
      value: `${metrics?.complianceScore || 94.2}%`,
      icon: '📊',
      color: 'from-green-500 to-emerald-500',
      change: '+2.1%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="backdrop-blur-md bg-white/40 border-white/30 hover:bg-white/50 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-green-600 font-medium">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsOverview;