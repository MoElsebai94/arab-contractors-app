import { Search, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import ModernDropdown from '../../../components/shared/ModernDropdown';

const StaffDirectoryFilters = ({
    searchQuery,
    onSearchChange,
    showInactive,
    onToggleInactive,
    selectedRole,
    onRoleChange,
    uniqueRoles
}) => {
    const { t } = useLanguage();

    return (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <div className="search-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    placeholder={t('searchEmployees')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
            </div>
            <button
                onClick={onToggleInactive}
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
                    onChange={onRoleChange}
                />
            </div>
        </div>
    );
};

export default StaffDirectoryFilters;
