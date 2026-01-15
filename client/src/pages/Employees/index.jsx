import { useState } from 'react';
import axios from 'axios';
import { Calendar, Download, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LoadingScreen from '../../components/LoadingScreen';
import { useLanguage } from '../../context/LanguageContext';
import useScrollLock from '../../hooks/useScrollLock';

// Custom Hooks
import { useEmployees, useEmployeeFilters } from './hooks/useEmployees';

// Components
import SortableEmployeeRow from './components/SortableEmployeeRow';
import AttendanceModal from './components/AttendanceModal';
import BulkAttendanceModal from './components/BulkAttendanceModal';
import DeactivateWarningModal from './components/DeactivateWarningModal';
import AttendanceReportModal from './components/AttendanceReportModal';
import EditEmployeeModal from './components/EditEmployeeModal';
import DeleteEmployeeModal from './components/DeleteEmployeeModal';
import EmployeeRegistrationForm from './components/EmployeeRegistrationForm';
import RoleSummaryCard from './components/RoleSummaryCard';
import StaffDirectoryFilters from './components/StaffDirectoryFilters';

const Employees = () => {
    const { t } = useLanguage();
    const { loading, employees, setEmployees, fetchEmployees, roleCounts, uniqueRoles } = useEmployees();
    const {
        selectedRole,
        setSelectedRole,
        searchQuery,
        setSearchQuery,
        showInactive,
        setShowInactive,
        filteredEmployees
    } = useEmployeeFilters(employees);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department_id: 1,
        contact_info: ''
    });

    // Edit State
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', role: '', contact_info: '' });
    const [showEditModal, setShowEditModal] = useState(false);

    // Delete State
    const [deletingEmployee, setDeletingEmployee] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Attendance States
    const [attendanceEmployee, setAttendanceEmployee] = useState(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState(false);

    // Report States
    const [reportEmployee, setReportEmployee] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showGlobalReportModal, setShowGlobalReportModal] = useState(false);

    // Deactivation Warning State
    const [showDeactivateWarningModal, setShowDeactivateWarningModal] = useState(false);
    const [employeeToDeactivate, setEmployeeToDeactivate] = useState(null);
    const [conflictingTasks, setConflictingTasks] = useState([]);
    const [warningMode, setWarningMode] = useState('deactivate');

    // Lock scroll when any modal is open
    const isAnyModalOpen = showEditModal || showDeleteModal || showAttendanceModal ||
        showBulkAttendanceModal || showReportModal || showGlobalReportModal || showDeactivateWarningModal;
    useScrollLock(isAnyModalOpen);

    // Drag and Drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        const upperValue = ['name', 'role', 'contact_info'].includes(name) ? value.toUpperCase() : value;
        setFormData({ ...formData, [name]: upperValue });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        const upperValue = ['name', 'role', 'contact_info'].includes(name) ? value.toUpperCase() : value;
        setEditFormData({ ...editFormData, [name]: upperValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/employees', formData);
            setFormData({ name: '', role: '', department_id: 1, contact_info: '' });
            fetchEmployees();
        } catch (error) {
            console.error('Error creating employee:', error);
        }
    };

    const handleEditClick = (emp) => {
        setEditingEmployee(emp);
        setEditFormData({ name: emp.name, role: emp.role, contact_info: emp.contact_info });
        setShowEditModal(true);
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/employees/${editingEmployee.id}`, editFormData);
            setShowEditModal(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (error) {
            console.error('Error updating employee:', error);
        }
    };

    const performDeactivation = async (emp, newStatus) => {
        try {
            await axios.put(`/api/employees/${emp.id}`, { is_active: newStatus });
            fetchEmployees();
            setShowDeactivateWarningModal(false);
            setEmployeeToDeactivate(null);
            setConflictingTasks([]);
        } catch (error) {
            console.error('Error updating employee status:', error);
        }
    };

    const handleToggleStatus = async (emp) => {
        const newStatus = emp.is_active === 0 ? 1 : 0;

        if (newStatus === 1) {
            performDeactivation(emp, newStatus);
            return;
        }

        try {
            const projectsRes = await axios.get('/api/projects');
            const projects = projectsRes.data.data;
            const activeConflicts = projects.filter(p => {
                if (p.status !== 'In Progress' || !p.assignee) return false;
                const assignees = p.assignee.split(',').map(s => s.trim());
                return assignees.includes(emp.name);
            });

            if (activeConflicts.length > 0) {
                setEmployeeToDeactivate(emp);
                setConflictingTasks(activeConflicts);
                setWarningMode('deactivate');
                setShowDeactivateWarningModal(true);
            } else {
                performDeactivation(emp, 0);
            }
        } catch (error) {
            console.error("Error checking tasks for deactivation:", error);
            performDeactivation(emp, 0);
        }
    };

    const handleDeleteClick = async (emp) => {
        try {
            const projectsRes = await axios.get('/api/projects');
            const projects = projectsRes.data.data;
            const activeConflicts = projects.filter(p => {
                if (p.status !== 'In Progress' || !p.assignee) return false;
                const assignees = p.assignee.split(',').map(s => s.trim());
                return assignees.includes(emp.name);
            });

            if (activeConflicts.length > 0) {
                setEmployeeToDeactivate(emp);
                setConflictingTasks(activeConflicts);
                setWarningMode('delete');
                setShowDeactivateWarningModal(true);
            } else {
                setDeletingEmployee(emp);
                setShowDeleteModal(true);
            }
        } catch (error) {
            console.error("Error checking tasks for deletion:", error);
            setDeletingEmployee(emp);
            setShowDeleteModal(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingEmployee) return;
        try {
            await axios.delete(`/api/employees/${deletingEmployee.id}`);
            setShowDeleteModal(false);
            setDeletingEmployee(null);
            fetchEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const handleRemoveFromTasksAndProceed = async () => {
        if (!employeeToDeactivate || conflictingTasks.length === 0) return;

        try {
            await Promise.all(conflictingTasks.map(async (project) => {
                const currentAssignees = project.assignee.split(',').map(s => s.trim());
                const newAssignees = currentAssignees.filter(name => name !== employeeToDeactivate.name);
                const newAssigneeString = newAssignees.join(', ');

                await axios.put(`/api/projects/${project.id}`, {
                    ...project,
                    assignee: newAssigneeString
                });
            }));

            if (warningMode === 'delete') {
                await axios.delete(`/api/employees/${employeeToDeactivate.id}`);
                fetchEmployees();
            } else if (warningMode === 'deactivate') {
                await performDeactivation(employeeToDeactivate, 0);
            }

            setShowDeactivateWarningModal(false);
            setEmployeeToDeactivate(null);
            setConflictingTasks([]);
            setWarningMode(null);
        } catch (error) {
            console.error("Error removing from tasks and proceeding:", error);
            alert("Failed to update tasks or process employee. Please try again.");
        }
    };

    const handleOpenAttendance = (emp) => {
        setAttendanceEmployee(emp);
        setShowAttendanceModal(true);
    };

    const handleDownloadReportClick = (emp) => {
        setReportEmployee(emp);
        setShowReportModal(true);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setEmployees((items) => {
                const oldIndex = items.findIndex((item) => String(item.id) === active.id);
                const newIndex = items.findIndex((item) => String(item.id) === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const orderUpdates = newItems.map((item, index) => ({
                    id: item.id,
                    display_order: index
                }));

                axios.put('/api/employees/reorder', { items: orderUpdates })
                    .catch(err => console.error("Failed to save order", err));

                return newItems;
            });
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">{t('employees')}</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-secondary btn-icon-mobile"
                        onClick={() => setShowGlobalReportModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#6c757d', color: 'white', border: 'none' }}
                    >
                        <Download size={18} />
                        <span className="btn-text">{t('globalReport') !== 'globalReport' ? t('globalReport') : "Global Report"}</span>
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowBulkAttendanceModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Calendar size={18} />
                        <span className="btn-text-mobile-hide">{t('bulkAttendance')}</span>
                    </button>
                </div>
            </div>

            <div className="content-grid">
                <div className="left-column">
                    <EmployeeRegistrationForm
                        formData={formData}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                    />
                    <RoleSummaryCard roleCounts={roleCounts} />
                </div>

                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>{t('staffDirectory')}</h3>
                        <StaffDirectoryFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            showInactive={showInactive}
                            onToggleInactive={() => setShowInactive(!showInactive)}
                            selectedRole={selectedRole}
                            onRoleChange={setSelectedRole}
                            uniqueRoles={uniqueRoles}
                        />
                    </div>

                    <div className="table-view">
                        <div className="table-container">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px' }}></th>
                                            <th>ID</th>
                                            <th>{t('name')}</th>
                                            <th>{t('role')}</th>
                                            <th>{t('contactInfo')}</th>
                                            <th>{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <SortableContext items={(filteredEmployees || []).map(e => String(e.id))} strategy={verticalListSortingStrategy}>
                                        <tbody>
                                            {filteredEmployees.map((emp, index) => (
                                                <SortableEmployeeRow
                                                    key={emp.id}
                                                    emp={emp}
                                                    index={index}
                                                    onEdit={handleEditClick}
                                                    onDelete={handleDeleteClick}
                                                    onToggleStatus={handleToggleStatus}
                                                    onOpenAttendance={handleOpenAttendance}
                                                    onDownloadReport={handleDownloadReportClick}
                                                />
                                            ))}
                                            {filteredEmployees.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                        No employees found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </SortableContext>
                                </table>
                            </DndContext>
                        </div>
                    </div>

                    <div className="mobile-view">
                        {filteredEmployees.map((emp, index) => (
                            <div key={emp.id} className="mobile-card">
                                <div className="mobile-card-header">
                                    <span className="mobile-card-id">#{index + 1}</span>
                                    <div className="mobile-card-actions">
                                        <button
                                            className="btn-icon-action toggle"
                                            onClick={() => handleToggleStatus(emp)}
                                            style={{ color: emp.is_active === 0 ? 'var(--text-secondary)' : 'var(--success-color)' }}
                                        >
                                            {emp.is_active === 0 ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
                                        </button>
                                        <button className="btn-icon-action" onClick={() => handleOpenAttendance(emp)}>
                                            <Calendar size={16} />
                                        </button>
                                        <button className="btn-icon-action" onClick={() => handleDownloadReportClick(emp)} style={{ color: '#007bff' }}>
                                            <Download size={16} />
                                        </button>
                                        <button className="btn-icon-action edit" onClick={() => handleEditClick(emp)}>
                                            <Pencil size={16} />
                                        </button>
                                        <button className="btn-icon-action delete" onClick={() => handleDeleteClick(emp)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mobile-card-body">
                                    <h4 style={{ color: emp.is_active === 0 ? 'red' : 'inherit' }}>
                                        {emp.name}
                                        {emp.is_active === 0 && <span style={{ fontSize: '0.8em', marginLeft: '0.5rem', color: 'red' }}>(Inactive)</span>}
                                    </h4>
                                    <p className="role">{emp.role}</p>
                                    <p className="contact">{emp.contact_info}</p>
                                </div>
                            </div>
                        ))}
                        {filteredEmployees.length === 0 && <p className="no-data">No employees found.</p>}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditEmployeeModal
                    employee={editingEmployee}
                    formData={editFormData}
                    onChange={handleEditChange}
                    onSubmit={handleUpdateEmployee}
                    onClose={() => setShowEditModal(false)}
                />
            )}

            {showDeleteModal && (
                <DeleteEmployeeModal
                    employee={deletingEmployee}
                    onConfirm={handleConfirmDelete}
                    onClose={() => setShowDeleteModal(false)}
                />
            )}

            {showAttendanceModal && attendanceEmployee && (
                <AttendanceModal
                    employee={attendanceEmployee}
                    onClose={() => {
                        setShowAttendanceModal(false);
                        setAttendanceEmployee(null);
                    }}
                />
            )}

            {showBulkAttendanceModal && (
                <BulkAttendanceModal
                    employees={employees}
                    onClose={() => setShowBulkAttendanceModal(false)}
                    onSave={() => setShowBulkAttendanceModal(false)}
                />
            )}

            {showGlobalReportModal && (
                <AttendanceReportModal
                    employees={employees}
                    isGlobal={true}
                    onClose={() => setShowGlobalReportModal(false)}
                />
            )}

            {showReportModal && (
                <AttendanceReportModal
                    employee={reportEmployee}
                    isGlobal={false}
                    onClose={() => {
                        setShowReportModal(false);
                        setReportEmployee(null);
                    }}
                />
            )}

            {showDeactivateWarningModal && (
                <DeactivateWarningModal
                    employee={employeeToDeactivate}
                    tasks={conflictingTasks}
                    mode={warningMode}
                    onClose={() => {
                        setShowDeactivateWarningModal(false);
                        setEmployeeToDeactivate(null);
                        setConflictingTasks([]);
                        setWarningMode(null);
                    }}
                    onConfirm={handleRemoveFromTasksAndProceed}
                />
            )}

            <style>{`
        .content-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        .left-column {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--primary-color);
        }

        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }

        .btn-icon-action {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            opacity: 0.6;
            transition: opacity 0.2s;
        }

        .btn-icon-action:hover {
            opacity: 1;
        }

        .btn-icon-action.edit {
            color: var(--primary-color);
        }

        .btn-icon-action.delete {
            color: var(--danger-color);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 1000;
          overflow-y: auto;
          padding: 2rem 0;
        }

        .modal-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 500px;
          margin: auto;
          position: relative;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        .mobile-view {
            display: none;
        }

        .role-stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--border-color);
        }

        .role-stat-item:last-child {
            border-bottom: none;
        }

        .role-count {
            background: var(--bg-secondary);
            color: var(--primary-color);
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.875rem;
        }

        @media (max-width: 768px) {
            .table-view {
                display: none;
            }

            .mobile-view {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .mobile-card {
                background: var(--bg-secondary);
                padding: 1rem;
                border-radius: var(--radius-md);
                border: 1px solid var(--border-color);
            }

            .mobile-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }

            .mobile-card-id {
                font-size: 0.8rem;
                color: var(--text-secondary);
                font-weight: 600;
            }

            .mobile-card-actions {
                display: flex;
                gap: 0.5rem;
            }

            .mobile-card-body h4 {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0.25rem;
            }

            .mobile-card-body .role {
                color: var(--primary-color);
                font-weight: 500;
                font-size: 0.9rem;
                margin-bottom: 0.25rem;
            }

            .mobile-card-body .contact {
                font-size: 0.85rem;
                color: var(--text-secondary);
            }

            .card {
                padding: 1rem;
            }

            .page-header {
                margin-bottom: 1.5rem;
            }

            .page-title {
                font-size: 1.5rem;
            }

            .btn-text, .btn-text-mobile-hide {
                display: none;
            }

            .btn-icon-mobile, .btn-primary {
                 padding: 0.6rem !important;
            }
        }
      `}</style>
        </div>
    );
};

export default Employees;
