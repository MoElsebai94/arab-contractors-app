/**
 * Gasoline Tab Component
 * Displays gasoline/fuel inventory with transaction history
 */

import { Plus, Minus } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import TransactionHistory from './TransactionHistory';

const GasolineTab = ({
    gasolineInventory,
    gasolineTransactions,
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
                    options={getAvailableMonths(gasolineTransactions)}
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    placeholder={t('allTransactions')}
                />
            </div>
            {gasolineInventory.map((item) => (
                <div key={item.id} className="card cement-card">
                    <div className="cement-header">
                        <h2>{t(item.type.toLowerCase()) === item.type.toLowerCase() ? item.type : t(item.type.toLowerCase())}</h2>
                        <div className="cement-stock">
                            <span className="stock-value">{item.quantity}</span>
                            <span className="stock-unit">{t('liters')}</span>
                        </div>
                    </div>

                    <div className="cement-actions">
                        <button
                            className="btn btn-success"
                            onClick={() => openModal('gasoline_in', item.id)}
                            aria-label={`${t('incoming')} ${t('fuel')}`}
                        >
                            <Plus size={18} aria-hidden="true" /> {t('incoming')}
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={() => openModal('gasoline_out', item.id)}
                            aria-label={`${t('outgoing')} ${t('fuel')}`}
                        >
                            <Minus size={18} aria-hidden="true" /> {t('outgoing')}
                        </button>
                    </div>

                    <TransactionHistory
                        transactions={gasolineTransactions[item.id] || []}
                        getFilteredTransactions={getFilteredTransactions}
                        confirmDeleteTransaction={confirmDeleteTransaction}
                        type="gasoline"
                        t={t}
                    />
                </div>
            ))}
        </div>
    );
};

export default GasolineTab;
