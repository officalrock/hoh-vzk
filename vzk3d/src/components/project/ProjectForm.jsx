import React, { useState } from 'react';
import { useProject } from '../../hooks/useProject';

/**
 * T030: Project form for name + standort (Stadt, Straße, Hausnummern)
 * Used in ProjectSelector for new project creation
 */
export function ProjectForm({ onCreated, onCancel }) {
  const { create } = useProject();
  const [formData, setFormData] = useState({
    name: '',
    stadt: '',
    strasse: '',
    von: '',
    bis: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const proj = create(
      formData.name,
      formData.stadt,
      formData.strasse,
      { von: formData.von, bis: formData.bis }
    );

    onCreated?.(proj);
  };

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h3>Neues Projekt erstellen</h3>

      {/* Project Name (required) */}
      <div className="form-group">
        <label htmlFor="proj-name">Projektname *</label>
        <input
          id="proj-name"
          type="text"
          placeholder="z.B. Bauvorhaben München"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
      </div>

      {/* Standort Section */}
      <fieldset className="form-fieldset">
        <legend>Standort (optional)</legend>

        <div className="form-group">
          <label htmlFor="proj-stadt">Stadt</label>
          <input
            id="proj-stadt"
            type="text"
            placeholder="München"
            value={formData.stadt}
            onChange={(e) => handleChange('stadt', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="proj-strasse">Straße</label>
          <input
            id="proj-strasse"
            type="text"
            placeholder="Unter den Linden"
            value={formData.strasse}
            onChange={(e) => handleChange('strasse', e.target.value)}
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="proj-von">Hausnummern (von)</label>
            <input
              id="proj-von"
              type="text"
              placeholder="1"
              value={formData.von}
              onChange={(e) => handleChange('von', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="proj-bis">(bis)</label>
            <input
              id="proj-bis"
              type="text"
              placeholder="50"
              value={formData.bis}
              onChange={(e) => handleChange('bis', e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* Buttons */}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Erstellen
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Abbrechen
        </button>
      </div>
    </form>
  );
}

export default ProjectForm;
