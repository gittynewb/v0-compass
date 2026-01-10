
import { WizardQuestion, BlockId, CanvasBlock } from './types';

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  // PROBLEM SPACE
  { 
    id: 1, 
    question: "What is the current scientific, technical, or societal landscape? Why is this area critical now?", 
    targetBlocks: ['problem_context'], 
    description: "Establish the 'macro' view and contemporary relevance of this field.",
    hints: [
      "Societal pressures or emerging global trends.",
      "Technological maturity or theoretical readiness in the field.",
      "Urgency: Why is a solution needed now vs. 10 years ago?"
    ]
  },
  { 
    id: 2, 
    question: "What foundational knowledge—empirical findings, theoretical proofs, or engineering standards—does this project build upon?", 
    targetBlocks: ['prior_work'], 
    description: "Identify the established baseline or state-of-the-art foundation.",
    hints: [
      "Seminal papers, patents, or industry standards.",
      "Previous experimental results or mathematical lemmas.",
      "Existing prototypes or pilot study outcomes."
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
  { 
    id: 4, 
    question: "How is this problem currently managed? What are the standard benchmarks or 'status quo' approaches?", 
    targetBlocks: ['current_solutions'], 
    description: "Describe existing solutions and their inherent limitations.",
    hints: [
      "Ad-hoc methods, brute force, or expensive legacy systems.",
      "Current 'Gold Standard' assays or algorithms.",
      "Why do these fail to address the gap identified in the previous step?"
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
    id: 6, 
    question: "What is new or unique about your approach? What fundamentally differentiates it from prior work?", 
    targetBlocks: ['novelty'], 
    description: "Define your unique technical angle or 'Secret Sauce'.",
    hints: [
      "Cross-disciplinary synthesis (e.g., applying Physics methods to Biology).",
      "New order of magnitude in precision, scale, or speed.",
      "A shift in theoretical paradigm or a new synthesis of existing data."
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
    question: "What data or physical materials are required? What do you already possess vs. what must be acquired?", 
    targetBlocks: ['data'], 
    description: "Inventory of your information assets and raw inputs.",
    hints: [
      "Instrument readouts, synthetic datasets, or archival records.",
      "Reagents, transgenic models, or specific material alloys.",
      "Open-source libraries vs. proprietary data streams."
    ]
  },
  { 
    id: 10, 
    question: "What specialized operational infrastructure or collaborations are essential for success?", 
    targetBlocks: ['resources'], 
    description: "The physical and human fuel for your research.",
    hints: [
      "HPC clusters, cleanroom access, or specific lab equipment (e.g., NMR, Cryo-EM).",
      "Subject matter experts (SMEs) or external industry partners.",
      "Specialized technicians or software engineering support."
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
    id: 15, 
    question: "What are the most probable technical hazards or external risks that could compromise the project?", 
    targetBlocks: ['risks'], 
    description: "Honest assessment of failure modes and danger zones.",
    hints: [
      "Instrument downtime or material shortages.",
      "Data sparsity, bias, or loss of signal.",
      "Key personnel departure or shifting regulatory requirements."
    ]
  },
  { 
    id: 16, 
    question: "What are the strategic redundancies and 'Plan B' contingencies for the hazards identified?", 
    targetBlocks: ['contingencies'], 
    description: "The safety net and mitigation strategies.",
    hints: [
      "Alternative data sources or surrogate model systems.",
      "Backup lab facilities or distributed compute resources.",
      "Reduced scope 'minimum viable research' pathways."
    ]
  },
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
  // CONSTRAINTS
  { 
    id: 19, 
    question: "What are the hard parameters regarding project timeline, funding caps, and ethical/IRB requirements?", 
    targetBlocks: ['timeline', 'budget', 'ethics', 'access'], 
    description: "The fixed boundaries of the research project.",
    hints: [
      "Grant duration (e.g., 24 months) and total cost limits.",
      "Institutional Review Board (IRB) or animal welfare approvals.",
      "Security clearances or restricted data access protocols."
    ]
  }
];

export const INITIAL_BLOCKS: Record<BlockId, CanvasBlock> = {
  problem_context: { id: 'problem_context', title: 'Problem Context', description: 'Broader setting or situation.', category: 'PROBLEM', items: [] },
  prior_work: { id: 'prior_work', title: 'Prior Work', description: 'What exists? Key references.', category: 'PROBLEM', items: [] },
  gaps_limits: { id: 'gaps_limits', title: 'Gaps & Limits', description: "What's missing or broken?", category: 'PROBLEM', items: [] },
  current_solutions: { id: 'current_solutions', title: 'Current Solutions', description: "How is it done today?", category: 'PROBLEM', items: [] },
  
  questions_hypotheses: { id: 'questions_hypotheses', title: 'Questions & Hypotheses', description: 'Q: What are you asking? H: What do you predict?', category: 'CLAIM', items: [] },
  aims_objectives: { id: 'aims_objectives', title: 'Aims & Objectives', description: 'Measurable project goals.', category: 'CLAIM', items: [] },
  novelty: { id: 'novelty', title: 'New Approach, Insight, Innovation', description: 'What is NEW in your approach?', category: 'CLAIM', items: [] },
  
  stakeholders: { id: 'stakeholders', title: 'Target Audience', description: 'Who cares? Who will benefit?', category: 'VALUE', items: [] },
  impact: { id: 'impact', title: 'Significance & Impact', description: 'What VALUE does this add?', category: 'VALUE', items: [] },
  
  methodology: { id: 'methodology', title: 'Methodology', description: 'Key Methods, strategy, experiments, controls.', category: 'EXECUTION', items: [] },
  data: { id: 'data', title: 'Data', description: 'Sources. ✓have / Xneed', category: 'EXECUTION', items: [] },
  resources: { id: 'resources', title: 'Resources', description: 'Compute, skills, collaborators.', category: 'EXECUTION', items: [] },
  
  evidence_criteria: { id: 'evidence_criteria', title: 'Evidence Criteria', description: 'What proves/disproves each claim?', category: 'VALIDATION', items: [] },
  
  milestones: { id: 'milestones', title: 'Milestones', description: 'Timeline checkpoints.', category: 'RISK', items: [] },
  risks: { id: 'risks', title: 'Risks', description: 'What could fail?', category: 'RISK', items: [] },
  contingencies: { id: 'contingencies', title: 'Contingencies', description: 'Backup plans.', category: 'RISK', items: [] },
  
  timeline: { id: 'timeline', title: 'Timeline', description: 'Deadlines...', category: 'CONSTRAINTS', items: [] },
  budget: { id: 'budget', title: 'Budget', description: 'Funding limits...', category: 'CONSTRAINTS', items: [] },
  ethics: { id: 'ethics', title: 'Ethics/IRB', description: 'Approvals needed...', category: 'CONSTRAINTS', items: [] },
  access: { id: 'access', title: 'Access', description: 'Restricted resources...', category: 'CONSTRAINTS', items: [] },
};
