/**
 * Project Materials Modal
 * Manages material allocation and consumption for projects
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Plus, Package, Minus, Trash2, AlertCircle, ChevronDown, Check } from 'lucide-react';

/**
 * Modern Dropdown Component
 * Custom styled dropdown replacing browser default select
 */
const ModernDropdown = ({ options, value, onChange, placeholder, renderOption, isRTL, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: disabled ? 'var(--bg-secondary)' : 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    textAlign: isRTL ? 'right' : 'left',
                    color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
                    opacity: disabled ? 0.6 : 1
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOption ? (renderOption ? renderOption(selectedOption) : selectedOption.label) : placeholder}
                </span>
                <ChevronDown size={16} style={{
                    flexShrink: 0,
                    marginLeft: isRTL ? 0 : '0.5rem',
                    marginRight: isRTL ? '0.5rem' : 0,
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '4px'
                }}>
                    {options.length === 0 ? (
                        <div style={{ padding: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            {isRTL ? 'لا توجد خيارات' : 'No options available'}
                        </div>
                    ) : (
                        options.map((option) => {
                            const isSelected = value === option.value;
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        padding: '0.6rem 0.75rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: isSelected ? 'var(--primary-color)' : 'transparent',
                                        color: isSelected ? 'white' : 'var(--text-primary)',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = 'var(--bg-secondary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {renderOption ? renderOption(option) : option.label}
                                    </span>
                                    {isSelected && <Check size={16} style={{ color: 'white', flexShrink: 0 }} />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

const MATERIAL_TYPES = [
    { value: 'production', label: 'Production Items', labelAr: 'منتجات الإنتاج' },
    { value: 'iron', label: 'Iron', labelAr: 'حديد' },
    { value: 'cement', label: 'Cement', labelAr: 'أسمنت' },
    { value: 'gasoline', label: 'Fuel/Gasoline', labelAr: 'وقود' }
];

const UNITS = [
    { value: 'units', label: 'Units' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'tons', label: 'Tons' },
    { value: 'bags', label: 'Bags' },
    { value: 'liters', label: 'Liters' },
    { value: 'm', label: 'Meters' },
    { value: 'm3', label: 'Cubic Meters (m³)' }
];

const ProjectMaterialsModal = ({ isOpen, onClose, project, isRTL, t }) => {
    const [materials, setMaterials] = useState([]);
    const [availableMaterials, setAvailableMaterials] = useState({
        production: [],
        iron: [],
        cement: [],
        gasoline: []
    });
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [consumeModal, setConsumeModal] = useState({ show: false, material: null });
    const [consumeAmount, setConsumeAmount] = useState('');
    const [consumeError, setConsumeError] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, materialId: null });

    const [newMaterial, setNewMaterial] = useState({
        material_type: 'iron',
        material_id: '',
        quantity_planned: 0,
        unit: 'units',
        notes: ''
    });

    useEffect(() => {
        if (isOpen && project) {
            fetchMaterials();
            fetchAvailableMaterials();
        }
    }, [isOpen, project]);

    const fetchMaterials = async () => {
        try {
            const response = await axios.get(`/api/projects/${project.id}/materials`);
            setMaterials(response.data.data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableMaterials = async () => {
        try {
            const [production, iron, cement, gasoline] = await Promise.all([
                axios.get('/api/storage/production'),
                axios.get('/api/storage/iron'),
                axios.get('/api/storage/cement'),
                axios.get('/api/storage/gasoline')
            ]);

            setAvailableMaterials({
                production: production.data.data || [],
                iron: iron.data.data || [],
                cement: cement.data.data || [],
                gasoline: gasoline.data.data || []
            });
        } catch (error) {
            console.error('Error fetching available materials:', error);
        }
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/projects/${project.id}/materials`, newMaterial);
            fetchMaterials();
            setShowAddForm(false);
            setNewMaterial({
                material_type: 'iron',
                material_id: '',
                quantity_planned: 0,
                unit: 'units',
                notes: ''
            });
        } catch (error) {
            console.error('Error adding material:', error);
        }
    };

    const handleRemoveMaterial = (materialId) => {
        setConfirmModal({ show: true, materialId });
    };

    const confirmRemoveMaterial = async () => {
        try {
            await axios.delete(`/api/projects/${project.id}/materials/${confirmModal.materialId}`);
            fetchMaterials();
        } catch (error) {
            console.error('Error removing material:', error);
        } finally {
            setConfirmModal({ show: false, materialId: null });
        }
    };

    const handleConsume = async () => {
        if (!consumeAmount || consumeAmount <= 0) return;
        setConsumeError('');
        try {
            await axios.post(`/api/projects/${project.id}/materials/${consumeModal.material.id}/consume`, {
                quantity: parseInt(consumeAmount),
                description: `Consumed for project: ${project.name}`
            });
            fetchMaterials();
            fetchAvailableMaterials();
            setConsumeModal({ show: false, material: null });
            setConsumeAmount('');
        } catch (error) {
            console.error('Error consuming material:', error);
            const errorMsg = error.response?.data?.error || (isRTL ? 'خطأ في استهلاك المادة' : 'Error consuming material');
            setConsumeError(errorMsg);
        }
    };

    const getMaterialOptions = () => {
        const type = newMaterial.material_type;
        const items = availableMaterials[type] || [];

        switch (type) {
            case 'production':
                return items.map(i => ({ value: i.id, label: i.name, quantity: i.current_quantity }));
            case 'iron':
                return items.map(i => ({ value: i.id, label: i.diameter, quantity: i.quantity }));
            case 'cement':
            case 'gasoline':
                return items.map(i => ({ value: i.id, label: i.type, quantity: i.quantity }));
            default:
                return [];
        }
    };

    const getProgressPercent = (consumed, planned) => {
        if (!planned || planned === 0) return 0;
        return Math.min(100, Math.round((consumed / planned) * 100));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '800px', width: '90%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="materials-modal-title"
            >
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 id="materials-modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={24} />
                        {isRTL ? 'مواد المشروع' : 'Project Materials'}: {project?.name}
                    </h2>
                    <button onClick={onClose} className="btn-icon" aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
                    {/* Add Material Button */}
                    {!showAddForm && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAddForm(true)}
                            style={{ marginBottom: '1rem' }}
                        >
                            <Plus size={18} />
                            {isRTL ? 'إضافة مادة' : 'Add Material'}
                        </button>
                    )}

                    {/* Add Material Form */}
                    {showAddForm && (
                        <form onSubmit={handleAddMaterial} style={{
                            background: 'var(--bg-secondary)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'نوع المادة' : 'Material Type'}</label>
                                    <ModernDropdown
                                        options={MATERIAL_TYPES.map(type => ({
                                            value: type.value,
                                            label: isRTL ? type.labelAr : type.label
                                        }))}
                                        value={newMaterial.material_type}
                                        onChange={(val) => setNewMaterial({ ...newMaterial, material_type: val, material_id: '' })}
                                        placeholder={isRTL ? 'اختر نوع المادة...' : 'Select material type...'}
                                        isRTL={isRTL}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'المادة' : 'Material'}</label>
                                    <ModernDropdown
                                        options={getMaterialOptions()}
                                        value={newMaterial.material_id}
                                        onChange={(val) => setNewMaterial({ ...newMaterial, material_id: val })}
                                        placeholder={isRTL ? 'اختر المادة...' : 'Select material...'}
                                        renderOption={(opt) => `${opt.label} (${isRTL ? 'متوفر' : 'Available'}: ${opt.quantity})`}
                                        isRTL={isRTL}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'الكمية المخططة' : 'Planned Quantity'}</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newMaterial.quantity_planned}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, quantity_planned: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'الوحدة' : 'Unit'}</label>
                                    <ModernDropdown
                                        options={UNITS}
                                        value={newMaterial.unit}
                                        onChange={(val) => setNewMaterial({ ...newMaterial, unit: val })}
                                        placeholder={isRTL ? 'اختر الوحدة...' : 'Select unit...'}
                                        isRTL={isRTL}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">{isRTL ? 'ملاحظات' : 'Notes'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newMaterial.notes}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                                    placeholder={isRTL ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary">
                                    {isRTL ? 'إضافة' : 'Add'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Materials List */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                    ) : materials.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>{isRTL ? 'لم يتم تخصيص مواد لهذا المشروع بعد' : 'No materials allocated to this project yet'}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {materials.map(material => {
                                const progress = getProgressPercent(material.quantity_consumed, material.quantity_planned);
                                const remaining = (material.quantity_planned || 0) - (material.quantity_consumed || 0);
                                const isOverConsumed = remaining < 0;

                                return (
                                    <div
                                        key={material.id}
                                        style={{
                                            background: 'white',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                                                    {material.material_name || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {MATERIAL_TYPES.find(t => t.value === material.material_type)?.[isRTL ? 'labelAr' : 'label']}
                                                    {material.notes && ` • ${material.notes}`}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                                    onClick={() => {
                                                        setConsumeModal({ show: true, material });
                                                        setConsumeAmount('');
                                                    }}
                                                >
                                                    <Minus size={14} />
                                                    {isRTL ? 'استهلاك' : 'Consume'}
                                                </button>
                                                <button
                                                    className="btn-icon-action delete"
                                                    onClick={() => handleRemoveMaterial(material.id)}
                                                    aria-label="Remove material"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '0.8rem',
                                                marginBottom: '0.25rem'
                                            }}>
                                                <span>
                                                    {isRTL ? 'مستهلك' : 'Consumed'}: {material.quantity_consumed || 0} / {material.quantity_planned || 0} {material.unit}
                                                </span>
                                                <span style={{ color: isOverConsumed ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                                                    {isOverConsumed ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <AlertCircle size={14} />
                                                            {isRTL ? 'تجاوز' : 'Over'}: {Math.abs(remaining)}
                                                        </span>
                                                    ) : (
                                                        `${isRTL ? 'متبقي' : 'Remaining'}: ${remaining}`
                                                    )}
                                                </span>
                                            </div>
                                            <div style={{
                                                height: '8px',
                                                background: 'var(--bg-secondary)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min(100, progress)}%`,
                                                    background: isOverConsumed ? 'var(--danger-color)' : progress >= 80 ? 'var(--warning-color)' : 'var(--success-color)',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {isRTL ? 'المتوفر في المخزن' : 'Available in stock'}: {material.available_quantity || 0}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Consume Modal */}
                {consumeModal.show && (
                    <div className="modal-overlay" onClick={() => { setConsumeModal({ show: false, material: null }); setConsumeError(''); }} style={{ zIndex: 1100 }}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                            <h3 style={{ marginBottom: '1rem' }}>
                                {isRTL ? 'استهلاك مادة' : 'Consume Material'}: {consumeModal.material?.material_name}
                            </h3>
                            <div className="form-group">
                                <label className="form-label">{isRTL ? 'الكمية' : 'Quantity'}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={consumeAmount}
                                    onChange={(e) => {
                                        setConsumeAmount(e.target.value);
                                        setConsumeError('');
                                    }}
                                    min="1"
                                    max={consumeModal.material?.available_quantity || 9999}
                                    autoFocus
                                />
                                <small style={{ color: 'var(--text-secondary)' }}>
                                    {isRTL ? 'المتوفر' : 'Available'}: {consumeModal.material?.available_quantity || 0} {consumeModal.material?.unit}
                                </small>
                            </div>

                            {/* Error Message */}
                            {consumeError && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'var(--danger-light, #fee2e2)',
                                    border: '1px solid var(--danger-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--danger-color)',
                                    fontSize: '0.9rem',
                                    marginTop: '0.5rem'
                                }}>
                                    <AlertCircle size={18} />
                                    <span>{consumeError}</span>
                                </div>
                            )}

                            <div className="modal-actions" style={{ marginTop: '1rem' }}>
                                <button className="btn btn-secondary" onClick={() => { setConsumeModal({ show: false, material: null }); setConsumeError(''); }}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button className="btn btn-primary" onClick={handleConsume} disabled={!consumeAmount || consumeAmount <= 0}>
                                    {isRTL ? 'استهلاك' : 'Consume'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {confirmModal.show && (
                    <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, materialId: null })} style={{ zIndex: 1100 }}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'var(--danger-light, #fee2e2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1rem'
                                }}>
                                    <Trash2 size={28} style={{ color: 'var(--danger-color)' }} />
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem' }}>
                                    {isRTL ? 'تأكيد الحذف' : 'Confirm Removal'}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    {isRTL ? 'هل أنت متأكد من إزالة هذه المادة؟' : 'Are you sure you want to remove this material?'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setConfirmModal({ show: false, materialId: null })}
                                    style={{ minWidth: '100px' }}
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    className="btn"
                                    onClick={confirmRemoveMaterial}
                                    style={{
                                        minWidth: '100px',
                                        background: 'var(--danger-color)',
                                        color: 'white'
                                    }}
                                >
                                    {isRTL ? 'حذف' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectMaterialsModal;
