import { useLanguage } from '../../../context/LanguageContext';

const EmployeeRegistrationForm = ({ formData, onChange, onSubmit }) => {
    const { t } = useLanguage();

    return (
        <div className="card">
            <h3 className="card-title">{t('registerNewEmployee')}</h3>
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label className="form-label">{t('fullName')}</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={onChange}
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
                        onChange={onChange}
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
                        onChange={onChange}
                        placeholder="e.g. email@example.com"
                        className="form-input"
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    <span>+ {t('registerEmployee')}</span>
                </button>
            </form>
        </div>
    );
};

export default EmployeeRegistrationForm;
