import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { GripVertical, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight, Calendar, ChevronDown, Search, Eye, EyeOff } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LoadingScreen from '../components/LoadingScreen';

const SortableEmployeeRow = ({ emp, index, onEdit, onDelete, onToggleStatus, onOpenAttendance }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(emp.id) });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
    };

    return (
        <tr ref={setNodeRef} style={style}>
            <td style={{ width: '50px' }}>
                <button className="btn-drag-handle" {...attributes} {...listeners}>
                    <GripVertical size={16} />
                </button>
            </td>
            <td>#{index + 1}</td>
            <td style={{ fontWeight: 500, color: emp.is_active === 0 ? 'red' : 'inherit' }}>
                {emp.name}
                {emp.is_active === 0 && <span style={{ fontSize: '0.8em', marginLeft: '0.5rem', color: 'red' }}>(Inactive)</span>}
            </td>
            <td>{emp.role}</td>
            <td>{emp.contact_info}</td>
            <td>
                <div className="action-buttons">
                    <button
                        className="btn-icon-action toggle"
                        onClick={() => onToggleStatus(emp)}
                        title={emp.is_active === 0 ? "Activate" : "Deactivate"}
                        style={{ color: emp.is_active === 0 ? 'var(--text-secondary)' : 'var(--success-color)' }}
                    >
                        {emp.is_active === 0 ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
                    </button>
                    <button className="btn-icon-action" onClick={() => onOpenAttendance(emp)} title="Attendance">
                        <Calendar size={16} />
                    </button>
                    <button className="btn-icon-action edit" onClick={() => onEdit(emp)} title="Edit">
                        <Pencil size={16} />
                    </button>
                    <button className="btn-icon-action delete" onClick={() => onDelete(emp)} title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const AttendanceModal = ({ employee, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);

    // Calculate cycle based on currentDate (22nd to 21st)
    const getCycleRange = (date) => {
        const day = date.getDate();
        let startMonth = date.getMonth();
        let startYear = date.getFullYear();

        if (day <= 21) {
            startMonth -= 1;
        }

        const startDate = new Date(startYear, startMonth, 22);
        // End date is 21st of the *next* month relative to startMonth
        const endDate = new Date(startYear, startMonth + 1, 21);
        return { startDate, endDate };
    };

    const { startDate, endDate } = getCycleRange(currentDate);

    useEffect(() => {
        fetchAttendance();
    }, [startDate.toISOString()]); // Depend on cycle start

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            const res = await axios.get(`/api/attendance/${employee.id}?startDate=${startStr}&endDate=${endStr}`);

            const data = {};
            res.data.data.forEach(record => {
                data[record.date] = record;
            });
            setAttendanceData(data);
        } catch (error) {
            console.error("Error fetching attendance", error);
        } finally {
            setLoading(false);
        }
    };

    const [selectedDay, setSelectedDay] = useState(null);
    const [dayDetails, setDayDetails] = useState({ status: '', start_time: '', end_time: '', notes: '' });

    const handleDayClick = (dateStr) => {
        const record = attendanceData[dateStr] || {};
        setDayDetails({
            status: record.status || '',
            start_time: record.start_time || '',
            end_time: record.end_time || '',
            notes: record.notes || ''
        });
        setSelectedDay(dateStr);
    };

    const handleSaveDayDetails = async () => {
        if (!selectedDay) return;

        // Optimistic update
        const updatedRecord = { ...dayDetails, date: selectedDay };
        setAttendanceData(prev => ({ ...prev, [selectedDay]: updatedRecord }));

        try {
            await axios.post('/api/attendance', {
                employee_id: employee.id,
                date: selectedDay,
                ...dayDetails
            });
            setSelectedDay(null);
        } catch (error) {
            console.error("Error updating attendance", error);
            // Revert would require keeping previous state, skipping for simplicity in this step
        }
    };

    const getDaysArray = () => {
        const days = [];
        let d = new Date(startDate);
        while (d <= endDate) {
            days.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return days;
    };

    const days = getDaysArray();

    const handlePrevMonth = () => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() - 1); // Go to 21st of prev cycle
        setCurrentDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(endDate);
        newDate.setDate(newDate.getDate() + 1); // Go to 22nd of next cycle
        setCurrentDate(newDate);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'var(--success-color)'; // Green
            case 'absent': return 'var(--danger-color)'; // Red
            case 'late': return '#f59e0b'; // Amber
            case 'vacation': return '#3b82f6'; // Blue
            case 'sick': return '#8b5cf6'; // Purple
            default: return 'var(--bg-secondary)'; // Grey
        }
    };

    const getStatusLabel = (status) => {
        if (!status) return '';
        return status.charAt(0).toUpperCase();
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '800px' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Attendance: {employee.name}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div className="calendar-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <button className="btn btn-secondary" onClick={handlePrevMonth}>&lt; Prev Month</button>
                    <span style={{ fontWeight: 600 }}>
                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button className="btn btn-secondary" onClick={handleNextMonth}>Next Month &gt;</button>
                </div>

                <div className="calendar-grid">
                    {days.map(day => {
                        const dateStr = day.toISOString().split('T')[0];
                        const record = attendanceData[dateStr] || {};
                        const status = record.status;
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });

                        return (
                            <div
                                key={dateStr}
                                className="calendar-day"
                                onClick={() => handleDayClick(dateStr)}
                                style={{
                                    backgroundColor: status ? getStatusColor(status) : (isWeekend ? 'var(--bg-secondary)' : 'white'),
                                    color: status ? 'white' : 'inherit',
                                    border: status ? 'none' : (isWeekend ? '1px solid var(--border-color-dark)' : '1px solid var(--border-color)'),
                                    opacity: isWeekend && !status ? 0.8 : 1
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span className="day-number">{day.getDate()}</span>
                                    <span style={{ fontSize: '0.7em', fontWeight: 600, opacity: 0.7 }}>{dayName}</span>
                                </div>
                                {status && (record.start_time || record.end_time) && (
                                    <div className="day-hours" style={{ fontSize: '0.7em', marginTop: 'auto' }}>
                                        {record.start_time}-{record.end_time}
                                    </div>
                                )}
                                <div className="day-status">{getStatusLabel(status)}</div>
                            </div>
                        );
                    })}
                </div>

                {selectedDay && (
                    <div className="day-details-overlay" onClick={() => setSelectedDay(null)}>
                        <div className="day-details-card" onClick={e => e.stopPropagation()}>
                            <h4>Edit Details: {selectedDay}</h4>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={dayDetails.status}
                                    onChange={e => setDayDetails({ ...dayDetails, status: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                >
                                    <option value="">Select Status...</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                    <option value="vacation">Vacation</option>
                                    <option value="sick">Sick</option>
                                </select>
                            </div>
                            {(dayDetails.status === 'present' || dayDetails.status === 'late') && (
                                <div className="time-inputs" style={{ display: 'flex', gap: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Start Time</label>
                                        <input
                                            type="time"
                                            value={dayDetails.start_time}
                                            onChange={e => setDayDetails({ ...dayDetails, start_time: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>End Time</label>
                                        <input
                                            type="time"
                                            value={dayDetails.end_time}
                                            onChange={e => setDayDetails({ ...dayDetails, end_time: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem' }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={dayDetails.notes}
                                    onChange={e => setDayDetails({ ...dayDetails, notes: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', minHeight: '60px' }}
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setSelectedDay(null)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSaveDayDetails}>Save</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="legend" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: 'var(--success-color)' }}></div> Present</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: 'var(--danger-color)' }}></div> Absent</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: '#f59e0b' }}></div> Late</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: '#3b82f6' }}></div> Vacation</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: '#8b5cf6' }}></div> Sick</div>
                </div>

                <style>{`
                    .calendar-grid {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 0.5rem;
                    }
                    .calendar-day {
                        aspect-ratio: 1;
                        border-radius: var(--radius-md);
                        padding: 0.5rem;
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        transition: transform 0.1s;
                    }
                    .calendar-day:hover {
                        transform: scale(1.05);
                    }
                    .day-number {
                        font-weight: 600;
                        font-size: 0.9rem;
                    }
                    .day-status {
                        font-size: 0.8rem;
                        text-align: center;
                        font-weight: bold;
                    }
                    .day-details-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                        border-radius: var(--radius-lg);
                    }
                    .day-details-card {
                        background: white;
                        padding: 1.5rem;
                        border-radius: var(--radius-md);
                        width: 300px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        color: var(--text-primary);
                    }
                    .day-details-card h4 {
                        margin-bottom: 1rem;
                        color: var(--primary-color);
                    }
                `}</style>
            </div>
        </div>
    );
};

const ModernDropdown = ({ options, value, onChange, placeholder = "Select..." }) => {
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

    return (
        <div className="modern-dropdown" ref={dropdownRef} style={{ position: 'relative', minWidth: '200px' }}>
            <button
                className="dropdown-trigger"
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
                    boxShadow: isOpen ? '0 0 0 2px var(--primary-color-light)' : 'none',
                    borderColor: isOpen ? 'var(--primary-color)' : 'var(--border-color)'
                }}
            >
                <span style={{ fontWeight: 500 }}>{value === 'All' ? 'All Roles' : value}</span>
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
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
                    overflowY: 'auto',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div
                        className="dropdown-item"
                        onClick={() => { onChange('All'); setIsOpen(false); }}
                        style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: value === 'All' ? 'var(--primary-color)' : 'var(--text-primary)',
                            background: value === 'All' ? 'var(--bg-secondary)' : 'transparent',
                            fontSize: '0.9rem'
                        }}
                    >
                        <span>All Roles</span>
                        {value === 'All' && <Check size={16} />}
                    </div>
                    {options.map(option => (
                        <div
                            key={option}
                            className="dropdown-item"
                            onClick={() => { onChange(option); setIsOpen(false); }}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: value === option ? 'var(--primary-color)' : 'var(--text-primary)',
                                background: value === option ? 'var(--bg-secondary)' : 'transparent',
                                fontSize: '0.9rem',
                                borderTop: '1px solid var(--border-color-light)'
                            }}
                        >
                            <span>{option}</span>
                            {value === option && <Check size={16} />}
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                .dropdown-item:hover {
                    background-color: var(--bg-secondary) !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const Employees = () => {
    const [employees, setEmployees] = useState([]);

    // Calculate Role Counts
    const roleCounts = useMemo(() => {
        if (!Array.isArray(employees)) return {};
        return employees.reduce((acc, emp) => {
            if (!emp || emp.is_active === 0) return acc;
            const role = emp.role || 'Unassigned';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});
    }, [employees]);

    // Filtering Logic
    const [selectedRole, setSelectedRole] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(true);

    const uniqueRoles = useMemo(() => {
        if (!Array.isArray(employees)) return [];
        const roles = new Set(employees.map(e => e.role).filter(r => r && r.trim() !== ''));
        return Array.from(roles).sort();
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        let result = employees;
        if (selectedRole !== 'All') {
            result = result.filter(e => e.role === selectedRole);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(e => e.name.toLowerCase().includes(query));
        }
        if (!showInactive) {
            result = result.filter(e => e.is_active !== 0);
        }
        // Sort by Role then Name
        return [...result].sort((a, b) => {
            const roleCompare = (a.role || '').localeCompare(b.role || '');
            if (roleCompare !== 0) return roleCompare;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [employees, selectedRole, searchQuery, showInactive]);

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department_id: 1, // Default to Genie Civil
        contact_info: ''
    });

    // Edit State
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', role: '', contact_info: '' });
    const [showEditModal, setShowEditModal] = useState(false);

    // Delete State
    const [deletingEmployee, setDeletingEmployee] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Attendance State
    const [attendanceEmployee, setAttendanceEmployee] = useState(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employees');
            setEmployees((response.data.data || []).filter(e => e && e.id));
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
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

    const handleToggleStatus = async (emp) => {
        try {
            const newStatus = emp.is_active === 0 ? 1 : 0;
            await axios.put(`/api/employees/${emp.id}`, { is_active: newStatus });
            fetchEmployees();
        } catch (error) {
            console.error('Error updating employee status:', error);
        }
    };

    const handleDeleteClick = (emp) => {
        setDeletingEmployee(emp);
        setShowDeleteModal(true);
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

    const handleOpenAttendance = (emp) => {
        setAttendanceEmployee(emp);
        setShowAttendanceModal(true);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setEmployees((items) => {
                const oldIndex = items.findIndex((item) => String(item.id) === active.id);
                const newIndex = items.findIndex((item) => String(item.id) === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update backend
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

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Employees</h1>
            </div>

            <div className="content-grid">
                <div className="left-column">
                    <div className="card">
                        <h3 className="card-title">Register New Employee</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. John Doe"
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role / Position</label>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    placeholder="e.g. Senior Engineer"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Information</label>
                                <input
                                    type="text"
                                    name="contact_info"
                                    value={formData.contact_info}
                                    onChange={handleChange}
                                    placeholder="e.g. email@example.com"
                                    className="form-input"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                <span>+ Register Employee</span>
                            </button>
                        </form>
                    </div>

                    {/* Role Summary Card */}
                    <div className="card">
                        <h3 className="card-title">Role Summary</h3>
                        <div className="role-stats">
                            {Object.entries(roleCounts).length > 0 ? (
                                Object.entries(roleCounts).map(([role, count]) => (
                                    <div key={role} className="role-stat-item">
                                        <span className="stat-role">{role}</span>
                                        <span className="stat-count">{count}</span>
                                    </div>
                                ))
                            ) : (
                                <p>No roles registered.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>Staff Directory</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                            <div className="search-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input"
                                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                                />
                            </div>
                            <button
                                onClick={() => setShowInactive(!showInactive)}
                                className="btn-icon"
                                style={{
                                    background: showInactive ? 'var(--primary-light)' : 'var(--bg-secondary)',
                                    color: showInactive ? 'white' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.6rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '38px',
                                    width: '38px',
                                    transition: 'all 0.2s'
                                }}
                                title={showInactive ? "Hide Inactive" : "Show Inactive"}
                            >
                                {showInactive ? <Eye size={20} /> : <EyeOff size={20} />}
                            </button>
                            <div style={{ width: '200px' }}>
                                <ModernDropdown
                                    options={uniqueRoles}
                                    value={selectedRole}
                                    onChange={setSelectedRole}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="table-view">
                        <div className="table-container">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50px' }}></th>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Contact</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <SortableContext
                                        items={(filteredEmployees || []).map(e => String(e.id))}
                                        strategy={verticalListSortingStrategy}
                                    >
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

                    {/* Mobile Card View */}
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
                        {filteredEmployees.length === 0 && (
                            <p className="no-data">No employees found.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {
                showEditModal && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h3>Edit Employee</h3>
                            <form onSubmit={handleUpdateEmployee}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <input
                                        type="text"
                                        name="role"
                                        value={editFormData.role}
                                        onChange={handleEditChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Info</label>
                                    <input
                                        type="text"
                                        name="contact_info"
                                        value={editFormData.contact_info}
                                        onChange={handleEditChange}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Modal */}
            {
                showDeleteModal && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h3>Confirm Deletion</h3>
                            <p>Are you sure you want to remove <strong>{deletingEmployee?.name}</strong>?</p>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleConfirmDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Attendance Modal */}
            {
                showAttendanceModal && attendanceEmployee && (
                    <AttendanceModal
                        employee={attendanceEmployee}
                        onClose={() => {
                            setShowAttendanceModal(false);
                            setAttendanceEmployee(null);
                        }}
                    />
                )
            }

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

        .btn-drag-handle {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: grab;
            opacity: 0.4;
            padding: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-drag-handle:hover {
            opacity: 1;
            color: var(--primary-color);
        }

        .btn-drag-handle:active {
            cursor: grabbing;
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
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
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

        .stat-role {
            color: var(--text-primary);
            font-weight: 500;
            text-transform: capitalize;
        }

        .stat-count {
            background: var(--bg-secondary);
            color: var(--primary-color);
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.875rem;
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
        }
      `}</style>
        </div >
    );
};

export default Employees;
