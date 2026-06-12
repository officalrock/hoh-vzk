/**
 * Projects — multi-project management with localStorage persistence
 * Each project has: name, standort (stadt, strasse, hausnummern), packlisten_id
 */

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY_PROJECTS = 'vzk-projects';
const STORAGE_KEY_ACTIVE = 'vzk-active-project';

export class Projects {
  constructor() {
    this.projects = this.loadAll();
    this.activeProjectId = this.loadActive();
  }

  loadAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load projects:', e);
      return [];
    }
  }

  loadActive() {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE);
    } catch (e) {
      return null;
    }
  }

  saveAll() {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
    } catch (e) {
      console.error('Failed to save projects:', e);
    }
  }

  saveActive() {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, this.activeProjectId || '');
    } catch (e) {
      console.error('Failed to save active project:', e);
    }
  }

  /**
   * Create new project
   */
  create(name, stadt = '', strasse = '', hausnummern = { von: '', bis: '' }) {
    const project = {
      id: uuidv4(),
      name,
      stadt,
      strasse,
      hausnummern,
      strassenklasse: null,
      erstelltAm: new Date().toISOString(),
      packlisten_id: `packliste-${uuidv4()}`,
    };
    this.projects.push(project);
    this.setActive(project.id);
    this.saveAll();
    this.saveActive();
    return project;
  }

  /**
   * Get project by ID
   */
  get(projectId) {
    return this.projects.find((p) => p.id === projectId);
  }

  /**
   * List all projects
   */
  list() {
    return this.projects;
  }

  /**
   * Update project metadata (standort, strassenklasse)
   */
  update(projectId, updates) {
    const project = this.get(projectId);
    if (project) {
      Object.assign(project, updates);
      this.saveAll();
    }
    return project;
  }

  /**
   * Delete project (irreversible)
   */
  delete(projectId) {
    this.projects = this.projects.filter((p) => p.id !== projectId);
    if (this.activeProjectId === projectId) {
      this.activeProjectId = this.projects[0]?.id || null;
      this.saveActive();
    }
    this.saveAll();
    // Zugehörige Packliste mitlöschen (Key: vzk-packliste-<projectId>).
    try {
      const key = 'vzk-packliste-' + projectId;
      localStorage.removeItem(key);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('packliste-changed', { detail: { key } }));
      }
    } catch (e) {
      console.error('Failed to delete packing list for project:', e);
    }
  }

  /**
   * Set active project
   */
  setActive(projectId) {
    if (this.get(projectId)) {
      this.activeProjectId = projectId;
      this.saveActive();
    }
  }

  /**
   * Get active project
   */
  getActive() {
    return this.get(this.activeProjectId);
  }

  /**
   * Check if in project mode (vs. general view)
   */
  isProjectMode() {
    return !!this.activeProjectId;
  }
}

export default Projects;
