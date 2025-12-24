import { useState } from 'react';
import { Calculator, Hammer, BrickWall, Ruler, Box, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DalotVisualization from '../components/DalotVisualization';
import { useLanguage } from '../context/LanguageContext';
import useCalculator from '../hooks/useCalculator';

// Components
import CalculatorInputs from '../components/Calculator/CalculatorInputs';
import IronResults from '../components/Calculator/IronResults';
import ConcreteResults from '../components/Calculator/ConcreteResults';
import WoodResults from '../components/Calculator/WoodResults';

const CalculatorPage = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('iron');
    const [dalotName, setDalotName] = useState('');

    const {
        calculatorParams,
        setCalculatorParams,
        calculateWood,
        calculateIron,
        calculateConcreteVolume,
        calculateTotalVolume,
        calculateBags,
        calculateTotalBags
    } = useCalculator();

    const getTitle = () => {
        switch (activeTab) {
            case 'iron': return t('ironCalculator');
            case 'concrete': return t('concreteCalculator');
            case 'wood': return t('woodCalculator');
            case '3d': return t('threeDVisualization');
            default: return t('constructionCalculator');
        }
    };

    const generatePDF = async () => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString();

        // Colors
        const NAVY_BLUE = [0, 35, 102]; // #002366
        const MCLAREN_ORANGE = [255, 128, 0]; // #FF8000
        const LIGHT_BLUE = [240, 244, 255]; // Light background

        // Load Logo
        const logoUrl = '/favicon.png';
        const logoImg = new Image();
        logoImg.src = logoUrl;

        try {
            await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
                if (logoImg.complete) resolve();
            });
            // Add Logo (x, y, width, height)
            doc.addImage(logoImg, 'PNG', 14, 10, 25, 25);
        } catch (e) {
            console.warn("Logo could not be loaded", e);
        }

        // Header Text
        doc.setFontSize(22);
        doc.setTextColor(...NAVY_BLUE);
        doc.setFont("helvetica", "bold");
        doc.text("ARAB CONTRACTORS CAMEROON", 45, 20);

        doc.setFontSize(14);
        doc.setTextColor(100); // Grey
        doc.setFont("helvetica", "normal");
        doc.text("Dalot Calculation Report", 45, 30);

        // Dalot Details Box
        doc.setDrawColor(...NAVY_BLUE);
        doc.setLineWidth(0.5);
        doc.setFillColor(...LIGHT_BLUE);
        doc.roundedRect(14, 40, 182, 25, 3, 3, 'FD');

        doc.setFontSize(11);
        doc.setTextColor(...NAVY_BLUE);
        doc.setFont("helvetica", "bold");
        doc.text(`Project: ${dalotName || 'Untitled Project'}`, 20, 50);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${today}`, 150, 50);

        doc.setDrawColor(200);
        doc.line(20, 54, 190, 54); // Separator

        doc.setFontSize(10);
        doc.setTextColor(...NAVY_BLUE);
        doc.text(`Section: ${calculatorParams.sectionType}`, 20, 61);
        doc.text(`Length: ${calculatorParams.dalotLength} ml`, 70, 61);
        doc.text(`Têtes: ${calculatorParams.tetes}`, 110, 61);
        doc.text(`Puisards: ${calculatorParams.puisard}`, 150, 61);

        let finalY = 75;

        // Helper for Section Headers
        const addSectionHeader = (title, y) => {
            doc.setFontSize(14);
            doc.setTextColor(...MCLAREN_ORANGE);
            doc.setFont("helvetica", "bold");
            doc.text(title, 14, y);
            doc.setDrawColor(...NAVY_BLUE);
            doc.setLineWidth(0.5);
            doc.line(14, y + 2, 196, y + 2); // Full width underline
        };

        // 1. Iron Section
        addSectionHeader("1. Iron Requirements", finalY);

        const ironData = [
            ['Diameter', 'Quantity (Bars)'],
            ['Ø6', calculateIron("Φ6") || "-"],
            ['Ø8', calculateIron("Φ8") || "-"],
            ['Ø10', calculateIron("Φ10") || "-"],
            ['Ø12', calculateIron("Φ12") || "-"],
            ['Ø14', calculateIron("Φ14") || "-"],
            ['Ø16', calculateIron("Φ16") || "-"]
        ];

        autoTable(doc, {
            startY: finalY + 8,
            head: [ironData[0]],
            body: ironData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: NAVY_BLUE, textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.1 },
            alternateRowStyles: { fillColor: [245, 247, 250] }
        });

        finalY = doc.lastAutoTable.finalY + 15;

        // 2. Concrete Section
        addSectionHeader("2. Concrete Requirements", finalY);

        const concreteData = [
            ['Part', 'Volume (m³)', 'Cement (Bags)'],
            ['B.P', calculateConcreteVolume('bp'), calculateBags('bp')],
            ['Radier', calculateConcreteVolume('radier'), calculateBags('radier')],
            ['Piedroits', calculateConcreteVolume('piedroit'), calculateBags('piedroit')],
            ['Dalle', calculateConcreteVolume('dalle'), calculateBags('dalle')],
            ['Total', calculateTotalVolume(), calculateTotalBags()]
        ];

        autoTable(doc, {
            startY: finalY + 8,
            head: [concreteData[0]],
            body: concreteData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: NAVY_BLUE, textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.1 },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            foot: [['', 'Total Volume: ' + calculateTotalVolume() + ' m³', 'Total Bags: ' + calculateTotalBags()]],
            footStyles: { fillColor: [255, 240, 220], textColor: NAVY_BLUE, fontStyle: 'bold' } // Orange tint footer
        });

        finalY = doc.lastAutoTable.finalY + 15;

        // 3. Wood Section
        if (finalY > 220) {
            doc.addPage();
            finalY = 20;
        }

        addSectionHeader("3. Wood Requirements", finalY);

        const woodResults = calculateWood();
        const woodData = [
            ['Item', 'Quantity', 'Unit'],
            ['Lattes', Math.ceil(woodResults.lattes || 0), 'units'],
            ['Chevron', Math.ceil(woodResults.chevron || 0), 'units'],
            ['Planches', Math.ceil(woodResults.planches || 0), 'units'],
            ['Panneaux', Math.ceil(woodResults.panneaux || 0), 'units'],
            ['Madrier', Math.ceil(woodResults.madrier || 0), 'units'],
            ['Point 80', Math.ceil(woodResults.point80 || 0), 'units'],
            ['Point 60', Math.ceil(woodResults.point60 || 0), 'units'],
            ['Point Toc 80', Math.ceil(woodResults.pointToc80 || 0), 'units']
        ];

        autoTable(doc, {
            startY: finalY + 8,
            head: [woodData[0]],
            body: woodData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: NAVY_BLUE, textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.1 },
            alternateRowStyles: { fillColor: [245, 247, 250] }
        });

        finalY = doc.lastAutoTable.finalY + 20;

        // Total Price Box
        if (finalY > 250) {
            doc.addPage();
            finalY = 20;
        }

        doc.setDrawColor(...MCLAREN_ORANGE);
        doc.setLineWidth(1);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, finalY, 182, 30, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setTextColor(...NAVY_BLUE);
        doc.text("Estimated Total Wood Cost", 24, finalY + 12);

        doc.setFontSize(20);
        doc.setTextColor(...MCLAREN_ORANGE);
        doc.setFont("helvetica", "bold");
        doc.text(`${woodResults.totalPrice?.toLocaleString()} FCFA`, 24, finalY + 24);

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, 195, 290, { align: 'right' });
            doc.text(`Generated by Arab Contractors System`, 14, 290);

            // Bottom Line
            doc.setDrawColor(...MCLAREN_ORANGE);
            doc.setLineWidth(0.5);
            doc.line(14, 285, 196, 285);
        }

        // Save
        doc.save(`Dalot_Report_${dalotName.replace(/\s+/g, '_') || 'Untitled'}.pdf`);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{getTitle()}</h1>

                <div className="report-controls">
                    <div className="input-wrapper dalot-input-wrapper">
                        <FileText size={18} className="input-icon" />
                        <input
                            type="text"
                            placeholder={t('enterDalotName')}
                            value={dalotName}
                            onChange={(e) => setDalotName(e.target.value)}
                            className="dalot-name-input"
                        />
                    </div>
                    <button className="generate-btn" onClick={generatePDF}>
                        <Download size={18} /> {t('generatePDFReport')}
                    </button>
                </div>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'iron' ? 'active' : ''}`}
                    onClick={() => setActiveTab('iron')}
                >
                    <Hammer size={18} /> {t('iron')}
                </button>
                <button
                    className={`tab ${activeTab === 'concrete' ? 'active' : ''}`}
                    onClick={() => setActiveTab('concrete')}
                >
                    <BrickWall size={18} /> {t('concreteCalculator')}
                </button>
                <button
                    className={`tab ${activeTab === 'wood' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wood')}
                >
                    <Ruler size={18} /> {t('woodCalculator')}
                </button>
                <button
                    className={`tab ${activeTab === '3d' ? 'active' : ''}`}
                    onClick={() => setActiveTab('3d')}
                >
                    <Box size={18} /> {t('threeDVisualization')}
                </button>
            </div>

            <div className="calculator-content">
                {activeTab === 'iron' && (
                    <div className="calculator-section">
                        <CalculatorInputs
                            calculatorParams={calculatorParams}
                            setCalculatorParams={setCalculatorParams}
                        />
                        <IronResults calculateIron={calculateIron} />
                    </div>
                )}

                {activeTab === 'concrete' && (
                    <div className="calculator-section">
                        <CalculatorInputs
                            calculatorParams={calculatorParams}
                            setCalculatorParams={setCalculatorParams}
                        />
                        <ConcreteResults
                            calculatorParams={calculatorParams}
                            calculateConcreteVolume={calculateConcreteVolume}
                            calculateTotalVolume={calculateTotalVolume}
                            calculateBags={calculateBags}
                            calculateTotalBags={calculateTotalBags}
                        />
                    </div>
                )}

                {activeTab === 'wood' && (
                    <div className="calculator-section">
                        <CalculatorInputs
                            calculatorParams={calculatorParams}
                            setCalculatorParams={setCalculatorParams}
                        />
                        <WoodResults calculateWood={calculateWood} />
                    </div>
                )}

                {activeTab === '3d' && (
                    <div className="calculator-section">
                        <CalculatorInputs
                            calculatorParams={calculatorParams}
                            setCalculatorParams={setCalculatorParams}
                        />
                        <div className="results-container">
                            <h3>3D Visualization</h3>
                            <DalotVisualization params={calculatorParams} />
                        </div>
                    </div >
                )}
            </div >

            <style>{`
                :root {
                    --primary: #1e293b;
                    --primary-hover: #0f172a;
                    --primary-light: #334155;
                    --bg-main: #f8fafc;
                    --bg-secondary: #f1f5f9;
                    --text-main: #1e293b;
                    --text-secondary: #64748b;
                    --border: #e2e8f0;
                    --radius-md: 8px;
                    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                }

                body {
                    background-color: var(--bg-main);
                    color: var(--text-main);
                    font-family: system-ui, -apple-system, sans-serif;
                }

                .tabs {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                    padding: 0.5rem;
                    background: white;
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-sm);
                    width: calc(100% - 2rem);
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                    box-sizing: border-box;
                }

                .page-header {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .page-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-main);
                    text-align: center;
                    width: 100%;
                }

                .tab {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 0.5rem;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    font-weight: 500;
                    color: var(--text-secondary);
                    border-radius: var(--radius-md);
                    transition: all 0.2s;
                    text-align: center;
                    line-height: 1.2;
                }

                .tab:hover {
                    color: var(--primary);
                    background: var(--bg-secondary);
                }

                .tab.active {
                    background: var(--primary);
                    color: white;
                }

                .calculator-section {
                    background: white;
                    border-radius: var(--radius-md);
                    padding: 2rem;
                    box-shadow: var(--shadow-md);
                    max-width: 800px;
                    margin: 0 auto;
                }

                .calculator-section h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                    color: var(--text-main);
                }

                .calculator-section h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                }
                
                .results-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                /* Report Controls */
                .report-controls {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    margin-top: 2rem;
                    flex-wrap: wrap;
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    border: 1px solid var(--border);
                    max-width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                }

                .dalot-input-wrapper {
                    width: 320px;
                }

                .dalot-name-input {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 2.75rem;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    background: var(--bg-secondary);
                }

                .dalot-name-input:focus {
                    border-color: var(--primary);
                    background: white;
                    box-shadow: 0 0 0 4px rgba(30, 41, 59, 0.1);
                    outline: none;
                }

                .generate-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
                    color: white;
                    border: none;
                    padding: 0.875rem 1.75rem;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px -1px rgba(30, 41, 59, 0.2);
                }

                .generate-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 8px -1px rgba(30, 41, 59, 0.3);
                }

                .generate-btn:active {
                    transform: translateY(0);
                }

                /* Mobile Optimization */
                @media (max-width: 640px) {
                    .page-title {
                        font-size: 1.75rem;
                        text-align: center;
                        width: 100%;
                    }

                    .page-header {
                        flex-direction: column;
                        gap: 1.5rem;
                        align-items: center;
                    }

                    .report-controls {
                        width: 100%;
                        margin-top: 0;
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }

                    .dalot-input-wrapper {
                        width: 100%;
                    }

                    .generate-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .tabs {
                        width: 100%;
                        overflow-x: auto;
                        justify-content: flex-start;
                        padding: 0.5rem;
                        border-radius: 0;
                        background: transparent;
                        box-shadow: none;
                        border: none;
                        margin-bottom: 1rem;
                        /* Hide scrollbar */
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    
                    .tabs::-webkit-scrollbar {
                        display: none;
                    }

                    .tab {
                        background: white;
                        box-shadow: var(--shadow-sm);
                        flex-shrink: 0;
                    }

                    .tab.active {
                        background: var(--primary);
                        color: white;
                    }

                    .calculator-section {
                        padding: 1.5rem;
                        border-radius: var(--radius-md);
                        box-shadow: var(--shadow-sm);
                        border: 1px solid var(--border);
                        background: white;
                        margin: 0 1rem 2rem 1rem; /* Add margin on sides */
                    }
                }
            `}</style>
        </div>
    );
};

export default CalculatorPage;
