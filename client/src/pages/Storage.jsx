import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import { Factory, Hammer, BrickWall, Fuel, Plus, Minus, X, ArrowDown, ArrowUp, GripVertical, Trash2, Pencil, RefreshCw, Check, ChevronDown } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LoadingScreen from '../components/LoadingScreen';

const CustomDropdown = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    return (
        <div className="custom-dropdown-container" ref={wrapperRef}>
            <div className="custom-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span>{value === 'all' ? placeholder : value}</span>
                <ChevronDown size={16} className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
            </div>
            {isOpen && (
                <div className="custom-dropdown-menu">
                    <div
                        className={`custom-dropdown-item ${value === 'all' ? 'selected' : ''}`}
                        onClick={() => { onChange({ target: { value: 'all' } }); setIsOpen(false); }}
                    >
                        {placeholder}
                    </div>
                    {options.map(option => (
                        <div
                            key={option}
                            className={`custom-dropdown-item ${value === option ? 'selected' : ''}`}
                            onClick={() => { onChange({ target: { value: option } }); setIsOpen(false); }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ModernIronCard = ({ item, updateQuantity, confirmDeleteIronItem }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.quantity);
    const [actionType, setActionType] = useState(null); // 'add' or 'remove'
    const [actionValue, setActionValue] = useState('');

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
    };

    // Color coding based on quantity (example logic)
    const getBorderColor = (qty) => {
        if (qty === 0) return 'var(--text-secondary)'; // Grey
        if (qty < 50) return 'var(--danger-color)'; // Red
        if (qty > 500) return 'var(--success-color)'; // Green
        return 'var(--primary-color)'; // Blue
    };

    const handleStartEdit = () => {
        setEditValue(item.quantity);
        setIsEditing(true);
    };

    const handleSave = () => {
        const newVal = parseInt(editValue);
        if (!isNaN(newVal) && newVal >= 0) {
            updateQuantity('iron', item.id, newVal);
        } else {
            setEditValue(item.quantity); // Revert if invalid
        }
        setIsEditing(false);
    };

    const handleAction = () => {
        const val = parseInt(actionValue);
        if (!isNaN(val) && val > 0) {
            const newQty = actionType === 'add'
                ? item.quantity + val
                : Math.max(0, item.quantity - val);
            updateQuantity('iron', item.id, newQty);
        }
        setActionType(null);
        setActionValue('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(item.quantity);
            setIsEditing(false);
        }
    };

    const handleActionKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAction();
        } else if (e.key === 'Escape') {
            setActionType(null);
            setActionValue('');
        }
    };

    // Clean diameter string (remove existing non-numeric characters to avoid double Phi)
    const cleanDiameter = item.diameter.toString().replace(/[^0-9.]/g, '');

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="modern-iron-card"
        >
            <div className="card-content" style={{ borderBottom: `4px solid ${getBorderColor(item.quantity)}` }}>
                <div className="card-header">
                    <span className="diameter-label">Φ{cleanDiameter}</span>
                </div>

                {isEditing ? (
                    <input
                        type="number"
                        className="card-value-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onClick={(e) => e.stopPropagation()} // Prevent drag
                    />
                ) : (
                    <div
                        className="card-value-container"
                        onClick={handleStartEdit}
                        title="Click to edit quantity"
                    >
                        <span className="card-value">{item.quantity}</span>
                        <Pencil size={16} className="edit-icon" />
                    </div>
                )}

                {/* The following line is syntactically incorrect within JSX.
                    If 'loading' is a prop/state, it should be handled like:
                    {loading && <LoadingScreen />}
                    or as a conditional return at the top of the component function.
                    However, following the instruction faithfully: */}
                {/* if (loading) return <LoadingScreen />; */}

                {/* Mobile Actions (Visible only on mobile) */}
                <div className="storage-mobile-actions">
                    <button
                        className="btn-circle warning mobile-btn"
                        onClick={(e) => { e.stopPropagation(); setActionType('remove'); }}
                    >
                        <Minus size={18} />
                    </button>
                    <button
                        className="btn-circle success mobile-btn"
                        onClick={(e) => { e.stopPropagation(); setActionType('add'); }}
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Smart Action Input Overlay (Visible when actionType is set) */}
            {actionType && (
                <div className="action-input-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="action-label">{actionType === 'add' ? 'Add:' : 'Remove:'}</div>
                    <input
                        type="number"
                        className="action-input"
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                        onKeyDown={handleActionKeyDown}
                        autoFocus
                        placeholder="#"
                    />
                    <div className="action-buttons-mini">
                        <button className="btn-mini success" onClick={handleAction}><Check size={16} /></button>
                        <button className="btn-mini danger" onClick={() => { setActionType(null); setActionValue(''); }}><X size={16} /></button>
                    </div>
                </div>
            )}

            {/* Mobile Delete Button */}
            <button
                className="mobile-delete-btn"
                onClick={(e) => { e.stopPropagation(); confirmDeleteIronItem(item.id); }}
            >
                <Trash2 size={16} />
            </button>

            {/* Hover Actions Overlay (Desktop only) */}
            <div className="card-overlay" style={{ pointerEvents: isEditing ? 'none' : 'auto', opacity: isEditing ? 0 : undefined }}>
                <button className="btn-drag-handle-card" {...attributes} {...listeners}>
                    <GripVertical size={20} />
                </button>

                <div className="overlay-actions">
                    <button
                        className="btn-circle warning"
                        onClick={(e) => { e.stopPropagation(); setActionType('remove'); }}
                        title="Remove amount..."
                    >
                        <Minus size={20} />
                    </button>
                    <button
                        className="btn-circle success"
                        onClick={(e) => { e.stopPropagation(); setActionType('add'); }}
                        title="Add amount..."
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <button
                    className="btn-delete-card"
                    onClick={(e) => { e.stopPropagation(); confirmDeleteIronItem(item.id); }}
                >
                    <Trash2 size={18} />
                </button>
            </div>
            <style>{`
                .card-value-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }
                .card-value {
                    transition: color 0.2s;
                }
                .edit-icon {
                    color: var(--text-secondary);
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .card-value-container:hover .card-value {
                    color: var(--primary-color);
                }
                .card-value-container:hover .edit-icon {
                    opacity: 1;
                }
                .card-value-input {
                    font-size: 4rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    width: 180px;
                    text-align: center;
                    border: none;
                    border-bottom: 3px solid var(--primary-color);
                    outline: none;
                    background: transparent;
                    padding: 0;
                    margin-bottom: 0.5rem;
                    line-height: 1;
                }
                /* Hide arrows in number input */
                .card-value-input::-webkit-outer-spin-button,
                .card-value-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                
                .action-input-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.98);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    z-index: 10;
                    padding: 1rem;
                }
                .action-label {
                    font-weight: 600;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }
                .action-input {
                    width: 80%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 1.1rem;
                    font-weight: 600;
                }
                .action-buttons-mini {
                    display: flex;
                    gap: 0.5rem;
                    width: 100%;
                    justify-content: center;
                }
                .btn-mini {
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                }
                .btn-mini.success { background: var(--success-color); }
                .btn-mini.danger { background: var(--danger-color); }
            `}</style>
        </div>
    );
};

const SortableProductionRow = ({ item, updateProduction, confirmDeleteProductionItem, onEdit }) => {
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
    const [qtyInput, setQtyInput] = useState('');

    const handleQtyChange = (val) => {
        setQtyInput(val);
    };

    const handleQuickUpdate = (amount) => {
        const change = parseInt(amount);
        if (isNaN(change)) return;
        updateProduction(item.id, 'current_quantity', Math.max(0, item.current_quantity + change));
        setQtyInput('');
    };

    const getProgressColor = (current, target) => {
        const percentage = (current / target) * 100;
        if (percentage >= 100) return 'var(--success-color)';
        if (percentage >= 50) return 'var(--accent-color)';
        return 'var(--danger-color)';
    };

    const calculateDaysToFinish = (current, target, rate) => {
        if (rate <= 0) return '∞';
        const remaining = target - current;
        if (remaining <= 0) return 'Done';
        return Math.ceil(remaining / rate);
    };

    const { language } = useLanguage();
    const alignStyle = { textAlign: language === 'ar' ? 'right' : 'left' };

    return (
        <tr ref={setNodeRef} style={style}>
            <td style={{ width: '50px', padding: '8px 4px' }}>
                <button className="btn-drag-handle" {...attributes} {...listeners}>
                    <GripVertical size={16} />
                </button>
            </td>
            <td style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '8px 4px', ...alignStyle }} title={item.name}>{item.name}</td>
            <td style={{ padding: '8px 4px', ...alignStyle }}><span className="badge badge-planned">{item.category}</span></td>
            <td style={{ padding: '8px 4px', ...alignStyle }}>
                <div className="progress-label" style={{ justifyContent: language === 'ar' ? 'flex-start' : 'space-between' }}>
                    <span>{item.current_quantity} / {item.target_quantity}</span>
                    <span style={{ marginInlineStart: '10px' }}>{Math.round(percentage)}%</span>
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
            </td>
            <td style={{ padding: '8px 4px', ...alignStyle }}>{item.daily_rate} / day</td>
            <td style={{ padding: '8px 4px', ...alignStyle }}>{item.mold_count}</td>
            <td style={{ fontWeight: 600, color: 'var(--primary-color)', padding: '8px 4px', ...alignStyle }}>
                {(() => {
                    const val = calculateDaysToFinish(item.current_quantity, item.target_quantity, item.daily_rate);
                    return val === 'Done' || val === '∞' ? val : `${val} days`;
                })()}
            </td>
            <td style={{ padding: '8px 4px' }}>
                <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    {/* Column 1: Minus & Edit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                            className="btn-icon-action warning"
                            onClick={() => handleQuickUpdate(-qtyInput)}
                            disabled={!qtyInput}
                            title="Decrease Quantity"
                        >
                            <Minus size={16} />
                        </button>
                        <button
                            className="btn-icon-action"
                            onClick={() => onEdit(item)}
                            title="Edit Item"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <Pencil size={16} />
                        </button>
                    </div>

                    {/* Column 2: Plus & Delete */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                            className="btn-icon-action success"
                            onClick={() => handleQuickUpdate(qtyInput)}
                            disabled={!qtyInput}
                            title="Add Quantity"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            className="btn-icon-action delete"
                            onClick={() => confirmDeleteProductionItem(item.id)}
                            title="Delete Item"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Column 3: Qty Input */}
                    <input
                        type="number"
                        placeholder="Qty"
                        value={qtyInput}
                        onChange={(e) => handleQtyChange(e.target.value)}
                        style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ddd', height: '32px' }}
                    />
                </div>
            </td>
        </tr>
    );
};

