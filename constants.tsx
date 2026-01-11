
import { WizardQuestion, BlockId, CanvasBlock } from './types';

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  // PROBLEM SPACE
  { 
    id: 1, 
    question: "What is the status quo? Describe the current landscape, existing solutions, and how things are done today.", 
    targetBlocks: ['problem_context'], 
    description: "Establish the 'macro' view, prior work, and current standard of practice.",
    hints: [
      "Societal pressures or emerging global trends.",
      "Existing prototypes, pilot study outcomes, or 'Gold Standard' assays.",
      "Urgency: Why is a solution needed now vs. 10 years ago?"
    ]
  },
  { 
    id: 3, 
    question: "What is the fundamental bottleneck, knowledge gap, or unresolved anomaly in current research?", 
    targetBlocks: ['gaps_limits'], 
    description: "Identify the critical friction point your project intends to resolve.",
    hints: [
      "Technical: Computational complexity, signal-to-noise ratio, or material fatigue.",
      "Theoretical: Inconsistencies in models or lack of formal proofs.",
      "Empirical: Biological pathways unknown or data resolution limits."
    ]
  },
  // CLAIM SPACE
  { 
    id: 5, 
    question: "What is your central research question, and what is your falsifiable hypothesis or predicted outcome?", 
    targetBlocks: ['questions_hypotheses'], 
    description: "State exactly what you are testing. What specific system behavior do you predict?",
    hints: [
      "Hypothesis: 'Under conditions [X], system [Y] will exhibit [Z] because...' ",
      "Ensure it can be proven WRONG through specific measurement.",
      "What is the 'pivot point' of your entire project?"
    ]
  },
  { 
    id: 7, 
    question: "What are your specific technical objectives? What concrete milestones define success for this claim?", 
    targetBlocks: ['aims_objectives'], 
    description: "State the measurable outcomes required to validate your hypothesis.",
    hints: [
      "Synthesis/Construction: 'To develop a prototype capable of [X]...'",
      "Optimization: 'To increase throughput by [Y]%...'",
      "Characterization: 'To map the interaction between [A] and [B]...'"
    ]
  },
  { 
    id: 6, 
    question: "What is new or unique about your approach? What fundamentally differentiates it from the status quo?", 
    targetBlocks: ['novelty'], 
    description: "Define your unique technical angle or 'Secret Sauce'.",
    hints: [
      "Cross-disciplinary synthesis (e.g., applying Physics methods to Biology).",
      "New order of magnitude in precision, scale, or speed.",
      "A shift in theoretical paradigm or a new synthesis of existing data."
    ]
  },
  // EXECUTION SPACE
  { 
    id: 8, 
    question: "What is the high-level strategy for your investigation? Describe your specific methods and controls.", 
    targetBlocks: ['methodology'], 
    description: "The 'How': Key Methods, strategy, experiments, and protocols.",
    hints: [
      "Computational: Algorithmic design, Big-O analysis, simulation parameters.",
      "Experimental: Assay protocols, material synthesis, controlled trials.",
      "Theoretical: Formal derivation strategies or proof-by-induction frameworks."
    ]
  },
  { 
    id: 9, 
    question: "What data, physical materials, or infrastructure do you need? What do you already possess vs. what must be acquired?", 
    targetBlocks: ['resources'], 
    description: "Inventory of your information assets, raw inputs, and compute needs.",
    hints: [
      "Instrument readouts, synthetic datasets, or archival records.",
      "Reagents, transgenic models, or specific material alloys.",
      "HPC clusters, cleanroom access, or specific lab equipment."
    ]
  },
  // VALIDATION
  { 
    id: 11, 
    question: "What specific metrics, p-values, or benchmarks will serve as definitive verification of your claims?", 
    targetBlocks: ['evidence_criteria'], 
    description: "The verification framework: When do you declare 'Proof'?",
    hints: [
      "Statistical significance thresholds.",
      "Accuracy, precision, and recall benchmarks.",
      "Repeatability standards across independent trials."
    ]
  },
  // VALUE SPACE
  { 
    id: 13, 
    question: "Who are the direct beneficiaries—stakeholders, industries, or communities of practice?", 
    targetBlocks: ['stakeholders'], 
    description: "Identify your immediate audience and translation partners.",
    hints: [
      "Other academic labs or specific industry R&D departments.",
      "Regulatory bodies or policy makers.",
      "End-users (e.g., patients, software developers, field engineers)."
    ]
  },
  { 
    id: 14, 
    question: "If this project succeeds perfectly, what is the 'big picture' translational vision or societal impact?", 
    targetBlocks: ['impact'], 
    description: "The long-term transformation or legacy of the work.",
    hints: [
      "Environmental sustainability or public health transformation.",
      "Economic shifts or disruptive technological breakthroughs.",
      "Advancing human knowledge or ethical standards."
    ]
  },
  // RISK & STRATEGY
  { 
    id: 17, 
    question: "What are the critical temporal checkpoints or milestones for this project?", 
    targetBlocks: ['milestones'], 
    description: "The project roadmap and execution timeline.",
    hints: [
      "Phase 1 complete: Data acquisition and cleanup.",
      "Phase 2 complete: Initial prototype/model verification.",
      "Phase 3: Final analysis and manuscript submission."
    ]
  },
  { 
    id: 15, 
    question: "What are the most probable hazards, and what are your Plan B contingencies?", 
    targetBlocks: ['risks'], 
    description: "Failure modes and mitigation strategies.",
    hints: [
      "Instrument downtime, data sparsity, or material shortages.",
      "Alternative data sources or surrogate model systems.",
      "Reduced scope 'minimum viable research' pathways."
    ]
  },
  // CONSTRAINTS
  { 
    id: 19, 
    question: "What are the hard parameters regarding project timeline, funding caps, and ethical/IRB requirements?", 
    targetBlocks: ['timeline', 'budget', 'ethics'], 
    description: "The fixed boundaries of the research project.",
    hints: [
      "Grant duration (e.g., 24 months) and total cost limits.",
      "Institutional Review Board (IRB) or animal welfare approvals.",
      "Security clearances or restricted data access protocols."
    ]
  }
];

