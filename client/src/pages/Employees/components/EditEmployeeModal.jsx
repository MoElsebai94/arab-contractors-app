import { useLanguage } from '../../../context/LanguageContext';

const EditEmployeeModal = ({ employee, formData, onChange, onSubmit, onClose }) => {
    const { t } = useLanguage();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{t('editEmployee') || 'Edit Employee'}</h3>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t('fullName')}</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('role')}</label>
                        <input
                            type="text"
                            name="role"
                            className="form-input"
                            value={formData.role}
                            onChange={onChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('contactInfo')}</label>
                        <input
                            type="text"
                            name="contact_info"
                            className="form-input"
                            value={formData.contact_info}
                            onChange={onChange}
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
                        <button type="submit" className="btn btn-primary">{t('save') || 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
