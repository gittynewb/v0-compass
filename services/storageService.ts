
import { ProjectState, BlockId, CanvasBlock } from '../types';

const STORAGE_KEY = 'discovery_canvas_backpack';

export const storageService = {
  getBackpack: (): ProjectState[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProject: (project: ProjectState) => {
    const backpack = storageService.getBackpack();
    const index = backpack.findIndex(p => p.id === project.id);
    
    const updatedProject = { ...project, updatedAt: Date.now() };
    
    if (index >= 0) {
      backpack[index] = updatedProject;
    } else {
      backpack.push(updatedProject);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backpack));
  },

  deleteProject: (id: string) => {
    const backpack = storageService.getBackpack().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backpack));
  },

  createNewProject: (name: string, template: Record<BlockId, CanvasBlock>): ProjectState => {
    return {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      blocks: JSON.parse(JSON.stringify(template)),
      threads: [],
      updatedAt: Date.now(),
    };
  }
};
