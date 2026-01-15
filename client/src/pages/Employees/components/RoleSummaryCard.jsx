import { useLanguage } from '../../../context/LanguageContext';

const RoleSummaryCard = ({ roleCounts }) => {
    const { t } = useLanguage();

    return (
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
    );
};

export default RoleSummaryCard;
