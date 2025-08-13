// API route for saving STR drafts
// Saves draft narratives and triggers auto-scoring

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { case_id, narrative, auto_saved, saved_at } = req.body;

    if (!case_id || !narrative) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In production, this would save to Firestore and trigger auto-scoring
    // For development, we'll simulate the save operation
    
    const draftData = {
      case_id,
      narrative,
      auto_saved: auto_saved || false,
      saved_at: saved_at || new Date().toISOString(),
      draft_id: `DRAFT_${Date.now()}`,
      status: 'DRAFT',
      narrative_length: narrative.length,
      word_count: narrative.trim().split(/\s+/).filter(w => w).length
    };

    // Simulate Firestore save delay
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('STR Draft saved:', {
      case_id: draftData.case_id,
      draft_id: draftData.draft_id,
      length: draftData.narrative_length,
      auto_saved: draftData.auto_saved
    });

    return res.status(200).json({
      success: true,
      draft: draftData,
      message: auto_saved ? 'Draft auto-saved' : 'Draft saved successfully'
    });

  } catch (error) {
    console.error('Save STR draft error:', error);
    return res.status(500).json({ 
      error: 'Save failed',
      message: error.message 
    });
  }
}
