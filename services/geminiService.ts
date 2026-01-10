
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
  
  AUDIT RULES:
  - Identify Risks missing corresponding Contingencies.
  - Identify Hypotheses without Methodology steps.
  - Identify Gaps without Research Questions.
  - Identify high-level aims without success criteria (evidence_criteria).
  
Logic chain:
THE "WHY" CHAIN (Defining the Niche)
1.	Problem Context + Prior Work connect to Gaps & Limits
You must define the landscape to prove a hole exists.
2.	Gaps & Limits + Current Solutions connect to Novelty
This is the triangulation you noted. Novelty is the intersection of "what is missing" (Gaps) and "why existing attempts failed" (Current Solutions).
THE "WHAT" CHAIN (The Research Spine)
3. Gaps & Limits connect to Questions & Hypotheses
The specific missing knowledge directly prompts the research question.
4.	Questions & Hypotheses connect to Aims & Objectives
This is the tight operational coupling.
•	Hypothesis: The prediction.
•	Aim: The specific action taken to test that prediction.
5.	Aims & Objectives connect to Evidence Criteria
If the Aim is the action, the Evidence Criteria is the proof that the action was successful.
THE "HOW" CHAIN (Execution)
6. Aims & Objectives connect to Methodology
The method must be selected specifically to achieve the stated Aim.
7.	Methodology connects to Data & Resources
The method dictates the raw materials (Data) and tools (Resources) required.
8.	Constraints connect to Methodology
Budget, ethics, and time limit which methods are viable.
THE "SO WHAT" CHAIN (Value)
9. Novelty connects to Impact & Stakeholders
The specific academic output determines who cares (Stakeholders) and the downstream effect (Impact).
THE REALITY CHECK (Feasibility)
10. Risks connect to Contingencies
Every risk requires a specific backup plan.

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
      blocks: ['problem_context', 'prior_work', 'gaps_limits', 'questions_hypotheses', 'aims_objectives', 'novelty']
    },
    {
      name: "Execution & Logistics",
      blocks: ['methodology', 'data', 'resources', 'milestones']
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
    - questions_hypotheses: Falsifiable predictions.
    - evidence_criteria: Success metrics/benchmarks.
    - novelty: Technical differentiators.
    - stakeholders: Potential users, customers, or organizations that will gain a technical, economic, or societal advantage from the project.
    
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
