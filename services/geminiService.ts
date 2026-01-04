
import { GoogleGenAI, Type } from "@google/genai";

export const detectJargon = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following research statement for jargon and buzzwords. Identify them and suggest simpler alternatives. Return the result in a JSON array of objects with 'term' and 'alternative'.
    
    Statement: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            alternative: { type: Type.STRING }
          },
          required: ["term", "alternative"]
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const checkFalsifiability = async (hypothesis: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Evaluate the following hypothesis for falsifiability. If it is vague, suggest a version with a measurable metric. Return a JSON object with 'isFalsifiable' (boolean) and 'suggestion' (string).
    
    Hypothesis: "${hypothesis}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isFalsifiable: { type: Type.BOOLEAN },
          suggestion: { type: Type.STRING }
        },
        required: ["isFalsifiable", "suggestion"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const runOrphanCheck = async (blocks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const simplifiedBlocks = Object.entries(blocks).reduce((acc: any, [key, val]: [string, any]) => {
    acc[key] = val.items.map((i: any) => i.text);
    return acc;
  }, {});

  const prompt = `Perform a high-speed logical audit on this research canvas. Identify exactly 3 critical structural gaps.
  
  MAPPING DEFINITION: 
  - contribution: Key deliverables and scientific advances reported. NOT author roles.
  
  AUDIT RULES:
  - Identify Risks missing corresponding Contingencies.
  - Identify Hypotheses without Methodology steps.
  - Identify Gaps without Research Questions.
  - Identify high-level aims without success criteria (evidence_criteria).
  
  Content: ${JSON.stringify(simplifiedBlocks)}
  
  Return a JSON array of strings (max 3). Be technical and specific.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      // Removed thinking budget for absolute maximum speed on this diagnostic task
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text);
};

export const fixLogicalGap = async (blocks: any, warning: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simplifiedBlocks = Object.entries(blocks).reduce((acc: any, [key, val]: [string, any]) => {
    acc[key] = val.items.map((i: any) => i.text);
    return acc;
  }, {});

  const prompt = `The following research project has a logical gap: "${warning}".
  
  Current Project Canvas: ${JSON.stringify(simplifiedBlocks)}
  
  TASK: Resolve this specific logical gap by modifying the relevant canvas blocks. 
  
  Return a JSON object with the block IDs as keys, where each value is an array of strings representing the NEW, complete set of items for that block. 
  Only include keys for blocks that require changes.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          problem_context: { type: Type.ARRAY, items: { type: Type.STRING } },
          prior_work: { type: Type.ARRAY, items: { type: Type.STRING } },
          gaps_limits: { type: Type.ARRAY, items: { type: Type.STRING } },
          current_solutions: { type: Type.ARRAY, items: { type: Type.STRING } },
          questions_hypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
          aims_objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          novelty: { type: Type.ARRAY, items: { type: Type.STRING } },
          contribution: { type: Type.ARRAY, items: { type: Type.STRING } },
          stakeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
          impact: { type: Type.ARRAY, items: { type: Type.STRING } },
          methodology: { type: Type.ARRAY, items: { type: Type.STRING } },
          data: { type: Type.ARRAY, items: { type: Type.STRING } },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
          evidence_criteria: { type: Type.ARRAY, items: { type: Type.STRING } },
          milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
          decision_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          contingencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          timeline: { type: Type.ARRAY, items: { type: Type.STRING } },
          budget: { type: Type.ARRAY, items: { type: Type.STRING } },
          ethics: { type: Type.ARRAY, items: { type: Type.STRING } },
          access: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const processWizardInput = async (question: string, answer: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the user's answer: "${answer}" to question: "${question}", map the information.
    
    'contribution' category MUST refer to KEY DELIVERABLES/ADVANCES.
    
    Return a JSON object with relevant block IDs.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          problem_context: { type: Type.STRING },
          prior_work: { type: Type.STRING },
          gaps_limits: { type: Type.STRING },
          current_solutions: { type: Type.STRING },
          questions_hypotheses: { type: Type.STRING },
          aims_objectives: { type: Type.STRING },
          novelty: { type: Type.STRING },
          contribution: { type: Type.STRING },
          stakeholders: { type: Type.STRING },
          impact: { type: Type.STRING },
          methodology: { type: Type.STRING },
          data: { type: Type.STRING },
          resources: { type: Type.STRING },
          evidence_criteria: { type: Type.STRING },
          milestones: { type: Type.STRING },
          decision_points: { type: Type.STRING },
          risks: { type: Type.STRING },
          contingencies: { type: Type.STRING },
          timeline: { type: Type.STRING },
          budget: { type: Type.STRING },
          ethics: { type: Type.STRING },
          access: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const processDocumentImport = async (data: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let base64Data = data;
  if (data.includes('base64,')) {
    base64Data = data.split('base64,')[1];
  }

  const systemPrompt = `You are an Expert Research Analyst. Extract research components fast.
  Contribution category refers ONLY to KEY DELIVERABLES and ADVANCES. No author names.`;

  const parts: any[] = [{ text: systemPrompt }];
  const binaryMimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];

  if (binaryMimeTypes.includes(mimeType)) {
    parts.push({ inlineData: { data: base64Data, mimeType: 'application/pdf' } });
  } else {
    parts.push({ text: `RAW DOCUMENT DATA:\n\n${data}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: 8192 }, 
      temperature: 0.1,
      responseMimeType: "application/json",
      seed: 42,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          problem_context: { type: Type.ARRAY, items: { type: Type.STRING } },
          prior_work: { type: Type.ARRAY, items: { type: Type.STRING } },
          gaps_limits: { type: Type.ARRAY, items: { type: Type.STRING } },
          current_solutions: { type: Type.ARRAY, items: { type: Type.STRING } },
          questions_hypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
          aims_objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          novelty: { type: Type.ARRAY, items: { type: Type.STRING } },
          contribution: { type: Type.ARRAY, items: { type: Type.STRING } },
          stakeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
          impact: { type: Type.ARRAY, items: { type: Type.STRING } },
          methodology: { type: Type.ARRAY, items: { type: Type.STRING } },
          data: { type: Type.ARRAY, items: { type: Type.STRING } },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
          evidence_criteria: { type: Type.ARRAY, items: { type: Type.STRING } },
          milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
          decision_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          contingencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          timeline: { type: Type.ARRAY, items: { type: Type.STRING } },
          budget: { type: Type.ARRAY, items: { type: Type.STRING } },
          ethics: { type: Type.ARRAY, items: { type: Type.STRING } },
          access: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text);
  } catch (err) {
    throw new Error("AI extraction failed.");
  }
};

export const generateAbstract = async (blocks: any, projectName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Generate abstract for "${projectName}". Contribution = deliverables. Canvas: ${JSON.stringify(blocks)}`,
  });
  return response.text;
};

export const generateGrantOutline = async (blocks: any, projectName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Generate outline for "${projectName}". Contribution = deliverables. Canvas: ${JSON.stringify(blocks)}`,
  });
  return response.text;
};

export const refineCanvas = async (blocks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simplifiedBlocks = Object.entries(blocks).reduce((acc: any, [key, val]: [string, any]) => {
    acc[key] = val.items.map((i: any) => i.text);
    return acc;
  }, {});

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Refine this data. Contribution = deliverables. Data: ${JSON.stringify(simplifiedBlocks)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          problem_context: { type: Type.ARRAY, items: { type: Type.STRING } },
          prior_work: { type: Type.ARRAY, items: { type: Type.STRING } },
          gaps_limits: { type: Type.ARRAY, items: { type: Type.STRING } },
          current_solutions: { type: Type.ARRAY, items: { type: Type.STRING } },
          questions_hypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
          aims_objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
          novelty: { type: Type.ARRAY, items: { type: Type.STRING } },
          contribution: { type: Type.ARRAY, items: { type: Type.STRING } },
          stakeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
          impact: { type: Type.ARRAY, items: { type: Type.STRING } },
          methodology: { type: Type.ARRAY, items: { type: Type.STRING } },
          data: { type: Type.ARRAY, items: { type: Type.STRING } },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
          evidence_criteria: { type: Type.ARRAY, items: { type: Type.STRING } },
          milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
          decision_points: { type: Type.ARRAY, items: { type: Type.STRING } },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          contingencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          timeline: { type: Type.ARRAY, items: { type: Type.STRING } },
          budget: { type: Type.ARRAY, items: { type: Type.STRING } },
          ethics: { type: Type.ARRAY, items: { type: Type.STRING } },
          access: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text);
};
