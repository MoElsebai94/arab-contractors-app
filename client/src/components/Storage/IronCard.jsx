import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText, Plus, Minus, ArrowDown, ArrowUp, Trash2 } from 'lucide-react';

const IronCard = ({ item, openModal, openReportModal, transactions, onDeleteTransaction, t, filterMonth, getFilteredTransactions, CustomDropdown, language }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
    };

    const cleanDiameter = item.diameter.toString().replace(/[^0-9.]/g, '');
    const filteredTransactions = getFilteredTransactions(transactions, filterMonth);

    // Calculate dynamic border color based on stock levels (example heuristic)
    const getBorderColor = (qty) => {
        if (qty === 0) return 'var(--text-secondary)';
        if (qty < 100) return 'var(--danger-color)';
        return 'var(--primary-color)';
    };

    return (
        <div ref={setNodeRef} style={style} className="card cement-card">
            <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="btn-drag-handle-card" {...attributes} {...listeners}>
                        <GripVertical size={20} />
                    </button>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                        Φ{cleanDiameter}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        className="btn-icon-action"
                        onClick={() => openReportModal('iron', item.id)}
                        title={t('monthReport')}
                        style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                    >
                        <FileText size={16} />
                    </button>
                    <div className="stock-badge" style={{
                        background: item.quantity > 0 ? 'var(--bg-secondary)' : '#f3f4f6',
                        color: item.quantity > 0 ? 'var(--primary-color)' : '#6b7280',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                    }}>
                        {item.quantity} Units
                    </div>
                </div>
            </div>

            <div className="card-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                    className="btn-action in"
                    onClick={() => openModal('iron_in', item.id)}
                    style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <ArrowDown size={18} />
                    {t('incoming') || 'Incoming'}
                </button>
                <button
                    className="btn-action out"
                    onClick={() => openModal('iron_out', item.id)}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <ArrowUp size={18} />
                    {t('outgoing') || 'Outgoing'}
                </button>
            </div>

            <div className="transaction-history">
                <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>{t('recentActivity') || 'Recent Activity'}</span>
                </div>

                <div className="history-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredTransactions.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            {t('noTransactions') || 'No transactions yet'}
                        </div>
                    ) : (
                        filteredTransactions.slice(0, 5).map(tx => (
                            <div key={tx.id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: tx.type === 'IN' ? '#059669' : '#dc2626' }}>
                                        {tx.type === 'IN' ? <Plus size={12} /> : <Minus size={12} />}
                                        {tx.quantity}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tx.description || '-'}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        {tx.transaction_date || (tx.timestamp ? tx.timestamp.split('T')[0] : '')}
                                    </span>
                                    <button
                                        onClick={() => onDeleteTransaction(tx.id, 'iron', item.id)}
                                        className="btn-delete-mini"
                                        style={{ border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default IronCard;
