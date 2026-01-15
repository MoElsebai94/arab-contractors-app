import { useLanguage } from '../../../context/LanguageContext';

const DeleteEmployeeModal = ({ employee, onConfirm, onClose }) => {
    const { t } = useLanguage();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <h3>{t('confirmDeletion')}</h3>
                <p>
                    {t('areYouSureRemove').split('{name}')[0]}
                    <strong>{employee?.name}</strong>
                    {t('areYouSureRemove').split('{name}')[1]}
                </p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
                    <button className="btn btn-danger" onClick={onConfirm}>{t('delete')}</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteEmployeeModal;
