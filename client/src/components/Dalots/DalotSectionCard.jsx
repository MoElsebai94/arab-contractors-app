/**
 * Dalot Section Card Component
 * Expandable section with dalots table
 */

import { ChevronDown, Edit2, Trash2, Construction, Check, Plus } from 'lucide-react';

const DalotSectionCard = ({
    section,
    dalots,
    isExpanded,
    onToggle,
    onEditSection,
    onDeleteSection,
    onAddDalot,
    onEditDalot,
    onDeleteDalot,
    onStatusChange,
    onValidationToggle,
    getDimensionClass,
    StatusDropdown,
    isRTL
}) => {
    const getSectionProgress = () => {
        const total = section.total_dalots || 0;
        const finished = section.finished_count || 0;
        return total > 0 ? Math.round((finished / total) * 100) : 0;
    };

    const progress = getSectionProgress();

    return (
        <div className="section-card">
            {/* Section Header */}
            <div
                className="section-header"
                onClick={onToggle}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={`section-content-${section.id}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle();
                    }
                }}
            >
                <div className="section-header-left">
                    <div
                        className={`section-toggle ${isExpanded ? 'open' : ''}`}
                        aria-hidden="true"
                    >
                        <ChevronDown size={18} />
                    </div>
                    <div>
                        <div className="section-title">{section.name}</div>
                        <div className="section-route">{section.route_name}</div>
                    </div>
                </div>

                <div className="section-header-right">
                    {/* Progress Bar */}
                    <div className="section-progress" aria-label={`${progress}% complete`}>
                        <div className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progress}%` }}
                                role="progressbar"
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                        <span className="progress-text">{progress}%</span>
                    </div>

                    {/* Dalots Count */}
                    <div className="section-count">
                        <Construction size={14} aria-hidden="true" />
                        <span>{section.total_dalots || 0}</span>
                    </div>

                    {/* Section Actions */}
                    <div className="section-actions">
                        <button
                            className="section-action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditSection(section);
                            }}
                            title={isRTL ? 'تعديل القسم' : 'Edit Section'}
                            aria-label={`Edit section ${section.name}`}
                        >
                            <Edit2 size={14} aria-hidden="true" />
                        </button>
                        <button
                            className="section-action-btn danger"
                            onClick={(e) => onDeleteSection(section.id, e)}
                            title={isRTL ? 'حذف القسم' : 'Delete Section'}
                            aria-label={`Delete section ${section.name}`}
                        >
                            <Trash2 size={14} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Section Content */}
            <div
                id={`section-content-${section.id}`}
                className={`section-content ${isExpanded ? 'open' : ''}`}
                role="region"
                aria-labelledby={`section-header-${section.id}`}
            >
                {dalots.length > 0 ? (
                    <div className="dalots-table-container">
                        <table className="dalots-table" role="grid">
                            <thead>
                                <tr role="row">
                                    <th scope="col">#</th>
                                    <th scope="col">{isRTL ? 'رقم المنشأة المرسل' : 'N° Transmis'}</th>
                                    <th scope="col">{isRTL ? 'رقم الدراسة' : "N° d'Étude"}</th>
                                    <th scope="col">{isRTL ? 'الرقم النهائي' : 'N° Définitif'}</th>
                                    <th scope="col">{isRTL ? 'نقطة الدراسة' : "PK d'Étude"}</th>
                                    <th scope="col">{isRTL ? 'نقطة المرسل' : 'PK Transmis'}</th>
                                    <th scope="col">{isRTL ? 'الأبعاد' : 'Dimension'}</th>
                                    <th scope="col">{isRTL ? 'الطول (م)' : 'Length (m)'}</th>
                                    <th scope="col">{isRTL ? 'تحقق' : 'Validated'}</th>
                                    <th scope="col">{isRTL ? 'الحالة' : 'Status'}</th>
                                    <th scope="col">{isRTL ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dalots.map((dalot, index) => (
                                    <tr
                                        key={dalot.id}
                                        role="row"
                                        className={
                                            dalot.notes?.includes('NOUVEAU DALOT') ? 'note-row' :
                                            dalot.notes?.includes('LE PONT') ? 'bridge-row' : ''
                                        }
                                    >
                                        <td role="gridcell">{index + 1}</td>
                                        <td role="gridcell"><strong>{dalot.ouvrage_transmis}</strong></td>
                                        <td role="gridcell">{dalot.ouvrage_etude || '-'}</td>
                                        <td role="gridcell">{dalot.ouvrage_definitif || '-'}</td>
                                        <td role="gridcell" className="pk-value">{dalot.pk_etude || '-'}</td>
                                        <td role="gridcell" className="pk-value">{dalot.pk_transmis || '-'}</td>
                                        <td role="gridcell">
                                            {dalot.dimension && (
                                                <span className={`dimension-badge ${getDimensionClass(dalot.dimension)}`}>
                                                    {dalot.dimension}
                                                </span>
                                            )}
                                        </td>
                                        <td role="gridcell">{dalot.length > 0 ? dalot.length : '-'}</td>
                                        <td role="gridcell">
                                            <button
                                                className={`validation-toggle ${dalot.is_validated ? 'validated' : ''}`}
                                                onClick={() => onValidationToggle(dalot.id)}
                                                title={dalot.is_validated ? (isRTL ? 'تم التحقق' : 'Validated') : (isRTL ? 'غير محقق' : 'Not validated')}
                                                aria-label={dalot.is_validated ? 'Mark as not validated' : 'Mark as validated'}
                                                aria-pressed={dalot.is_validated}
                                            >
                                                <Check size={16} aria-hidden="true" />
                                            </button>
                                        </td>
                                        <td role="gridcell">
                                            <StatusDropdown
                                                value={dalot.status}
                                                onChange={(newStatus) => onStatusChange(dalot.id, newStatus)}
                                                isRTL={isRTL}
                                            />
                                        </td>
                                        <td role="gridcell">
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn"
                                                    onClick={() => onEditDalot(dalot)}
                                                    title={isRTL ? 'تعديل' : 'Edit'}
                                                    aria-label={`Edit dalot ${dalot.ouvrage_transmis}`}
                                                >
                                                    <Edit2 size={14} aria-hidden="true" />
                                                </button>
                                                <button
                                                    className="action-btn danger"
                                                    onClick={() => onDeleteDalot(dalot.id)}
                                                    title={isRTL ? 'حذف' : 'Delete'}
                                                    aria-label={`Delete dalot ${dalot.ouvrage_transmis}`}
                                                >
                                                    <Trash2 size={14} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state" role="status">
                        <Construction size={48} aria-hidden="true" />
                        <p>{isRTL ? 'لا توجد دالوت في هذا القسم' : 'No dalots in this section'}</p>
                    </div>
                )}

                <button
                    className="add-dalot-btn"
                    onClick={() => onAddDalot(section.id)}
                    aria-label={isRTL ? `إضافة دالوت جديد إلى ${section.name}` : `Add new dalot to ${section.name}`}
                >
                    <Plus size={18} aria-hidden="true" />
                    {isRTL ? 'إضافة دالوت جديد' : 'Add New Dalot'}
                </button>
            </div>
        </div>
    );
};

export default DalotSectionCard;
