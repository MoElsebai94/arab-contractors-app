import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Receipt, Plus, Upload, ArrowLeft, Search, Trash2, Edit3,
  Calculator, CheckCircle, X, FileText, ChevronDown
} from 'lucide-react';
import './DQE.css';

const API_BASE = '/api/dqe';

const getToken = () => localStorage.getItem('token');

const apiFetch = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
};

// Format FCFA with space separator
const formatFCFA = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  const num = Math.round(Number(amount));
  return num.toLocaleString('fr-FR').replace(/,/g, ' ').replace(/\u202f/g, ' ') + ' FCFA';
};

// Format quantity (no unnecessary decimals)
const formatQty = (val) => {
  if (!val && val !== 0) return '0';
  const num = Number(val);
  if (Number.isInteger(num)) return num.toLocaleString('fr-FR');
  return num.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
};

// Serie color class
const getSerieClass = (serie) => {
  if (!serie) return '';
  const s = serie.toString().replace(/[^0-9]/g, '');
  const prefix = s.substring(0, 3);
  return `s-${prefix}`;
};

// ============ Toast Component ============
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className={`dqe-toast ${type === 'error' ? 'error' : ''}`}>{message}</div>;
};

// ============ Confirm Dialog ============
const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => (
  <div className="dqe-confirm-overlay" onClick={onCancel}>
    <div className="dqe-confirm" onClick={e => e.stopPropagation()}>
      <h4>{title}</h4>
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="dqe-btn dqe-btn-secondary" onClick={onCancel}>Annuler</button>
        <button className="dqe-btn dqe-btn-danger" onClick={onConfirm}>Supprimer</button>
      </div>
    </div>
  </div>
);

