import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Factory, Hammer, BrickWall, Fuel, Plus, Minus, X, ArrowDown, ArrowUp, GripVertical, Trash2, Pencil, RefreshCw, Check, ChevronDown, FileText } from 'lucide-react';
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

const StorageReportModal = ({ type, data, transactions, onClose, t, language, selectedItemId = null }) => {
    // ... (lines 307-534 remain same, only title logic updates below)

    // Determine correct Modal Title
    const isAr = language === 'ar';
    let modalTitle = "";

    // Helper for formatting
    const formatTitle = (typeTrans, monthRepTrans) => {
        return isAr ? `${monthRepTrans} ${typeTrans}` : `${typeTrans} ${monthRepTrans}`;
    };

    if (type === 'cement') modalTitle = formatTitle(t('cement'), t('monthReport'));
    else if (type === 'iron') {
        // Check if individual item selected
        if (selectedItemId) {
            const selectedItem = data.find(i => i.id === selectedItemId);
            // Sanitize diameter for display
            const d = selectedItem ? String(selectedItem.diameter).replace(/[^0-9.]/g, '') : '';

            if (isAr) {
                // Arabic: "Report Diameter 6" -> "تقرير قطر 6"
                modalTitle = selectedItem ? `${t('report')} ${t('diameter')} ${d}` : formatTitle(t('iron'), t('monthReport'));
            } else {
                // English: "Diameter 6 Report"
                modalTitle = selectedItem ? `${t('diameter')} ${d} ${t('report')}` : formatTitle(t('iron'), t('monthReport'));
            }
        } else {
            modalTitle = formatTitle(t('iron'), t('monthReport'));
        }
    }
    else modalTitle = formatTitle(t('fuel'), t('monthReport'));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    console.log("StorageReportModal type:", type, "selectedItemId:", selectedItemId);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const generateStoragePDF = async () => {
        setLoading(true);
        // Format Helper: DD/MM/YYYY
        const formatDisplayDate = (d) => {
            if (!d) return '-';
            const dateObj = d instanceof Date ? d : new Date(d);
            if (isNaN(dateObj.getTime())) return '-';
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${day}/${m}/${y}`;
        };
        try {
            const doc = new jsPDF();

            // Filter Data if selectedItemId is present
            let reportData = data;
            if (selectedItemId) {
                reportData = data.filter(item => item.id === selectedItemId);
            }

            // Load Logo
            let logoImg = null;
            try {
                logoImg = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = '/logo_circular.png';
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(e);
                });
            } catch (err) { console.warn("Logo load failed", err); }

            // Title
            const monthName = months[selectedMonth];

            let reportTitle = "";
            if (type === 'cement') {
                reportTitle = "Cement Month Report";
            } else if (type === 'iron') {
                reportTitle = "Iron Month Report";
            } else {
                reportTitle = "Fuel Month Report";
            }

            if (selectedItemId && reportData.length > 0) {
                const item = reportData[0];
                const cleanDiameter = item.diameter ? String(item.diameter).replace(/[^0-9.]/g, '') : '';
                const itemName = item.type || item.name || (cleanDiameter ? `Diameter ${cleanDiameter}` : 'Item');
                reportTitle = `${itemName} Report`;
            }
            const title = `${reportTitle} - ${monthName} ${selectedYear}`;

            // Dates
            // Report covers 1st to Last Day of the selected month
            // Start Date: 1st of selected month year
            const startDate = new Date(selectedYear, selectedMonth, 1);
            // End Date: 0th day of next month (= last day of selected month)
            const endDate = new Date(selectedYear, selectedMonth + 1, 0);

            // Adjust to end of day to include all transactions on that final day if relying on timestamp comparison (but we use string split)
            // For simple string comparison YYYY-MM-DD, strict equality is fine.

            // However, to be safe with timezone issues, explicitly set components or just use manual formatting:
            const format = (d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };

            const startStr = format(startDate);
            const endStr = format(endDate);

            // Header
            if (logoImg) {
                doc.addImage(logoImg, 'PNG', 14, 8, 20, 20 * (logoImg.height / logoImg.width));
            }
            doc.setFontSize(18);
            doc.setTextColor(0, 51, 102);
            doc.setFont("helvetica", "bold");
            doc.text("Arab Contractors Cameroon", 105, 18, { align: "center" });

            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.setFont("helvetica", "normal");
            doc.text(title, 105, 26, { align: "center" });
            doc.text(`Period: ${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`, 105, 32, { align: "center" });

            doc.setDrawColor(200);
            doc.line(14, 36, 196, 36);

            let yPos = 45;

            // Iterate Items
            for (let i = 0; i < reportData.length; i++) {
                const item = reportData[i];
                const itemTrans = transactions[item.id] || [];

                // 1. Calculate Opening Balance
                let openingBalance = 0;

                itemTrans.forEach(tx => {
                    // Compare simple strings YYYY-MM-DD
                    const txDateStr = tx.transaction_date || (tx.timestamp ? tx.timestamp.split('T')[0] : '');
                    if (txDateStr && txDateStr < startStr) {
                        if (tx.type === 'IN') openingBalance += tx.quantity;
                        else openingBalance -= tx.quantity;
                    }
                });
                if (openingBalance < 0) openingBalance = 0;

                // 2. Filter Period Transactions
                const periodTrans = itemTrans.filter(tx => {
                    const d = tx.transaction_date || (tx.timestamp ? tx.timestamp.split('T')[0] : '');
                    return d >= startStr && d <= endStr;
                }).sort((a, b) => {
                    const da = a.transaction_date || a.timestamp;
                    const db = b.transaction_date || b.timestamp;
                    return new Date(da) - new Date(db);
                });

                // 3. Totals
                let totalIn = 0;
                let totalOut = 0;
                let running = openingBalance;

                const tableRows = periodTrans.map(tx => {
                    if (tx.type === 'IN') totalIn += tx.quantity;
                    else totalOut += tx.quantity;

                    if (tx.type === 'IN') running += tx.quantity;
                    else running -= tx.quantity;

                    return [
                        formatDisplayDate(tx.transaction_date || tx.timestamp),
                        tx.description || '-',
                        tx.type === 'IN' ? 'Incoming' : 'Outgoing',
                        tx.quantity,
                        running
                    ];
                });

                const closingBalance = openingBalance + totalIn - totalOut;

                // --- Render Item Section ---

                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(0, 51, 102);
                doc.setFont("helvetica", "bold");

                // Fix Item Title (Handle Iron diameter)
                const cleanDiameter = item.diameter ? String(item.diameter).replace(/[^0-9.]/g, '') : '';
                const itemDisplayName = item.type || item.name || (cleanDiameter ? `Diameter ${cleanDiameter}` : `Item ID: ${item.id}`);
                doc.text(itemDisplayName, 14, yPos);

                yPos += 8;
                doc.setFillColor(248, 250, 252);
                doc.setDrawColor(226, 232, 240);
                doc.rect(14, yPos - 5, 182, 12, 'FD');
                doc.setFontSize(10);
                doc.setTextColor(50);

                // Adjust text positions for cleanliness
                doc.text(`Opening Balance: ${openingBalance}`, 18, yPos + 2);
                doc.text(`Total In: ${totalIn}`, 70, yPos + 2);
                doc.text(`Total Out: ${totalOut}`, 110, yPos + 2);
                doc.text(`Closing Balance: ${closingBalance}`, 190, yPos + 2, { align: 'right' });

                yPos += 10;

                if (periodTrans.length > 0) {
                    autoTable(doc, {
                        startY: yPos,
                        head: [['Date', 'Description', 'Type', 'Quantity', 'Running Balance']],
                        body: tableRows,
                        theme: 'grid',
                        headStyles: { fillColor: [51, 65, 85], fontSize: 9, halign: 'center' },
                        bodyStyles: { fontSize: 8, halign: 'center', textColor: 50 },
                        margin: { left: 14, right: 14 },
                        didParseCell: function (data) {
                            if (data.section === 'body' && data.column.index === 2) {
                                if (data.cell.raw === 'Incoming') {
                                    data.cell.styles.textColor = [22, 163, 74];
                                    data.cell.styles.fontStyle = 'bold';
                                } else {
                                    data.cell.styles.textColor = [220, 38, 38];
                                    data.cell.styles.fontStyle = 'bold';
                                }
                            }
                        }
                    });
                    yPos = doc.lastAutoTable.finalY + 15;
                } else {
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "italic");
                    doc.setTextColor(150);
                    doc.text("No transactions in this period", 14, yPos + 5);
                    yPos += 15;
                }
            }

            doc.save(`${type}_Report_${months[selectedMonth]}_${selectedYear}.pdf`);
            onClose();

        } catch (err) {
            console.error(err);
            alert("Error generating PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '400px', position: 'relative' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(255,255,255,0.95)', zIndex: 10,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px'
                    }}>
                        <div className="spinner" style={{
                            width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary-color)',
                            borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem'
                        }}></div>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{t('loading')}</h4>
                    </div>
                )}
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>{modalTitle}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <div className="form-group">
                    <label className="form-label">{t('month')}</label>
                    <select className="form-input" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                        {months.map((m, i) => <option key={i} value={i}>{t(m.toLowerCase()) !== m.toLowerCase() ? t(m.toLowerCase()) : m}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">{t('year')}</label>
                    <input type="number" className="form-input" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} />
                </div>
                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('cancel')}</button>
                    <button className="btn btn-primary" onClick={generateStoragePDF} disabled={loading}>{t('generatePDF')}</button>
                </div>
            </div>
        </div>
    );
};

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
    const [reportType, setReportType] = useState('cement'); // 'cement' or 'gasoline' or 'iron'
    const [reportItemId, setReportItemId] = useState(null);

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
                        <button className="btn btn-primary" onClick={() => openModal('production')}>
                            <Plus size={20} /> {t('addProductionItem')}
                        </button>
                    )}
                    {activeTab === 'iron' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => openReportModal('iron')}>
                                <FileText size={20} /> {t('monthReport')}
                            </button>
                            <button className="btn btn-primary" onClick={() => openModal('iron')}>
                                <Plus size={20} /> {t('addIronType')}
                            </button>
                        </div>
                    )}
                    {activeTab === 'cement' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => openReportModal('cement')}>
                                <FileText size={20} /> {t('monthReport')}
                            </button>
                        </div>
                    )}
                    {activeTab === 'gasoline' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => openReportModal('gasoline')}>
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
                                        CustomDropdown={CustomDropdown}
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
                                                placeholder={modalType === 'gasoline_in' ? t('gasolineIn') : t('gasolineOut')}
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
                                            <label className="form-label">{t('quantityUnits') || 'Quantity (Units)'}</label>
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
                                                placeholder={modalType === 'iron_in' ? t('supplier') : t('subcontractor')}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={submitting}>{t('cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <span className="spinner-small"></span> {t('saving') || 'Saving...'}
                                            </>
                                        ) : t('save')}
                                    </button>
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

        @media (max-width: 640px) {
            .tabs {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
                padding-bottom: 0;
                border-bottom: none;
            }
            .tab {
                justify-content: center;
                font-size: 0.9rem;
                padding: 0.6rem 0.5rem;
                width: 100%;
            }
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
            {showReportModal && (
                <StorageReportModal
                    type={reportType}
                    data={reportType === 'cement' ? cementInventory : reportType === 'iron' ? ironInventory : gasolineInventory}
                    transactions={reportType === 'cement' ? cementTransactions : reportType === 'iron' ? ironTransactions : gasolineTransactions}
                    onClose={() => setShowReportModal(false)}
                    t={t}
                    language={language}
                    selectedItemId={reportItemId}
                />
            )}
        </div >
    );
};

export default Storage;
