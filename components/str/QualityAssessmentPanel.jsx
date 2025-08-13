import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const QualityAssessmentPanel = ({ scoringResult }) => {
  const getQualityColor = (tier) => {
    switch (tier) {
      case 'EXCELLENT': return 'quality-excellent';
      case 'GOOD': return 'quality-good';
      case 'FAIR': return 'quality-fair';
      case 'POOR': return 'quality-poor';
      default: return 'text-gray-600';
    }
  };

  const getQualityIcon = (tier) => {
    switch (tier) {
      case 'EXCELLENT': return <span className="text-green-600 font-bold">✓</span>;
      case 'GOOD': return <span className="text-blue-600 font-bold">✓</span>;
      case 'FAIR': return <span className="text-yellow-600 font-bold">⏰</span>;
      case 'POOR': return <span className="text-red-600 font-bold">⚠</span>;
      default: return <span className="text-gray-600 font-bold">📄</span>;
    }
  };

  if (!scoringResult) {
    return (
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-cyan-200 py-8">
            Score your narrative to see quality assessment
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            {getQualityIcon(scoringResult.quality_tier)}
            Quality Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2 text-white">
              {scoringResult.overall_score.toFixed(1)}/5.0
            </div>
            <div className={`text-lg font-medium ${getQualityColor(scoringResult.quality_tier)}`}>
              {scoringResult.quality_tier}
            </div>
            <div className="text-sm text-cyan-200 mt-1">
              Confidence: {(scoringResult.confidence * 100).toFixed(0)}%
            </div>
          </div>

          {scoringResult.requires_review && (
            <Alert className="glass-effect border-yellow-400/30">
              <span className="text-yellow-600 font-bold">⚠</span>
              <AlertTitle className="text-yellow-200">Review Required</AlertTitle>
              <AlertDescription className="text-yellow-100">
                This narrative requires additional review before submission.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Rubric Breakdown */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-sm text-white">Quality Rubric</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(scoringResult.rubric_scores).map(([criterion, score]) => (
            <div key={criterion} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize text-cyan-100">{criterion}</span>
                <span className="text-white">{score.toFixed(1)}/5.0</span>
              </div>
              <Progress 
                value={(score / 5) * 100} 
                className="h-2 bg-white/20"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {scoringResult.recommendations && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-sm text-white">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {scoringResult.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-cyan-100">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quality Tips */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-sm text-white">Quality Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-cyan-200">
          <p>• Include specific dates, times, and amounts</p>
          <p>• Clearly identify suspicious indicators</p>
          <p>• Provide chronological sequence of events</p>
          <p>• Use objective, factual language</p>
          <p>• Explain why activity is suspicious</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityAssessmentPanel;