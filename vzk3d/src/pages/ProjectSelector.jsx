import React, { useState } from 'react';
import { useProject } from '../hooks/useProject';
import { useView } from '../app/ViewContext';
import { Plus, FolderOpen } from '@phosphor-icons/react';
import ProjectForm from '../components/project/ProjectForm';
import './project-selector.css';

/**
 * T026-T035: Landing page with project selection & creation
 * User sees: list of existing projects, "New Project" button, "General View" button
 */
export function ProjectSelector() {
  const { projects, setActive, deleteProject } = useProject();
  const { gotoKatalog } = useView();
  const [showForm, setShowForm] = useState(false);

  const handleSelectProject = (projectId) => {
    setActive(projectId); // schreibt vzk-active-project
    gotoKatalog();
  };

  const handleGeneralView = () => {
    try { localStorage.setItem('vzk-active-project', 'global'); } catch { /* ignore */ }
    gotoKatalog();
  };

  return (
    <div className="project-selector-page">
      <div className="project-selector-header">
        <h1>VZK App – Packliste & Regelplaene</h1>
        <p>Wählen Sie ein Projekt oder nutzen Sie die allgemeine Ansicht</p>
      </div>

      {/* New Project Form (mit Standort US6) */}
      <div className="project-selector-section">
        <h2>Neues Projekt</h2>
        {showForm ? (
          <ProjectForm
            onCreated={() => { setShowForm(false); gotoKatalog(); }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-lg">
            <Plus size={20} /> Neues Projekt
          </button>
        )}
      </div>

      {/* Project List */}
      {projects.length > 0 && (
        <div className="project-selector-section">
          <h2>Meine Projekte ({projects.length})</h2>
          <div className="project-list">
            {projects.map((proj) => (
              <div key={proj.id} className="project-card">
                <div className="project-card-content">
                  <h3>{proj.name}</h3>
                  {proj.stadt && <small>{proj.stadt}, {proj.strasse}</small>}
                  <small className="project-card-date">
                    {new Date(proj.erstelltAm).toLocaleDateString('de-DE')}
                  </small>
                </div>
                <div className="project-card-actions">
                  <button onClick={() => handleSelectProject(proj.id)} className="btn btn-outline">
                    <FolderOpen size={18} /> Öffnen
                  </button>
                  <button
                    onClick={() => deleteProject(proj.id)}
                    className="btn btn-danger-outline"
                    title="Projekt löschen"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General View */}
      <div className="project-selector-section">
        <h2>Allgemeine Ansicht</h2>
        <button onClick={handleGeneralView} className="btn btn-secondary btn-lg">
          Katalog & Regelplaene ohne Projekt
        </button>
      </div>
    </div>
  );
}

export default ProjectSelector;
