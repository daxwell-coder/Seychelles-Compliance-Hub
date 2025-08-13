import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const NarrativeEditor = ({ 
  narrative, 
  setNarrative, 
  onScoreNarrative, 
  onSaveDraft, 
  isScoring,
  caseId 
}) => {
  const wordCount = narrative.trim().split(/\s+/).filter(w => w).length;
  const charCount = narrative.length;

  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <span className="font-bold">📄</span>
          STR Narrative
        </CardTitle>
        <CardDescription className="text-cyan-100">
          Compose your suspicious transaction report narrative. The system will automatically assess quality and provide recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Describe the suspicious activity, including specific dates, amounts, parties involved, and reasons for suspicion..."
          className="seychelles-input min-h-[300px] text-sm resize-none"
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-cyan-200">
            {charCount} characters • {wordCount} words
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onSaveDraft}
              disabled={!narrative.trim()}
              className="glass-effect border-white/20 text-white hover:bg-white/20"
            >
              Save Draft
            </Button>
            <Button 
              onClick={onScoreNarrative}
              disabled={isScoring || narrative.length < 20}
              className="paradise-button flex items-center gap-2"
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
  );
};

export default NarrativeEditor;