// ============ Item Modal (Add/Edit) ============
const ItemModal = ({ item, onSave, onClose }) => {
  const [form, setForm] = useState(item || {
    code: '', designation: '', unite: '', prix_unitaire: 0,
    serie: '', serie_label: '',
    qty_s1: 0, qty_s2: 0, qty_s3: 0
  });

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate totals
      if (['prix_unitaire', 'qty_s1', 'qty_s2', 'qty_s3'].includes(field)) {
        const pu = Number(field === 'prix_unitaire' ? value : updated.prix_unitaire) || 0;
        const q1 = Number(field === 'qty_s1' ? value : updated.qty_s1) || 0;
        const q2 = Number(field === 'qty_s2' ? value : updated.qty_s2) || 0;
        const q3 = Number(field === 'qty_s3' ? value : updated.qty_s3) || 0;
        updated.qty_total = q1 + q2 + q3;
        updated.montant_s1 = pu * q1;
        updated.montant_s2 = pu * q2;
        updated.montant_s3 = pu * q3;
        updated.montant_total = pu * (q1 + q2 + q3);
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code || !form.designation || !form.unite) return;
    onSave(form);
  };

  return (
    <div className="dqe-modal-overlay" onClick={onClose}>
      <div className="dqe-modal" onClick={e => e.stopPropagation()}>
        <h3>{item?.id ? 'Modifier l\'article' : 'Nouvel article'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Code *</label>
              <input value={form.code} onChange={e => handleChange('code', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Unité *</label>
              <input value={form.unite} onChange={e => handleChange('unite', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label>Désignation *</label>
            <input value={form.designation} onChange={e => handleChange('designation', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Prix Unitaire (FCFA)</label>
              <input type="number" value={form.prix_unitaire} onChange={e => handleChange('prix_unitaire', e.target.value)} min="0" />
            </div>
            <div className="form-group">
              <label>Série</label>
              <input value={form.serie || ''} onChange={e => handleChange('serie', e.target.value)} placeholder="ex: 300" />
            </div>
          </div>
          <div className="form-group">
            <label>Libellé série</label>
            <input value={form.serie_label || ''} onChange={e => handleChange('serie_label', e.target.value)} placeholder="ex: 300 - Chaussée" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Qté S1</label>
              <input type="number" value={form.qty_s1} onChange={e => handleChange('qty_s1', e.target.value)} min="0" step="any" />
            </div>
            <div className="form-group">
              <label>Qté S2</label>
              <input type="number" value={form.qty_s2} onChange={e => handleChange('qty_s2', e.target.value)} min="0" step="any" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Qté S3</label>
              <input type="number" value={form.qty_s3} onChange={e => handleChange('qty_s3', e.target.value)} min="0" step="any" />
            </div>
            <div className="form-group">
              <label>Total calculé</label>
              <input value={form.montant_total ? formatFCFA(form.montant_total) : '—'} disabled style={{ background: '#f8fafc' }} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="dqe-btn dqe-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="dqe-btn dqe-btn-primary">
              {item?.id ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============ Project Modal ============
const ProjectModal = ({ project, onSave, onClose }) => {
  const [form, setForm] = useState(project || {
    name: '', contract_number: '', client: '', contractor: 'Arab Contractors Cameroon LTD', total_ht: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    onSave(form);
  };

  return (
    <div className="dqe-modal-overlay" onClick={onClose}>
      <div className="dqe-modal" onClick={e => e.stopPropagation()}>
        <h3>{project?.id ? 'Modifier le projet' : 'Nouveau projet DQE'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom du projet *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>N° de marché</label>
            <input value={form.contract_number || ''} onChange={e => setForm({ ...form, contract_number: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Client</label>
              <input value={form.client || ''} onChange={e => setForm({ ...form, client: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Entrepreneur</label>
              <input value={form.contractor || ''} onChange={e => setForm({ ...form, contractor: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="dqe-btn dqe-btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="dqe-btn dqe-btn-primary">
              {project?.id ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============ Import Modal ============
const ImportModal = ({ onImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (f && f.name.endsWith('.json')) {
      setFile(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await onImport(data);
    } catch (err) {
      alert('Erreur: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="dqe-modal-overlay" onClick={onClose}>
      <div className="dqe-modal" onClick={e => e.stopPropagation()}>
        <h3>Importer un projet DQE</h3>
        <div
          className={`dqe-import-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={32} />
          <p>Glissez un fichier JSON ici ou cliquez pour sélectionner</p>
          {file && <p className="file-info">{file.name}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="dqe-btn dqe-btn-secondary" onClick={onClose}>Annuler</button>
          <button
            className="dqe-btn dqe-btn-primary"
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? 'Importation...' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ Price Calculator Widget ============
const PriceCalculator = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (selectedProjectId) {
      apiFetch(`${API_BASE}/projects/${selectedProjectId}/items`)
        .then(res => setItems(res.data || []))
        .catch(() => setItems([]));
    } else {
      setItems([]);
    }
    setSelectedItemId('');
    setQuantity('');
  }, [selectedProjectId]);

  const selectedItem = items.find(i => i.id === Number(selectedItemId));
  const total = selectedItem ? selectedItem.prix_unitaire * (Number(quantity) || 0) : 0;

  const filteredItems = searchText
    ? items.filter(i =>
      i.designation.toLowerCase().includes(searchText.toLowerCase()) ||
      i.code.toLowerCase().includes(searchText.toLowerCase()))
    : items;

  return (
    <div className="dqe-calculator">
      <h3><Calculator size={18} /> Calculateur de prix rapide</h3>
      <div className="calc-row">
        <div className="calc-field">
          <label>Projet</label>
          <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
            <option value="">— Sélectionner un projet —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="calc-field">
          <label>Article</label>
          <select
            value={selectedItemId}
            onChange={e => setSelectedItemId(e.target.value)}
            disabled={!selectedProjectId}
          >
            <option value="">— Sélectionner un article —</option>
            {filteredItems.map(i => (
              <option key={i.id} value={i.id}>{i.code} — {i.designation}</option>
            ))}
          </select>
        </div>
        <div className="calc-field" style={{ maxWidth: 150 }}>
          <label>Quantité</label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="0"
            min="0"
            step="any"
            disabled={!selectedItemId}
          />
        </div>
      </div>
      {selectedItem && quantity && (
        <div className="calc-result">
          <span className="prix-u">{formatFCFA(selectedItem.prix_unitaire)}</span>
          <span className="multiply">×</span>
          <span className="qty">{formatQty(quantity)}</span>
          <span className="equals">=</span>
          <span className="total">{formatFCFA(total)}</span>
        </div>
      )}
    </div>
  );
};

// ============ Project Detail View ============
const ProjectDetail = ({ projectId, onBack }) => {
  const [project, setProject] = useState(null);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serieFilter, setSerieFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [projRes, itemsRes, summRes] = await Promise.all([
        apiFetch(`${API_BASE}/projects`),
        apiFetch(`${API_BASE}/projects/${projectId}/items`),
        apiFetch(`${API_BASE}/projects/${projectId}/summary`)
      ]);
      setProject(projRes.data?.find(p => p.id === Number(projectId)));
      setItems(itemsRes.data || []);
      setSummary(summRes.data || null);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Get unique series for filter
  const series = useMemo(() => {
    const map = new Map();
    items.forEach(i => {
      if (i.serie && !map.has(i.serie)) {
        map.set(i.serie, i.serie_label || i.serie);
      }
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  // Filter items
  const filtered = useMemo(() => {
    let list = items;
    if (serieFilter) list = list.filter(i => i.serie === serieFilter);
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      list = list.filter(i =>
        i.designation.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, serieFilter, searchFilter]);

  // Group by serie for display
  const groupedItems = useMemo(() => {
    const groups = new Map();
    filtered.forEach(item => {
      const key = item.serie || '—';
      if (!groups.has(key)) {
        groups.set(key, { label: item.serie_label || key, items: [] });
      }
      groups.get(key).items.push(item);
    });
    return groups;
  }, [filtered]);

  const handleSaveItem = async (formData) => {
    try {
      if (formData.id) {
        await apiFetch(`${API_BASE}/items/${formData.id}`, {
          method: 'PUT', body: JSON.stringify(formData)
        });
        setToast({ message: 'Article modifié', type: 'success' });
      } else {
        await apiFetch(`${API_BASE}/projects/${projectId}/items`, {
          method: 'POST', body: JSON.stringify(formData)
        });
        setToast({ message: 'Article ajouté', type: 'success' });
      }
      setShowItemModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await apiFetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
      setToast({ message: 'Article supprimé', type: 'success' });
      setConfirmDelete(null);
      loadData();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  if (loading) {
    return <div className="dqe-loading"><div className="spinner" /> Chargement...</div>;
  }

  return (
    <div className="dqe-page">
      <div className="dqe-detail-header">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={16} /> Retour aux projets
        </button>
        <h2>{project?.name || 'Projet'}</h2>
        {project?.contract_number && (
          <div className="header-contract">{project.contract_number}</div>
        )}
        <div className="header-stats">
          <div className="header-stat">
            <label>Articles</label>
            <span>{items.length}</span>
          </div>
          <div className="header-stat">
            <label>Total S1</label>
            <span>{formatFCFA(summary?.grand?.grand_s1)}</span>
          </div>
          <div className="header-stat">
            <label>Total S2</label>
            <span>{formatFCFA(summary?.grand?.grand_s2)}</span>
          </div>
          <div className="header-stat">
            <label>Total S3</label>
            <span>{formatFCFA(summary?.grand?.grand_s3)}</span>
          </div>
          <div className="header-stat">
            <label>Total HT</label>
            <span>{formatFCFA(summary?.grand?.grand_total || project?.total_ht)}</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="dqe-filter-bar">
        <select value={serieFilter} onChange={e => setSerieFilter(e.target.value)}>
          <option value="">Toutes les séries</option>
          {series.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <input
          className="search-input"
          type="text"
          placeholder="Rechercher par code ou désignation..."
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
        />
        <button className="dqe-btn dqe-btn-primary dqe-btn-sm" onClick={() => { setEditingItem(null); setShowItemModal(true); }}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Items table */}
      <div className="dqe-table-container">
        <table className="dqe-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th>Unité</th>
              <th style={{ textAlign: 'right' }}>P.U. (FCFA)</th>
              <th style={{ textAlign: 'right' }}>Qté Total</th>
              <th style={{ textAlign: 'right' }}>Montant Total</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...groupedItems.entries()].map(([serieKey, group]) => (
              <>
                <tr key={`serie-${serieKey}`} className="serie-header">
                  <td colSpan={7}>
                    <span className={`serie-tag ${getSerieClass(serieKey)}`}>{serieKey}</span>
                    {' '}{group.label}
                  </td>
                </tr>
                {group.items.map(item => (
                  <tr key={item.id}>
                    <td className="col-code">{item.code}</td>
                    <td className="col-designation">{item.designation}</td>
                    <td className="col-unite">{item.unite}</td>
                    <td className="col-prix">{formatFCFA(item.prix_unitaire)}</td>
                    <td className="col-qty">{formatQty(item.qty_total)}</td>
                    <td className="col-montant">{formatFCFA(item.montant_total)}</td>
                    <td className="col-actions">
                      <div className="dqe-item-actions">
                        <button onClick={() => { setEditingItem(item); setShowItemModal(true); }} title="Modifier">
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => setConfirmDelete(item)}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Aucun article trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {summary?.grand && (
        <div className="dqe-summary-bar">
          <div className="summary-item">
            <span className="summary-label">Articles</span>
            <span className="summary-value">{summary.grand.total_items}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Section 1</span>
            <span className="summary-value">{formatFCFA(summary.grand.grand_s1)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Section 2</span>
            <span className="summary-value">{formatFCFA(summary.grand.grand_s2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Section 3</span>
            <span className="summary-value">{formatFCFA(summary.grand.grand_s3)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total HT</span>
            <span className="summary-value total">{formatFCFA(summary.grand.grand_total)}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => { setShowItemModal(false); setEditingItem(null); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer cet article ?"
          message={`${confirmDelete.code} — ${confirmDelete.designation}`}
          onConfirm={() => handleDeleteItem(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// ============ Main DQE Page ============
const DQE = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadProjects = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/projects`);
      setProjects(res.data || []);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleCreateProject = async (formData) => {
    try {
      await apiFetch(`${API_BASE}/projects`, {
        method: 'POST', body: JSON.stringify(formData)
      });
      setShowProjectModal(false);
      setToast({ message: 'Projet créé avec succès', type: 'success' });
      loadProjects();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleImport = async (data) => {
    try {
      const res = await apiFetch(`${API_BASE}/import-full`, {
        method: 'POST', body: JSON.stringify(data)
      });
      setShowImportModal(false);
      setToast({ message: `Import réussi: ${res.imported} articles importés`, type: 'success' });
      loadProjects();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await apiFetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      setToast({ message: 'Projet supprimé', type: 'success' });
      loadProjects();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  // If a project is selected, show detail view
  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  if (loading) {
    return <div className="dqe-loading"><div className="spinner" /> Chargement...</div>;
  }

  return (
    <div className="dqe-page">
      <h1><Receipt size={28} /> DQE / Calculateur de Prix</h1>

      {/* Price Calculator Widget */}
      {projects.length > 0 && <PriceCalculator projects={projects} />}

      {/* Actions */}
      <div className="dqe-actions-bar">
        <button className="dqe-btn dqe-btn-primary" onClick={() => setShowProjectModal(true)}>
          <Plus size={16} /> Nouveau Projet
        </button>
        <button className="dqe-btn dqe-btn-secondary" onClick={() => setShowImportModal(true)}>
          <Upload size={16} /> Importer (JSON)
        </button>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="dqe-empty">
          <FileText size={48} />
          <h3>Aucun projet DQE</h3>
          <p>Créez un nouveau projet ou importez un fichier JSON pour commencer.</p>
        </div>
      ) : (
        <div className="dqe-projects-grid">
          {projects.map(project => (
            <div
              key={project.id}
              className="dqe-project-card"
              onClick={() => setSelectedProjectId(project.id)}
            >
              <button
                className="project-delete-btn"
                onClick={e => {
                  e.stopPropagation();
                  setConfirmDelete(project);
                }}
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
              <h3>{project.name}</h3>
              {project.contract_number && (
                <div className="project-contract">{project.contract_number}</div>
              )}
              <div className="project-meta">
                <span className="project-total">{formatFCFA(project.total_ht)}</span>
                {project.client && <span className="project-client">{project.client}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          onSave={handleCreateProject}
          onClose={() => setShowProjectModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer ce projet ?"
          message={`${confirmDelete.name} — Tous les articles seront supprimés.`}
          onConfirm={() => handleDeleteProject(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default DQE;
