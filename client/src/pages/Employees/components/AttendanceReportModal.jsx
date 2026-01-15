import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { generateAttendancePDF, generateGlobalAttendancePDF } from '../utils/pdfGenerator';

const AttendanceReportModal = ({ employee, employees, onClose, isGlobal }) => {
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
                await generateGlobalAttendancePDF(employees, startDate, endDate, title, (current, total) => {
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
        <div className="modal-overlay" onClick={!loading ? onClose : undefined}>
            <div className="modal-card" style={{ maxWidth: '400px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>

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
                    {!loading && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>}
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

export default AttendanceReportModal;
