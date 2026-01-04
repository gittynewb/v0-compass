
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
  const prompt = `Review this research canvas structure for logical gaps. Look for:
  - Risks without contingency plans
  - Study designs that don't test stated hypotheses
  - Gaps without corresponding research questions
  - Missing resource requirements for complex methodologies
  
  Content: ${JSON.stringify(blocks)}
  
  Return a list of warnings (max 3) in a JSON array of strings. Each warning should be a clear description of a single logical issue.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
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

  const prompt = `The following research project has a logical gap detected by the validation engine: "${warning}".
  
  Current Project Canvas: ${JSON.stringify(simplifiedBlocks)}
  
  TASK: Resolve this specific logical gap by modifying the relevant canvas blocks. 
  - If a risk is orphaned, add a contingency.
  - If a method is unsupported, add the required resources or data.
  - If a hypothesis is not being tested, add a relevant methodological step.
  
  Return a JSON object with the block IDs as keys, where each value is an array of strings representing the NEW, complete set of items for that block. 
  Only include keys for blocks that require changes. Keep changes minimal and focused solely on resolving the warning.`;

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
    contents: `Based on the user's answer to the specific research question: "${question}", extract and format the core information. 
    User Answer: "${answer}"
    
    Map the extracted information to the most relevant categories among the Discovery Canvas blocks.
    
    Return a JSON object where keys are the relevant block IDs and values are concise, bullet-point ready strings summarizing the information for that block.`,
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

  const systemPrompt = `You are an Expert Research Analyst. 
Your objective is to perform a FAST, EXHAUSTIVE, and CONSISTENT extraction of research components from the provided document into a structured Discovery Canvas.

OPERATIONAL RULES:
1. THOROUGH SCAN: Capture every nuanced claim, methodological detail, and deliverables.
2. RIGID CATEGORIZATION: Map findings with high precision.
3. CONTRIBUTION DEFINITION: The 'contribution' category refers to KEY DELIVERABLES, SCIENTIFIC ADVANCES, and TANGIBLE OUTCOMES reported in the text. DO NOT extract author names or contribution roles (e.g., "John wrote the paper") into this category.
4. MAPPING DICTIONARY:
   - problem_context: The broad setting.
   - gaps_limits: Specific bottlenecks.
   - novelty: What is new or unique.
   - methodology: Technical procedures.
   - evidence_criteria: Success metrics.
   - contribution: Deliverables, advances, and outcomes (NOT author roles).
5. NO HALLUCINATION: Only extract what is present in the source.

DOCUMENT TYPE: ${mimeType}`;

  const parts: any[] = [{ text: systemPrompt }];

  const binaryMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (binaryMimeTypes.includes(mimeType)) {
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: 'application/pdf'
      }
    });
  } else {
    parts.push({ text: `RAW DOCUMENT DATA:\n\n${data}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // Use Flash for high speed
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: 16384 }, // High reasoning budget for thoroughness
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
    console.error("Failed to parse AI response:", response.text);
    throw new Error("AI extraction failed to produce valid structured data.");
  }
};

export const generateAbstract = async (blocks: any, projectName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Based on the provided Discovery Canvas data for "${projectName}", generate a high-impact Scientific Abstract.
    
    The abstract should cover:
    - The problem and its significance.
    - The specific gap in knowledge.
    - The core hypothesis/solution.
    - High-level methodology.
    - Expected deliverables and contribution to the field.
    
    Canvas Content: ${JSON.stringify(blocks)}
    
    Tone: Professional and academic.`,
  });
  return response.text;
};

export const generateGrantOutline = async (blocks: any, projectName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Using the provided Discovery Canvas data for "${projectName}", generate a detailed Grant Outline.
    
    The document MUST follow this structure:
    
    1. PROJECT DESCRIPTION
       - Introduction/Objectives: What you're doing and why.
       - Rationale/Scope: Scientific justification, preliminary data, and predictions.
       - Research Plan/Methods: Detailed "how-to," including experimental design.
    2. INTELLECTUAL MERIT: Significance of the work and its potential to advance knowledge.
    3. BROADER IMPACTS: Societal benefits, education, outreach, and diversity goals.
    4. EVALUATION/SUCCESS: Definitive success metrics and benchmarks.
    
    Canvas Content: ${JSON.stringify(blocks)}
    
    Tone: Formal and technical.`,
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
    contents: `Evaluate the following research canvas data. Consolidate similar points, improve technical wording, and ensure a professional tone. 
    Never change the original meaning or intent. 
    
    Data: ${JSON.stringify(simplifiedBlocks)}
    
    Return a JSON object with the same keys, where each value is an array of refined strings.`,
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
