import { useState } from 'react';
import { Field, Modal } from '../ui/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { INTERNAL_STATUSES } from '../../constants/index.js';
import { todayISO } from '../../utils/format.js';

// Create / edit an internal (own-business) project. Costs are booked later as expenses against it.
export default function InternalProjectModal({ project, onClose, onSaved }) {
  const { run, addInternalProject, updateInternalProject } = useData();
  const toast = useToast();
  const [f, setF] = useState(
    project || { name: '', description: '', status: 'ACTIVE', budget: '', startDate: todayISO(), endDate: '' },
  );
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Project name is required', 'error');
    const res = await run(
      () => (project ? updateInternalProject(project.id, f) : addInternalProject(f)),
      project ? 'Internal project updated' : 'Internal project created',
    );
    if (res) {
      onSaved?.(res);
      onClose();
    }
  };

  return (
    <Modal
      title={project ? 'Edit internal project' : 'New internal project'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="internal-form" className="btn btn-primary">{project ? 'Save' : 'Create project'}</button>
        </>
      }
    >
      <form id="internal-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Project name" full><input className="input" autoFocus value={f.name} onChange={set('name')} placeholder="e.g. New office setup, Website revamp" /></Field>
          <Field label="Description" full><textarea className="textarea" rows={3} value={f.description} onChange={set('description')} /></Field>
          <Field label="Status">
            <select className="select" value={f.status} onChange={set('status')}>
              {INTERNAL_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Budget (₹, optional)"><input className="input" type="number" min="0" value={f.budget} onChange={set('budget')} /></Field>
          <Field label="Start date"><input className="input" type="date" value={f.startDate || ''} onChange={set('startDate')} /></Field>
          <Field label="End date"><input className="input" type="date" value={f.endDate || ''} onChange={set('endDate')} /></Field>
        </div>
      </form>
    </Modal>
  );
}
