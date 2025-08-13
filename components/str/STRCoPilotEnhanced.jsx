import React, { useState, useEffect, useCallback } from 'react';
import NarrativeEditor from './NarrativeEditor';
import QualityAssessmentPanel from './QualityAssessmentPanel';

const STRCoPilotEnhanced = () => {
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
      // Simulate API call with mock scoring
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = getMockScoringResult(narrative);
      setScoringResult(mockResult);
    } catch (error) {
      console.error('Narrative scoring failed:', error);
    } finally {
      setIsScoring(false);
    }
  }, [narrative, caseId]);

  const saveDraft = async () => {
    if (!narrative.trim()) return;
    
    try {
      console.log('Saving STR draft:', {
        case_id: caseId,
        narrative: narrative,
        auto_saved: autoSaveEnabled,
        saved_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
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
    <div className="paradise-gradient-bg min-h-screen">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">STR Co-Pilot</h1>
            <p className="text-cyan-200">Intelligent Suspicious Transaction Report Assistant</p>
          </div>
          <div className="text-sm text-cyan-300">
            Case: {caseId}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Narrative Editor */}
          <div className="lg:col-span-2">
            <NarrativeEditor
              narrative={narrative}
              setNarrative={setNarrative}
              onScoreNarrative={scoreNarrative}
              onSaveDraft={saveDraft}
              isScoring={isScoring}
              caseId={caseId}
            />
          </div>

          {/* Quality Assessment Panel */}
          <div className="space-y-4">
            <QualityAssessmentPanel scoringResult={scoringResult} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default STRCoPilotEnhanced;