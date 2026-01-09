import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Trash2, FileText, Download, ChevronDown } from 'lucide-react';

const DemandeAchatForm = () => {
    const [project, setProject] = useState('');
    const [director, setDirector] = useState('Ing. EL-BADAWY MOHAMADY');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([
        { designation: '', unit: 'PCS', quantity: 0 }
    ]);
    const [loading, setLoading] = useState(false);

    const addItem = () => {
        setItems([...items, { designation: '', unit: 'PCS', quantity: 0 }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const generatePDF = async () => {
        setLoading(true);
        try {
            const doc = new jsPDF({ format: 'a4', unit: 'mm' });
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            // --- 1. Load Logo ---
            let logoImg = null;
            try {
                logoImg = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = '/logo_circular.png'; // Assuming this exists based on previous file
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(e);
                });
            } catch (err) { console.warn("Logo load failed", err); }

            // --- 2. Header ---
            if (logoImg) {
                doc.addImage(logoImg, 'PNG', 10, 5, 25, 25 * (logoImg.height / logoImg.width));
            }

            // Company Name
            doc.setFontSize(16);
            doc.setTextColor(0, 100, 0); // Dark Green
            doc.setFont("helvetica", "bold");
            doc.text("ARAB CONTRACTORS CAMEROON LTD", 40, 12);

            // Address Details
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            const address = "Avenue Jean Paul II, P. O. Box : 12995 Yaounde Tel : +237 222 013 306 Fax : +237 222 202 511";
            const niu = "NIU : M050600020713W - RC/YAO/2006/B/1416 - N° CNPS : 321-0104759-L";
            doc.text(address, 40, 18);
            doc.text(niu, 40, 23);

            // Blue Horizontal Line
            doc.setDrawColor(0, 51, 153); // Blue
            doc.setLineWidth(1);
            doc.line(10, 33, pageWidth - 10, 33);

            // Project Info
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`PROJET : ${project.toUpperCase()}`, 20, 40);

            // Format Date: OKOLA LE DD / MM / YYYY
            const dateObj = new Date(date);
            const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')} / ${(dateObj.getMonth() + 1).toString().padStart(2, '0')} / ${dateObj.getFullYear()}`;
            doc.text(`OKOLA LE  ${formattedDate}`, 20, 48);

            // --- 3. Blue Title Box ---
            // Draw rounded rectangle
            doc.setFillColor(70, 130, 180); // Steel Blue-ish
            doc.setDrawColor(50, 50, 50);
            doc.setLineWidth(0.5);

            // Using a slightly complex shape to mimic the reference button-like look? 
            // For now, a simple rounded rect with a shadow effect or border
            doc.roundedRect(50, 55, pageWidth - 100, 12, 3, 3, 'F');
            doc.setDrawColor(0);
            doc.roundedRect(50, 55, pageWidth - 100, 12, 3, 3, 'S');

            doc.setTextColor(255, 255, 255); // White text
            doc.setFontSize(14);
            doc.text("DEMANDE D'ACHAT", pageWidth / 2, 63, { align: 'center' });


            // --- 4. Items Table ---
            const tableHeaders = [['N°', 'DÉSIGNATION', 'UNITÉ', 'QUANTITÉ']];
            const tableData = items.map((item, index) => [
                index + 1,
                item.designation.toUpperCase(),
                item.unit.toUpperCase(),
                item.quantity
            ]);

            // Add extra empty rows to fill space if needed, or just let the Z line handle it
            // The reference has a fixed grid look. Let's create a fixed number of rows or at least enough to look like the sheet.
            // Let's ensure we have at least 15 rows for the look
            const minRows = 15;
            const emptyRowsCount = Math.max(0, minRows - items.length);
            for (let i = 0; i < emptyRowsCount; i++) {
                tableData.push(['', '', '', '']);
            }

            autoTable(doc, {
                startY: 75,
                head: tableHeaders,
                body: tableData,
                theme: 'grid',
                headStyles: {
                    fillColor: [200, 200, 200], // Grey header
                    textColor: 0,
                    fontStyle: 'bold',
                    lineColor: 0,
                    lineWidth: 0.1,
                    halign: 'center'
                },
                bodyStyles: {
                    textColor: 0,
                    lineColor: 0,
                    lineWidth: 0.1,
                    minCellHeight: 8
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    1: { halign: 'left' },
                    2: { halign: 'center', cellWidth: 30 },
                    3: { halign: 'center', cellWidth: 30 },
                },
                didDrawCell: (data) => {
                    // Capture the Y position of the last real item
                    if (data.section === 'body' && data.row.index === items.length - 1) {
                        doc.lastRealItemY = data.cell.y + data.cell.height;
                    }
                }
            });

            // --- 5. Hash/Diagonal Line over Empty Rows ---
            if (doc.lastRealItemY) {
                const finalY = doc.lastAutoTable.finalY;

                // Ensure we have space to draw
                if (finalY > doc.lastRealItemY) {
                    doc.setDrawColor(0); // Black
                    doc.setLineWidth(0.5);

                    // Draw Z-pattern or simple Diagonal
                    // Top horizontal is already the row border.
                    // Draw diagonal from Top-Left of empty area to Bottom-Right
                    doc.line(14, doc.lastRealItemY, pageWidth - 14, finalY);

                    // Optional: Bottom horizontal is already the table border
                }
            }

            // --- 6. Footer ---
            // Signatures
            const footerY = pageHeight - 60; // Fixed position higher up

            // Check if we need to add a page if the table ended too low?
            // With margin bottom 40, autoTable should handle page breaks.
            // We just need to draw the footer on the last page.

            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0); // Ensure black text
            doc.setFont("helvetica", "bold");

            const signatureTitle = "LE DIRECTEUR DU PROJET";
            const titleWidth = doc.getTextWidth(signatureTitle);
            const signatureX = pageWidth - 60;

            doc.text(signatureTitle, signatureX, footerY, { align: 'center' });
            // Draw underline
            doc.setLineWidth(0.5);
            doc.line(signatureX - (titleWidth / 2), footerY + 1, signatureX + (titleWidth / 2), footerY + 1);

            doc.text(`Ing. ${director.toUpperCase()}`, signatureX, footerY + 25, { align: 'center' });

            // Save
            doc.save(`Demande_Achat_${project}_${date}.pdf`);

        } catch (err) {
            console.error("PDF Gen Error", err);
            alert("Failed to generate PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div className="card">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-color)'
                        }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)', margin: 0 }}>Purchase Request</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Create and manage project procurement</p>
                        </div>
                    </div>
                </div>

                {/* Project Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="form-group">
                        <label className="form-label">Project Name</label>
                        <input
                            type="text"
                            value={project}
                            onChange={(e) => setProject(e.target.value)}
                            className="form-input"
                            placeholder="e.g. BOUCLE DE LA LEKIE"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Director</label>
                        <input
                            type="text"
                            value={director}
                            onChange={(e) => setDirector(e.target.value)}
                            className="form-input"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="form-group" style={{ maxWidth: '200px' }}>
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="form-input"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Items List</h3>
                        <span className="badge badge-planned">{items.length} Items</span>
                    </div>

                    <div className="table-view">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                                    <th>Description</th>
                                    <th style={{ width: '150px' }}>Unit</th>
                                    <th style={{ width: '120px' }}>Qty</th>
                                    <th style={{ width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.designation}
                                                onChange={(e) => updateItem(index, 'designation', e.target.value)}
                                                className="form-input"
                                                placeholder="Item description"
                                                style={{ border: 'none', background: 'transparent', padding: '0.4rem 0', borderRadius: 0 }}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                value={item.unit}
                                                onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                className="form-input"
                                                style={{}}
                                            >
                                                <option value="PCS">PCS</option>
                                                <option value="KG">KG</option>
                                                <option value="TONNES">TONNES</option>
                                                <option value="BARRES">BARRES</option>
                                                <option value="M3">M3</option>
                                                <option value="LITRES">LITRES</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className="form-input"
                                                style={{ textAlign: 'center' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="btn-icon-small danger"
                                                title="Remove Item"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <button
                    onClick={addItem}
                    className="btn btn-secondary btn-block"
                    style={{ marginBottom: '2rem', borderStyle: 'dashed', borderWidth: '2px' }}
                >
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                    Add New Row
                </button>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={generatePDF}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                    >
                        {loading ? (
                            'Processing...'
                        ) : (
                            <>
                                <Download size={18} style={{ marginRight: '0.75rem' }} />
                                Download Official PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DemandeAchatForm;