export const INITIAL_BLOCKS: Record<BlockId, CanvasBlock> = {
  problem_context: { id: 'problem_context', title: 'STATUS QUO', description: 'Broader setting. What exists? How is it done today?', category: 'PROBLEM', items: [] },
  gaps_limits: { id: 'gaps_limits', title: 'GAPS & LIMITS', description: "What's missing or broken? Why is the status quo insufficient?", category: 'PROBLEM', items: [] },
  
  questions_hypotheses: { id: 'questions_hypotheses', title: 'QUESTIONS & HYPOTHESES', description: 'What do you hope to learn? What do you predict?', category: 'CLAIM', items: [] },
  aims_objectives: { id: 'aims_objectives', title: 'AIMS & OBJECTIVES', description: 'Measurable project goals.', category: 'CLAIM', items: [] },
  novelty: { id: 'novelty', title: 'NEW APPROACH, INSIGHT, INNOVATION', description: 'What is NEW in your approach?', category: 'CLAIM', items: [] },
  
  stakeholders: { id: 'stakeholders', title: 'TARGET AUDIENCE', description: 'Who cares? Who will benefit?', category: 'VALUE', items: [] },
  impact: { id: 'impact', title: 'SIGNIFICANCE & IMPACT', description: 'What VALUE does this add?', category: 'VALUE', items: [] },
  
  methodology: { id: 'methodology', title: 'METHODOLOGY', description: 'Key Methods, strategy, experiments, controls.', category: 'EXECUTION', items: [] },
  resources: { id: 'resources', title: 'RESOURCES NEEDED', description: 'What do you need? Data sources, compute, tools, skills.', category: 'EXECUTION', items: [] },
  
  evidence_criteria: { id: 'evidence_criteria', title: 'EVIDENCE CRITERIA', description: 'How will you prove / disprove each claim?', category: 'VALIDATION', items: [] },
  
  milestones: { id: 'milestones', title: 'MILESTONES', description: 'Timeline & checkpoints.', category: 'RISK', items: [] },
  risks: { id: 'risks', title: 'RISKS & CONTINGENCIES', description: 'What could fail? Backup plans. Kill criteria.', category: 'RISK', items: [] },
  
  timeline: { id: 'timeline', title: 'TIMELINE', description: 'Deadlines...', category: 'CONSTRAINTS', items: [] },
  budget: { id: 'budget', title: 'BUDGET', description: 'Funding needs / limits...', category: 'CONSTRAINTS', items: [] },
  ethics: { id: 'ethics', title: 'ETHICS / IRB', description: 'Approvals needed...', category: 'CONSTRAINTS', items: [] },
};
