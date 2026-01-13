import { useState, useEffect, useCallback } from 'react';
import {
    ChevronDown, Plus, Search, Filter, X, Check, Edit2, Trash2,
    Construction, CheckCircle2, Clock, XCircle, AlertCircle, Ruler
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Dalots.css';

const API_BASE = 'http://localhost:3001/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

// Dimension presets based on the spreadsheet
const DIMENSION_PRESETS = [
    '1D100x100', '1D150X200', '2D100x100', '2D150X200', '2D200X100',
    '1D200X100', '1D300X300', '2D300X300', '1D150X150'
];

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
    { value: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ' },
    { value: 'finished', label: 'Finished', labelAr: 'مكتمل' },
    { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' }
];

const Dalots = () => {
    const { t, language } = useLanguage();
    const isRTL = language === 'ar';

    // State
    const [sections, setSections] = useState([]);
    const [dalots, setDalots] = useState([]);
    const [stats, setStats] = useState({ total: 0, finished: 0, in_progress: 0, cancelled: 0, validated: 0 });
    const [expandedSections, setExpandedSections] = useState({});
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingDalot, setEditingDalot] = useState(null);
    const [formData, setFormData] = useState({
        section_id: '',
        ouvrage_transmis: '',
        ouvrage_etude: '',
        ouvrage_definitif: '',
        pk_etude: '',
        pk_transmis: '',
        dimension: '1D100x100',
        length: 0,
        status: 'pending',
        is_validated: 0,
        notes: ''
    });

    // Fetch data
    const fetchSections = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/dalots/sections`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setSections(data.data || []);
            // Expand all sections by default
            const expanded = {};
            (data.data || []).forEach(s => { expanded[s.id] = true; });
            setExpandedSections(expanded);
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    }, []);

    const fetchDalots = useCallback(async () => {
        try {
            let url = `${API_BASE}/dalots?`;
            if (sectionFilter) url += `section_id=${sectionFilter}&`;
            if (statusFilter) url += `status=${statusFilter}&`;
            if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

            const res = await fetch(url, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setDalots(data.data || []);
        } catch (err) {
            console.error('Error fetching dalots:', err);
        }
    }, [sectionFilter, statusFilter, searchTerm]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/dalots/stats`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setStats(data.data || { total: 0, finished: 0, in_progress: 0, cancelled: 0, validated: 0 });
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchSections(), fetchDalots(), fetchStats()]);
            setLoading(false);
        };
        loadData();
    }, [fetchSections, fetchDalots, fetchStats]);

    // Toggle section expansion
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Handle status change
    const handleStatusChange = async (dalotId, newStatus) => {
        try {
            await fetch(`${API_BASE}/dalots/${dalotId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus })
            });
            fetchDalots();
            fetchStats();
            fetchSections();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    // Handle validation toggle
    const handleValidationToggle = async (dalotId) => {
        try {
            await fetch(`${API_BASE}/dalots/${dalotId}/validate`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });
            fetchDalots();
            fetchStats();
            fetchSections();
        } catch (err) {
            console.error('Error toggling validation:', err);
        }
    };

    // Handle delete
    const handleDelete = async (dalotId) => {
        if (!window.confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this dalot?')) return;
        try {
            await fetch(`${API_BASE}/dalots/${dalotId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            fetchDalots();
            fetchStats();
            fetchSections();
        } catch (err) {
            console.error('Error deleting dalot:', err);
        }
    };

    // Open modal for adding/editing
    const openModal = (dalot = null) => {
        if (dalot) {
            setEditingDalot(dalot);
            setFormData({
                section_id: dalot.section_id || '',
                ouvrage_transmis: dalot.ouvrage_transmis || '',
                ouvrage_etude: dalot.ouvrage_etude || '',
                ouvrage_definitif: dalot.ouvrage_definitif || '',
                pk_etude: dalot.pk_etude || '',
                pk_transmis: dalot.pk_transmis || '',
                dimension: dalot.dimension || '1D100x100',
                length: dalot.length || 0,
                status: dalot.status || 'pending',
                is_validated: dalot.is_validated || 0,
                notes: dalot.notes || ''
            });
        } else {
            setEditingDalot(null);
            setFormData({
                section_id: sections[0]?.id || '',
                ouvrage_transmis: '',
                ouvrage_etude: '',
                ouvrage_definitif: '',
                pk_etude: '',
                pk_transmis: '',
                dimension: '1D100x100',
                length: 0,
                status: 'pending',
                is_validated: 0,
                notes: ''
            });
        }
        setShowModal(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingDalot
                ? `${API_BASE}/dalots/${editingDalot.id}`
                : `${API_BASE}/dalots`;
            const method = editingDalot ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            setShowModal(false);
            fetchDalots();
            fetchStats();
            fetchSections();
        } catch (err) {
            console.error('Error saving dalot:', err);
        }
    };

    // Group dalots by section
    const getDalotsBySection = (sectionId) => {
        return dalots.filter(d => d.section_id === sectionId);
    };

    // Calculate section progress
    const getSectionProgress = (section) => {
        const total = section.total_dalots || 0;
        const finished = section.finished_count || 0;
        return total > 0 ? Math.round((finished / total) * 100) : 0;
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'finished': return <CheckCircle2 size={14} />;
            case 'in_progress': return <Clock size={14} />;
            case 'cancelled': return <XCircle size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p className="loading-text">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
        );
    }

    return (
        <div className="dalots-page" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">{isRTL ? 'إدارة الدالوت' : 'Dalots Management'}</h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    {isRTL ? 'إضافة دالوت' : 'Add Dalot'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="dalots-stats">
                <div className="stat-card-dalot">
                    <div className="stat-icon-dalot total">
                        <Construction size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.total || 0}</h3>
                        <p>{isRTL ? 'إجمالي الدالوت' : 'Total Dalots'}</p>
                    </div>
                </div>

                <div className="stat-card-dalot">
                    <div className="stat-icon-dalot finished">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.finished || 0}</h3>
                        <p>{isRTL ? 'مكتمل' : 'Finished'}</p>
                    </div>
                </div>

                <div className="stat-card-dalot">
                    <div className="stat-icon-dalot progress">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.in_progress || 0}</h3>
                        <p>{isRTL ? 'قيد التنفيذ' : 'In Progress'}</p>
                    </div>
                </div>

                <div className="stat-card-dalot">
                    <div className="stat-icon-dalot cancelled">
                        <XCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.cancelled || 0}</h3>
                        <p>{isRTL ? 'ملغى' : 'Cancelled'}</p>
                    </div>
                </div>

                <div className="stat-card-dalot">
                    <div className="stat-icon-dalot validated">
                        <Check size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.validated || 0}</h3>
                        <p>{isRTL ? 'تم التحقق' : 'Validated'}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="dalots-filters">
                <div className="search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={isRTL ? 'بحث بالرقم...' : 'Search by ouvrage number...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="filter-group">
                    <Filter size={16} />
                    <select
                        className="form-input filter-select"
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                    >
                        <option value="">{isRTL ? 'كل الأقسام' : 'All Sections'}</option>
                        {sections.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        className="form-input filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">{isRTL ? 'كل الحالات' : 'All Statuses'}</option>
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {isRTL ? opt.labelAr : opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {(searchTerm || sectionFilter || statusFilter) && (
                    <div className="filter-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setSearchTerm('');
                                setSectionFilter('');
                                setStatusFilter('');
                            }}
                        >
                            {isRTL ? 'مسح الكل' : 'Clear All'}
                        </button>
                    </div>
                )}
            </div>

            {/* Sections */}
            <div className="sections-container">
                {sections.map(section => (
                    <div key={section.id} className="section-card">
                        <div className="section-header" onClick={() => toggleSection(section.id)}>
                            <div className="section-header-left">
                                <div className={`section-toggle ${expandedSections[section.id] ? 'open' : ''}`}>
                                    <ChevronDown size={18} />
                                </div>
                                <div>
                                    <div className="section-title">{section.name}</div>
                                    <div className="section-route">{section.route_name}</div>
                                </div>
                            </div>

                            <div className="section-header-right">
                                <div className="section-progress">
                                    <div className="progress-bar-container">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${getSectionProgress(section)}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">{getSectionProgress(section)}%</span>
                                </div>

                                <div className="section-count">
                                    <Construction size={14} />
                                    <span>{section.total_dalots || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`section-content ${expandedSections[section.id] ? 'open' : ''}`}>
                            {getDalotsBySection(section.id).length > 0 ? (
                                <div className="dalots-table-container">
                                    <table className="dalots-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>{isRTL ? 'رقم المنشأة المرسل' : 'N° Transmis'}</th>
                                                <th>{isRTL ? 'رقم الدراسة' : "N° d'Étude"}</th>
                                                <th>{isRTL ? 'الرقم النهائي' : 'N° Définitif'}</th>
                                                <th>{isRTL ? 'نقطة الدراسة' : "PK d'Étude"}</th>
                                                <th>{isRTL ? 'نقطة المرسل' : 'PK Transmis'}</th>
                                                <th>{isRTL ? 'الأبعاد' : 'Dimension'}</th>
                                                <th>{isRTL ? 'الطول (م)' : 'Length (m)'}</th>
                                                <th>{isRTL ? 'تحقق' : 'Validated'}</th>
                                                <th>{isRTL ? 'الحالة' : 'Status'}</th>
                                                <th>{isRTL ? 'إجراءات' : 'Actions'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getDalotsBySection(section.id).map((dalot, index) => (
                                                <tr
                                                    key={dalot.id}
                                                    className={
                                                        dalot.notes?.includes('NOUVEAU DALOT') ? 'note-row' :
                                                            dalot.notes?.includes('LE PONT') ? 'bridge-row' : ''
                                                    }
                                                >
                                                    <td>{index + 1}</td>
                                                    <td><strong>{dalot.ouvrage_transmis}</strong></td>
                                                    <td>{dalot.ouvrage_etude || '-'}</td>
                                                    <td>{dalot.ouvrage_definitif || '-'}</td>
                                                    <td className="pk-value">{dalot.pk_etude || '-'}</td>
                                                    <td className="pk-value">{dalot.pk_transmis || '-'}</td>
                                                    <td>
                                                        {dalot.dimension && (
                                                            <span className="dimension-badge">{dalot.dimension}</span>
                                                        )}
                                                    </td>
                                                    <td>{dalot.length > 0 ? dalot.length : '-'}</td>
                                                    <td>
                                                        <button
                                                            className={`validation-toggle ${dalot.is_validated ? 'validated' : ''}`}
                                                            onClick={() => handleValidationToggle(dalot.id)}
                                                            title={dalot.is_validated ? (isRTL ? 'تم التحقق' : 'Validated') : (isRTL ? 'غير محقق' : 'Not validated')}
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className={`status-select ${dalot.status}`}
                                                            value={dalot.status}
                                                            onChange={(e) => handleStatusChange(dalot.id, e.target.value)}
                                                        >
                                                            {STATUS_OPTIONS.map(opt => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {isRTL ? opt.labelAr : opt.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn"
                                                                onClick={() => openModal(dalot)}
                                                                title={isRTL ? 'تعديل' : 'Edit'}
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                className="action-btn danger"
                                                                onClick={() => handleDelete(dalot.id)}
                                                                title={isRTL ? 'حذف' : 'Delete'}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Construction size={48} />
                                    <p>{isRTL ? 'لا توجد دالوت في هذا القسم' : 'No dalots in this section'}</p>
                                </div>
                            )}

                            <button
                                className="add-dalot-btn"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, section_id: section.id }));
                                    openModal();
                                }}
                            >
                                <Plus size={18} />
                                {isRTL ? 'إضافة دالوت جديد' : 'Add New Dalot'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="dalot-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="dalot-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dalot-modal-header">
                            <h2>{editingDalot ? (isRTL ? 'تعديل دالوت' : 'Edit Dalot') : (isRTL ? 'إضافة دالوت جديد' : 'Add New Dalot')}</h2>
                            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="dalot-modal-body">
                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'القسم' : 'Section'}</label>
                                    <select
                                        className="form-input"
                                        value={formData.section_id}
                                        onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                                        required
                                    >
                                        <option value="">{isRTL ? 'اختر القسم' : 'Select Section'}</option>
                                        {sections.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{isRTL ? 'رقم المنشأة المرسل' : 'N° Ouvrage Transmis'} *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.ouvrage_transmis}
                                            onChange={(e) => setFormData({ ...formData, ouvrage_transmis: e.target.value })}
                                            placeholder="OH1"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{isRTL ? "رقم الدراسة" : "N° d'Étude"}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.ouvrage_etude}
                                            onChange={(e) => setFormData({ ...formData, ouvrage_etude: e.target.value })}
                                            placeholder="OH1"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'الرقم النهائي' : 'N° Ouvrage Définitif'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.ouvrage_definitif}
                                        onChange={(e) => setFormData({ ...formData, ouvrage_definitif: e.target.value })}
                                        placeholder="OH1"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{isRTL ? "نقطة الدراسة" : "PK d'Étude"}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.pk_etude}
                                            onChange={(e) => setFormData({ ...formData, pk_etude: e.target.value })}
                                            placeholder="00+055"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{isRTL ? 'نقطة المرسل' : 'PK Transmis'}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.pk_transmis}
                                            onChange={(e) => setFormData({ ...formData, pk_transmis: e.target.value })}
                                            placeholder="00+055"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{isRTL ? 'الأبعاد' : 'Dimension'}</label>
                                        <select
                                            className="form-input"
                                            value={formData.dimension}
                                            onChange={(e) => setFormData({ ...formData, dimension: e.target.value })}
                                        >
                                            {DIMENSION_PRESETS.map(dim => (
                                                <option key={dim} value={dim}>{dim}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{isRTL ? 'الطول (م)' : 'Length (m)'}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input"
                                            value={formData.length}
                                            onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">{isRTL ? 'الحالة' : 'Status'}</label>
                                        <select
                                            className="form-input"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {isRTL ? opt.labelAr : opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{isRTL ? 'تم التحقق' : 'Validated'}</label>
                                        <div className="checkbox-container" style={{ marginTop: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.is_validated === 1}
                                                onChange={(e) => setFormData({ ...formData, is_validated: e.target.checked ? 1 : 0 })}
                                                id="validated-checkbox"
                                            />
                                            <label htmlFor="validated-checkbox">
                                                {formData.is_validated ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'ملاحظات' : 'Notes'}</label>
                                    <textarea
                                        className="form-input"
                                        rows="2"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder={isRTL ? 'مثال: NOUVEAU DALOT، LE PONT...' : 'e.g., NOUVEAU DALOT, LE PONT...'}
                                    />
                                </div>
                            </div>

                            <div className="dalot-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingDalot ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إضافة' : 'Add Dalot')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dalots;
