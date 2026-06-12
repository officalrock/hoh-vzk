import { useState, useEffect, useCallback } from 'react';
import Projects from '../lib/projects';

/**
 * useProject — React hook for project management
 */
export function useProject() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  // Initialize on mount
  useEffect(() => {
    const pm = new Projects();
    setProjects(pm.list());
    setActiveProject(pm.getActive());
  }, []);

  const create = useCallback((name, stadt = '', strasse = '', hausnummern = {}) => {
    const pm = new Projects();
    const newProject = pm.create(name, stadt, strasse, hausnummern);
    setProjects(pm.list());
    setActiveProject(newProject);
    return newProject;
  }, []);

  const setActive = useCallback((projectId) => {
    const pm = new Projects();
    pm.setActive(projectId);
    setProjects(pm.list());
    setActiveProject(pm.getActive());
  }, []);

  const update = useCallback((projectId, updates) => {
    const pm = new Projects();
    const updated = pm.update(projectId, updates);
    setProjects(pm.list());
    if (projectId === pm.activeProjectId) {
      setActiveProject(updated);
    }
    return updated;
  }, []);

  const deleteProject = useCallback((projectId) => {
    const pm = new Projects();
    pm.delete(projectId);
    setProjects(pm.list());
    setActiveProject(pm.getActive());
  }, []);

  const listProjects = useCallback(() => {
    return projects;
  }, [projects]);

  const getActive = useCallback(() => {
    return activeProject;
  }, [activeProject]);

  const isProjectMode = useCallback(() => {
    return !!activeProject;
  }, [activeProject]);

  return {
    projects,
    activeProject,
    create,
    setActive,
    update,
    deleteProject,
    listProjects,
    getActive,
    isProjectMode,
  };
}

export default useProject;