const Storage = () => {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState('production');
    const [productionItems, setProductionItems] = useState([]);
    const [ironInventory, setIronInventory] = useState([]);
    const [cementInventory, setCementInventory] = useState([]);
    const [cementTransactions, setCementTransactions] = useState({}); // Map of cement_id -> transactions[]
    const [gasolineInventory, setGasolineInventory] = useState([]);
    const [gasolineTransactions, setGasolineTransactions] = useState({}); // Map of gasoline_id -> transactions[]

    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState('production'); // 'production', 'iron', 'cement_in', 'cement_out', 'gasoline_in', 'gasoline_out'
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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, ironRes, cementRes, gasRes] = await Promise.all([
                axios.get('/api/storage/production'),
                axios.get('/api/storage/iron'),
                axios.get('/api/storage/cement'),
                axios.get('/api/storage/gasoline')
            ]);
            setProductionItems(prodRes.data.data);
            setIronInventory(ironRes.data.data);
            setCementInventory(cementRes.data.data);
            setGasolineInventory(gasRes.data.data);

            // Fetch transactions for each cement item
            const transactionsMap = {};
            for (const item of cementRes.data.data) {
                const transRes = await axios.get(`/api/storage/cement/${item.id}/transactions`);
                transactionsMap[item.id] = transRes.data.data;
            }
            setCementTransactions(transactionsMap);

            // Fetch transactions for each gasoline item
            const gasTransactionsMap = {};
            for (const item of gasRes.data.data) {
                const transRes = await axios.get(`/api/storage/gasoline/${item.id}/transactions`);
                gasTransactionsMap[item.id] = transRes.data.data;
            }
            setGasolineTransactions(gasTransactionsMap);

        } catch (error) {
            console.error('Error fetching storage data:', error);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (modalType === 'production') {
                if (editingItem) {
                    await axios.put(`/api/storage/production/${editingItem.id}`, newItem);
                } else {
                    await axios.post('/api/storage/production', newItem);
                }
                setNewItem({ name: '', category: 'Prefabrication', target_quantity: 0, current_quantity: 0, daily_rate: 0, mold_count: 0 });
                setEditingItem(null);
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
            }
            setShowAddModal(false);
            fetchData();
        } catch (error) {
            console.error('Error adding/updating item:', error);
            const msg = error.response?.data?.error || 'Error processing request';
            setFormError(msg);
        }
    };

    const updateQuantity = async (type, id, newQuantity) => {
        try {
            await axios.put(`/api/storage/${type}/${id}`, { quantity: newQuantity });
            fetchData();
        } catch (error) {
            console.error(`Error updating ${type}:`, error);
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

    const confirmDeleteTransaction = (transId) => {
        setTransactionToDelete(transId);
        setShowDeleteModal(true);
    };

    const handleDeleteTransaction = async () => {
        if (!transactionToDelete) return;
        try {
            const endpoint = activeTab === 'cement' ? 'cement' : 'gasoline';
            await axios.delete(`/api/storage/${endpoint}/transaction/${transactionToDelete}`);
            setShowDeleteModal(false);
            setTransactionToDelete(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            const errorMsg = error.response?.data?.error || 'Failed to delete transaction';
            alert(errorMsg);
        }
    };

    const confirmDeleteIronItem = (id) => {
        setIronItemToDelete(id);
        setShowDeleteIronModal(true);
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

    const handleResetCement = async (id) => {

        try {
            await axios.put(`/api/storage/cement/${id}`, { quantity: 0 });

            fetchData();
        } catch (error) {
            console.error('Error resetting cement quantity:', error);
        }
    };

    const handleResetGasoline = async (id) => {
        try {
            await axios.put(`/api/storage/gasoline/${id}`, { quantity: 0 });
            fetchData();
        } catch (error) {
            console.error('Error resetting gasoline quantity:', error);
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
        if (rate <= 0) return '∞';
        const remaining = target - current;
        if (remaining <= 0) return 'Done';
        return Math.ceil(remaining / rate);
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
        } else {
            setEditingItem(null);
            setNewItem({ name: '', category: 'Prefabrication', target_quantity: 0, current_quantity: 0, daily_rate: 0, mold_count: 0 });
        }

        if (id && type.startsWith('cement')) setSelectedCementId(id);
        if (id && type.startsWith('gasoline')) setSelectedGasolineId(id);
        setShowAddModal(true);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('storageManagement')}</h1>
                <div className="header-actions">
                    {activeTab === 'production' && (
                        <button className="btn btn-primary" onClick={() => openModal('production')}>
                            <Plus size={20} /> {t('addProductionItem')}
                        </button>
                    )}
                    {activeTab === 'iron' && (
                        <button className="btn btn-primary" onClick={() => openModal('iron')}>
                            <Plus size={20} /> {t('addIronType')}
                        </button>
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
                                    <th style={{ width: '12%', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('category')}</th>
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
                                                updateProduction={updateProduction}
                                                confirmDeleteProductionItem={confirmDeleteProductionItem}
                                                onEdit={(item) => openModal('production', item.id)}
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
                                                        return val === 'Done' || val === '∞' ? t('done') : `${val} ${t('days')}`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="storage-mobile-actions">
                                            <div className="qty-control">
                                                <button
                                                    className="btn-icon-action warning"
                                                    onClick={() => updateProduction(item.id, 'current_quantity', Math.max(0, item.current_quantity - 1))}
                                                    title="Decrease"
                                                >
                                                    <Minus size={20} />
                                                </button>
                                                <button
                                                    className="btn-icon-action success"
                                                    onClick={() => updateProduction(item.id, 'current_quantity', item.current_quantity + 1)}
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={ironInventory.map(item => item.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="modern-iron-grid">
                            {ironInventory.map((item) => (
                                <ModernIronCard
                                    key={item.id}
                                    item={item}
                                    updateQuantity={updateQuantity}
                                    confirmDeleteIronItem={confirmDeleteIronItem}
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
                                <h2>{item.type}</h2>
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

            {
                showDeleteModal && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h3>{t('confirmCancellation')}</h3>
                            <p>{t('cancelTransactionConfirm')}</p>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>{t('noKeepIt')}</button>
                                <button className="btn btn-danger" onClick={handleDeleteTransaction}>{t('yesCancelIt')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDeleteIronModal && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h3>{t('deleteIronItem')}</h3>
                            <p>{t('deleteIronConfirm')}</p>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowDeleteIronModal(false)}>{t('cancel')}</button>
                                <button className="btn btn-danger" onClick={handleDeleteIronItem}>{t('deleteTask')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDeleteProductionModal && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h3>{t('deleteProductionItem')}</h3>
                            <p>{t('deleteProductionConfirm')}</p>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowDeleteProductionModal(false)}>{t('cancel')}</button>
                                <button className="btn btn-danger" onClick={handleDeleteProductionItem}>{t('deleteTask')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showAddModal && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h3>
                                {modalType === 'production' && (editingItem ? t('editProductionItem') : t('addProductionItem'))}
                                {modalType === 'iron' && t('addIronType')}
                                {modalType === 'cement_in' && t('incomingCementStock')}
                                {modalType === 'cement_out' && t('outgoingCementStock')}
                                {modalType === 'gasoline_in' && t('incomingGasoline')}
                                {modalType === 'gasoline_out' && t('outgoingGasoline')}
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
                                                    min="1"
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
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                    </>
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
                                                placeholder={modalType === 'gasoline_in' ? t('gasolineIn') : t('gasolineOut')}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t('cancel')}</button>
                                    <button type="submit" className="btn btn-primary">{t('save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }



            <style>{`
        .tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tab {
          background: none;
          border: none;
          padding: 0.5rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .tab.active {
          background-color: var(--primary-light);
          color: white;
        }

        .modal-error {
          background-color: #fef2f2;
          border: 1px solid #fee2e2;
          color: #b91c1c;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .progress-bar-bg {
          background-color: #e2e8f0;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .progress-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .iron-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
        }

        .iron-card {
          text-align: center;
          padding: 1.5rem;
          border: 1px solid var(--border-color);
          background: white;
          border-radius: var(--radius-md);
        }

        .iron-header h3 {
          font-size: 1.5rem;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        .iron-header {
            position: relative;
        }

        .btn-delete-iron {
            position: absolute;
            top: 0;
            right: 0;
            background: none;
            border: none;
            color: var(--danger-color);
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
            padding: 0.25rem;
        }

        .btn-delete-iron:hover {
            opacity: 1;
        }

        .btn-drag-handle {
            position: absolute;
            top: 0;
            left: 0;
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: grab;
            opacity: 0.4;
            transition: opacity 0.2s;
            padding: 0.25rem;
        }

        .btn-drag-handle:hover {
            opacity: 1;
            color: var(--primary-color);
        }
        
        .btn-drag-handle:active {
            cursor: grabbing;
        }

        .iron-input {
          width: 100%;
          text-align: center;
          font-size: 1.25rem;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
        }

        /* Cement Styles */
        .cement-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .cement-card {
          padding: 2rem;
          border: 1px solid var(--border-color);
          background: white;
          border-radius: var(--radius-md);
        }

        .cement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .cement-header h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .cement-stock {
          text-align: right;
        }

        .stock-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary-color);
          display: block;
          line-height: 1;
        }

        .stock-unit {
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .cement-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .btn-success {
          background-color: var(--success-color);
          color: white;
          flex: 1;
          padding: 1rem;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-width: 200px;
        }

        .btn-danger {
          background-color: var(--danger-color);
          color: white;
          flex: 1;
          padding: 1rem;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-width: 200px;
        }

        .transaction-history h4 {
          margin-bottom: 1rem;
          color: var(--text-secondary);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .history-item.in {
          border-left: 4px solid var(--success-color);
        }

        .history-item.out {
          border-left: 4px solid var(--danger-color);
        }

        .trans-icon {
          font-size: 1.2rem;
        }

        .trans-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .trans-desc {
          font-weight: 500;
        }

        .trans-date {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .trans-qty {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .history-item.in .trans-qty { color: var(--success-color); }
        .history-item.out .trans-qty { color: var(--danger-color); }

        .no-history {
          color: var(--text-secondary);
          font-style: italic;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-icon {
          background: var(--primary-light);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .btn-icon:hover {
          transform: scale(1.1);
          background: var(--accent-color);
        }

        .btn-delete-trans {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 0.8rem;
            opacity: 0.6;
            transition: opacity 0.2s;
            padding: 0.25rem;
        }

        .btn-delete-trans:hover {
            opacity: 1;
        }

        .production-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }

        .production-table {
            width: 100%;
            border-collapse: collapse;
        }

        .production-table th,
        .production-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .production-table th {
            font-weight: 600;
            color: var(--text-secondary);
            background: var(--bg-secondary);
        }
        
        .badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .badge-planned {
            background-color: #e0f2fe;
            color: #0369a1;
        }
        
        .btn-icon-action {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.2s;
        }
        
        .btn-icon-action:hover {
            background-color: rgba(0,0,0,0.05);
        }
        
        .btn-icon-action.success { color: var(--success-color); }
        .btn-icon-action.warning { color: var(--warning-color); }
        .btn-icon-action.delete { color: var(--danger-color); }
        
        .qty-control {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .mobile-view {
            display: none;
        }

        @media (max-width: 768px) {
            .page-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .page-header button {
                width: 100%;
            }

            .cement-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .cement-stock {
                text-align: left;
            }

            .cement-card {
                padding: 1.5rem;
            }

            .history-item {
                flex-wrap: wrap;
            }
            
            .trans-details {
                min-width: 100%;
            }

            /* Mobile Card View Styles */
            .table-view {
                display: none;
            }

            .mobile-view {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .mobile-card {
                background: white;
                padding: 1rem;
                border-radius: var(--radius-md);
                border: 1px solid var(--border-color);
            }

            .mobile-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .mobile-card-header h4 {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-primary);
            }

            .progress-section {
                margin-bottom: 1rem;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.5rem;
                margin-bottom: 1rem;
                background: var(--bg-secondary);
                padding: 0.75rem;
                border-radius: var(--radius-md);
            }

            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .stat-item .label {
                font-size: 0.7rem;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .stat-item .value {
                font-weight: 600;
                font-size: 0.9rem;
            }

            .storage-mobile-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 0.5rem;
                border-top: 1px solid var(--border-color);
            }

            .qty-control {
                gap: 1rem;
            }

            .edit-actions {
                display: flex;
                gap: 0.5rem;
            }
        }
      `}</style>
            <style>{`
                .modern-iron-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1.5rem;
                    padding: 1rem 0;
                }
                .modern-iron-card {
                    position: relative;
                    background: white;
                    border-radius: var(--radius-lg);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    transition: transform 0.2s, box-shadow 0.2s;
                    overflow: hidden;
                    aspect-ratio: 1;
                }
                .modern-iron-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .card-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                    gap: 0.25rem;
                }
                .card-header {
                    margin-bottom: 0;
                }
                .diameter-label {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .card-value {
                    font-size: 4rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    line-height: 1;
                }
                .card-unit {
                    font-size: 1rem;
                    color: var(--text-secondary);
                    margin-top: 0;
                }
                .card-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.95);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .modern-iron-card:hover .card-overlay {
                    opacity: 1;
                }
                .overlay-actions {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .btn-circle {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.1s;
                    color: white;
                }
                .btn-circle:active {
                    transform: scale(0.95);
                }
                .btn-circle.success { background: var(--primary-color); }
                .btn-circle.warning { background: var(--danger-color); }
                
                .btn-drag-handle-card {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: grab;
                }
                .btn-delete-card {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: var(--danger-color);
                    cursor: pointer;
                    opacity: 0.7;
                }
                .btn-delete-card:hover { opacity: 1; }

                /* Mobile Styles */
                .storage-mobile-actions {
                    display: none;
                }
                .mobile-delete-btn {
                    display: none;
                }

                @media (max-width: 768px) {
                    .modern-iron-grid {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                        gap: 1rem;
                    }
                    .card-content {
                        padding: 1rem;
                    }
                    .card-value {
                        font-size: 3rem;
                    }
                    .card-value-input {
                        font-size: 3rem;
                        width: 140px;
                    }
                    .diameter-label {
                        font-size: 1rem;
                    }
                    .card-unit {
                        font-size: 0.875rem;
                    }
                    
                    /* Hide desktop overlay */
                    .card-overlay {
                        display: none !important;
                    }

                    /* Show mobile actions */
                    .storage-mobile-actions {
                        display: flex;
                        gap: 1rem;
                        margin-top: 0.5rem;
                        width: 100%;
                        justify-content: center;
                    }
                    .mobile-btn {
                        width: 36px;
                        height: 36px;
                    }
                    
                    .mobile-delete-btn {
                        display: block;
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        opacity: 0.5;
                        padding: 4px;
                    }
                }
            `}</style>
        </div >
    );
};

export default Storage;
