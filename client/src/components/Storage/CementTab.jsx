/**
 * Cement Tab Component
 * Displays cement inventory with transaction history
 */

import { Plus, Minus, ArrowDown, ArrowUp, X } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import TransactionHistory from './TransactionHistory';

const CementTab = ({
    cementInventory,
    cementTransactions,
    filterMonth,
    setFilterMonth,
    getAvailableMonths,
    getFilteredTransactions,
    openModal,
    confirmDeleteTransaction,
    t,
    language
}) => {
    return (
        <div className="cement-container">
            <div className="filter-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <CustomDropdown
                    options={getAvailableMonths(cementTransactions)}
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    placeholder={t('allTransactions')}
                />
            </div>
            {cementInventory.map((item) => (
                <div key={item.id} className="card cement-card">
                    <div className="cement-header">
                        <h2>{item.type === 'Cement In Warehouse' ? t('cementInWarehouse') : item.type}</h2>
                        <div className="cement-stock">
                            <span className="stock-value">{item.quantity}</span>
                            <span className="stock-unit">{t('bags')}</span>
                        </div>
                    </div>

                    <div className="cement-actions">
                        <button
                            className="btn btn-success"
                            onClick={() => openModal('cement_in', item.id)}
                            aria-label={`${t('incoming')} ${t('cement')}`}
                        >
                            <Plus size={18} aria-hidden="true" /> {t('incoming')} ({t('truck')})
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={() => openModal('cement_out', item.id)}
                            aria-label={`${t('outgoing')} ${t('cement')}`}
                        >
                            <Minus size={18} aria-hidden="true" /> {t('outgoing')} ({t('subcontractor')})
                        </button>
                    </div>

                    <TransactionHistory
                        transactions={cementTransactions[item.id] || []}
                        getFilteredTransactions={getFilteredTransactions}
                        confirmDeleteTransaction={confirmDeleteTransaction}
                        type="cement"
                        t={t}
                    />
                </div>
            ))}
        </div>
    );
};

export default CementTab;
