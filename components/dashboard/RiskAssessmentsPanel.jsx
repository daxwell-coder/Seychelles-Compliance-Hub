import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

export const RiskAssessmentsPanel = ({ assessments = [] }) => {
  const mockAssessments = assessments.length > 0 ? assessments : [
    {
      id: 1,
      clientName: 'Paradise Holdings Ltd',
      riskLevel: 'MEDIUM',
      score: 65,
      lastReview: '2025-01-15',
      nextReview: '2025-04-15',
      status: 'CURRENT',
      flags: ['PEP Check Required', 'Source of Funds']
    },
    {
      id: 2,
      clientName: 'Seychelles Investment Corp',
      riskLevel: 'LOW',
      score: 25,
      lastReview: '2025-01-10',
      nextReview: '2025-07-10',
      status: 'CURRENT',
      flags: []
    },
    {
      id: 3,
      clientName: 'Ocean Blue Enterprises',
      riskLevel: 'HIGH',
      score: 85,
      lastReview: '2025-01-12',
      nextReview: '2025-02-12',
      status: 'REVIEW_REQUIRED',
      flags: ['High-Risk Jurisdiction', 'Complex Structure', 'Large Transactions']
    }
  ];

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'bg-red-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CURRENT': return 'bg-green-100 text-green-800';
      case 'REVIEW_REQUIRED': return 'bg-red-100 text-red-800';
      case 'OVERDUE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="backdrop-blur-md bg-white/40 border-white/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-blue-500">📊</span>
          <span>Risk Assessments</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockAssessments.map((assessment) => (
            <div key={assessment.id} className="p-4 bg-white/50 rounded-lg border border-white/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{assessment.clientName}</h4>
                  <p className="text-sm text-gray-600">Last Review: {assessment.lastReview}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRiskColor(assessment.riskLevel)}>
                    {assessment.riskLevel}
                  </Badge>
                  <Badge className={getStatusColor(assessment.status)}>
                    {assessment.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <span className="text-sm font-medium">{assessment.score}/100</span>
                </div>
                <Progress value={assessment.score} className="h-2" />
              </div>

              {assessment.flags.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Risk Flags:</p>
                  <div className="flex flex-wrap gap-1">
                    {assessment.flags.map((flag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Next Review: {assessment.nextReview}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentsPanel;