/**
 * Transaction History Component
 * Reusable component for displaying transaction lists
 */

import { ArrowDown, ArrowUp, X } from 'lucide-react';

const TransactionHistory = ({
    transactions = [],
    getFilteredTransactions,
    confirmDeleteTransaction,
    type = 'cement', // 'cement', 'gasoline', 'iron'
    t,
    maxItems = 5
}) => {
    const filteredTransactions = getFilteredTransactions(transactions);
    const displayedTransactions = filteredTransactions.slice(0, maxItems);

    return (
        <div className="transaction-history">
            <h4>{t('recentTransactions')}</h4>
            <div className="history-list" role="list" aria-label={t('recentTransactions')}>
                {displayedTransactions.map((trans) => (
                    <div
                        key={trans.id}
                        className={`history-item ${trans.type.toLowerCase()}`}
                        role="listitem"
                    >
                        <span className="trans-icon" aria-hidden="true">
                            {trans.type === 'IN' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                        </span>
                        <div className="trans-details">
                            <span className="trans-desc">{trans.description}</span>
                            <span className="trans-date">
                                {trans.transaction_date || new Date(trans.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        <span
                            className="trans-qty"
                            aria-label={`${trans.type === 'IN' ? 'Added' : 'Removed'} ${trans.quantity}`}
                        >
                            {trans.type === 'IN' ? '+' : '-'}{trans.quantity}
                        </span>
                        <button
                            className="btn-delete-trans"
                            onClick={() => confirmDeleteTransaction(trans.id, type)}
                            title={t('cancelTransaction') || 'Cancel Transaction'}
                            aria-label={`Cancel transaction: ${trans.description}`}
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    </div>
                ))}
                {filteredTransactions.length === 0 && (
                    <p className="no-history">{t('noTransactions')}</p>
                )}
            </div>
        </div>
    );
};

export default TransactionHistory;
