import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const DeactivateWarningModal = ({ employee, tasks, onClose, onConfirm, mode = 'deactivate' }) => {
    const { t } = useLanguage();

    const isDelete = mode === 'delete';
    const warningMessage = isDelete ? t('deleteWarningMessage') : t('deactivateWarningMessage');
    const confirmButtonText = isDelete ? t('removeFromTasksAndDelete') : t('removeFromTasksAndDeactivate');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
                <div className="modal-header" style={{ marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                        <div style={{ background: 'var(--danger-bg-light, #fee2e2)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={24} />
                        </div>
                        {t('warning') || 'Warning'}
                    </h3>
                </div>
                <div className="modal-body" style={{ marginBottom: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem', lineHeight: '1.6', fontSize: '1rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{employee?.name}</span> {t('isCurrentlyAssignedTo') || 'is currently assigned to'} <span style={{ fontWeight: '600' }}>{tasks.length} {t('activeTasks') || 'active task(s)'}</span>:
                    </p>
                    <div style={{
                        maxHeight: '180px',
                        overflowY: 'auto',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.25rem'
                    }} className="custom-scrollbar">
                        <ul style={{ paddingInlineStart: '1.25rem', margin: 0 }}>
                            {tasks.map(task => (
                                <li key={task.id} style={{ marginBottom: '0.5rem', lineHeight: '1.4' }}>{task.name}</li>
                            ))}
                        </ul>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px solid #fcd34d' }}>
                        <AlertTriangle size={18} style={{ color: '#d97706', minWidth: '18px', marginTop: '2px' }} />
                        <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0, lineHeight: '1.4' }}>
                            {warningMessage}
                        </p>
                    </div>
                </div>
                <div className="modal-actions" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={onConfirm}
                        className="btn btn-danger btn-block"
                        style={{ justifyContent: 'center', padding: '0.75rem', fontWeight: '600' }}
                    >
                        {confirmButtonText}
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary btn-block"
                        style={{ justifyContent: 'center', marginTop: 0 }}
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeactivateWarningModal;
