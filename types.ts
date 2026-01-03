
export type BlockId = 
  | 'problem_context' | 'prior_work' | 'gaps_limits' | 'current_solutions'
  | 'questions_hypotheses' | 'aims_objectives' | 'novelty' | 'contribution'
  | 'stakeholders' | 'impact'
  | 'methodology' | 'data' | 'resources'
  | 'evidence_criteria' | 'milestones' | 'decision_points' | 'risks' | 'contingencies'
  | 'timeline' | 'budget' | 'ethics' | 'access';

export type SpaceId = 
  | 'PROBLEM' | 'CLAIM' | 'VALUE' | 'EXECUTION' | 'VALIDATION' | 'RISK' | 'CONSTRAINTS';

export interface CanvasItem {
  id: string;
  text: string;
  status?: 'pending' | 'validated' | 'falsified';
  isKillCriterion?: boolean;
  metadata?: any;
}

export interface CanvasBlock {
  id: BlockId;
  title: string;
  description: string;
  category: SpaceId;
  items: CanvasItem[];
  icon?: string;
}

export interface Thread {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface ProjectState {
  id: string;
  name: string;
  blocks: Record<BlockId, CanvasBlock>;
  threads: Thread[];
  updatedAt: number;
}

export interface WizardQuestion {
  id: number;
  question: string;
  targetBlocks: BlockId[];
  description: string;
  hints: string[];
}
