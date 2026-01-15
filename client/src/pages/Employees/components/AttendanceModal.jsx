import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../../context/LanguageContext';
import LoadingScreen from '../../../components/LoadingScreen';
import ModernDropdown from '../../../components/shared/ModernDropdown';

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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
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
                                <label className="form-label">{t('status')}</label>
                                <ModernDropdown
                                    value={dayDetails.status}
                                    onChange={(val) => setDayDetails({ ...dayDetails, status: val })}
                                    options={[
                                        { value: 'present', label: t('present') },
                                        { value: 'absent', label: t('absent') },
                                        { value: 'late', label: t('late') },
                                        { value: 'vacation', label: t('vacation') },
                                        { value: 'sick', label: t('sick') }
                                    ]}
                                />
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

export default AttendanceModal;
