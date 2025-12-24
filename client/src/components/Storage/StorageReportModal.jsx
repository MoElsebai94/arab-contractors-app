import React, { useState } from 'react';
import CustomDropdown from './CustomDropdown';

// ... (keep existing imports)
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X } from 'lucide-react';

const StorageReportModal = ({ type, data, transactions, onClose, t, language, selectedItemId = null }) => {
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
                    <CustomDropdown
                        options={months.map((m, i) => ({ value: i, label: t(m.toLowerCase()) !== m.toLowerCase() ? t(m.toLowerCase()) : m }))}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        placeholder={t('selectMonth')}
                    />
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

export default StorageReportModal;
