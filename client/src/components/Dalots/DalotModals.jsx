/**
 * Dalot Modals Component
 * Modal dialogs for adding/editing dalots and sections
 */

import { X, Trash2, AlertCircle, FileSpreadsheet } from 'lucide-react';

// Dalot Add/Edit Modal
export const DalotFormModal = ({
    show,
    onClose,
    onSubmit,
    formData,
    setFormData,
    editingDalot,
    sections,
    dimensionOptions,
    statusOptions,
    CustomDropdown,
    isRTL
}) => {
    if (!show) return null;

    const sectionFormOptions = sections.map(s => ({ value: String(s.id), label: s.name, labelAr: s.name }));

    return (
        <div className="dalot-modal-overlay" onClick={onClose} role="presentation">
            <div
                className="dalot-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dalot-modal-title"
            >
                <div className="dalot-modal-header">
                    <h2 id="dalot-modal-title">
                        {editingDalot ? (isRTL ? 'تعديل دالوت' : 'Edit Dalot') : (isRTL ? 'إضافة دالوت جديد' : 'Add New Dalot')}
                    </h2>
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="dalot-modal-body">
                        {/* Section Selection */}
                        <div className="form-group">
                            <label className="form-label" id="section-label">
                                {isRTL ? 'القسم' : 'Section'}
                            </label>
                            <CustomDropdown
                                value={String(formData.section_id)}
                                options={sectionFormOptions}
                                onChange={(val) => setFormData({ ...formData, section_id: val })}
                                placeholder={isRTL ? 'اختر القسم' : 'Select Section'}
                                isRTL={isRTL}
                            />
                        </div>

                        {/* Ouvrage Numbers */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="ouvrage-transmis">
                                    {isRTL ? 'رقم المنشأة المرسل' : 'N° Ouvrage Transmis'} *
                                </label>
                                <input
                                    id="ouvrage-transmis"
                                    type="text"
                                    className="form-input"
                                    value={formData.ouvrage_transmis}
                                    onChange={(e) => setFormData({ ...formData, ouvrage_transmis: e.target.value })}
                                    placeholder="OH1"
                                    required
                                    aria-required="true"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="ouvrage-etude">
                                    {isRTL ? "رقم الدراسة" : "N° d'Étude"}
                                </label>
                                <input
                                    id="ouvrage-etude"
                                    type="text"
                                    className="form-input"
                                    value={formData.ouvrage_etude}
                                    onChange={(e) => setFormData({ ...formData, ouvrage_etude: e.target.value })}
                                    placeholder="OH1"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="ouvrage-definitif">
                                {isRTL ? 'الرقم النهائي' : 'N° Ouvrage Définitif'}
                            </label>
                            <input
                                id="ouvrage-definitif"
                                type="text"
                                className="form-input"
                                value={formData.ouvrage_definitif}
                                onChange={(e) => setFormData({ ...formData, ouvrage_definitif: e.target.value })}
                                placeholder="OH1"
                            />
                        </div>

                        {/* PK Values */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="pk-etude">
                                    {isRTL ? "نقطة الدراسة" : "PK d'Étude"}
                                </label>
                                <input
                                    id="pk-etude"
                                    type="text"
                                    className="form-input"
                                    value={formData.pk_etude}
                                    onChange={(e) => setFormData({ ...formData, pk_etude: e.target.value })}
                                    placeholder="00+055"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="pk-transmis">
                                    {isRTL ? 'نقطة المرسل' : 'PK Transmis'}
                                </label>
                                <input
                                    id="pk-transmis"
                                    type="text"
                                    className="form-input"
                                    value={formData.pk_transmis}
                                    onChange={(e) => setFormData({ ...formData, pk_transmis: e.target.value })}
                                    placeholder="00+055"
                                />
                            </div>
                        </div>

                        {/* Dimension and Length */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    {isRTL ? 'الأبعاد' : 'Dimension'}
                                </label>
                                <CustomDropdown
                                    value={formData.dimension}
                                    options={dimensionOptions}
                                    onChange={(val) => setFormData({ ...formData, dimension: val })}
                                    placeholder="1D100x100"
                                    isRTL={isRTL}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="length">
                                    {isRTL ? 'الطول (م)' : 'Length (m)'}
                                </label>
                                <input
                                    id="length"
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.length}
                                    onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) || 0 })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Status and Validation */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    {isRTL ? 'الحالة' : 'Status'}
                                </label>
                                <CustomDropdown
                                    value={formData.status}
                                    options={statusOptions}
                                    onChange={(val) => setFormData({ ...formData, status: val })}
                                    isRTL={isRTL}
                                    renderOption={(option) => (
                                        <>
                                            <span className={`status-option-dot ${option.value}`} />
                                            <span>{isRTL ? option.labelAr : option.label}</span>
                                        </>
                                    )}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="validated-checkbox">
                                    {isRTL ? 'تم التحقق' : 'Validated'}
                                </label>
                                <div className="checkbox-container" style={{ marginTop: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_validated === 1}
                                        onChange={(e) => setFormData({ ...formData, is_validated: e.target.checked ? 1 : 0 })}
                                        id="validated-checkbox"
                                    />
                                    <label htmlFor="validated-checkbox">
                                        {formData.is_validated ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="notes">
                                {isRTL ? 'ملاحظات' : 'Notes'}
                            </label>
                            <textarea
                                id="notes"
                                className="form-input"
                                rows="2"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={isRTL ? 'مثال: NOUVEAU DALOT، LE PONT...' : 'e.g., NOUVEAU DALOT, LE PONT...'}
                            />
                        </div>
                    </div>

                    <div className="dalot-modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingDalot ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إضافة' : 'Add Dalot')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Confirm Delete Modal
export const ConfirmModal = ({
    show,
    title,
    message,
    confirmText,
    cancelText,
    type = 'danger',
    onConfirm,
    onClose
}) => {
    if (!show) return null;

    return (
        <div className="dalot-modal-overlay" onClick={onClose} role="presentation">
            <div
                className="dalot-modal confirm-modal"
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
            >
                <div className="confirm-modal-body">
                    <div className={`confirm-modal-icon ${type}`} aria-hidden="true">
                        {type === 'danger' ? <Trash2 size={32} /> : <AlertCircle size={32} />}
                    </div>
                    <h3 id="confirm-title" className="confirm-modal-title">{title}</h3>
                    <p id="confirm-message" className="confirm-modal-message">{message}</p>
                </div>
                <div className="confirm-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Import Modal
export const ImportModal = ({
    show,
    onClose,
    onImport,
    importFile,
    importData,
    importSection,
    setImportSection,
    importResult,
    importing,
    dragOver,
    setDragOver,
    handleFileSelect,
    handleDrop,
    fileInputRef,
    sections,
    CustomDropdown,
    isRTL
}) => {
    if (!show) return null;

    const sectionFormOptions = sections.map(s => ({ value: String(s.id), label: s.name, labelAr: s.name }));

    return (
        <div className="dalot-modal-overlay" onClick={onClose} role="presentation">
            <div
                className="dalot-modal import-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="import-modal-title"
            >
                <div className="dalot-modal-header">
                    <h2 id="import-modal-title">
                        {isRTL ? 'استيراد من CSV' : 'Import from CSV'}
                    </h2>
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="dalot-modal-body">
                    {/* Import Result Message */}
                    {importResult && (
                        <div
                            className={`import-result ${importResult.success ? 'success' : 'error'}`}
                            role="alert"
                        >
                            {importResult.message}
                        </div>
                    )}

                    {/* Section Selection */}
                    <div className="form-group">
                        <label className="form-label">
                            {isRTL ? 'القسم المستهدف' : 'Target Section'} *
                        </label>
                        <CustomDropdown
                            value={importSection}
                            options={sectionFormOptions}
                            onChange={setImportSection}
                            placeholder={isRTL ? 'اختر القسم' : 'Select Section'}
                            isRTL={isRTL}
                        />
                    </div>

                    {/* File Drop Zone */}
                    <div
                        className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${importFile ? 'has-file' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label={isRTL ? 'اضغط أو اسحب ملف CSV للاستيراد' : 'Click or drag CSV file to import'}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <FileSpreadsheet size={48} className="file-drop-icon" aria-hidden="true" />
                        {importFile ? (
                            <>
                                <p className="file-drop-text">
                                    {isRTL ? 'الملف جاهز للاستيراد' : 'File ready for import'}
                                </p>
                                <p className="file-name">{importFile.name}</p>
                            </>
                        ) : (
                            <p className="file-drop-text">
                                {isRTL ? (
                                    <>اسحب ملف CSV هنا أو <strong>اضغط للاختيار</strong></>
                                ) : (
                                    <>Drag CSV file here or <strong>click to browse</strong></>
                                )}
                            </p>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                            aria-hidden="true"
                        />
                    </div>

                    {/* Preview */}
                    {importData.length > 0 && (
                        <div className="import-preview">
                            <h4>{isRTL ? `معاينة (${importData.length} صف)` : `Preview (${importData.length} rows)`}</h4>
                            <div className="import-preview-list" role="list">
                                {importData.slice(0, 5).map((row, i) => (
                                    <div key={i} className="import-preview-row" role="listitem">
                                        <span>#{i + 1}</span>
                                        <span><strong>{row.ouvrage_transmis || row['N° Ouvrage Transmis'] || row.transmis || '-'}</strong></span>
                                        <span>{row.dimension || row.Dimension || '-'}</span>
                                        <span>{row.pk_etude || row["PK d'Étude"] || '-'}</span>
                                    </div>
                                ))}
                                {importData.length > 5 && (
                                    <div className="import-preview-row" style={{ opacity: 0.6 }}>
                                        {isRTL ? `... و ${importData.length - 5} صف آخر` : `... and ${importData.length - 5} more rows`}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Help Text */}
                    <div className="import-help">
                        <strong>{isRTL ? 'الأعمدة المدعومة:' : 'Supported columns:'}</strong><br />
                        <code>ouvrage_transmis</code>, <code>ouvrage_etude</code>, <code>ouvrage_definitif</code>,
                        <code>pk_etude</code>, <code>pk_transmis</code>, <code>dimension</code>,
                        <code>length</code>, <code>status</code>, <code>notes</code>
                    </div>
                </div>

                <div className="dalot-modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onImport}
                        disabled={!importSection || importData.length === 0 || importing}
                        aria-busy={importing}
                    >
                        {importing
                            ? (isRTL ? 'جاري الاستيراد...' : 'Importing...')
                            : (isRTL ? `استيراد ${importData.length} سجل` : `Import ${importData.length} Records`)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default {
    DalotFormModal,
    ConfirmModal,
    ImportModal
};
