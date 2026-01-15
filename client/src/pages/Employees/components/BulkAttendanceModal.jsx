import { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../../../context/LanguageContext';
import ModernDropdown from '../../../components/shared/ModernDropdown';

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
        <div className="modal-overlay" onClick={!loading ? onClose : undefined}>
            <div className="modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>{t('bulkAttendance')}</h3>
                    {!loading && (
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    )}
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
                        <ModernDropdown
                            value={status}
                            onChange={setStatus}
                            options={[
                                { value: 'present', label: t('present') },
                                { value: 'absent', label: t('absent') },
                                { value: 'late', label: t('late') },
                                { value: 'vacation', label: t('vacation') },
                                { value: 'sick', label: t('sick') }
                            ]}
                        />
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

export default BulkAttendanceModal;
