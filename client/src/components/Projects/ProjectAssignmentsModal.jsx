/**
 * Project Assignments Modal
 * Manages employee assignments to projects with workload tracking
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Plus, Users, Clock, Trash2, UserCheck, AlertTriangle, ChevronDown, Check, Search, UsersRound } from 'lucide-react';

const ROLE_OPTIONS = [
    { value: 'supervisor', label: 'Supervisor', labelAr: 'مشرف' },
    { value: 'engineer', label: 'Engineer', labelAr: 'مهندس' },
    { value: 'foreman', label: 'Foreman', labelAr: 'ملاحظ' },
    { value: 'worker', label: 'Worker', labelAr: 'عامل' },
    { value: 'driver', label: 'Driver', labelAr: 'سائق' },
    { value: 'operator', label: 'Equipment Operator', labelAr: 'مشغل معدات' },
    { value: 'other', label: 'Other', labelAr: 'أخرى' }
];

// Modern Dropdown Component
const ModernDropdown = ({ options, value, onChange, placeholder, renderOption, isRTL }) => {
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
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    minHeight: '42px'
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedOption ? (renderOption ? renderOption(selectedOption) : selectedOption.label) :
                        <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>}
                </span>
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-secondary)' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    maxHeight: '250px',
                    overflowY: 'auto'
                }}>
                    {options.map(option => (
                        <div
                            key={option.value}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: value === option.value ? 'var(--bg-secondary)' : 'transparent',
                                borderBottom: '1px solid var(--border-color-light)',
                                fontSize: '0.9rem',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = value === option.value ? 'var(--bg-secondary)' : 'transparent'}
                        >
                            <span>{renderOption ? renderOption(option) : option.label}</span>
                            {value === option.value && <Check size={16} style={{ color: 'var(--primary-color)' }} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Employee Multi-Select Dropdown with Bulk Options
const EmployeeSelector = ({ employees, selectedIds, onSelect, onSelectAll, onClear, workloadData, getWorkloadStatus, isRTL, currentProjectAssignments = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
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

    const getEmployeeWorkload = (employeeId) => {
        return workloadData.find(w => w.id === employeeId);
    };

    // Check if employee is available (not assigned to another active project)
    const isEmployeeAvailable = (employeeId) => {
        // If already assigned to this project, not available for re-selection
        if (currentProjectAssignments.includes(employeeId)) return false;

        // Check workload for other active projects
        const workload = getEmployeeWorkload(employeeId);
        if (workload && workload.active_projects > 0) return false;

        return true;
    };

    // Filter by search and sort: available employees first, then alphabetically
    const filteredEmployees = employees
        .filter(emp =>
            emp.name.toLowerCase().includes(search.toLowerCase()) ||
            (emp.role || '').toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const aAvailable = isEmployeeAvailable(a.id);
            const bAvailable = isEmployeeAvailable(b.id);
            if (aAvailable && !bAvailable) return -1;
            if (!aAvailable && bAvailable) return 1;
            return a.name.localeCompare(b.name);
        });

    // Get only available employees for "Select All"
    const availableEmployees = filteredEmployees.filter(emp => isEmployeeAvailable(emp.id));

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    minHeight: '42px'
                }}
            >
                <span style={{ color: selectedIds.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {selectedIds.length > 0
                        ? `${selectedIds.length} ${isRTL ? 'موظف محدد' : 'employee(s) selected'}`
                        : (isRTL ? 'اختر موظفين...' : 'Select employees...')}
                </span>
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    maxHeight: '350px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Search */}
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder={isRTL ? 'بحث...' : 'Search...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    <div style={{
                        padding: '0.5rem 0.75rem',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'var(--bg-secondary)'
                    }}>
                        <button
                            type="button"
                            onClick={() => onSelectAll(availableEmployees.map(e => e.id))}
                            disabled={availableEmployees.length === 0}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: availableEmployees.length === 0 ? 'var(--text-secondary)' : 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                cursor: availableEmployees.length === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                opacity: availableEmployees.length === 0 ? 0.6 : 1
                            }}
                        >
                            <UsersRound size={14} />
                            {isRTL ? `تحديد المتاحين (${availableEmployees.length})` : `Select Available (${availableEmployees.length})`}
                        </button>
                        {selectedIds.length > 0 && (
                            <button
                                type="button"
                                onClick={onClear}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    background: 'var(--text-secondary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {isRTL ? 'إلغاء التحديد' : 'Clear'}
                            </button>
                        )}
                    </div>

                    {/* Employee List */}
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '220px' }}>
                        {filteredEmployees.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                {isRTL ? 'لا يوجد موظفين' : 'No employees found'}
                            </div>
                        ) : (
                            filteredEmployees.map(emp => {
                                const isSelected = selectedIds.includes(emp.id);
                                const available = isEmployeeAvailable(emp.id);
                                const workload = getEmployeeWorkload(emp.id);
                                const isAssignedElsewhere = workload && workload.active_projects > 0;

                                return (
                                    <div
                                        key={emp.id}
                                        onClick={() => available && onSelect(emp.id)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            cursor: available ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            background: isSelected ? 'rgba(30, 58, 95, 0.1)' : !available ? 'rgba(0,0,0,0.03)' : 'transparent',
                                            borderBottom: '1px solid var(--border-color-light)',
                                            transition: 'background 0.15s',
                                            opacity: available ? 1 : 0.6
                                        }}
                                        onMouseEnter={(e) => { if (!isSelected && available) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = !available ? 'rgba(0,0,0,0.03)' : 'transparent'; }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '4px',
                                            border: isSelected ? 'none' : '2px solid var(--border-color)',
                                            background: isSelected ? 'var(--primary-color)' : !available ? 'var(--bg-secondary)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {isSelected && <Check size={14} style={{ color: 'white' }} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{emp.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {emp.role || 'No Role'}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '10px',
                                            background: isAssignedElsewhere ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                            color: isAssignedElsewhere ? 'var(--danger-color)' : 'var(--success-color)'
                                        }}>
                                            {isAssignedElsewhere
                                                ? (isRTL ? 'مشغول في مشروع آخر' : 'Assigned elsewhere')
                                                : (isRTL ? 'متاح' : 'Available')}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProjectAssignmentsModal = ({ isOpen, onClose, project, isRTL, t }) => {
    const [assignments, setAssignments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [workloadData, setWorkloadData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [logHoursModal, setLogHoursModal] = useState({ show: false, assignment: null });
    const [hoursToLog, setHoursToLog] = useState('');
    const [confirmModal, setConfirmModal] = useState({ show: false, assignmentId: null });

    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [bulkRole, setBulkRole] = useState('worker');
    const [bulkHours, setBulkHours] = useState(0);

    useEffect(() => {
        if (isOpen && project) {
            fetchAssignments();
            fetchEmployees();
            fetchWorkload();
        }
    }, [isOpen, project]);

    useEffect(() => {
        if (!showAddForm) {
            setSelectedEmployeeIds([]);
            setBulkRole('worker');
            setBulkHours(0);
        }
    }, [showAddForm]);

    const fetchAssignments = async () => {
        try {
            const response = await axios.get(`/api/projects/${project.id}/assignments`);
            setAssignments(response.data.data || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employees');
            setEmployees((response.data.data || []).filter(e => e.is_active));
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchWorkload = async () => {
        try {
            const response = await axios.get('/api/employees/workload');
            setWorkloadData(response.data.data || []);
        } catch (error) {
            console.error('Error fetching workload:', error);
        }
    };

    const getEmployeeWorkload = (employeeId) => {
        return workloadData.find(w => w.id === employeeId);
    };


    const handleAddAssignments = async (e) => {
        e.preventDefault();
        if (selectedEmployeeIds.length === 0) return;

        try {
            // Add all selected employees
            await Promise.all(selectedEmployeeIds.map(empId =>
                axios.post(`/api/projects/${project.id}/assignments`, {
                    employee_id: empId,
                    role_on_project: bulkRole,
                    hours_allocated: bulkHours
                })
            ));

            fetchAssignments();
            fetchWorkload();
            setShowAddForm(false);
        } catch (error) {
            console.error('Error adding assignments:', error);
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            }
        }
    };

    const handleSelectEmployee = (empId) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(empId)
                ? prev.filter(id => id !== empId)
                : [...prev, empId]
        );
    };

    const handleSelectAllEmployees = (empIds) => {
        setSelectedEmployeeIds(empIds);
    };

    const handleRemoveAssignment = (assignmentId) => {
        setConfirmModal({ show: true, assignmentId });
    };

    const confirmRemoveAssignment = async () => {
        try {
            await axios.delete(`/api/projects/${project.id}/assignments/${confirmModal.assignmentId}`);
            fetchAssignments();
            fetchWorkload();
        } catch (error) {
            console.error('Error removing assignment:', error);
        } finally {
            setConfirmModal({ show: false, assignmentId: null });
        }
    };

    const handleToggleActive = async (assignment) => {
        try {
            await axios.put(`/api/projects/${project.id}/assignments/${assignment.id}`, {
                is_active: assignment.is_active ? 0 : 1
            });
            fetchAssignments();
            fetchWorkload();
        } catch (error) {
            console.error('Error updating assignment:', error);
        }
    };

    const handleLogHours = async () => {
        if (!hoursToLog || hoursToLog <= 0) return;
        try {
            await axios.post(`/api/projects/${project.id}/assignments/${logHoursModal.assignment.id}/log-hours`, {
                hours: parseFloat(hoursToLog)
            });
            fetchAssignments();
            setLogHoursModal({ show: false, assignment: null });
            setHoursToLog('');
        } catch (error) {
            console.error('Error logging hours:', error);
        }
    };

    const getWorkloadStatus = (workload) => {
        if (!workload) return { color: 'var(--success-color)', label: isRTL ? 'متاح' : 'Available' };
        if (workload.active_projects >= 3) {
            return { color: 'var(--danger-color)', label: isRTL ? 'محمّل بشكل زائد' : 'Overloaded' };
        }
        if (workload.active_projects >= 2) {
            return { color: 'var(--warning-color)', label: isRTL ? 'مشغول' : 'Busy' };
        }
        return { color: 'var(--success-color)', label: isRTL ? 'متاح' : 'Available' };
    };

    if (!isOpen) return null;

    // Check if there are any available employees (not assigned to this project or other active projects)
    const hasAvailableEmployees = employees.some(emp => {
        // If already assigned to this project, not available
        if (assignments.some(a => a.employee_id === emp.id)) return false;
        // Check workload - if they have active projects elsewhere, not available
        const workload = workloadData.find(w => w.id === emp.id);
        if (workload && workload.active_projects > 0) return false;
        return true;
    });

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '900px', width: '90%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="assignments-modal-title"
            >
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 id="assignments-modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={24} />
                        {isRTL ? 'فريق المشروع' : 'Project Team'}: {project?.name}
                    </h2>
                    <button onClick={onClose} className="btn-icon" aria-label="Close">
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
                    {/* Summary Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                {assignments.filter(a => a.is_active).length}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {isRTL ? 'أعضاء نشطين' : 'Active Members'}
                            </div>
                        </div>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                                {assignments.reduce((sum, a) => sum + (a.hours_allocated || 0), 0)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {isRTL ? 'ساعات مخصصة' : 'Hours Allocated'}
                            </div>
                        </div>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success-color)' }}>
                                {assignments.reduce((sum, a) => sum + (a.hours_worked || 0), 0)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {isRTL ? 'ساعات عمل' : 'Hours Worked'}
                            </div>
                        </div>
                    </div>

                    {/* Add Assignment Button */}
                    {!showAddForm && hasAvailableEmployees && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAddForm(true)}
                            style={{ marginBottom: '1rem' }}
                        >
                            <Plus size={18} />
                            {isRTL ? 'إضافة أعضاء' : 'Add Team Members'}
                        </button>
                    )}

                    {/* Add Assignment Form */}
                    {showAddForm && (
                        <form onSubmit={handleAddAssignments} style={{
                            background: 'var(--bg-secondary)',
                            padding: '1.25rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem'
                        }}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                    {isRTL ? 'اختر الموظفين' : 'Select Employees'}
                                </label>
                                <EmployeeSelector
                                    employees={employees}
                                    selectedIds={selectedEmployeeIds}
                                    onSelect={handleSelectEmployee}
                                    onSelectAll={handleSelectAllEmployees}
                                    onClear={() => setSelectedEmployeeIds([])}
                                    workloadData={workloadData}
                                    getWorkloadStatus={getWorkloadStatus}
                                    isRTL={isRTL}
                                    currentProjectAssignments={assignments.map(a => a.employee_id)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                        {isRTL ? 'الدور في المشروع' : 'Role on Project'}
                                    </label>
                                    <ModernDropdown
                                        options={ROLE_OPTIONS.map(r => ({ value: r.value, label: isRTL ? r.labelAr : r.label }))}
                                        value={bulkRole}
                                        onChange={setBulkRole}
                                        placeholder={isRTL ? 'اختر الدور...' : 'Select role...'}
                                        isRTL={isRTL}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                        {isRTL ? 'الساعات المخصصة' : 'Hours Allocated'}
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={bulkHours}
                                        onChange={(e) => setBulkHours(parseInt(e.target.value) || 0)}
                                        min="0"
                                        style={{ height: '42px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={selectedEmployeeIds.length === 0}
                                >
                                    <Plus size={16} />
                                    {isRTL ? `إضافة ${selectedEmployeeIds.length} موظف` : `Add ${selectedEmployeeIds.length} Employee(s)`}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Assignments List */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                    ) : assignments.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>{isRTL ? 'لم يتم تعيين أعضاء لهذا المشروع بعد' : 'No team members assigned to this project yet'}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {assignments.map(assignment => {
                                const workload = getEmployeeWorkload(assignment.employee_id);
                                const hoursProgress = assignment.hours_allocated > 0
                                    ? Math.round((assignment.hours_worked / assignment.hours_allocated) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={assignment.id}
                                        style={{
                                            background: 'white',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '1rem',
                                            opacity: assignment.is_active ? 1 : 0.6
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'var(--primary-color)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 600,
                                                    flexShrink: 0
                                                }}>
                                                    {assignment.employee_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {assignment.employee_name}
                                                        {!assignment.is_active && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                padding: '0.15rem 0.4rem',
                                                                background: 'var(--text-secondary)',
                                                                color: 'white',
                                                                borderRadius: '4px'
                                                            }}>
                                                                {isRTL ? 'غير نشط' : 'Inactive'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {ROLE_OPTIONS.find(r => r.value === assignment.role_on_project)?.[isRTL ? 'labelAr' : 'label'] || assignment.role_on_project}
                                                        {' • '}
                                                        {assignment.employee_role || 'No Role'}
                                                    </div>
                                                    {workload && workload.active_projects >= 2 && (
                                                        <div style={{
                                                            fontSize: '0.75rem',
                                                            color: workload.active_projects >= 3 ? 'var(--danger-color)' : 'var(--warning-color)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            marginTop: '0.25rem'
                                                        }}>
                                                            <AlertTriangle size={12} />
                                                            {isRTL
                                                                ? `معين لـ ${workload.active_projects} مشاريع`
                                                                : `Assigned to ${workload.active_projects} projects`}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                                    onClick={() => {
                                                        setLogHoursModal({ show: true, assignment });
                                                        setHoursToLog('');
                                                    }}
                                                >
                                                    <Clock size={14} />
                                                    {isRTL ? 'تسجيل ساعات' : 'Log Hours'}
                                                </button>
                                                <button
                                                    className={`btn ${assignment.is_active ? 'btn-secondary' : 'btn-primary'}`}
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                                                    onClick={() => handleToggleActive(assignment)}
                                                    title={assignment.is_active ? (isRTL ? 'إلغاء التفعيل' : 'Deactivate') : (isRTL ? 'تفعيل' : 'Activate')}
                                                >
                                                    <UserCheck size={14} />
                                                </button>
                                                <button
                                                    className="btn-icon-action delete"
                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                    aria-label="Remove assignment"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Hours Progress */}
                                        {assignment.hours_allocated > 0 && (
                                            <div>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '0.8rem',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    <span>
                                                        {isRTL ? 'الساعات' : 'Hours'}: {assignment.hours_worked || 0} / {assignment.hours_allocated}
                                                    </span>
                                                    <span style={{ color: hoursProgress >= 100 ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                                                        {hoursProgress}%
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: '6px',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${Math.min(100, hoursProgress)}%`,
                                                        background: hoursProgress >= 100 ? 'var(--success-color)' : 'var(--primary-color)',
                                                        borderRadius: '3px',
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                            </div>
                                        )}

                                        {assignment.start_date && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                                {isRTL ? 'من' : 'From'}: {assignment.start_date}
                                                {assignment.end_date && ` ${isRTL ? 'إلى' : 'to'} ${assignment.end_date}`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Log Hours Modal */}
                {logHoursModal.show && (
                    <div className="modal-overlay" onClick={() => setLogHoursModal({ show: false, assignment: null })} style={{ zIndex: 1100 }}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                            <h3 style={{ marginBottom: '1rem' }}>
                                {isRTL ? 'تسجيل ساعات عمل' : 'Log Work Hours'}: {logHoursModal.assignment?.employee_name}
                            </h3>
                            <div className="form-group">
                                <label className="form-label">{isRTL ? 'الساعات' : 'Hours'}</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={hoursToLog}
                                    onChange={(e) => setHoursToLog(e.target.value)}
                                    min="0.5"
                                    step="0.5"
                                    autoFocus
                                />
                                <small style={{ color: 'var(--text-secondary)' }}>
                                    {isRTL ? 'الساعات المسجلة حاليا' : 'Currently logged'}: {logHoursModal.assignment?.hours_worked || 0}h
                                </small>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '1rem' }}>
                                <button className="btn btn-secondary" onClick={() => setLogHoursModal({ show: false, assignment: null })}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button className="btn btn-primary" onClick={handleLogHours} disabled={!hoursToLog || hoursToLog <= 0}>
                                    {isRTL ? 'تسجيل' : 'Log Hours'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {confirmModal.show && (
                    <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, assignmentId: null })} style={{ zIndex: 1100 }}>
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
                                    {isRTL ? 'هل أنت متأكد من إزالة هذا التعيين؟' : 'Are you sure you want to remove this assignment?'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setConfirmModal({ show: false, assignmentId: null })}
                                    style={{ minWidth: '100px' }}
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    className="btn"
                                    onClick={confirmRemoveAssignment}
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

export default ProjectAssignmentsModal;
