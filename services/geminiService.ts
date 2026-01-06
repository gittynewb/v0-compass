
import { GoogleGenAI, Type } from "@google/genai";

// Helper to define block schema subsets for modular processing
const generateBlockSchema = (keys: string[]) => {
  const properties: any = {};
  keys.forEach(key => {
    properties[key] = { type: Type.ARRAY, items: { type: Type.STRING } };
  });
  return {
    type: Type.OBJECT,
    properties,
    required: keys
  };
};

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
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The following research project has a logical gap: "${warning}". Resolve it.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const processWizardInput = async (question: string, answer: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Map answer: "${answer}" to question: "${question}".`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text);
};

export const processDocumentImport = async (data: string, mimeType: string, onUpdate?: (stage: string) => void) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let base64Data = data;
  if (data.includes('base64,')) {
    base64Data = data.split('base64,')[1];
  }

  const groups = [
    {
      name: "Background & Core Claims",
      blocks: ['problem_context', 'prior_work', 'gaps_limits', 'questions_hypotheses', 'novelty', 'contribution']
    },
    {
      name: "Execution & Logistics",
      blocks: ['aims_objectives', 'methodology', 'data', 'resources', 'milestones', 'decision_points']
    },
    {
      name: "Value, Strategy & Constraints",
      blocks: ['stakeholders', 'impact', 'evidence_criteria', 'risks', 'contingencies', 'timeline', 'budget', 'ethics', 'access']
    }
  ];

  const processGroup = async (group: {name: string, blocks: string[]}) => {
    if (onUpdate) onUpdate(`Analyzing ${group.name}...`);
    
    const prompt = `You are a PhD-level research analyst. From the provided PDF, extract technical details for these specific blocks: ${group.blocks.join(', ')}.
    
    DEFINITIONS:
    - contribution: Deliverables/advances.
    - questions_hypotheses: Falsifiable predictions.
    - evidence_criteria: Success metrics/benchmarks.
    - novelty: Technical differentiators.
    - Steakholders: Potential users, customers, or organizations that will gain a technical, economic, or societal advantage from the project.
    
    Return ONLY JSON. Ensure maximum coverage for these specific blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt },
        { inlineData: { data: base64Data, mimeType: mimeType } }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: generateBlockSchema(group.blocks)
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error(`Failed to parse group: ${group.name}`, e);
      return {};
    }
  };

  const results = await Promise.all(groups.map(g => processGroup(g)));
  return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
};

export const refineCanvas = async (blocks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const simplifiedBlocks = Object.entries(blocks).reduce((acc: any, [key, val]: [string, any]) => {
    const items = val.items.map((i: any) => i.text).filter((t: string) => t.trim().length > 0);
    if (items.length > 0) acc[key] = items;
    return acc;
  }, {});

  const blockKeys = Object.keys(simplifiedBlocks);
  if (blockKeys.length === 0) return {};

  const prompt = `As a professional scientific editor, refine the following research canvas data. 
  TASK:
  1. Improve technical wording and framing for clarity and academic professionalism.
  2. Consolidate similar or redundant bullet points within the same block into single, comprehensive statements.
  3. CRITICAL RULE: NEVER change the fundamental intent, meaning, or specific data points of the user's original input.
  4. Ensure 'contribution' blocks describe key scientific deliverables or advances.

  Return a JSON object mapping the provided block IDs to their NEW arrays of refined strings.
  
  DATA: ${JSON.stringify(simplifiedBlocks)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: generateBlockSchema(blockKeys)
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Refine parse failed", e);
    return {};
  }
};

export const generateAbstract = async (blocks: any, projectName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Generate abstract for "${projectName}". Canvas: ${JSON.stringify(blocks)}`,
  });
  return response.text;
};

export const generateGrantOutline = async (blocks: any, projectName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Generate a comprehensive Grant Proposal Outline for "${projectName}" using the following Research Compass data: ${JSON.stringify(blocks)}.
  
  Key Features of a Good NSF Proposal Project Description
Clarity and Significance

Opens with a compelling problem statement that establishes why this research matters now
Clearly articulates intellectual merit and broader impacts throughout (not just in separate sections)
Connects to the specific program's priorities and review criteria

Strong Scientific Foundation

Demonstrates deep knowledge of the field and positions work within current literature
Identifies genuine gaps—not just "no one has done X" but why X matters
Presents preliminary data that de-risks the proposal and shows feasibility

Well-Structured Approach

Specific, testable hypotheses or clear research questions
Logical flow from aims to methods to expected outcomes
Realistic timeline with milestones
Anticipates challenges and describes alternative approaches

Rigor and Reproducibility

Addresses statistical considerations, controls, and validation strategies
Describes how data will be managed and shared

Integration of Broader Impacts

Goes beyond boilerplate—shows genuine integration with the research
Specific, measurable activities with clear outcomes


Typical Headings:

- Introduction / Project Overview
- Background and Rationale
- Preliminary Studies / Results
- Research Plan (or Objectives and Approach)
  Aim 1, Aim 2, Aim 3 (as subsections)
- Expected Outcomes and Significance
- Timeline
- Broader Impacts

  Ensure the output is well-formatted, professional, and directly utilizes the specific details from the provided Research Compass data.`;
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
  });
  return response.text;
};
