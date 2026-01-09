import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Scissors, Calculator, ChevronDown, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '../../context/LanguageContext';

const IronCutter = () => {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ quantity: 1, length: '', diameter: '10' });
    const [results, setResults] = useState(null);
    const [isDiameterOpen, setIsDiameterOpen] = useState(false);

    // PDF Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportNameInput, setReportNameInput] = useState('');

    // Error Modal State
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const dropdownRef = useRef(null);

    const diameters = ['6', '8', '10', '12', '14', '16', '20', '25', '32'];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDiameterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAddItem = () => {
        if (!newItem.length || newItem.length <= 0) return;
        if (parseFloat(newItem.length) > 12) {
            setErrorMessage(t('barLengthTrigger'));
            setShowErrorModal(true);
            return;
        }

        const itemToAdd = {
            id: Date.now(),
            quantity: parseInt(newItem.quantity) || 1,
            length: parseFloat(newItem.length),
            diameter: newItem.diameter
        };

        setItems([...items, itemToAdd]);
        setNewItem({ ...newItem, length: '' }); // Reset length but keep diameter
        setResults(null); // Clear previous results
    };

    const handleDeleteItem = (id) => {
        setItems(items.filter(item => item.id !== id));
        setResults(null);
    };

    const optimizeCuts = () => {
        if (items.length === 0) return;

        // Group items by diameter
        const stockLength = 12;
        const groupedItems = {};

        items.forEach(item => {
            if (!groupedItems[item.diameter]) {
                groupedItems[item.diameter] = [];
            }
            // Expand quantity into individual pieces for the algorithm
            for (let i = 0; i < item.quantity; i++) {
                groupedItems[item.diameter].push(item.length);
            }
        });

        const optimizationResults = {};

        Object.keys(groupedItems).forEach(diameter => {
            // Sort pieces descending (Best Fit Decreasing)
            const pieces = groupedItems[diameter].sort((a, b) => b - a);
            const bars = []; // Array of { remaining: number, cuts: number[] }

            pieces.forEach(piece => {
                // Find best fit: tightest spot it fits into
                let bestBarIndex = -1;
                let minRemaining = stockLength + 1;

                for (let i = 0; i < bars.length; i++) {
                    if (bars[i].remaining >= piece) {
                        const remainingAfter = bars[i].remaining - piece;
                        if (remainingAfter < minRemaining) {
                            minRemaining = remainingAfter;
                            bestBarIndex = i;
                        }
                    }
                }

                if (bestBarIndex !== -1) {
                    bars[bestBarIndex].cuts.push(piece);
                    bars[bestBarIndex].remaining -= piece;
                } else {
                    // Start new bar
                    bars.push({
                        remaining: stockLength - piece,
                        cuts: [piece]
                    });
                }
            });

            // Group identical patterns
            const groupedPatterns = [];
            bars.forEach(bar => {
                // Sort cuts for consistent key generation
                bar.cuts.sort((a, b) => b - a);
                const key = bar.cuts.join(',');

                const existingGroup = groupedPatterns.find(g => g.key === key);
                if (existingGroup) {
                    existingGroup.count++;
                } else {
                    groupedPatterns.push({
                        ...bar,
                        key,
                        count: 1
                    });
                }
            });

            optimizationResults[diameter] = {
                totalBars: bars.length,
                patterns: groupedPatterns,
                totalWaste: bars.reduce((acc, bar) => acc + bar.remaining, 0),
                wastePercentage: ((bars.reduce((acc, bar) => acc + bar.remaining, 0) / (bars.length * stockLength)) * 100).toFixed(1)
            };
        });

        setResults(optimizationResults);
    };

    const openReportModal = () => {
        setReportNameInput('');
        setShowReportModal(true);
    };

    const confirmGeneratePDF = () => {
        generatePDF(reportNameInput);
        setShowReportModal(false);
    };

    const generatePDF = async (reportName) => {
        if (!results) return;

        // Fallback or empty name if user just clicks confirms without typing (optional)
        const finalName = reportName || "Untitled Project";

        const doc = new jsPDF({ orientation: 'landscape' });
        const today = new Date().toLocaleDateString();

        // Colors
        const NAVY_BLUE = [0, 35, 102];
        const MCLAREN_ORANGE = [255, 128, 0];
        const LIGHT_BLUE = [240, 244, 255];
        const BAR_BLUE = [59, 130, 246]; // #3b82f6
        const WASTE_RED = [239, 68, 68]; // #ef4444

        // Load Logo
        try {
            const logoUrl = '/favicon.png';
            const logoImg = new Image();
            logoImg.src = logoUrl;
            await new Promise((resolve) => {
                logoImg.onload = resolve;
                logoImg.onerror = resolve; // Continue even if logo fails
                if (logoImg.complete) resolve();
            });
            doc.addImage(logoImg, 'PNG', 14, 10, 25, 25);
        } catch (e) {
            console.warn("Logo load failed", e);
        }

        // Header
        doc.setFontSize(22);
        doc.setTextColor(...NAVY_BLUE);
        doc.setFont("helvetica", "bold");
        doc.text("ARAB CONTRACTORS CAMEROON", 45, 20);

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text("Iron Cutting Optimization Report", 45, 30);

        if (finalName) {
            doc.setFontSize(12);
            doc.setTextColor(...MCLAREN_ORANGE);
            doc.text(`Project: ${finalName}`, 45, 38);
        }

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${today}`, 250, 50); // Adjusted X for landscape

        let finalY = 60;

        // 1. Required List
        doc.setFontSize(14);
        doc.setTextColor(...MCLAREN_ORANGE);
        doc.setFont("helvetica", "bold");
        doc.text("1. Required Bars", 14, finalY);

        const reqData = items.map(item => [
            `${item.diameter}`, // Removed Phi symbol to prevent encoding bugs
            `${item.length}m`,
            item.quantity
        ]);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Diameter', 'Length', 'Quantity']],
            body: reqData,
            theme: 'striped',
            headStyles: { fillColor: NAVY_BLUE },
            styles: { fontSize: 10 },
            margin: { left: 14, right: 14 }
        });

        finalY = doc.lastAutoTable.finalY + 15;

        // 2. Optimization Results
        doc.setFontSize(14);
        doc.setTextColor(...MCLAREN_ORANGE);
        doc.text("2. Optimization Results", 14, finalY);

        Object.entries(results).forEach(([diameter, data]) => {
            if (finalY > 150) { // Check page break earlier for landscape
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(12);
            doc.setTextColor(...NAVY_BLUE);
            // Removed Phi symbol here too
            doc.text(`Diameter ${diameter} - Total 12m Bars: ${data.totalBars}`, 14, finalY + 10);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Total Waste: ${data.wastePercentage}%`, 14, finalY + 16);

            // Prepare data with raw objects for hooks
            const patternData = data.patterns.map((p, idx) => ({
                pattern: `Pattern #${idx + 1}`,
                count: `x${p.count}`,
                visual: '', // Placeholder
                cuts: p.cuts, // Raw data for drawing
                remaining: p.remaining
            }));

            autoTable(doc, {
                startY: finalY + 20,
                head: [['Pattern', 'Count', 'Visualization (12m Bar)', 'Waste']],
                body: patternData.map(p => [p.pattern, p.count, '', `${p.remaining.toFixed(2)}m`]),
                theme: 'grid',
                headStyles: { fillColor: [51, 65, 85] },
                styles: { fontSize: 9, minCellHeight: 15, valign: 'middle' },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 'auto' }, // Expanded for visual
                    3: { cellWidth: 25 }
                },
                margin: { left: 14, right: 14 },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        const rawRow = patternData[data.row.index];
                        if (!rawRow) return;

                        const cell = data.cell;
                        const barWidth = cell.width - 4; // Padding
                        const barHeight = 8; // Height of the visual bar
                        const startX = cell.x + 2;
                        const startY = cell.y + (cell.height - barHeight) / 2;
                        const scale = barWidth / 12; // Pixels per meter

                        let currentX = startX;

                        // Draw Cuts
                        rawRow.cuts.forEach(cut => {
                            const width = cut * scale;

                            // Bar Rect
                            doc.setFillColor(...BAR_BLUE);
                            doc.rect(currentX, startY, width, barHeight, 'F');

                            // Divider
                            doc.setDrawColor(255, 255, 255);
                            doc.setLineWidth(0.2);
                            doc.rect(currentX, startY, width, barHeight, 'S');

                            // Text
                            if (width > 8) { // Only draw text if space permits
                                doc.setFontSize(7);
                                doc.setTextColor(255, 255, 255);
                                doc.text(`${cut}m`, currentX + width / 2, startY + 5.5, { align: 'center' });
                            }

                            currentX += width;
                        });

                        // Draw Waste
                        if (rawRow.remaining > 0) {
                            const width = rawRow.remaining * scale;
                            // Waste Rect
                            doc.setFillColor(...WASTE_RED);
                            doc.rect(currentX, startY, width, barHeight, 'F');

                            // Divider
                            doc.setDrawColor(255, 255, 255);
                            doc.setLineWidth(0.2);
                            doc.rect(currentX, startY, width, barHeight, 'S');
                        }
                    }
                }
            });

            finalY = doc.lastAutoTable.finalY + 10;
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, 280, 200, { align: 'right' }); // Adjusted for landscape
            doc.text("Generated by Arab Contractors System", 14, 200);
        }

        const safeName = finalName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
        doc.save(`${safeName}_Iron_Opt_${today.replace(/\//g, '-')}.pdf`);
    };

    return (
        <div className="iron-cutter-container">
            <div className="iron-cutter-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
                {results && (
                    <button className="generate-btn" onClick={openReportModal} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        <Download size={16} /> Download Report
                    </button>
                )}
            </div>

            <div className="input-section">
                <h3>{t('ironCutter')}</h3>

                <div className="add-item-form">
                    <div className="form-group">
                        <label>{t('diameter')}</label>
                        <div className="custom-dropdown-container" ref={dropdownRef}>
                            <div
                                className="custom-dropdown-trigger"
                                onClick={() => setIsDiameterOpen(!isDiameterOpen)}
                            >
                                <span>Φ{newItem.diameter}</span>
                                <ChevronDown size={16} className={`dropdown-arrow ${isDiameterOpen ? 'open' : ''}`} />
                            </div>

                            {isDiameterOpen && (
                                <div className="custom-dropdown-menu">
                                    {diameters.map(d => (
                                        <div
                                            key={d}
                                            className={`custom-dropdown-item ${newItem.diameter === d ? 'selected' : ''}`}
                                            onClick={() => {
                                                setNewItem({ ...newItem, diameter: d });
                                                setIsDiameterOpen(false);
                                            }}
                                        >
                                            Φ{d}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{t('lengthMeter')}</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.1"
                            max="12"
                            value={newItem.length}
                            onChange={(e) => setNewItem({ ...newItem, length: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            placeholder="e.g. 5.5"
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('quantity')}</label>
                        <input
                            type="number"
                            min="1"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        />
                    </div>

                    <button className="add-btn" onClick={handleAddItem}>
                        <Plus size={20} />
                        {t('addBar')}
                    </button>
                </div>
            </div>

            {items.length > 0 && (
                <div className="items-list">
                    {items.map(item => (
                        <div key={item.id} className="item-chip">
                            <span>{item.quantity}x Φ{item.diameter} L={item.length}m</span>
                            <button onClick={() => handleDeleteItem(item.id)} className="delete-chip-btn">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <button className="optimize-btn" onClick={optimizeCuts}>
                        <Calculator size={18} />
                        {t('optimize')}
                    </button>
                </div>
            )}

            {results && (
                <div className="results-section">
                    <h3>{t('results')}</h3>
                    {Object.keys(results).map(diameter => (
                        <div key={diameter} className="diameter-result">
                            <div className="result-header">
                                <span className="diameter-badge">Φ{diameter}</span>
                                <div className="result-stats">
                                    <span>{t('totalBars12m')}: <strong>{results[diameter].totalBars}</strong></span>
                                    <span>{t('waste')}: <strong>{results[diameter].wastePercentage}%</strong> ({results[diameter].totalWaste.toFixed(2)}m)</span>
                                </div>
                            </div>

                            <div className="patterns-list">
                                {results[diameter].patterns.map((group, idx) => (
                                    <div key={idx} className="bar-visual">
                                        <div className="bar-label">
                                            <div>{t('cutPattern')} #{idx + 1}</div>
                                            <div className="bar-count-badge">x{group.count}</div>
                                        </div>
                                        <div className="bar-track">
                                            {(() => {
                                                let cumulative = 0;
                                                return group.cuts.map((cut, cIdx) => {
                                                    cumulative += cut;
                                                    // Floating point correction for display
                                                    const displayCumulative = Number(cumulative.toFixed(2));

                                                    return (
                                                        <div
                                                            key={cIdx}
                                                            className="cut-segment"
                                                            style={{ width: `${(cut / 12) * 100}%` }}
                                                            title={`${cut}m (x${group.count})`}
                                                        >
                                                            <span className="segment-text">
                                                                {cut}m <span className="segment-qty">x{group.count}</span>
                                                            </span>
                                                            {cIdx < group.cuts.length && (
                                                                <div className="cumulative-marker">
                                                                    <div className="marker-line"></div>
                                                                    <div className="marker-value">{displayCumulative}m</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                            <div
                                                className="waste-segment"
                                                style={{ width: `${(group.remaining / 12) * 100}%` }}
                                                title={`Waste: ${group.remaining.toFixed(2)}m`}
                                            >
                                                {group.remaining >= 0.5 && (
                                                    <span className="waste-text">{group.remaining.toFixed(2)}m</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showReportModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>{t('enterReportName') || "Report Name"}</h4>
                        <input
                            type="text"
                            placeholder="e.g. Project Alpha"
                            value={reportNameInput}
                            onChange={(e) => setReportNameInput(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && confirmGeneratePDF()}
                        />
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowReportModal(false)}>
                                {t('cancel') || "Cancel"}
                            </button>
                            <button className="confirm-btn" onClick={confirmGeneratePDF}>
                                {t('generate') || "Generate PDF"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showErrorModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4 style={{ color: '#ef4444' }}>Error</h4>
                        <p style={{ margin: '1rem 0', color: '#374151' }}>{errorMessage}</p>
                        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="confirm-btn" onClick={() => setShowErrorModal(false)}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .iron-cutter-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .input-section {
                    background: var(--bg-secondary);
                    padding: 1.5rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                }

                .add-item-form {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    align-items: end;
                    margin-top: 1rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-group label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                .form-group input {
                    padding: 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    font-size: 0.95rem;
                    background: white;
                }

                .custom-dropdown-container {
                    width: 100%;
                    min-width: 0;
                    position: relative; /* Ensure stacking context */
                    z-index: 50; /* Raise container */
                }

                .custom-dropdown-menu {
                    z-index: 1000;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 4px;
                    padding: 4px;
                    width: 240px; /* Wider to fit 3 columns comfortably */
                }

                .custom-dropdown-item {
                    text-align: center;
                    padding: 8px 4px;
                    border-radius: 4px;
                    justify-content: center; /* Center flex content if it is flex */
                    display: flex;
                }

                .add-btn {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 0.75rem 1rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: background 0.2s;
                    height: 42px;
                }

                .add-btn:hover {
                    background: var(--primary-hover);
                }

                .items-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: white;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    align-items: center;
                }

                .item-chip {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: var(--bg-secondary);
                    padding: 0.5rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    border: 1px solid var(--border);
                }

                .delete-chip-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 2px;
                    border-radius: 50%;
                }

                .delete-chip-btn:hover {
                    background: #fee2e2;
                }

                .optimize-btn {
                    margin-left: auto;
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
                    transition: all 0.2s;
                }

                .optimize-btn:hover {
                    background: #059669;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px -1px rgba(16, 185, 129, 0.3);
                }

                .results-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .diameter-result {
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                }

                .result-header {
                    background: var(--bg-secondary);
                    padding: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border);
                }

                .diameter-badge {
                    background: var(--primary);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    font-weight: 700;
                    font-size: 0.9rem;
                }

                .result-stats {
                    display: flex;
                    gap: 1.5rem;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }

                .result-stats strong {
                    color: var(--text-main);
                }

                .patterns-list {
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .bar-visual {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .bar-label {
                    width: 70px;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .bar-count-badge {
                    background: var(--text-main);
                    color: white;
                    border-radius: 12px;
                    padding: 0.1rem 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    align-self: flex-start;
                }

                .cut-segment {
                    height: 100%;
                    background: #3b82f6;
                    border-right: 1px solid rgba(255,255,255,0.5);
                    color: white;
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: visible;
                    padding: 0 4px;
                    position: relative;
                    min-width: 0; /* Critical for accurate flex sizing */
                }

                .segment-text {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .segment-qty {
                    background: rgba(255,255,255,0.2);
                    padding: 0 4px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                }

                .cumulative-marker {
                    position: absolute;
                    right: 0;
                    bottom: -22px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 10;
                    transform: translateX(50%); /* Centers the marker on the cut line */
                }

                .marker-line {
                    width: 1px;
                    height: 6px;
                    background: #666;
                    margin-bottom: 2px;
                }

                .marker-value {
                    font-size: 0.7rem;
                    color: #4b5563;
                    font-weight: 600;
                    background: white;
                    padding: 0 2px;
                }




                .bar-track {
                    flex: 1;
                    height: 32px;
                    background: #eee;
                    border-radius: 4px;
                    display: flex;
                    overflow: visible;
                    position: relative;
                    margin-bottom: 1.5rem;
                }

                .waste-segment {
                    height: 100%;
                    background: #ef4444;
                    opacity: 0.6;
                    background-image: repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 5px,
                        #ffffff 5px,
                        #ffffff 10px
                    );
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .waste-text {
                    font-size: 0.7rem;
                    color: #7f1d1d;
                    font-weight: 700;
                    background: rgba(255,255,255,0.7);
                    padding: 0 4px;
                    border-radius: 4px;
                    white-space: nowrap;
                    z-index: 2;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(2px);
                }

                .modal-content {
                    background: white;
                    padding: 1.5rem;
                    border-radius: var(--radius-md);
                    width: 100%;
                    max-width: 400px;
                    box-shadow: var(--shadow-md);
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    animation: slideIn 0.2s ease;
                }

                @keyframes slideIn {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .modal-content h4 {
                    font-size: 1.1rem;
                    margin: 0;
                    color: var(--text-main);
                }

                .modal-content input {
                    padding: 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    font-size: 1rem;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 0.5rem;
                }

                .modal-actions button {
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
                    font-size: 0.9rem;
                }

                .cancel-btn {
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                }

                .cancel-btn:hover {
                    background: #e2e8f0;
                }

                .confirm-btn {
                    background: var(--primary);
                    color: white;
                }

                .confirm-btn:hover {
                    background: var(--primary-hover);
                }

                @media (max-width: 640px) {
                    /* Fix Header Overlap */
                    .result-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    
                    .result-stats {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                    }

                    .result-stats span {
                         /* Normal flow, not spaced apart */
                        white-space: nowrap;
                    }
                    
                    /* Hide the redundant 'x20' inside the bar on mobile */
                    .segment-qty {
                        display: none;
                    }

                    /* Fix Marker Height Overlap */
                    .patterns-list {
                        gap: 2rem;
                    }

                    .bar-visual {
                        gap: 0.25rem; /* Reduce gap since we add margin to track */
                    }

                    .bar-track {
                        margin-bottom: 1.5rem;
                        margin-top: 1.25rem; /* Space for the top floating quantity */
                    }

                    /* Move the quantity 'x20' above the bar */
                    .segment-qty {
                        display: block;
                        position: absolute;
                        top: -18px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 0.7rem;
                        color: #64748b;
                        background: none;
                        padding: 0;
                        font-weight: 600;
                    }
            `}</style>
        </div>
    );
};

export default IronCutter;
