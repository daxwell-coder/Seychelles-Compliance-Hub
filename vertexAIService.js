import { VertexAI } from '@google-cloud/vertexai';
import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Vertex AI
const vertex_ai = new VertexAI({
  project: process.env.GCP_PROJECT_ID || 'seychelles-compliance-hub-prod',
  location: process.env.GCP_LOCATION || 'us-central1',
});

const model = 'gemini-1.5-pro-001'; // Or your preferred model

const generativeModel = vertex_ai.getGenerativeModel({
  model: model,
  generationConfig: {
    'maxOutputTokens': 8192,
    'temperature': 0.2,
    'responseMimeType': 'application/json', // Enforce JSON output
  },
});

/**
 * @description Analyzes an IBC formation application using Vertex AI (Gemini).
 * @param {string} formationId The ID of the Firestore document.
 * @param {object} applicationData The application data to be analyzed.
 */
export const analyzeIbcApplication = async (formationId, applicationData) => {
  console.log(`[VertexAI] Starting analysis for formation ID: ${formationId}`);

  const prompt = `
    You are an expert Seychelles corporate compliance and risk analysis officer.
    Your task is to analyze the following application for a new International Business Company (IBC).
    Based on the provided data, perform a risk assessment and generate a summary.

    Application Data:
    ${JSON.stringify(applicationData, null, 2)}

    Your analysis must be returned as a single, valid JSON object with the following structure:
    {
      "riskScore": <An integer between 0 and 100 representing the overall risk. 0 is no risk, 100 is maximum risk.>,
      "riskLevel": <A string: "low", "medium", or "high">,
      "summary": "<A concise, one-sentence summary of your findings.>",
      "potentialRisks": [
        "<A string describing the first potential risk or compliance issue.>",
        "<A string describing the second potential risk, if any.>"
      ],
      "recommendedActions": [
        "<A string describing the first recommended action for a compliance officer.>",
        "<A string describing the second recommended action, if any.>"
      ]
    }

    Analyze the directors, shareholders, business activity, and source of funds.
    Consider factors like complex ownership structures, high-risk business activities (e.g., gambling, arms),
    and vague or unverifiable source of funds. Assign a higher risk score for such factors.
  `;

  try {
    const [response] = await generativeModel.generateContent([prompt]);
    const analysisResult = response.candidates[0].content.parts[0].text;

    console.log(`[VertexAI] Analysis complete for ${formationId}. Updating Firestore.`);

    const docRef = db.collection('ibc_formations').doc(formationId);

    // Update the document with the AI analysis and change the status
    await docRef.update({
      aiAnalysis: {
        ...JSON.parse(analysisResult),
        analysisModel: model,
        analysisCompletedAt: FieldValue.serverTimestamp(),
      },
      status: 'analysis_completed',
      updatedAt: FieldValue.serverTimestamp(),
      'history': FieldValue.arrayUnion({
        timestamp: FieldValue.serverTimestamp(),
        status: 'analysis_completed',
        action: 'Vertex AI analysis completed.',
        actor: `system:mcp-server`
      })
    });

    console.log(`[Firestore] Successfully updated document ${formationId} with AI analysis.`);

  } catch (error) {
    console.error(`[VertexAI] Error analyzing application ${formationId}:`, error);
    // Optional: Update the document to reflect the error state
    const docRef = db.collection('ibc_formations').doc(formationId);
    await docRef.update({ status: 'analysis_failed', updatedAt: FieldValue.serverTimestamp() });
  }
};