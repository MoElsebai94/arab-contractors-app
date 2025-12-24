import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Minus, Plus, Pencil, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SortableProductionRow = ({ item, openModal, confirmDeleteProductionItem }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(item.id) });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
    };

    const percentage = Math.min(100, (item.current_quantity / item.target_quantity) * 100) || 0;

    const getProgressColor = (current, target) => {
        const percentage = (current / target) * 100;
        if (percentage >= 100) return 'var(--success-color)';
        if (percentage >= 50) return 'var(--accent-color)';
        return 'var(--danger-color)';
    };

    const { language, t } = useLanguage();
    const alignStyle = { textAlign: language === 'ar' ? 'right' : 'left' };

    const calculateDaysToFinish = (current, target, rate) => {
        if (current >= target) return t('done');
        if (rate <= 0) return '∞';
        const remaining = target - current;
        return Math.ceil(remaining / rate) + ` ${t('days')}`;
    };

    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-slate-50 transition-colors">
            <td style={{ width: '40px' }}>
                <button className="btn-drag-handle" {...attributes} {...listeners} style={{ color: '#cbd5e1' }}>
                    <GripVertical size={16} />
                </button>
            </td>
            <td>
                <div className="text-strong" title={item.name}>{item.name}</div>
            </td>
            <td>
                <span className="badge badge-planned">{item.category}</span>
            </td>
            <td style={{ minWidth: '200px' }}>
                <div className="progress-container">
                    <div className="progress-stats">
                        <span dir="ltr">{item.current_quantity} / {item.target_quantity}</span>
                        <span>{Math.round(percentage)}%</span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: getProgressColor(item.current_quantity, item.target_quantity)
                            }}
                        ></div>
                    </div>
                </div>
            </td>
            <td>
                <div className="text-muted">{item.daily_rate} / {t('day')}</div>
            </td>
            <td>
                <div className="text-muted">{item.mold_count}</div>
            </td>
            <td>
                {(() => {
                    const val = calculateDaysToFinish(item.current_quantity, item.target_quantity, item.daily_rate);
                    const isDone = val === 'Done';
                    const isInfinite = val === '∞';

                    let badgeClass = 'badge-time';
                    if (isDone) badgeClass += ' done';
                    if (isInfinite) badgeClass += ' infinite';

                    return (
                        <span className={badgeClass}>
                            {isDone ? t('done') : isInfinite ? '∞' : val}
                        </span>
                    );
                })()}
            </td>
            <td>
                <div className="action-group" style={{
                    direction: 'ltr',
                    justifyContent: language === 'ar' ? 'flex-end' : 'flex-start'
                }}>
                    <button
                        className="btn-icon-action warning"
                        onClick={() => openModal('production_out', item.id)}
                        title="Decrease Quantity"
                    >
                        <Minus size={16} />
                    </button>
                    <button
                        className="btn-icon-action success"
                        onClick={() => openModal('production_in', item.id)}
                        title="Increase Quantity"
                        style={{ color: 'var(--success-color)' }}
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        className="btn-icon-action"
                        onClick={() => openModal('production', item.id)}
                        title="Edit Item"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        className="btn-icon-action danger"
                        onClick={() => confirmDeleteProductionItem(item)}
                        title="Delete Item"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default SortableProductionRow;
