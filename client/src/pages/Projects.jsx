import { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Pencil, X, Trash, Search, ChevronDown, Check, Users, ArrowRight, Package, UserPlus } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import { ProjectMaterialsModal, ProjectAssignmentsModal } from '../components/Projects';

const ModernSelect = ({ options, value, onChange, placeholder = "Select...", renderOption }) => {
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
        <div className="modern-select" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
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
                    minHeight: '38px'
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedOption ? (renderOption ? renderOption(selectedOption) : selectedOption.label) : <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>}
                </span>
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-secondary)' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    animation: 'fadeIn 0.2s ease-out'
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
                                fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = value === option.value ? 'var(--bg-secondary)' : 'transparent'}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {renderOption ? renderOption(option) : option.label}
                            </span>
                            {value === option.value && <Check size={16} className="text-primary" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ModernAssigneeDropdown = ({ employees, onSelect, onSelectAll }) => {
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

    const filtered = employees.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.role && e.role.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="modern-dropdown" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="form-input"
                style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                }}
            >
                <span>+ Add Assignee</span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="dropdown-menu" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        {onSelectAll && employees.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { onSelectAll(employees); setIsOpen(false); setSearch(''); }}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    marginBottom: '0.5rem',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                }}
                            >
                                Select All Available ({employees.length})
                            </button>
                        )}
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search employees..."
                                style={{
                                    width: '100%',
                                    padding: '0.4rem 0.4rem 0.4rem 2rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.85rem'
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {filtered.length > 0 ? (
                        filtered.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => { onSelect(emp.name); setIsOpen(false); setSearch(''); }}
                                className="dropdown-item"
                                style={{
                                    padding: '0.6rem 1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderBottom: '1px solid var(--border-color-light)',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{emp.role || 'No Role'}</span>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            No employees found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

import { createPortal } from 'react-dom';

const AssigneeListPopover = ({ assigneeString, employees }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, isRTL: false });
    const buttonRef = useRef(null);
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        // Update position on scroll or resize
        const updatePosition = () => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const isRTL = document.documentElement.dir === 'rtl';
                setPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: isRTL ? rect.right + window.scrollX : rect.left + window.scrollX,
                    isRTL
                });
            }
        };

        if (isOpen) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    if (!assigneeString) return <span style={{ color: 'var(--text-secondary)' }}>-</span>;

    const names = assigneeString.split(', ').filter(n => n);
    if (names.length === 0) return <span style={{ color: 'var(--text-secondary)' }}>-</span>;

    // Map names to employee objects to get roles
    const details = names.map(name => {
        const emp = employees.find(e => e.name === name);
        return { name, role: emp?.role || 'Unknown Role' };
    });

    const togglePopover = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={togglePopover}
                className="btn-text"
                style={{
                    color: 'var(--primary-color)',
                    fontWeight: 500,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: 'inherit',
                    textAlign: 'left'
                }}
            >
                {names.length === 1 ? names[0] : `${t('view')} ${names.length} ${t('assignees')}`}
            </button>

            {isOpen && createPortal(
                <div
                    ref={popoverRef}
                    className="popover-card custom-scrollbar"
                    style={{
                        position: 'absolute',
                        top: position.top,
                        left: position.left,
                        transform: position.isRTL ? 'translateX(-100%)' : 'none',
                        zIndex: 9999, // High z-index to sit on top of everything
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '250px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        padding: '0.75rem 0.75rem 0.5rem',
                        borderBottom: '1px solid var(--border-color-light)',
                        position: 'sticky',
                        top: 0,
                        background: 'white',
                        zIndex: 1
                    }}>
                        Assigned Team ({details.length})
                    </div>
                    <div style={{ padding: '0.5rem 0.75rem' }}>
                        {details.map((person, idx) => (
                            <div key={idx} style={{ marginBottom: idx === details.length - 1 ? 0 : '0.75rem' }}>
                                <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{person.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{person.role}</div>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

const Projects = () => {
    const { t } = useLanguage();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [editingTask, setEditingTask] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [materialsModal, setMaterialsModal] = useState({ show: false, project: null });
    const [assignmentsModal, setAssignmentsModal] = useState({ show: false, project: null });
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Planned',
        priority: 'Medium',
        assignee: '',
        start_date: '',
        end_date: '',
        department_id: 1 // Default to Genie Civil
    });

    const fetchProjects = async () => {
        try {
            const response = await axios.get('/api/projects');

            // Sort by status: In Progress -> Planned -> On Hold -> Completed
            const statusOrder = {
                'In Progress': 1,
                'Planned': 2,
                'On Hold': 3,
                'Completed': 4
            };

            const sortedProjects = response.data.data.sort((a, b) => {
                const orderA = statusOrder[a.status] || 99;
                const orderB = statusOrder[b.status] || 99;
                return orderA - orderB;
            });

            setProjects(sortedProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employees');
            // Filter for active employees (is_active is 1 or true)
            const activeEmployees = response.data.data.filter(emp => emp.is_active);
            setEmployees(activeEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchEmployees();
    }, []);

    // Calculate busy employees (those assigned to other 'In Progress' tasks)
    const busyEmployees = useMemo(() => {
        const busy = new Set();
        projects.forEach(p => {
            // Skip current task if editing
            if (editingTask && p.id === editingTask.id) return;

            if (p.status === 'In Progress' && p.assignee) {
                p.assignee.split(', ').forEach(name => {
                    if (name && name.trim()) busy.add(name.trim());
                });
            }
        });
        return busy;
    }, [projects, editingTask]);

    // Sync selectedAssignees with formData
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            assignee: selectedAssignees.join(', ')
        }));
    }, [selectedAssignees]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-clear assignees if status is not 'In Progress'
        if (name === 'status' && value !== 'In Progress') {
            setSelectedAssignees([]);
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await axios.put(`/api/projects/${editingTask.id}`, formData);
            } else {
                await axios.post('/api/projects', formData);
            }

            setFormData({
                name: '',
                description: '',
                status: 'Planned',
                priority: 'Medium',
                assignee: '',
                start_date: '',
                end_date: '',
                department_id: 1
            });
            setSelectedAssignees([]);
            setEditingTask(null);
            fetchProjects();
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setFormData({
            name: task.name,
            description: task.description || '',
            status: task.status,
            priority: task.priority || 'Medium',
            assignee: task.assignee || '',
            start_date: task.start_date || '',
            end_date: task.end_date || '',
            department_id: task.department_id
        });

        // Parse assignees string to array
        if (task.assignee) {
            setSelectedAssignees(task.assignee.split(', ').filter(s => s));
        } else {
            setSelectedAssignees([]);
        }

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingTask(null);
        setSelectedAssignees([]);
        setFormData({
            name: '',
            description: '',
            status: 'Planned',
            priority: 'Medium',
            assignee: '',
            start_date: '',
            end_date: '',
            department_id: 1
        });
    };

    const handleDelete = (task) => {
        setTaskToDelete(task);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!taskToDelete) return;
        try {
            await axios.delete(`/api/projects/${taskToDelete.id}`);
            fetchProjects();
            setShowDeleteModal(false);
            setTaskToDelete(null);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setTaskToDelete(null);
    };

    const addAssignee = (name) => {
        if (name && !selectedAssignees.includes(name)) {
            setSelectedAssignees([...selectedAssignees, name]);
        }
    };

    const addAllAssignees = (availableEmployees) => {
        const newAssignees = availableEmployees.map(e => e.name);
        // Combine existing and new, removing duplicates (though availableEmployees should already be filtered)
        const combined = [...new Set([...selectedAssignees, ...newAssignees])];
        setSelectedAssignees(combined);
    };

    const removeAssignee = (name) => {
        setSelectedAssignees(selectedAssignees.filter(a => a !== name));
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'In Progress': return 'badge-progress';
            case 'Completed': return 'badge-completed';
            case 'On Hold': return 'badge-hold';
            default: return 'badge-planned';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'var(--danger-color)';
            case 'Medium': return 'var(--warning-color)';
            case 'Low': return 'var(--success-color)';
            default: return 'var(--text-secondary)';
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('taskManager')}</h1>
            </div>

            <div className="content-grid">
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>
                            {editingTask ? t('editTask') : t('createNewTask')}
                        </h3>
                        {editingTask && (
                            <button
                                onClick={handleCancelEdit}
                                className="btn-icon"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('taskName')}</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t('insertTask')}
                                className="form-input"
                                required
                            />
                        </div>
                        {formData.status === 'In Progress' && (
                            <div className="form-group">
                                <label className="form-label">{t('assignees')}</label>
                                <div className="assignee-selector">
                                    <div className="selected-tags">
                                        {selectedAssignees.map(name => (
                                            <span key={name} className="assignee-tag">
                                                {name}
                                                <button type="button" onClick={() => removeAssignee(name)}>
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <ModernAssigneeDropdown
                                        employees={employees.filter(emp =>
                                            !selectedAssignees.includes(emp.name) &&
                                            !busyEmployees.has(emp.name)
                                        )}
                                        onSelect={addAssignee}
                                        onSelectAll={addAllAssignees}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">{t('description')}</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder={t('briefTaskDetails')}
                                rows="3"
                            />
                        </div>

                        <div className="form-group-row">
                            {/* Removed duplicate Assignee input */}
                            <div className="form-group">
                                <label className="form-label">{t('priority')}</label>
                                <ModernSelect
                                    options={[
                                        { value: 'High', label: 'High' },
                                        { value: 'Medium', label: 'Medium' },
                                        { value: 'Low', label: 'Low' }
                                    ]}
                                    value={formData.priority}
                                    onChange={(val) => setFormData({ ...formData, priority: val })}
                                    renderOption={(opt) => (
                                        <span style={{
                                            color: opt.value === 'High' ? 'var(--danger-color)' :
                                                opt.value === 'Medium' ? 'var(--warning-color)' : 'var(--success-color)',
                                            fontWeight: 500
                                        }}>
                                            {t(opt.value.toLowerCase())}
                                        </span>
                                    )}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('status')}</label>
                                <ModernSelect
                                    options={[
                                        { value: 'Planned', label: 'Planned' },
                                        { value: 'In Progress', label: 'In Progress' },
                                        { value: 'Completed', label: 'Completed' },
                                        { value: 'On Hold', label: 'On Hold' }
                                    ]}
                                    value={formData.status}
                                    onChange={(val) => setFormData({ ...formData, status: val })}
                                    renderOption={(opt) => (
                                        <span className={`badge ${getStatusBadgeClass(opt.value)}`}>
                                            {opt.value === 'In Progress' ? t('inProgress') :
                                                opt.value === 'On Hold' ? t('onHold') :
                                                    t(opt.value.toLowerCase())}
                                        </span>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="form-group-row">
                            <div className="form-group">
                                <label className="form-label">{t('startDate')}</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('endDate')}</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        </div>
                        {/* Department is automatically set to Genie Civil */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                <span>{editingTask ? t('updateTask') : `+ ${t('createNewTask')}`}</span>
                            </button>
                            {editingTask && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="btn"
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                >
                                    {t('cancel')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="card">
                    <h3 className="card-title">{t('taskList')}</h3>
                    {/* Desktop Table View */}
                    <div className="table-view">
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('taskName')}</th>
                                        <th>{t('assignees')}</th>
                                        <th>{t('priority')}</th>
                                        <th>{t('status')}</th>
                                        <th>{t('time')}</th>
                                        <th>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((proj) => (
                                        <tr key={proj.id} className={editingTask?.id === proj.id ? 'editing-row' : ''}>
                                            <td style={{ fontWeight: 500 }}>{proj.name}</td>
                                            <td>
                                                <AssigneeListPopover
                                                    assigneeString={proj.assignee}
                                                    employees={employees}
                                                />
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: getPriorityColor(proj.priority),
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {t(proj.priority ? proj.priority.toLowerCase() : 'medium')}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(proj.status)}`}>
                                                    {proj.status === 'In Progress' ? t('inProgress') :
                                                        proj.status === 'On Hold' ? t('onHold') :
                                                            t(proj.status.toLowerCase())}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {proj.start_date && proj.end_date ? (
                                                        <>{proj.start_date} <ArrowRight size={14} /> {proj.end_date}</>
                                                    ) : (
                                                        <span>{proj.start_date || proj.end_date || '-'}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => setMaterialsModal({ show: true, project: proj })}
                                                        className="btn-icon-small"
                                                        title={t('materials') || 'Materials'}
                                                        style={{ color: 'var(--accent-color)' }}
                                                    >
                                                        <Package size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setAssignmentsModal({ show: true, project: proj })}
                                                        className="btn-icon-small"
                                                        title={t('team') || 'Team'}
                                                        style={{ color: 'var(--success-color)' }}
                                                    >
                                                        <UserPlus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(proj)}
                                                        className="btn-icon-small"
                                                        title="Edit Task"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(proj)}
                                                        className="btn-icon-small danger"
                                                        title="Delete Task"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {projects.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                {t('noTasksFound')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-view">
                        {projects.map((proj) => (
                            <div key={proj.id} className="mobile-card">
                                <div className="mobile-card-header">
                                    <span style={{
                                        color: getPriorityColor(proj.priority),
                                        fontWeight: 600,
                                        fontSize: '0.8rem'
                                    }}>
                                        {proj.priority || 'Medium'}
                                    </span>
                                    <span className={`badge ${getStatusBadgeClass(proj.status)}`}>
                                        {proj.status}
                                    </span>
                                </div>
                                <div className="mobile-card-body">
                                    <h4>{proj.name}</h4>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={14} />
                                        <AssigneeListPopover
                                            assigneeString={proj.assignee}
                                            employees={employees}
                                        />
                                    </div>
                                    <div className="timeline">
                                        <span>{proj.start_date}</span>
                                        <span className="arrow"><ArrowRight size={14} /></span>
                                        <span>{proj.end_date}</span>
                                    </div>
                                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => setMaterialsModal({ show: true, project: proj })}
                                            className="btn-icon-small"
                                            style={{ padding: '0.5rem', color: 'var(--accent-color)' }}
                                        >
                                            <Package size={16} /> {t('materials') || 'Materials'}
                                        </button>
                                        <button
                                            onClick={() => setAssignmentsModal({ show: true, project: proj })}
                                            className="btn-icon-small"
                                            style={{ padding: '0.5rem', color: 'var(--success-color)' }}
                                        >
                                            <UserPlus size={16} /> {t('team') || 'Team'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(proj)}
                                            className="btn-icon-small"
                                            style={{ padding: '0.5rem' }}
                                        >
                                            <Pencil size={16} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(proj)}
                                            className="btn-icon-small danger"
                                            style={{ padding: '0.5rem' }}
                                        >
                                            <Trash size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <p className="no-data">{t('noTasksFound')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">{t('deleteTask')}</h3>
                        <p className="modal-text">
                            {t('deleteTaskConfirm')} <strong>{taskToDelete?.name}</strong>?
                            {t('deleteTaskWarning')}
                        </p>
                        <div className="modal-actions">
                            <button onClick={cancelDelete} className="btn btn-secondary">
                                {t('cancel')}
                            </button>
                            <button onClick={confirmDelete} className="btn btn-danger">
                                {t('deleteTask')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Project Materials Modal */}
            <ProjectMaterialsModal
                isOpen={materialsModal.show}
                onClose={() => setMaterialsModal({ show: false, project: null })}
                project={materialsModal.project}
                isRTL={document.documentElement.dir === 'rtl'}
                t={t}
            />

            {/* Project Assignments Modal */}
            <ProjectAssignmentsModal
                isOpen={assignmentsModal.show}
                onClose={() => setAssignmentsModal({ show: false, project: null })}
                project={assignmentsModal.project}
                isRTL={document.documentElement.dir === 'rtl'}
                t={t}
            />

            <style>{`
        .content-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--primary-color);
        }

        .form-group-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        .mobile-view {
            display: none;
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
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

            .mobile-card-body h4 {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 0.5rem;
            }

            .timeline {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
                color: var(--text-secondary);
                background: rgba(0,0,0,0.03);
                padding: 0.5rem;
                border-radius: 4px;
            }

            .timeline .arrow {
                color: var(--primary-color);
                font-weight: bold;
            }

            .card {
                padding: 1rem;
            }

            .form-group-row {
                grid-template-columns: 1fr;
            }
            
            .page-header {
                margin-bottom: 1.5rem;
            }

            .page-title {
                font-size: 1.5rem;
            }

            .btn-icon-small {
                background: none;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 4px;
                cursor: pointer;
                color: var(--text-secondary);
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .btn-icon-small:hover {
                background: var(--bg-secondary);
                color: var(--primary-color);
                border-color: var(--primary-color);
            }

            .btn-icon-small.danger:hover {
                color: var(--danger-color);
                border-color: var(--danger-color);
            }

            .editing-row {
                background-color: rgba(2, 132, 199, 0.05);
            }
        }
      `}</style>
        </div>
    );
};

export default Projects;
