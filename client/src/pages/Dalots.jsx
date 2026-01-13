import { useState, useEffect, useCallback, useRef } from 'react';
import {
    ChevronDown, Plus, Search, Filter, X, Check, Edit2, Trash2,
    Construction, CheckCircle2, Clock, XCircle, AlertCircle, Upload, FileSpreadsheet
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

// Custom Dropdown Component
const CustomDropdown = ({
    value,
    options,
    onChange,
    placeholder,
    isRTL,
    className = '',
    renderOption,
    renderTrigger
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className={`custom-dropdown ${className}`} ref={dropdownRef}>
            <div
                className={`custom-dropdown-trigger ${isOpen ? 'open' : ''} ${value || ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {renderTrigger ? renderTrigger(selectedOption) : (
                    <>
                        <span>{selectedOption ? (isRTL ? selectedOption.labelAr : selectedOption.label) : placeholder}</span>
                        <ChevronDown size={16} className="dropdown-icon" />
                    </>
                )}
            </div>
            {isOpen && (
                <div className="custom-dropdown-menu">
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`custom-dropdown-option ${value === option.value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {renderOption ? renderOption(option) : (
                                <>
                                    <span>{isRTL ? option.labelAr : option.label}</span>
                                    {value === option.value && <Check size={14} className="check-icon" />}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Status Dropdown Component
const StatusDropdown = ({ value, onChange, isRTL }) => {
    return (
        <CustomDropdown
            className="status-dropdown"
            value={value}
            options={STATUS_OPTIONS}
            onChange={onChange}
            isRTL={isRTL}
            renderTrigger={(option) => (
                <>
                    <span>{option ? (isRTL ? option.labelAr : option.label) : ''}</span>
                    <ChevronDown size={14} className="dropdown-icon" />
                </>
            )}
            renderOption={(option) => (
                <>
                    <span className={`status-option-dot ${option.value}`} />
                    <span>{isRTL ? option.labelAr : option.label}</span>
                </>
            )}
        />
    );
};

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

    // Section modal state
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [sectionFormData, setSectionFormData] = useState({
        name: '',
        route_name: ''
    });

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importData, setImportData] = useState([]);
    const [importSection, setImportSection] = useState('');
    const [importResult, setImportResult] = useState(null);
    const [importing, setImporting] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: '',
        cancelText: '',
        type: 'danger' // 'danger' or 'warning'
    });

    const showConfirm = ({ title, message, onConfirm, confirmText, cancelText, type = 'danger' }) => {
        setConfirmModal({
            show: true,
            title,
            message,
            onConfirm,
            confirmText: confirmText || (isRTL ? 'حذف' : 'Delete'),
            cancelText: cancelText || (isRTL ? 'إلغاء' : 'Cancel'),
            type
        });
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
    };

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
            setExpandedSections(prev => ({ ...expanded, ...prev }));
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
    const handleDelete = (dalotId) => {
        showConfirm({
            title: isRTL ? 'حذف الدالوت' : 'Delete Dalot',
            message: isRTL ? 'هل أنت متأكد من حذف هذا الدالوت؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this dalot? This action cannot be undone.',
            confirmText: isRTL ? 'حذف' : 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await fetch(`${API_BASE}/dalots/${dalotId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    fetchDalots();
                    fetchStats();
                    fetchSections();
                    closeConfirm();
                } catch (err) {
                    console.error('Error deleting dalot:', err);
                }
            }
        });
    };

    // Open modal for adding/editing dalot
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

    // Handle dalot form submit
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

    // Section CRUD
    const openSectionModal = (section = null) => {
        if (section) {
            setEditingSection(section);
            setSectionFormData({
                name: section.name || '',
                route_name: section.route_name || ''
            });
        } else {
            setEditingSection(null);
            setSectionFormData({
                name: '',
                route_name: ''
            });
        }
        setShowSectionModal(true);
    };

    const handleSectionSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingSection
                ? `${API_BASE}/dalots/sections/${editingSection.id}`
                : `${API_BASE}/dalots/sections`;
            const method = editingSection ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(sectionFormData)
            });

            setShowSectionModal(false);
            fetchSections();
        } catch (err) {
            console.error('Error saving section:', err);
        }
    };

    const handleDeleteSection = (sectionId, e) => {
        e.stopPropagation();
        const sectionDalots = dalots.filter(d => d.section_id === sectionId);
        const section = sections.find(s => s.id === sectionId);

        showConfirm({
            title: isRTL ? 'حذف القسم' : 'Delete Section',
            message: sectionDalots.length > 0
                ? (isRTL
                    ? `سيتم حذف القسم "${section?.name}" مع ${sectionDalots.length} دالوت. هذا الإجراء لا يمكن التراجع عنه.`
                    : `Section "${section?.name}" and its ${sectionDalots.length} dalots will be deleted. This action cannot be undone.`)
                : (isRTL
                    ? `هل أنت متأكد من حذف القسم "${section?.name}"؟`
                    : `Are you sure you want to delete "${section?.name}"?`),
            confirmText: isRTL ? 'حذف' : 'Delete',
            type: sectionDalots.length > 0 ? 'danger' : 'warning',
            onConfirm: async () => {
                try {
                    await fetch(`${API_BASE}/dalots/sections/${sectionId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    fetchSections();
                    fetchDalots();
                    fetchStats();
                    closeConfirm();
                } catch (err) {
                    console.error('Error deleting section:', err);
                }
            }
        });
    };

    // CSV Import handlers
    const parseCSV = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }
        return rows;
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        setImportFile(file);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const data = parseCSV(text);
            setImportData(data);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
            handleFileSelect(file);
        }
    };

    const handleImport = async () => {
        if (!importSection || importData.length === 0) return;

        setImporting(true);
        setImportResult(null);

        try {
            const res = await fetch(`${API_BASE}/dalots/import`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    section_id: importSection,
                    dalots: importData
                })
            });
            const result = await res.json();

            if (res.ok) {
                setImportResult({
                    success: true,
                    message: isRTL
                        ? `تم استيراد ${result.imported} من ${result.total} سجل بنجاح`
                        : `Successfully imported ${result.imported} of ${result.total} records`
                });
                fetchDalots();
                fetchStats();
                fetchSections();
            } else {
                setImportResult({ success: false, message: result.error });
            }
        } catch (err) {
            setImportResult({ success: false, message: err.message });
        }
        setImporting(false);
    };

    const resetImportModal = () => {
        setShowImportModal(false);
        setImportFile(null);
        setImportData([]);
        setImportSection('');
        setImportResult(null);
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

    // Section filter options
    const sectionOptions = [
        { value: '', label: 'All Sections', labelAr: 'كل الأقسام' },
        ...sections.map(s => ({ value: String(s.id), label: s.name, labelAr: s.name }))
    ];

    // Status filter options
    const statusFilterOptions = [
        { value: '', label: 'All Statuses', labelAr: 'كل الحالات' },
        ...STATUS_OPTIONS
    ];

    // Dimension options for dropdown
    const dimensionOptions = DIMENSION_PRESETS.map(d => ({ value: d, label: d, labelAr: d }));

    // Section options for form
    const sectionFormOptions = sections.map(s => ({ value: String(s.id), label: s.name, labelAr: s.name }));

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
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                        <Upload size={18} />
                        {isRTL ? 'استيراد CSV' : 'Import CSV'}
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={18} />
                        {isRTL ? 'إضافة دالوت' : 'Add Dalot'}
                    </button>
                </div>
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
                    <CustomDropdown
                        className="filter-dropdown"
                        value={sectionFilter}
                        options={sectionOptions}
                        onChange={setSectionFilter}
                        placeholder={isRTL ? 'كل الأقسام' : 'All Sections'}
                        isRTL={isRTL}
                    />
                </div>

                <div className="filter-group">
                    <CustomDropdown
                        className="filter-dropdown"
                        value={statusFilter}
                        options={statusFilterOptions}
                        onChange={setStatusFilter}
                        placeholder={isRTL ? 'كل الحالات' : 'All Statuses'}
                        isRTL={isRTL}
                    />
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

                                <div className="section-actions">
                                    <button
                                        className="section-action-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openSectionModal(section);
                                        }}
                                        title={isRTL ? 'تعديل القسم' : 'Edit Section'}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        className="section-action-btn danger"
                                        onClick={(e) => handleDeleteSection(section.id, e)}
                                        title={isRTL ? 'حذف القسم' : 'Delete Section'}
                                    >
                                        <Trash2 size={14} />
                                    </button>
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
                                                        <StatusDropdown
                                                            value={dalot.status}
                                                            onChange={(newStatus) => handleStatusChange(dalot.id, newStatus)}
                                                            isRTL={isRTL}
                                                        />
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

                {/* Add Section Button */}
                <button className="add-section-btn" onClick={() => openSectionModal()}>
                    <Plus size={20} />
                    {isRTL ? 'إضافة قسم جديد' : 'Add New Section'}
                </button>
            </div>

            {/* Dalot Modal */}
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
                                    <CustomDropdown
                                        value={String(formData.section_id)}
                                        options={sectionFormOptions}
                                        onChange={(val) => setFormData({ ...formData, section_id: val })}
                                        placeholder={isRTL ? 'اختر القسم' : 'Select Section'}
                                        isRTL={isRTL}
                                    />
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
                                        <CustomDropdown
                                            value={formData.dimension}
                                            options={dimensionOptions}
                                            onChange={(val) => setFormData({ ...formData, dimension: val })}
                                            placeholder="1D100x100"
                                            isRTL={isRTL}
                                        />
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
                                        <CustomDropdown
                                            value={formData.status}
                                            options={STATUS_OPTIONS}
                                            onChange={(val) => setFormData({ ...formData, status: val })}
                                            isRTL={isRTL}
                                            renderOption={(option) => (
                                                <>
                                                    <span className={`status-option-dot ${option.value}`} />
                                                    <span>{isRTL ? option.labelAr : option.label}</span>
                                                </>
                                            )}
                                        />
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

            {/* Section Modal */}
            {showSectionModal && (
                <div className="dalot-modal-overlay" onClick={() => setShowSectionModal(false)}>
                    <div className="dalot-modal section-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dalot-modal-header">
                            <h2>{editingSection ? (isRTL ? 'تعديل القسم' : 'Edit Section') : (isRTL ? 'إضافة قسم جديد' : 'Add New Section')}</h2>
                            <button className="modal-close-btn" onClick={() => setShowSectionModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSectionSubmit}>
                            <div className="dalot-modal-body">
                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'اسم القسم' : 'Section Name'} *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={sectionFormData.name}
                                        onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                                        placeholder={isRTL ? 'مثال: القسم 4' : 'e.g., Section 4'}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'اسم الطريق' : 'Route Name'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={sectionFormData.route_name}
                                        onChange={(e) => setSectionFormData({ ...sectionFormData, route_name: e.target.value })}
                                        placeholder="ZAMENGOUE – EKEKAM – EVODOULA"
                                    />
                                </div>
                            </div>

                            <div className="dalot-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSectionModal(false)}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingSection ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إضافة' : 'Add Section')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="dalot-modal-overlay" onClick={resetImportModal}>
                    <div className="dalot-modal import-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dalot-modal-header">
                            <h2>{isRTL ? 'استيراد من CSV' : 'Import from CSV'}</h2>
                            <button className="modal-close-btn" onClick={resetImportModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="dalot-modal-body">
                            {importResult && (
                                <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
                                    {importResult.message}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">{isRTL ? 'القسم المستهدف' : 'Target Section'} *</label>
                                <CustomDropdown
                                    value={importSection}
                                    options={sectionFormOptions}
                                    onChange={setImportSection}
                                    placeholder={isRTL ? 'اختر القسم' : 'Select Section'}
                                    isRTL={isRTL}
                                />
                            </div>

                            <div
                                className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${importFile ? 'has-file' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FileSpreadsheet size={48} className="file-drop-icon" />
                                {importFile ? (
                                    <>
                                        <p className="file-drop-text">{isRTL ? 'الملف جاهز للاستيراد' : 'File ready for import'}</p>
                                        <p className="file-name">{importFile.name}</p>
                                    </>
                                ) : (
                                    <p className="file-drop-text">
                                        {isRTL ? (
                                            <>اسحب ملف CSV هنا أو <strong>اضغط للاختيار</strong></>
                                        ) : (
                                            <>Drag CSV file here or <strong>click to browse</strong></>
                                        )}
                                    </p>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                            </div>

                            {importData.length > 0 && (
                                <div className="import-preview">
                                    <h4>{isRTL ? `معاينة (${importData.length} صف)` : `Preview (${importData.length} rows)`}</h4>
                                    <div className="import-preview-list">
                                        {importData.slice(0, 5).map((row, i) => (
                                            <div key={i} className="import-preview-row">
                                                <span>#{i + 1}</span>
                                                <span><strong>{row.ouvrage_transmis || row['N° Ouvrage Transmis'] || row.transmis || '-'}</strong></span>
                                                <span>{row.dimension || row.Dimension || '-'}</span>
                                                <span>{row.pk_etude || row["PK d'Étude"] || '-'}</span>
                                            </div>
                                        ))}
                                        {importData.length > 5 && (
                                            <div className="import-preview-row" style={{ opacity: 0.6 }}>
                                                {isRTL ? `... و ${importData.length - 5} صف آخر` : `... and ${importData.length - 5} more rows`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="import-help">
                                <strong>{isRTL ? 'الأعمدة المدعومة:' : 'Supported columns:'}</strong><br />
                                <code>ouvrage_transmis</code>, <code>ouvrage_etude</code>, <code>ouvrage_definitif</code>,
                                <code>pk_etude</code>, <code>pk_transmis</code>, <code>dimension</code>,
                                <code>length</code>, <code>status</code>, <code>notes</code>
                            </div>
                        </div>

                        <div className="dalot-modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={resetImportModal}>
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleImport}
                                disabled={!importSection || importData.length === 0 || importing}
                            >
                                {importing
                                    ? (isRTL ? 'جاري الاستيراد...' : 'Importing...')
                                    : (isRTL ? `استيراد ${importData.length} سجل` : `Import ${importData.length} Records`)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal.show && (
                <div className="dalot-modal-overlay" onClick={closeConfirm}>
                    <div className="dalot-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-modal-body">
                            <div className={`confirm-modal-icon ${confirmModal.type}`}>
                                {confirmModal.type === 'danger' ? <Trash2 size={32} /> : <AlertCircle size={32} />}
                            </div>
                            <h3 className="confirm-modal-title">{confirmModal.title}</h3>
                            <p className="confirm-modal-message">{confirmModal.message}</p>
                        </div>
                        <div className="confirm-modal-footer">
                            <button className="btn btn-secondary" onClick={closeConfirm}>
                                {confirmModal.cancelText}
                            </button>
                            <button className="btn btn-danger" onClick={confirmModal.onConfirm}>
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dalots;
