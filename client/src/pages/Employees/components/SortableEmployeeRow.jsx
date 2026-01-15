import { GripVertical, Pencil, Trash2, ToggleLeft, ToggleRight, Calendar, Download } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLanguage } from '../../../context/LanguageContext';

const SortableEmployeeRow = ({ emp, index, onEdit, onDelete, onToggleStatus, onOpenAttendance, onDownloadReport }) => {
    const { t } = useLanguage();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(emp.id) });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
    };

    return (
        <tr ref={setNodeRef} style={style}>
            <td style={{ width: '50px' }}>
                <button className="btn-drag-handle" {...attributes} {...listeners}>
                    <GripVertical size={16} />
                </button>
            </td>
            <td>#{index + 1}</td>
            <td style={{ fontWeight: 500, color: emp.is_active === 0 ? 'red' : 'inherit' }}>
                {emp.name}
                {emp.is_active === 0 && <span style={{ fontSize: '0.8em', marginLeft: '0.5rem', color: 'red' }}>({t('inactive')})</span>}
            </td>
            <td>{emp.role}</td>
            <td>{emp.contact_info}</td>
            <td>
                <div className="action-buttons">
                    <button
                        className="btn-icon-action toggle"
                        onClick={() => onToggleStatus(emp)}
                        title={emp.is_active === 0 ? t('active') : t('inactive')}
                        style={{ color: emp.is_active === 0 ? 'var(--text-secondary)' : 'var(--success-color)' }}
                    >
                        {emp.is_active === 0 ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
                    </button>
                    <button className="btn-icon-action" onClick={() => onOpenAttendance(emp)} title={t('attendance')}>
                        <Calendar size={16} />
                    </button>
                    <button
                        className="btn-icon-action"
                        onClick={() => onDownloadReport(emp)}
                        title={t('downloadReport') || "Download Report"}
                        style={{ color: '#007bff' }}
                    >
                        <Download size={16} />
                    </button>
                    <button className="btn-icon-action edit" onClick={() => onEdit(emp)} title={t('editEmployee')}>
                        <Pencil size={16} />
                    </button>
                    <button className="btn-icon-action delete" onClick={() => onDelete(emp)} title={t('deleteEmployee')}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default SortableEmployeeRow;
