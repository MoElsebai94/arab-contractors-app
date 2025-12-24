import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Factory, Hammer, BrickWall, Fuel, Plus, Minus, X, ArrowDown, ArrowUp, Trash2, Pencil, Check, FileText } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LoadingScreen from '../components/LoadingScreen';
import './Storage.css';

// Imported Components
import CustomDropdown from '../components/Storage/CustomDropdown';
import IronCard from '../components/Storage/IronCard';
import SortableProductionRow from '../components/Storage/SortableProductionRow';
import StorageReportModal from '../components/Storage/StorageReportModal';
import ProductionReportModal from '../components/Storage/ProductionReportModal';
import useScrollLock from '../hooks/useScrollLock';

const Storage = () => {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('production');
    const [productionItems, setProductionItems] = useState([]);
    const [ironInventory, setIronInventory] = useState([]);
    const [cementInventory, setCementInventory] = useState([]);
    const [cementTransactions, setCementTransactions] = useState({}); // Map of cement_id -> transactions[]
    const [gasolineInventory, setGasolineInventory] = useState([]);
    const [gasolineTransactions, setGasolineTransactions] = useState({}); // Map of gasoline_id -> transactions[]
    const [ironTransactions, setIronTransactions] = useState({}); // Map of iron_id -> transactions[]

    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState('production'); // 'production', 'iron', 'iron_in', 'iron_out', 'cement_in', 'cement_out', 'gasoline_in', 'gasoline_out'
    const [selectedIronId, setSelectedIronId] = useState(null);
    const [selectedCementId, setSelectedCementId] = useState(null);
    const [selectedGasolineId, setSelectedGasolineId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [ironItemToDelete, setIronItemToDelete] = useState(null);
    const [showDeleteIronModal, setShowDeleteIronModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formError, setFormError] = useState(null);
    const [filterMonth, setFilterMonth] = useState('all');

    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Prefabrication',
        target_quantity: 0,
        current_quantity: 0,
        daily_rate: 0,
        mold_count: 0
    });

    const [newIronItem, setNewIronItem] = useState({
        diameter: '',
        quantity: 0
    });

    const [transaction, setTransaction] = useState({
        quantity: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [productionInventory, setTransactionHistory] = useState([]);


    // Category Management State
    const [categories, setCategories] = useState([]);
    const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        fetchProductionData();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/storage/production-categories', {
                headers: { authorization: `Bearer ${token}` }
            });
            if (response.data.data) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/storage/production-categories', { name: newCategoryName }, {
                headers: { authorization: `Bearer ${token}` }
            });
            setCategories([...categories, response.data.data]);
            setNewCategoryName('');
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const handleDeleteCategory = (id) => {
        setCategoryToDelete(id);
        setShowDeleteCategoryModal(true);
    };

    const confirmDeleteCategoryAction = async () => {
        if (!categoryToDelete) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/storage/production-categories/${categoryToDelete}`, {
                headers: { authorization: `Bearer ${token}` }
            });
            setCategories(categories.filter(c => c.id !== categoryToDelete));
            setShowDeleteCategoryModal(false);
            setCategoryToDelete(null);
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    const fetchProductionData = async () => {
        try {
            const [prodRes, ironRes, cementRes, gasRes, allCementTrans, allGasTrans, allIronTrans] = await Promise.all([
                axios.get('/api/storage/production'),
                axios.get('/api/storage/iron'),
                axios.get('/api/storage/cement'),
                axios.get('/api/storage/gasoline'),
                axios.get('/api/storage/cement/transactions/all'),
                axios.get('/api/storage/gasoline/transactions/all'),
                axios.get('/api/storage/iron/transactions/all')
            ]);
            setProductionItems(prodRes.data.data);
            setIronInventory(ironRes.data.data);
            setCementInventory(cementRes.data.data);
            setGasolineInventory(gasRes.data.data);

            // Process Cement Transactions
            const transactionsMap = {};
            (allCementTrans.data.data || []).forEach(t => {
                if (!transactionsMap[t.cement_id]) transactionsMap[t.cement_id] = [];
                transactionsMap[t.cement_id].push(t);
            });
            setCementTransactions(transactionsMap);

            // Process Gasoline Transactions
            const gasTransactionsMap = {};
            (allGasTrans.data.data || []).forEach(t => {
                if (!gasTransactionsMap[t.gasoline_id]) gasTransactionsMap[t.gasoline_id] = [];
                gasTransactionsMap[t.gasoline_id].push(t);
            });
            setGasolineTransactions(gasTransactionsMap);

            // Process Iron Transactions
            const ironTransactionsMap = {};
            (allIronTrans.data.data || []).forEach(t => {
                if (!ironTransactionsMap[t.iron_id]) ironTransactionsMap[t.iron_id] = [];
                ironTransactionsMap[t.iron_id].push(t);
            });
            setIronTransactions(ironTransactionsMap);

        } catch (error) {
            console.error('Error fetching storage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchData = async () => {
        try {
            const [prodRes, ironRes, cementRes, gasRes, allCementTrans, allGasTrans, allIronTrans] = await Promise.all([
                axios.get('/api/storage/production'),
                axios.get('/api/storage/iron'),
                axios.get('/api/storage/cement'),
                axios.get('/api/storage/gasoline'),
                axios.get('/api/storage/cement/transactions/all'),
                axios.get('/api/storage/gasoline/transactions/all'),
                axios.get('/api/storage/iron/transactions/all')
            ]);
            setProductionItems(prodRes.data.data);
            setIronInventory(ironRes.data.data);
            setCementInventory(cementRes.data.data);
            setGasolineInventory(gasRes.data.data);

            // Process Cement Transactions
            const transactionsMap = {};
            (allCementTrans.data.data || []).forEach(t => {
                if (!transactionsMap[t.cement_id]) transactionsMap[t.cement_id] = [];
                transactionsMap[t.cement_id].push(t);
            });
            setCementTransactions(transactionsMap);

            // Process Gasoline Transactions
            const gasTransactionsMap = {};
            (allGasTrans.data.data || []).forEach(t => {
                if (!gasTransactionsMap[t.gasoline_id]) gasTransactionsMap[t.gasoline_id] = [];
                gasTransactionsMap[t.gasoline_id].push(t);
            });
            setGasolineTransactions(gasTransactionsMap);

            // Process Iron Transactions
            const ironTransactionsMap = {};
            (allIronTrans.data.data || []).forEach(t => {
                if (!ironTransactionsMap[t.iron_id]) ironTransactionsMap[t.iron_id] = [];
                ironTransactionsMap[t.iron_id].push(t);
            });
            setIronTransactions(ironTransactionsMap);

        } catch (error) {
            console.error('Error fetching storage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProduction = async (id, field, value) => {
        try {
            await axios.put(`/api/storage/production/${id}`, { [field]: value });
            fetchData();
        } catch (error) {
            console.error('Error updating production:', error);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            if (modalType === 'production') {
                if (editingItem) {
                    await axios.put(`/api/storage/production/${editingItem.id}`, newItem);
                } else {
                    await axios.post('/api/storage/production', newItem);
                }
                setNewItem({ name: '', category: 'Prefabrication', target_quantity: 0, current_quantity: 0, daily_rate: 0, mold_count: 0 });
                setEditingItem(null);
            } else if (modalType === 'production_in') {
                if (transaction.quantity <= 0) {
                    setFormError(t('quantityMustBePositive') || 'Quantity must be positive');
                    return;
                }
                const newQty = editingItem.current_quantity + transaction.quantity;

                // Add validation for target quantity
                if (newQty > editingItem.target_quantity) {
                    setFormError(`${t('quantityExceedsTarget')} (${editingItem.target_quantity})`);
                    return;
                }

                await updateProduction(editingItem.id, 'current_quantity', newQty);
                setShowAddModal(false);
                setTransaction({ quantity: 0, description: '', date: new Date().toISOString().split('T')[0] });
            } else if (modalType === 'production_out') {
                if (transaction.quantity <= 0) {
                    setFormError(t('quantityMustBePositive') || 'Quantity must be positive');
                    return;
                }
                const newQty = editingItem.current_quantity - transaction.quantity;
                if (newQty < 0) {
                    setFormError(t('insufficientStock') || 'Insufficient stock');
                    return;
                }
                await updateProduction(editingItem.id, 'current_quantity', newQty);
                setShowAddModal(false);
                setTransaction({ quantity: 0, description: '', date: new Date().toISOString().split('T')[0] });
            } else if (modalType === 'iron') {
                await axios.post('/api/storage/iron', newIronItem);
                setNewIronItem({ diameter: '', quantity: 0 });
            } else if (modalType === 'cement_in' || modalType === 'cement_out') {
                if (!transaction.quantity || transaction.quantity <= 0) {
                    setFormError('Quantity must be greater than 0');
                    return;
                }
                const type = modalType === 'cement_in' ? 'IN' : 'OUT';
                await axios.post('/api/storage/cement/transaction', {
                    cement_id: selectedCementId,
                    type,
                    quantity: transaction.quantity,
                    description: transaction.description,
                    date: transaction.date
                });
                setTransaction({ quantity: 0, description: '', date: new Date().toISOString().split('T')[0] });
            } else if (modalType === 'gasoline_in' || modalType === 'gasoline_out') {
                if (!transaction.quantity || transaction.quantity <= 0) {
                    setFormError('Quantity must be greater than 0');
                    return;
                }
                const type = modalType === 'gasoline_in' ? 'IN' : 'OUT';
                await axios.post('/api/storage/gasoline/transaction', {
                    gasoline_id: selectedGasolineId,
                    type,
                    quantity: transaction.quantity,
                    description: transaction.description,
                    date: transaction.date
                });
                setTransaction({ quantity: 0, description: '', date: new Date().toISOString().split('T')[0] });
            } else if (modalType === 'iron_in' || modalType === 'iron_out') {
                if (!transaction.quantity || transaction.quantity <= 0) {
                    setFormError('Quantity must be greater than 0');
                    return;
                }
                const type = modalType === 'iron_in' ? 'IN' : 'OUT';
                console.log('Sending Iron Transaction:', { iron_id: selectedIronId, type, quantity: transaction.quantity });
                await axios.post('/api/storage/iron/transaction', {
                    iron_id: selectedIronId,
                    type,
                    quantity: transaction.quantity,
                    description: transaction.description,
                    date: transaction.date
                });
                setTransaction({ quantity: 0, description: '', date: new Date().toISOString().split('T')[0] });
            }
            setShowAddModal(false);
            fetchData();
        } catch (error) {
            console.error('Error adding/updating item:', error);
            const msg = error.response?.data?.error || 'Error processing request';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const getAvailableMonths = (transactionsMap) => {
        const months = new Set();
        Object.values(transactionsMap).flat().forEach(trans => {
            const date = trans.transaction_date || trans.timestamp.split('T')[0];
            const monthStr = date.substring(0, 7); // YYYY-MM
            months.add(monthStr);
        });
        return Array.from(months).sort().reverse();
    };

    const getFilteredTransactions = (transactions) => {
        if (filterMonth === 'all') return transactions;
        return transactions.filter(trans => {
            const date = trans.transaction_date || trans.timestamp.split('T')[0];
            return date.startsWith(filterMonth);
        });
    };

    const handleDeleteTransaction = async () => {
        if (!transactionToDelete) return;
        try {
            await axios.delete(`/api/storage/${transactionToDelete.type}/transaction/${transactionToDelete.id}`);
            setShowDeleteModal(false);
            setTransactionToDelete(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            setFormError(t('errorDeletingTransaction') || 'Error deleting transaction');
        }
    };

    const confirmDeleteTransaction = (id, type = 'cement') => { // 'cement', 'gasoline', or 'iron'
        // If type is iron, use the new structure
        if (type === 'iron') {
            setTransactionToDelete({ id, type: 'iron' });
        } else {
            // Heuristic to detect type if not passed explicitly (legacy)
            setTransactionToDelete({ id, type });
        }
        setShowDeleteModal(true);
    };

    const handleDeleteIronItem = async () => {
        if (!ironItemToDelete) return;
        try {
            await axios.delete(`/api/storage/iron/${ironItemToDelete}`);
            setShowDeleteIronModal(false);
            setIronItemToDelete(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting iron item:', error);
        }
    };

    const [productionItemToDelete, setProductionItemToDelete] = useState(null);
    const [showDeleteProductionModal, setShowDeleteProductionModal] = useState(false);

    // Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [showProductionReportModal, setShowProductionReportModal] = useState(false);
    const [reportType, setReportType] = useState('cement'); // 'cement' or 'gasoline' or 'iron'
    const [reportItemId, setReportItemId] = useState(null);

    // Lock scroll when any modal is open
    const isAnyModalOpen = showAddModal || showDeleteModal || showDeleteIronModal ||
        showReportModal || showProductionReportModal || showDeleteProductionModal ||
        showManageCategoriesModal || showDeleteCategoryModal;

    useScrollLock(isAnyModalOpen);

    const openReportModal = (type, itemId = null) => {
        setReportType(type);
        setReportItemId(itemId);
        setShowReportModal(true);
    };

    const confirmDeleteProductionItem = (id) => {
        setProductionItemToDelete(id);
        setShowDeleteProductionModal(true);
    };

    const handleDeleteProductionItem = async () => {
        if (!productionItemToDelete) return;
        try {
            await axios.delete(`/api/storage/production/${productionItemToDelete}`);
            setShowDeleteProductionModal(false);
            setProductionItemToDelete(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting production item:', error);
        }
    };

    const handleDragEndProduction = async (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const oldIndex = productionItems.findIndex((item) => String(item.id) === String(active.id));
            const newIndex = productionItems.findIndex((item) => String(item.id) === String(over.id));

            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(productionItems, oldIndex, newIndex);
                setProductionItems(newItems);

                // Update backend with new order
                const orderUpdates = newItems.map((item, index) => ({
                    id: item.id,
                    display_order: index
                }));

                try {
                    await axios.put('/api/storage/production/reorder', { items: orderUpdates });
                } catch (err) {
                    console.error("Failed to save order", err);
                    fetchData(); // Revert on error
                }
            }
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = ironInventory.findIndex((item) => String(item.id) === String(active.id));
            const newIndex = ironInventory.findIndex((item) => String(item.id) === String(over.id));

            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(ironInventory, oldIndex, newIndex);
                setIronInventory(newItems);

                // Update backend with new order
                const orderUpdates = newItems.map((item, index) => ({
                    id: item.id,
                    display_order: index
                }));

                try {
                    await axios.put('/api/storage/iron/reorder', { items: orderUpdates });
                } catch (err) {
                    console.error("Failed to save order", err);
                    fetchData(); // Revert on error
                }
            }
        }
    };

    const calculateDaysToFinish = (current, target, rate) => {
        if (current >= target) return t('done');
        if (rate <= 0) return '∞';
        const remaining = target - current;
        return Math.ceil(remaining / rate) + ` ${t('days')}`;
    };

    const getProgressColor = (current, target) => {
        const percentage = (current / target) * 100;
        if (percentage >= 100) return 'var(--success-color)';
        if (percentage >= 50) return 'var(--accent-color)';
        return 'var(--danger-color)';
    };

    const openModal = (type, id = null) => {
        setModalType(type);
        setFormError(null);
        if (type === 'production' && id) {
            // Edit mode for production
            const itemToEdit = productionItems.find(i => i.id === id);
            if (itemToEdit) {
                setEditingItem(itemToEdit);
                setNewItem({
                    name: itemToEdit.name,
                    category: itemToEdit.category,
                    target_quantity: itemToEdit.target_quantity,
                    current_quantity: itemToEdit.current_quantity,
                    daily_rate: itemToEdit.daily_rate,
                    mold_count: itemToEdit.mold_count
                });
            }
        } else if ((type === 'production_in' || type === 'production_out') && id) {
            const itemToEdit = productionItems.find(i => i.id === id);
            if (itemToEdit) {
                setEditingItem(itemToEdit);
                setTransaction({ date: new Date().toISOString().split('T')[0], quantity: 0, description: '', type: 'IN' }); // Reset transaction
            }
        } else {
            setEditingItem(null);
            setNewItem({ name: '', category: 'Prefabrication', target_quantity: 0, current_quantity: 0, daily_rate: 0, mold_count: 0 });
        }

        if (id && type.startsWith('cement')) setSelectedCementId(id);
        if (id && type.startsWith('gasoline')) setSelectedGasolineId(id);
        if (id && type.startsWith('iron')) setSelectedIronId(id);
        setShowAddModal(true);
    };

    if (loading) return <LoadingScreen />;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('storageManagement')}</h1>
                <div className="header-actions">
                    {activeTab === 'production' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowProductionReportModal(true)} style={{ whiteSpace: 'nowrap' }}>
                                <FileText size={20} /> {t('report')}
                            </button>
                            <button className="btn btn-primary" onClick={() => openModal('production')} style={{ whiteSpace: 'nowrap' }}>
                                <Plus size={20} /> {t('addProductionItem')}
                            </button>
                        </div>
                    )}
                    {activeTab === 'iron' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => openReportModal('iron')} style={{ whiteSpace: 'nowrap' }}>
                                <FileText size={20} /> {t('monthReport')}
                            </button>
                            <button className="btn btn-primary" onClick={() => openModal('iron')} style={{ whiteSpace: 'nowrap' }}>
                                <Plus size={20} /> {t('addIronType')}
                            </button>
                        </div>
                    )}
                    {activeTab === 'cement' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => openReportModal('cement')} style={{ whiteSpace: 'nowrap' }}>
                                <FileText size={20} /> {t('monthReport')}
                            </button>
                        </div>
                    )}
                    {activeTab === 'gasoline' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => openReportModal('gasoline')} style={{ whiteSpace: 'nowrap' }}>
                                <FileText size={20} /> {t('monthReport')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'production' ? 'active' : ''}`}
                    onClick={() => setActiveTab('production')}
                >
                    <Factory size={18} /> {t('production')}
                </button>
                <button
                    className={`tab ${activeTab === 'iron' ? 'active' : ''}`}
                    onClick={() => setActiveTab('iron')}
                >
                    <Hammer size={18} /> {t('iron')}
                </button>
                <button
                    className={`tab ${activeTab === 'cement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cement')}
                >
                    <BrickWall size={18} /> {t('cement')}
                </button>
                <button
                    className={`tab ${activeTab === 'gasoline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gasoline')}
                >
                    <Fuel size={18} /> {t('fuel')}
                </button>
            </div>

            {activeTab === 'production' && (
                <div className="production-container">
                    {/* Desktop Table View */}
                    <div className="table-view">
                        <table className="production-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}></th>
                                    <th style={{ width: '15%', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('itemName')}</th>
                                    <th style={{ width: '15%', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('category')}</th>
                                    <th style={{ width: '25%', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('currentQty')} / {t('targetQty')}</th>
                                    <th style={{ width: '10%', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('dailyRate')}</th>
                                    <th style={{ width: '8%', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('moldCount')}</th>
                                    <th style={{ width: '10%', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('time')}</th>
                                    <th style={{ width: '150px' }}>{t('actions')}</th>
                                </tr>
                            </thead>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEndProduction}
                            >
                                <SortableContext
                                    items={productionItems.map(item => String(item.id))}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <tbody>
                                        {productionItems.map((item) => (
                                            <SortableProductionRow
                                                key={item.id}
                                                item={item}
                                                openModal={openModal}
                                                confirmDeleteProductionItem={confirmDeleteProductionItem}
                                            />
                                        ))}
                                    </tbody>
                                </SortableContext>
                            </DndContext>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-view">
                        {productionItems.map((item) => {
                            const percentage = Math.min(100, (item.current_quantity / item.target_quantity) * 100) || 0;
                            return (
                                <div key={item.id} className="mobile-card">
                                    <div className="mobile-card-header">
                                        <h4>{item.name}</h4>
                                        <span className="badge badge-planned">{item.category}</span>
                                    </div>

                                    <div className="mobile-card-body">
                                        <div className="progress-section">
                                            <div className="progress-label">
                                                <span>{item.current_quantity} / {item.target_quantity}</span>
                                                <span>{Math.round(percentage)}%</span>
                                            </div>
                                            <div className="progress-bar-bg">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: getProgressColor(item.current_quantity, item.target_quantity)
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="stats-grid">
                                            <div className="stat-item">
                                                <span className="label">{t('rate')}</span>
                                                <span className="value">{item.daily_rate}/{t('days')}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="label">{t('molds')}</span>
                                                <span className="value">{item.mold_count}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="label">{t('time')}</span>
                                                <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                                                    {(() => {
                                                        const val = calculateDaysToFinish(item.current_quantity, item.target_quantity, item.daily_rate);
                                                        return val;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="storage-mobile-actions">
                                            <div className="qty-control">
                                                <button
                                                    className="btn-icon-action warning"
                                                    onClick={() => openModal('production_out', item.id)}
                                                    title="Decrease"
                                                >
                                                    <Minus size={20} />
                                                </button>
                                                <button
                                                    className="btn-icon-action success"
                                                    onClick={() => openModal('production_in', item.id)}
                                                    title="Increase"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                            <div className="edit-actions">
                                                <button className="btn-icon-action" onClick={() => openModal('production', item.id)}>
                                                    <Pencil size={20} />
                                                </button>
                                                <button className="btn-icon-action delete" onClick={() => confirmDeleteProductionItem(item.id)}>
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'iron' && (
                <div className="cement-container">
                    <div className="filter-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <CustomDropdown
                            options={getAvailableMonths(ironTransactions)}
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            placeholder={t('allTransactions')}
                        />
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={ironInventory.map(item => item.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="modern-iron-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                                {ironInventory.map((item) => (
                                    <IronCard
                                        key={item.id}
                                        item={item}
                                        openModal={openModal}
                                        openReportModal={openReportModal}
                                        transactions={ironTransactions[item.id] || []}
                                        onDeleteTransaction={confirmDeleteTransaction}
                                        t={t}
                                        filterMonth={filterMonth}
                                        getFilteredTransactions={getFilteredTransactions}
                                        language={language}
                                    />
                                ))}
                            </div>
                            {ironInventory.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    <p>No iron items found. Add one above.</p>
                                </div>
                            )}
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            {activeTab === 'cement' && (
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
                                <button className="btn btn-success" onClick={() => openModal('cement_in', item.id)}>
                                    <Plus size={18} /> {t('incoming')} ({t('truck')})
                                </button>
                                <button className="btn btn-danger" onClick={() => openModal('cement_out', item.id)}>
                                    <Minus size={18} /> {t('outgoing')} ({t('subcontractor')})
                                </button>
                            </div>

                            <div className="transaction-history">
                                <h4>{t('recentTransactions')}</h4>
                                <div className="history-list">
                                    {(cementTransactions[item.id] ? getFilteredTransactions(cementTransactions[item.id]) : []).slice(0, 5).map((trans) => (
                                        <div key={trans.id} className={`history-item ${trans.type.toLowerCase()}`}>
                                            <span className="trans-icon">{trans.type === 'IN' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}</span>
                                            <div className="trans-details">
                                                <span className="trans-desc">{trans.description}</span>
                                                <span className="trans-date">{trans.transaction_date || new Date(trans.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <span className="trans-qty">
                                                {trans.type === 'IN' ? '+' : '-'}{trans.quantity}
                                            </span>
                                            <button
                                                className="btn-delete-trans"
                                                onClick={() => confirmDeleteTransaction(trans.id)}
                                                title="Cancel Transaction"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!cementTransactions[item.id] || cementTransactions[item.id].length === 0) && (
                                        <p className="no-history">{t('noTransactions')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'gasoline' && (
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
                                <button className="btn btn-success" onClick={() => openModal('gasoline_in', item.id)}>
                                    <Plus size={18} /> {t('incoming')}
                                </button>
                                <button className="btn btn-danger" onClick={() => openModal('gasoline_out', item.id)}>
                                    <Minus size={18} /> {t('outgoing')}
                                </button>
                            </div>

                            <div className="transaction-history">
                                <h4>{t('recentTransactions')}</h4>
                                <div className="history-list">
                                    {(gasolineTransactions[item.id] ? getFilteredTransactions(gasolineTransactions[item.id]) : []).slice(0, 5).map((trans) => (
                                        <div key={trans.id} className={`history-item ${trans.type.toLowerCase()}`}>
                                            <span className="trans-icon">{trans.type === 'IN' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}</span>
                                            <div className="trans-details">
                                                <span className="trans-desc">{trans.description}</span>
                                                <span className="trans-date">{trans.transaction_date || new Date(trans.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <span className="trans-qty">
                                                {trans.type === 'IN' ? '+' : '-'}{trans.quantity}
                                            </span>
                                            <button
                                                className="btn-delete-trans"
                                                onClick={() => confirmDeleteTransaction(trans.id)}
                                                title="Cancel Transaction"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!gasolineTransactions[item.id] || gasolineTransactions[item.id].length === 0) && (
                                        <p className="no-history">{t('noTransactions')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('confirmCancellation')}</h3>
                        <p>{t('cancelTransactionConfirm')}</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>{t('noKeepIt')}</button>
                            <button className="btn btn-danger" onClick={handleDeleteTransaction}>{t('yesCancelIt')}</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteIronModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteIronModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('deleteIronItem')}</h3>
                        <p>{t('deleteIronConfirm')}</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteIronModal(false)}>{t('cancel')}</button>
                            <button className="btn btn-danger" onClick={handleDeleteIronItem}>{t('deleteTask')}</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteProductionModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteProductionModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('deleteProductionItem')}</h3>
                        <p>{t('deleteProductionConfirm')}</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteProductionModal(false)}>{t('cancel')}</button>
                            <button className="btn btn-danger" onClick={handleDeleteProductionItem}>{t('deleteTask')}</button>
                        </div>
                    </div>
                </div>
            )}



            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>
                            {modalType === 'production' && (editingItem ? t('editProductionItem') : t('addProductionItem'))}
                            {modalType === 'iron' && t('addIronType')}
                            {modalType === 'cement_in' && t('incomingCementStock')}
                            {modalType === 'cement_out' && t('outgoingCementStock')}
                            {modalType === 'gasoline_in' && t('incomingGasoline')}
                            {modalType === 'gasoline_out' && t('outgoingGasoline')}
                            {modalType === 'iron_in' && t('incomingIronStock')}
                            {modalType === 'iron_out' && t('outgoingIronStock')}
                        </h3>
                        {formError && (
                            <div className="modal-error">
                                <X size={16} />
                                <span>{formError}</span>
                            </div>
                        )}
                        <form onSubmit={handleAddItem}>

                            {modalType === 'production' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">{t('itemName')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <label className="form-label" style={{ margin: 0 }}>{t('category')}</label>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => setShowManageCategoriesModal(true)}
                                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', height: 'auto', minHeight: 'unset' }}
                                            >
                                                {t('manageCategories') || "Manage Categories"}
                                            </button>
                                        </div>
                                        <CustomDropdown
                                            options={categories.map(cat => cat.name)}
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            placeholder={t('selectCategory') || "Select Category"}
                                            allowAll={false}
                                        />
                                    </div>

                                    <div className="form-group-row">
                                        <div className="form-group">
                                            <label className="form-label">{t('targetQty')}</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={newItem.target_quantity}
                                                onChange={(e) => setNewItem({ ...newItem, target_quantity: parseInt(e.target.value) })}
                                                min="1"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('dailyRate')}</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={newItem.daily_rate}
                                                onChange={(e) => setNewItem({ ...newItem, daily_rate: parseInt(e.target.value) })}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group-row">
                                        <div className="form-group">
                                            <label className="form-label">{t('currentQty')}</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={newItem.current_quantity}
                                                onChange={(e) => setNewItem({ ...newItem, current_quantity: parseInt(e.target.value) })}
                                                min="0"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('moldCount')}</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={newItem.mold_count}
                                                onChange={(e) => setNewItem({ ...newItem, mold_count: parseInt(e.target.value) })}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {(modalType === 'production_in' || modalType === 'production_out') && (
                                <div className="form-group">
                                    <label className="form-label">
                                        {modalType === 'production_in' ? (t('quantityToAdd') || 'Quantity to Add') : (t('quantityToRemove') || 'Quantity to Remove')}
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={transaction.quantity}
                                        onChange={(e) => setTransaction({ ...transaction, quantity: parseInt(e.target.value) })}
                                        min="1"
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}

                            {modalType === 'iron' && (
                                <div className="form-group">
                                    <label className="form-label">{t('diameterType')}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={newIronItem.diameter}
                                        onChange={(e) => setNewIronItem({ ...newIronItem, diameter: e.target.value })}
                                        placeholder="e.g. Φ32"
                                        required
                                    />
                                    <div className="form-group" style={{ marginTop: '1rem' }}>
                                        <label className="form-label">{t('initialQuantity')}</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={newIronItem.quantity}
                                            onChange={(e) => setNewIronItem({ ...newIronItem, quantity: parseInt(e.target.value) })}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            )}

                            {(modalType === 'cement_in' || modalType === 'cement_out') && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">{t('date')}</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={transaction.date}
                                            onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('quantityBags')}</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={transaction.quantity}
                                            onChange={(e) => setTransaction({ ...transaction, quantity: parseInt(e.target.value) })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('description')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={transaction.description}
                                            onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                                            placeholder={modalType === 'cement_in' ? t('truckPlate') : t('subcontractorName')}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {(modalType === 'gasoline_in' || modalType === 'gasoline_out') && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">{t('date')}</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={transaction.date}
                                            onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('quantityLiters')}</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={transaction.quantity}
                                            onChange={(e) => setTransaction({ ...transaction, quantity: parseInt(e.target.value) })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('description')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={transaction.description}
                                            onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                                            placeholder={modalType === 'gasoline_in' ? t('truckPlate') : t('vehicleCheck')}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {(modalType === 'iron_in' || modalType === 'iron_out') && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">{t('date')}</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={transaction.date}
                                            onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('quantity')}</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={transaction.quantity}
                                            onChange={(e) => setTransaction({ ...transaction, quantity: parseInt(e.target.value) })}
                                            required
                                            min="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('description')}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={transaction.description}
                                            onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                                            placeholder={t('description')} // e.g. "Truck 123" or "Project X"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t('cancel')}</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? t('saving') : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReportModal && (
                <StorageReportModal
                    type={reportType}
                    data={reportType === 'cement' ? cementInventory : (reportType === 'gasoline' ? gasolineInventory : ironInventory)}
                    transactions={reportType === 'cement' ? cementTransactions : (reportType === 'gasoline' ? gasolineTransactions : ironTransactions)}
                    onClose={() => setShowReportModal(false)}
                    t={t}
                    language={language}
                    selectedItemId={reportItemId}
                />
            )}
            {showProductionReportModal && (
                <ProductionReportModal
                    data={productionItems}
                    onClose={() => setShowProductionReportModal(false)}
                    t={t}
                    language={language}
                />
            )}

            {showManageCategoriesModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowManageCategoriesModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>{t('manageCategories') || "Manage Categories"}</h3>
                            <button className="btn-icon" onClick={() => setShowManageCategoriesModal(false)}><X size={20} /></button>
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
                                />
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}><Plus size={24} /></button>
                            </form>
                        </div>

                        <div className="category-list">
                            {categories.map(cat => (
                                <div key={cat.id} className="category-item">
                                    <span>{cat.name}</span>
                                    <button
                                        className="btn-icon-action delete"
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        title={t('delete') || "Delete"}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showDeleteCategoryModal && (
                <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setShowDeleteCategoryModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('delete') || "Delete"}</h3>
                        <p>{t('confirmDeleteCategory') || "Are you sure you want to delete this category?"}</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteCategoryModal(false)}>{t('cancel') || "Cancel"}</button>
                            <button className="btn btn-danger" onClick={confirmDeleteCategoryAction}>{t('delete') || "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Storage;
