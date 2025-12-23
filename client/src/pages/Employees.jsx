
import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { GripVertical, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight, Calendar, ChevronDown, Search, Eye, EyeOff, FileText, Download } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LoadingScreen from '../components/LoadingScreen';

import { useLanguage } from '../context/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const SortableEmployeeRow = ({ emp, index, onEdit, onDelete, onToggleStatus, onOpenAttendance, onDownloadReport }) => {
    const { t } = useLanguage();
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
                {emp.is_active === 0 && <span style={{ fontSize: '0.8em', marginLeft: '0.5rem', color: 'red' }}>({t('inactive')})</span>}
            </td>
            <td>{emp.role}</td>
            <td>{emp.contact_info}</td>
            <td>
                <div className="action-buttons">
                    <button
                        className="btn-icon-action toggle"
                        onClick={() => onToggleStatus(emp)}
                        title={emp.is_active === 0 ? t('active') : t('inactive')}
                        style={{ color: emp.is_active === 0 ? 'var(--text-secondary)' : 'var(--success-color)' }}
                    >
                        {emp.is_active === 0 ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
                    </button>
                    <button className="btn-icon-action" onClick={() => onOpenAttendance(emp)} title={t('attendance')}>
                        <Calendar size={16} />
                    </button>
                    <button
                        className="btn-icon-action"
                        onClick={() => onDownloadReport(emp)}
                        title={t('downloadReport') || "Download Report"}
                        style={{ color: '#007bff' }}
                    >
                        <Download size={16} />
                    </button>
                    <button className="btn-icon-action edit" onClick={() => onEdit(emp)} title={t('editEmployee')}>
                        <Pencil size={16} />
                    </button>
                    <button className="btn-icon-action delete" onClick={() => onDelete(emp)} title={t('deleteEmployee')}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const AttendanceModal = ({ employee, onClose }) => {
    const { t } = useLanguage();
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
                    <h3>{t('attendance')}: {employee.name}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div className="calendar-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <button className="btn btn-secondary" onClick={handlePrevMonth}>&lt; {t('prevMonth')}</button>
                    <span style={{ fontWeight: 600 }}>
                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <button className="btn btn-secondary" onClick={handleNextMonth}>{t('nextMonth')} &gt;</button>
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
                            <h4>{t('editDetails')}: {selectedDay}</h4>
                            <div className="form-group">
                                <label>{t('status')}</label>
                                <select
                                    value={dayDetails.status}
                                    onChange={e => setDayDetails({ ...dayDetails, status: e.target.value })}
                                    className="form-input"
                                >
                                    <option value="">{t('selectStatus')}</option>
                                    <option value="present">{t('present')}</option>
                                    <option value="absent">{t('absent')}</option>
                                    <option value="late">{t('late')}</option>
                                    <option value="vacation">{t('vacation')}</option>
                                    <option value="sick">{t('sick')}</option>
                                </select>
                            </div>
                            {(dayDetails.status === 'present' || dayDetails.status === 'late') && (
                                <div className="time-inputs" style={{ display: 'flex', gap: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t('startTime')}</label>
                                        <input
                                            type="time"
                                            value={dayDetails.start_time}
                                            onChange={e => setDayDetails({ ...dayDetails, start_time: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t('endTime')}</label>
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
                                <label>{t('notes')}</label>
                                <textarea
                                    value={dayDetails.notes}
                                    onChange={e => setDayDetails({ ...dayDetails, notes: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setSelectedDay(null)}>{t('cancel')}</button>
                                <button className="btn btn-primary" onClick={handleSaveDayDetails}>{t('save')}</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="legend" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: 'var(--success-color)' }}></div> {t('present')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: 'var(--danger-color)' }}></div> {t('absent')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: '#f59e0b' }}></div> {t('late')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: '#3b82f6' }}></div> {t('vacation')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 12, height: 12, background: '#8b5cf6' }}></div> {t('sick')}</div>
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
    const { t } = useLanguage();
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
                <span style={{ fontWeight: 500 }}>{value === 'All' ? t('allRoles') : value}</span>
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
                        <span>{t('allRoles')}</span>
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

const BulkAttendanceModal = ({ employees, onClose, onSave }) => {
    const { t } = useLanguage();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('present');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const activeEmployees = employees.filter(emp => emp.is_active !== 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const employeeIds = activeEmployees.map(emp => emp.id);
            await axios.post('/api/attendance/bulk', {
                employeeIds,
                date,
                status,
                start_time: startTime,
                end_time: endTime,
                notes
            });
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving bulk attendance:', error);
            alert(error.response?.data?.error || 'Failed to save bulk attendance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '500px' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>{t('bulkAttendance')}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {t('applyingTo')} <strong>{activeEmployees.length}</strong> {t('activeEmployees')}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t('date')}</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('status')}</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="form-input"
                            required
                        >
                            <option value="present">{t('present')}</option>
                            <option value="absent">{t('absent')}</option>
                            <option value="late">{t('late')}</option>
                            <option value="vacation">{t('vacation')}</option>
                            <option value="sick">{t('sick')}</option>
                        </select>
                    </div>

                    {(status === 'present' || status === 'late') && (
                        <div className="time-inputs" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">{t('startTime')}</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">{t('endTime')}</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">{t('notes')}</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="form-input"
                            rows="3"
                            placeholder={t('optionalNotes')}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Employees = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
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

    // Bulk Attendance State
    const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState(false);

    // Generate PDF State
    const [reportEmployee, setReportEmployee] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showGlobalReportModal, setShowGlobalReportModal] = useState(false);

    const AttendanceReportModal = ({ employee, onClose, isGlobal }) => {
        const { t } = useLanguage();
        const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
        const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
        const [progress, setProgress] = useState({ current: 0, total: 0 });
        const [loading, setLoading] = useState(false);

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const handleGenerate = async () => {
            setLoading(true);
            setProgress({ current: 0, total: 0 });
            try {
                // Logic: 22nd of Previous Month to 21st of Selected Month
                let startMonth = selectedMonth - 1;
                let startYear = selectedYear;

                if (startMonth < 0) {
                    startMonth = 11;
                    startYear -= 1;
                }

                const startDate = new Date(startYear, startMonth, 22);
                const endDate = new Date(selectedYear, selectedMonth, 21);

                const monthName = months[selectedMonth];
                const title = `Monthly Attendance Report - ${monthName} ${selectedYear}`;

                if (isGlobal) {
                    await generateGlobalAttendancePDF(startDate, endDate, title, (current, total) => {
                        setProgress({ current, total });
                    });
                } else {
                    await generateAttendancePDF(employee, startDate, endDate, title);
                }
                onClose();
            } catch (error) {
                console.error("PDF Gen Error:", error);
                alert("Failed to generate report.");
            } finally {
                setLoading(false);
                setProgress({ current: 0, total: 0 });
            }
        };

        return (
            <div className="modal-overlay">
                <div className="modal-card" style={{ maxWidth: '400px', position: 'relative' }}>

                    {loading && (
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(255, 255, 255, 0.95)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 10,
                            borderRadius: '12px'
                        }}>
                            <div className="spinner" style={{
                                width: '40px', height: '40px',
                                border: '4px solid #f3f3f3',
                                borderTop: '4px solid var(--primary-color)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                marginBottom: '1rem'
                            }}></div>
                            <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{t('loading')}</h4>
                            {isGlobal && progress.total > 0 && (
                                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {progress.current} / {progress.total}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>{t('attendance')}</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('month')}</label>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="form-input">
                            {months.map((m, i) => <option key={i} value={i}>{t(m.toLowerCase()) !== m.toLowerCase() ? t(m.toLowerCase()) : m}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('year')}</label>
                        <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="form-input" />
                    </div>

                    <div className="modal-actions">
                        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('cancel')}</button>
                        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                            {t('generatePDF')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleDownloadReportClick = (emp) => {
        setReportEmployee(emp);
        setShowReportModal(true);
    };

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
        } finally {
            setLoading(false);
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

    const renderEmployeeReport = async (doc, employee, startDate, endDate, title, logoImg) => {
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Fetch data
        const response = await axios.get(`/api/attendance/${employee.id}?startDate=${startStr}&endDate=${endStr}`);
        const attendanceDataRaw = response.data.data || [];

        const attendanceMap = new Map();
        attendanceDataRaw.forEach(record => {
            const d = new Date(record.date).toISOString().split('T')[0];
            attendanceMap.set(d, record);
        });

        // Add Logo
        if (logoImg) {
            doc.addImage(logoImg, 'PNG', 14, 8, 20, 20 * (logoImg.height / logoImg.width));
        }

        // --- Header Section ---
        doc.setFontSize(18);
        doc.setTextColor(0, 51, 102);
        doc.setFont("helvetica", "bold");
        doc.text("Arab Contractors Cameroon", 105, 18, { align: "center" });

        // Report Title
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text(title || "Employee Attendance Report", 105, 26, { align: "center" });

        // Line Separator
        doc.setDrawColor(200);
        doc.line(14, 32, 196, 32);

        // --- Employee Details ---
        doc.setFontSize(10);
        doc.setTextColor(50);

        const startY = 38;
        doc.text(`Name:`, 14, startY);
        doc.setFont("helvetica", "bold");
        doc.text(`${employee.name}`, 30, startY);
        doc.setFont("helvetica", "normal");

        doc.text(`Role:`, 14, startY + 5);
        doc.setFont("helvetica", "bold");
        doc.text(`${employee.role || 'N/A'}`, 30, startY + 5);
        doc.setFont("helvetica", "normal");

        // Status
        if (employee.is_active === 0) {
            doc.setTextColor(231, 76, 60);
            doc.setFont("helvetica", "bold");
            doc.text("STATUS: INACTIVE", 196, startY, { align: "right" });
        } else {
            doc.setTextColor(39, 174, 96);
            doc.setFont("helvetica", "bold");
            doc.text("STATUS: ACTIVE", 196, startY, { align: "right" });
        }

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.setFontSize(9);
        const rangeText = `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        doc.text(rangeText, 196, startY + 5, { align: "right" });

        // --- Attendance Table ---
        const tableColumn = ["DATE", "STATUS", "TIME IN", "TIME OUT", "NOTES"];
        const tableRows = [];

        let loopDate = new Date(startDate);
        const stopDate = new Date(endDate);

        while (loopDate <= stopDate) {
            const dayStr = loopDate.toISOString().split('T')[0];
            const record = attendanceMap.get(dayStr);

            const dateOptions = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
            let dateDisplay = loopDate.toLocaleDateString('fr-FR', dateOptions);
            dateDisplay = dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1);

            const status = record ? (record.status || 'Present').toUpperCase() : '';
            const timeIn = record ? (record.start_time || '-') : '';
            const timeOut = record ? (record.end_time || '-') : '';
            const notes = record ? (record.notes || '') : '';

            tableRows.push([dateDisplay, status, timeIn, timeOut, notes]);
            loopDate.setDate(loopDate.getDate() + 1);
        }

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY + 12,
            theme: 'grid',
            headStyles: {
                fillColor: [21, 67, 96],
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'center',
                cellPadding: 1.5,
                lineWidth: 0.1,
                lineColor: [200, 200, 200]
            },
            bodyStyles: {
                textColor: 40,
                fontSize: 8,
                halign: 'center',
                cellPadding: 1.5,
                lineWidth: 0.1,
                lineColor: [220, 220, 220]
            },
            columnStyles: {
                0: { halign: 'left' },
                4: { halign: 'left' }
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            margin: { top: 10, bottom: 10 },
            didParseCell: function (data) {
                if (data.section === 'body') {
                    const dateStr = data.row.raw[0].toLowerCase();
                    if (dateStr.startsWith('samedi') || dateStr.startsWith('dimanche')) {
                        data.cell.styles.fillColor = [252, 248, 227];
                    }
                    if (data.column.index === 1) {
                        const statusText = (data.cell.raw || '').toString().toUpperCase();
                        if (statusText === 'PRESENT') {
                            data.cell.styles.textColor = [39, 174, 96];
                            data.cell.styles.fontStyle = 'bold';
                        } else if (statusText === 'ABSENT' || statusText.includes('ABSENT')) {
                            data.cell.styles.textColor = [231, 76, 60];
                            data.cell.styles.fontStyle = 'bold';
                        } else if (statusText === 'LATE') {
                            data.cell.styles.textColor = [243, 156, 18];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                }
            }
        });

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
    };

    const generateAttendancePDF = async (employee, startDate, endDate, title) => {
        try {
            const doc = new jsPDF();

            let logoImg = null;
            try {
                logoImg = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = '/logo_circular.png';
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(e);
                });
            } catch (err) { console.warn("Logo load failed", err); }

            await renderEmployeeReport(doc, employee, startDate, endDate, title, logoImg);

            const sanitizedName = employee.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const sanitizedMonth = title ? title.replace(/[^a-z0-9]/gi, '_') : 'report';
            doc.save(`Attendance_${sanitizedName}_${sanitizedMonth}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate report. Please try again.");
        }
    };

    const generateGlobalAttendancePDF = async (startDate, endDate, title, onProgress) => {
        try {
            const doc = new jsPDF();

            let logoImg = null;
            try {
                logoImg = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = '/logo_circular.png';
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(e);
                });
            } catch (err) { console.warn("Logo load failed", err); }

            // Iterate all employees
            const total = employees.length;
            for (let i = 0; i < total; i++) {
                if (onProgress) onProgress(i + 1, total);

                const emp = employees[i];
                if (i > 0) doc.addPage();
                await renderEmployeeReport(doc, emp, startDate, endDate, title, logoImg);

                // Small delay to allow UI to update
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const sanitizedMonth = title ? title.replace(/[^a-z0-9]/gi, '_') : 'global_report';
            doc.save(`Global_Attendance_${sanitizedMonth}.pdf`);
        } catch (error) {
            console.error("Error generating Global PDF:", error);
            alert("Failed to generate global report.");
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

    if (loading) return <LoadingScreen />;

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">{t('employees')}</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-secondary btn-icon-mobile"
                        onClick={() => setShowGlobalReportModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                        }}
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
                    <div className="card">
                        <h3 className="card-title">{t('registerNewEmployee')}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('fullName')}</label>
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
                                <label className="form-label">{t('rolePosition')}</label>
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
                                <label className="form-label">{t('contactInfo')}</label>
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
                                <span>+ {t('registerEmployee')}</span>
                            </button>
                        </form>
                    </div>

                    {/* Role Summary Card */}
                    <div className="card">
                        <h3 className="card-title">{t('roleSummary')}</h3>
                        <div className="role-stats">
                            {Object.entries(roleCounts).length > 0 ? (
                                Object.entries(roleCounts).map(([role, count]) => (
                                    <div key={role} className="role-stat-item">
                                        <span className="role-name">{role}</span>
                                        <span className="role-count">{count}</span>
                                    </div>
                                ))
                            ) : (
                                <p>{t('noRolesRegistered')}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>{t('staffDirectory')}</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                            <div className="search-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder={t('searchEmployees')}
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
                                title={showInactive ? t('hideInactive') : t('showInactive')}
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
                                            <th>{t('name')}</th>
                                            <th>{t('role')}</th>
                                            <th>{t('contactInfo')}</th>
                                            <th>{t('actions')}</th>
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
                                        <button
                                            className="btn-icon-action"
                                            onClick={() => handleDownloadReportClick(emp)}
                                            style={{ color: '#007bff' }}
                                        >
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

            .btn-text, .btn-text-mobile-hide {
                display: none;
            }

            .btn-icon-mobile, .btn-primary {
                 padding: 0.6rem !important;
            }
        }
      `}</style>

            {showReportModal && reportEmployee && (
                <AttendanceReportModal
                    employee={reportEmployee}
                    onClose={() => {
                        setShowReportModal(false);
                        setReportEmployee(null);
                    }}
                />
            )}

            {/* Bulk Attendance Modal */}
            {showBulkAttendanceModal && (
                <BulkAttendanceModal
                    employees={employees}
                    onClose={() => setShowBulkAttendanceModal(false)}
                    onSave={() => {
                        // Optionally refresh data or show success message
                        setShowBulkAttendanceModal(false);
                    }}
                />
            )}

            {/* Global Report Modal */}
            {showGlobalReportModal && (
                <AttendanceReportModal
                    employee={null}
                    isGlobal={true}
                    onClose={() => setShowGlobalReportModal(false)}
                />
            )}
        </div >
    );
};

export default Employees;
