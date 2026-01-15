import { ChevronDown } from 'lucide-react';
import CustomDropdown from '../../../components/shared/CustomDropdown';

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
    { value: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ' },
    { value: 'finished', label: 'Finished', labelAr: 'مكتمل' },
    { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' }
];

const StatusDropdown = ({ value, onChange, isRTL }) => {
    return (
        <CustomDropdown
            className="status-dropdown"
            value={value}
            options={STATUS_OPTIONS}
            onChange={onChange}
            isRTL={isRTL}
            renderTrigger={(option) => (
                <>
                    <span>{option ? (isRTL ? option.labelAr : option.label) : ''}</span>
                    <ChevronDown size={14} className="dropdown-icon" />
                </>
            )}
            renderOption={(option) => (
                <>
                    <span className={`status-option-dot ${option.value}`} />
                    <span>{isRTL ? option.labelAr : option.label}</span>
                </>
            )}
        />
    );
};

export default StatusDropdown;
export { STATUS_OPTIONS };
