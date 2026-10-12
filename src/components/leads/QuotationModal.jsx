import { useState } from 'react';
import { Field, Modal } from '../ui/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PROJECT_PLANS } from '../../constants/index.js';

// Moving a lead to "Proposal / Quotation Sent" → record the price quoted for each plan.
export default function QuotationModal({ lead, stage, onClose }) {
  const { moveLead, updateLead, run } = useData();
  const toast = useToast();
  const [f, setF] = useState({ PRO: lead.quote?.PRO ?? '', PREMIUM: lead.quote?.PREMIUM ?? '' });

  const submit = async (e) => {
    e.preventDefault();
    const quote = { PRO: Number(f.PRO) || 0, PREMIUM: Number(f.PREMIUM) || 0 };
    if (!quote.PRO || !quote.PREMIUM) return toast('Enter both the Pro and Premium quotation prices', 'error');
    const ok = await run(async () => {
      await updateLead(lead.id, { ...lead, quote });
      await moveLead(lead.id, stage);
    }, 'Quotation recorded — moved to “Proposal / Quotation Sent”');
    if (ok) onClose();
  };

  return (
    <Modal
      title="Quotation sent — enter prices"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="quote-form" className="btn btn-primary">Save & move</button>
        </>
      }
    >
      <div className="callout info" style={{ marginBottom: 16 }}>
        <div className="small"><b>{lead.title}</b> · {lead.company}<br />Record the price quoted to the client for each plan. The plan they choose is picked later at Deal Won.</div>
      </div>
      <form id="quote-form" onSubmit={submit} className="form-grid">
        {PROJECT_PLANS.map((p) => (
          <Field key={p.key} label={`${p.label} plan price (₹) *`}>
            <input className="input" type="number" min="0" value={f[p.key]} onChange={(e) => setF({ ...f, [p.key]: e.target.value })} autoFocus={p.key === 'PRO'} />
          </Field>
        ))}
      </form>
    </Modal>
  );
}
