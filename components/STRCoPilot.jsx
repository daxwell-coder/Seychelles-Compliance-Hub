import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function STRCoPilot() {
  const [narrative, setNarrative] = useState('');
  const [scoringResult, setScoringResult] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [autoSaveEnabled] = useState(true);

  // Auto-save draft every 30 seconds if enabled
  useEffect(() => {
    if (!autoSaveEnabled || narrative.length < 50) return;
    
    const autoSaveTimer = setTimeout(() => {
      saveDraft();
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
  }, [narrative, autoSaveEnabled]);

  // Initialize with case ID
  useEffect(() => {
    setCaseId(`STR_CASE_${Date.now()}`);
  }, []);

  const scoreNarrative = useCallback(async () => {
    if (!narrative.trim() || narrative.length < 20) {
      console.warn('Narrative too short for scoring');
      return;
    }

    setIsScoring(true);
    setScoringResult(null);

    try {
      // This will call our deployed narrative scoring function
      const response = await fetch('/api/score-narrative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          narrative: narrative,
          case_id: caseId,
          scoring_context: {
            type: 'STR_DRAFT',
            user_interface: 'STR_CO_PILOT'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Scoring failed: ${response.statusText}`);
      }

      const data = await response.json();
      setScoringResult(data.scoring_result);
    } catch (error) {
      console.error('Narrative scoring failed:', error);
      // Fallback to mock scoring for development
      setScoringResult(getMockScoringResult(narrative));
    } finally {
      setIsScoring(false);
    }
  }, [narrative, caseId]);

  const saveDraft = async () => {
    if (!narrative.trim()) return;
    
    try {
      // Save to Firestore via API
      await fetch('/api/save-str-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_id: caseId,
          narrative: narrative,
          auto_saved: autoSaveEnabled,
          saved_at: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const getQualityColor = (tier) => {
    switch (tier) {
      case 'EXCELLENT': return 'text-green-600';
      case 'GOOD': return 'text-blue-600';
      case 'FAIR': return 'text-yellow-600';
      case 'POOR': return 'text-red-600';
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

  // Mock scoring for development/testing
  const getMockScoringResult = (text) => {
    const wordCount = text.trim().split(/\s+/).length;
    const hasSpecifics = /\$[\d,]+|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(text);
    const hasSuspiciousTerms = /(suspicious|unusual|irregular|concern|structur)/i.test(text);
    
    let score = 2.0;
    if (wordCount > 50) score += 0.5;
    if (wordCount > 100) score += 0.5;
    if (hasSpecifics) score += 1.0;
    if (hasSuspiciousTerms) score += 1.0;
    
    const tier = score >= 4.5 ? 'EXCELLENT' : 
                 score >= 3.5 ? 'GOOD' : 
                 score >= 2.5 ? 'FAIR' : 'POOR';

    return {
      overall_score: Math.min(5.0, score),
      quality_tier: tier,
      confidence: 0.85,
      requires_review: score < 3.0,
      rubric_scores: {
        clarity: Math.min(5, score + 0.2),
        completeness: Math.min(5, score - 0.1),
        specificity: hasSpecifics ? Math.min(5, score + 0.3) : Math.max(1, score - 0.5),
        timeline: Math.min(5, score),
        redFlags: hasSuspiciousTerms ? Math.min(5, score + 0.5) : Math.max(1, score - 0.3),
        compliance: Math.min(5, score + 0.1)
      },
      recommendations: score < 3.5 ? [
        'Add more specific details about dates, amounts, and parties involved',
        'Include clearer identification of suspicious indicators',
        'Provide more detailed chronological sequence of events'
      ] : ['Narrative meets quality standards']
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">STR Co-Pilot</h1>
          <p className="text-gray-600">Intelligent Suspicious Transaction Report Assistant</p>
        </div>
        <div className="text-sm text-gray-500">
          Case: {caseId}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Narrative Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="font-bold">📄</span>
                STR Narrative
              </CardTitle>
              <CardDescription>
                Compose your suspicious transaction report narrative. The system will automatically assess quality and provide recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the suspicious activity, including specific dates, amounts, parties involved, and reasons for suspicion..."
                className="min-h-[300px] text-sm"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {narrative.length} characters • {narrative.trim().split(/\s+/).filter(w => w).length} words
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={saveDraft}
                    disabled={!narrative.trim()}
                  >
                    Save Draft
                  </Button>
                  <Button 
                    onClick={scoreNarrative}
                    disabled={isScoring || narrative.length < 20}
                    className="flex items-center gap-2"
                  >
                    {isScoring ? (
                      <>
                        <span className="animate-spin">🔄</span>
                        Scoring...
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        Score Quality
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quality Assessment Panel */}
        <div className="space-y-4">
          {/* Overall Score */}
          {scoringResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getQualityIcon(scoringResult.quality_tier)}
                  Quality Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {scoringResult.overall_score.toFixed(1)}/5.0
                  </div>
                  <div className={`text-lg font-medium ${getQualityColor(scoringResult.quality_tier)}`}>
                    {scoringResult.quality_tier}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Confidence: {(scoringResult.confidence * 100).toFixed(0)}%
                  </div>
                </div>

                {scoringResult.requires_review && (
                  <Alert>
                    <span className="text-yellow-600 font-bold">⚠</span>
                    <AlertTitle>Review Required</AlertTitle>
                    <AlertDescription>
                      This narrative requires additional review before submission.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rubric Breakdown */}
          {scoringResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quality Rubric</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(scoringResult.rubric_scores).map(([criterion, score]) => (
                  <div key={criterion} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{criterion}</span>
                      <span>{score.toFixed(1)}/5.0</span>
                    </div>
                    <Progress value={(score / 5) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {scoringResult && scoringResult.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {scoringResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quality Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>• Include specific dates, times, and amounts</p>
              <p>• Clearly identify suspicious indicators</p>
              <p>• Provide chronological sequence of events</p>
              <p>• Use objective, factual language</p>
              <p>• Explain why activity is suspicious</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
