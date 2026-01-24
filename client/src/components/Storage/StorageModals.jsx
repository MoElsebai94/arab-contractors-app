/**
 * Storage Modals Component
 * Contains all modal dialogs for the Storage page
 */

import { X, Plus, Trash2 } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

// Delete Transaction Confirmation Modal
export const DeleteTransactionModal = ({ show, onClose, onConfirm, t }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-trans-title"
            >
                <h3 id="delete-trans-title">{t('confirmCancellation')}</h3>
                <p>{t('cancelTransactionConfirm')}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {t('noKeepIt')}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {t('yesCancelIt')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Delete Iron Item Modal
export const DeleteIronModal = ({ show, onClose, onConfirm, t }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-iron-title"
            >
                <h3 id="delete-iron-title">{t('deleteIronItem')}</h3>
                <p>{t('deleteIronConfirm')}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {t('deleteTask')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Delete Production Item Modal
export const DeleteProductionModal = ({ show, onClose, onConfirm, t }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="presentation">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-prod-title"
            >
                <h3 id="delete-prod-title">{t('deleteProductionItem')}</h3>
                <p>{t('deleteProductionConfirm')}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {t('cancel')}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {t('deleteTask')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Manage Categories Modal
export const ManageCategoriesModal = ({
    show,
    onClose,
    categories,
    newCategoryName,
    setNewCategoryName,
    handleAddCategory,
    handleDeleteCategory,
    t
}) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose} role="presentation">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="manage-categories-title"
            >
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 id="manage-categories-title">{t('manageCategories') || "Manage Categories"}</h3>
                    <button
                        className="btn-icon"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('newCategoryName') || "New Category Name"}
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            required
                            aria-label={t('newCategoryName') || "New Category Name"}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }} aria-label="Add category">
                            <Plus size={24} aria-hidden="true" />
                        </button>
                    </form>
                </div>

                <div className="category-list" role="list" aria-label="Categories">
                    {categories.map(cat => (
                        <div key={cat.id} className="category-item" role="listitem">
                            <span>{cat.name}</span>
                            <button
                                className="btn-icon-action delete"
                                onClick={() => handleDeleteCategory(cat.id)}
                                title={t('delete') || "Delete"}
                                aria-label={`Delete ${cat.name} category`}
                            >
                                <Trash2 size={18} aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Delete Category Confirmation Modal
export const DeleteCategoryModal = ({ show, onClose, onConfirm, t }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose} role="presentation">
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-category-title"
            >
                <h3 id="delete-category-title">{t('delete') || "Delete"}</h3>
                <p>{t('confirmDeleteCategory') || "Are you sure you want to delete this category?"}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {t('cancel') || "Cancel"}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {t('delete') || "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default {
    DeleteTransactionModal,
    DeleteIronModal,
    DeleteProductionModal,
    ManageCategoriesModal,
    DeleteCategoryModal
};
