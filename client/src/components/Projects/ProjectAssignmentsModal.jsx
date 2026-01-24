/**
 * Project Assignments Modal
 * Manages employee assignments to projects with workload tracking
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Users, Clock, Trash2, UserCheck, AlertTriangle } from 'lucide-react';

const ROLE_OPTIONS = [
    { value: 'supervisor', label: 'Supervisor', labelAr: 'مشرف' },
    { value: 'engineer', label: 'Engineer', labelAr: 'مهندس' },
    { value: 'foreman', label: 'Foreman', labelAr: 'ملاحظ' },
    { value: 'worker', label: 'Worker', labelAr: 'عامل' },
    { value: 'driver', label: 'Driver', labelAr: 'سائق' },
    { value: 'operator', label: 'Equipment Operator', labelAr: 'مشغل معدات' },
    { value: 'other', label: 'Other', labelAr: 'أخرى' }
];

const ProjectAssignmentsModal = ({ isOpen, onClose, project, isRTL, t }) => {
    const [assignments, setAssignments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [workloadData, setWorkloadData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [logHoursModal, setLogHoursModal] = useState({ show: false, assignment: null });
    const [hoursToLog, setHoursToLog] = useState('');

    const [newAssignment, setNewAssignment] = useState({
        employee_id: '',
        role_on_project: 'worker',
        hours_allocated: 0,
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        if (isOpen && project) {
            fetchAssignments();
            fetchEmployees();
            fetchWorkload();
        }
    }, [isOpen, project]);

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

    const getAvailableEmployees = () => {
        const assignedIds = assignments.map(a => a.employee_id);
        return employees.filter(e => !assignedIds.includes(e.id));
    };

    const handleAddAssignment = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/projects/${project.id}/assignments`, newAssignment);
            fetchAssignments();
            fetchWorkload();
            setShowAddForm(false);
            setNewAssignment({
                employee_id: '',
                role_on_project: 'worker',
                hours_allocated: 0,
                start_date: '',
                end_date: ''
            });
        } catch (error) {
            console.error('Error adding assignment:', error);
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            }
        }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من إزالة هذا التعيين؟' : 'Are you sure you want to remove this assignment?')) return;
        try {
            await axios.delete(`/api/projects/${project.id}/assignments/${assignmentId}`);
            fetchAssignments();
            fetchWorkload();
        } catch (error) {
            console.error('Error removing assignment:', error);
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
        if (!workload) return { color: 'var(--text-secondary)', label: isRTL ? 'متاح' : 'Available' };
        if (workload.active_projects >= 3) {
            return { color: 'var(--danger-color)', label: isRTL ? 'محمّل بشكل زائد' : 'Overloaded' };
        }
        if (workload.active_projects >= 2) {
            return { color: 'var(--warning-color)', label: isRTL ? 'مشغول' : 'Busy' };
        }
        return { color: 'var(--success-color)', label: isRTL ? 'متاح' : 'Available' };
    };

    if (!isOpen) return null;

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
                    {!showAddForm && getAvailableEmployees().length > 0 && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAddForm(true)}
                            style={{ marginBottom: '1rem' }}
                        >
                            <Plus size={18} />
                            {isRTL ? 'إضافة عضو' : 'Add Team Member'}
                        </button>
                    )}

                    {/* Add Assignment Form */}
                    {showAddForm && (
                        <form onSubmit={handleAddAssignment} style={{
                            background: 'var(--bg-secondary)',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'الموظف' : 'Employee'}</label>
                                    <select
                                        className="form-input"
                                        value={newAssignment.employee_id}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, employee_id: e.target.value })}
                                        required
                                    >
                                        <option value="">{isRTL ? 'اختر موظف...' : 'Select employee...'}</option>
                                        {getAvailableEmployees().map(emp => {
                                            const workload = getEmployeeWorkload(emp.id);
                                            const status = getWorkloadStatus(workload);
                                            return (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.name} ({emp.role || 'No Role'}) - {status.label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'الدور في المشروع' : 'Role on Project'}</label>
                                    <select
                                        className="form-input"
                                        value={newAssignment.role_on_project}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, role_on_project: e.target.value })}
                                    >
                                        {ROLE_OPTIONS.map(role => (
                                            <option key={role.value} value={role.value}>
                                                {isRTL ? role.labelAr : role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'الساعات المخصصة' : 'Hours Allocated'}</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={newAssignment.hours_allocated}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, hours_allocated: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{isRTL ? 'تاريخ البدء' : 'Start Date'}</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newAssignment.start_date}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, start_date: e.target.value })}
                                    />
                                </div>
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
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
                                                    fontWeight: 600
                                                }}>
                                                    {assignment.employee_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            </div>
        </div>
    );
};

export default ProjectAssignmentsModal;
