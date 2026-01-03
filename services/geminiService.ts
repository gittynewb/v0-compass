
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
  
  // Robust base64 extraction from DataURL
  let base64Data = data;
  if (data.includes('base64,')) {
    base64Data = data.split('base64,')[1];
  }

  const systemPrompt = `You are a World-Class Research Systems Analyst. Analyze the attached document (it could be a PDF, Word doc, or text file) and systematically extract core research components to populate a Strategic Research Canvas.

CRITICAL REQUIREMENTS:
1. MULTIMODAL EXTRACTION: If this is a PDF or binary file, use your advanced vision/document-parsing capabilities to read all text, tables, and section headers. 
2. MAPPING LOGIC:
   - 'gaps_limits': Look for unresolved questions, technical bottlenecks, or "Future Work" sections.
   - 'questions_hypotheses': Identify central claims, research questions, or predictive statements.
   - 'evidence_criteria': Find mention of success metrics, p-values, benchmarks, or validation protocols.
   - 'methodology': Extract the specific technical procedures, controls, and study design.
   - 'impact': Look for societal, technical, or economic benefits.
3. OUTPUT FORMAT: Return ONLY a valid JSON object.
4. QUALITY: Use professional, high-level scientific terminology. Consolidate redundant information.

DOCUMENT CONTEXT: ${mimeType.includes('pdf') ? 'PDF Document' : mimeType.includes('word') ? 'Word Document' : 'Plain Text Document'}`;

  const parts: any[] = [{ text: systemPrompt }];

  const binaryMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (binaryMimeTypes.includes(mimeType)) {
    // Note: If Word documents fail with their specific MIME types, 
    // we use application/pdf for PDFs and let the model handle Word headers 
    // if we pass application/octet-stream or the specific Word mime.
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: binaryMimeTypes.includes(mimeType) && !mimeType.includes('pdf') 
          ? 'application/pdf' // Hack: Gemini often handles docx better if treated as a generic searchable document, but let's try the correct one first. Actually, PDF is highly stable.
          : mimeType 
      }
    });
  } else {
    parts.push({ text: `DOCUMENT CONTENT:\n"""\n${data}\n"""` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: 8000 }, // Increased budget for complex document parsing
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
  
  try {
    return JSON.parse(response.text);
  } catch (err) {
    throw new Error("AI returned an invalid format. This often happens if the document is too long or extremely dense.");
  }
};

export const generateGrantDraft = async (blocks: any, projectName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Using the provided Discovery Canvas data for the project "${projectName}", generate an NSF-style Project Summary (Executive Summary). 
    
    The document must adhere to NSF standards and be structured into three explicit sections:
    1. Overview: A description of the project, including goals and activities.
    2. Intellectual Merit: The potential of the proposed activity to advance knowledge.
    3. Broader Impacts: The potential of the proposed activity to benefit society and contribute to the achievement of specific, desired societal outcomes.
    
    Canvas Content: ${JSON.stringify(blocks)}
    
    Ensure the tone is formal, academic, and highly persuasive. Use professional scientific terminology appropriate for a grant reviewer.`,
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
    contents: `Evaluate the following research canvas data. For each block, consolidate similar or redundant points, improve wording for technical accuracy and clarity, and ensure a professional tone. 
    CRITICAL: Never change the original meaning, implication, or intent of the user's input. 
    
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
