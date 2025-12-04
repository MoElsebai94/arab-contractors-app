import { useState, useEffect } from 'react';
import { Calculator, Hammer, BrickWall, Ruler, ChevronDown, Hash, ArrowRight, FileText, Download, Box } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DalotVisualization from '../components/DalotVisualization';

import { useLanguage } from '../context/LanguageContext';

const ConfigTrigger = ({ isPuisard, onToggle }) => {
    const { t } = useLanguage();
    return (
        <button
            className={`trigger-btn ${isPuisard ? 'puisard-mode' : 'standard-mode'}`}
            onClick={onToggle}
        >
            <div className="trigger-content">
                {isPuisard ? (
                    <>
                        <ArrowRight size={20} />
                        <span>With Puisard (1 Tête + 1 Puisard)</span>
                    </>
                ) : (
                    <>
                        <Box size={20} />
                        <span>Standard (2 Têtes)</span>
                    </>
                )}
            </div>
            <div className="trigger-indicator">
                <div className="indicator-dot"></div>
            </div>
        </button>
    );
};

const CalculatorPage = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('iron');
    const [dalotName, setDalotName] = useState('');

    // Unified Calculator State with Persistence
    const [calculatorParams, setCalculatorParams] = useState(() => {
        const saved = localStorage.getItem('calculatorParams');
        return saved ? JSON.parse(saved) : {
            sectionType: '1x1',
            tetes: '2',
            dalotLength: 0,
            puisard: '0'
        };
    });

    useEffect(() => {
        localStorage.setItem('calculatorParams', JSON.stringify(calculatorParams));
    }, [calculatorParams]);

    const WOOD_PRICES = {
        lattes: 2000,
        chevron: 2000,
        planches: 2500,
        panneaux: 14500,
        madrier: 7000,
        point80: 4500,
        point60: 4500,
        pointToc80: 1500
    };

    const WOOD_DATA = {
        '1x1': {
            panneaux: { ml: 2, tete: 10, puisard: 13 },
            lattes: { ml: 12, tete: 35, puisard: 45 },
            chevron: { ml: 9, tete: 20, puisard: 24 },
            planches: { ml: 1, tete: 0, puisard: 2 },
            madrier: { ml: 0, tete: 0, puisard: 0 },
            point80: { ml: 1, tete: 1, puisard: 2 },
            point60: { ml: 0, tete: 0, puisard: 1 },
            pointToc80: { ml: 1, tete: 1, puisard: 2 }
        },
        '2x2x1': {
            panneaux: { ml: 4, tete: 11, puisard: 0 },
            lattes: { ml: 20, tete: 38, puisard: 0 },
            chevron: { ml: 15, tete: 22, puisard: 0 },
            planches: { ml: 0, tete: 0, puisard: 0 },
            madrier: { ml: 0, tete: 0, puisard: 0 },
            point80: { ml: 2, tete: 2, puisard: 0 },
            point60: { ml: 0, tete: 0, puisard: 0 },
            pointToc80: { ml: 2, tete: 2, puisard: 0 }
        },
        '2x1.5x2': {
            panneaux: { ml: 8, tete: 12, puisard: 0 },
            lattes: { ml: 28, tete: 40, puisard: 0 },
            chevron: { ml: 35, tete: 35, puisard: 0 },
            planches: { ml: 0, tete: 0, puisard: 0 },
            madrier: { ml: 0, tete: 0, puisard: 0 },
            point80: { ml: 1, tete: 3, puisard: 0 },
            point60: { ml: 1, tete: 1, puisard: 0 },
            pointToc80: { ml: 2, tete: 2, puisard: 0 }
        },
        '1x3x3': {
            panneaux: { ml: 7, tete: 15, puisard: 0 },
            lattes: { ml: 28, tete: 60, puisard: 0 },
            chevron: { ml: 36, tete: 88, puisard: 0 },
            planches: { ml: 3, tete: 0, puisard: 0 },
            madrier: { ml: 6, tete: 3, puisard: 0 },
            point80: { ml: 1, tete: 4, puisard: 0 },
            point60: { ml: 1, tete: 1, puisard: 0 },
            pointToc80: { ml: 2, tete: 2, puisard: 0 }
        },
        '1x1.5x2': {
            panneaux: { ml: 6, tete: 8, puisard: 0 },
            lattes: { ml: 26, tete: 36, puisard: 0 },
            chevron: { ml: 28, tete: 20, puisard: 0 },
            planches: { ml: 0, tete: 0, puisard: 0 },
            madrier: { ml: 0, tete: 0, puisard: 0 },
            point80: { ml: 1, tete: 3, puisard: 0 },
            point60: { ml: 1, tete: 1, puisard: 0 },
            pointToc80: { ml: 1, tete: 1, puisard: 0 }
        },
        '1x2x1': {
            panneaux: { ml: 3, tete: 7, puisard: 0 },
            lattes: { ml: 13, tete: 25, puisard: 0 },
            chevron: { ml: 10, tete: 15, puisard: 0 },
            planches: { ml: 0, tete: 0, puisard: 0 },
            madrier: { ml: 0, tete: 0, puisard: 0 },
            point80: { ml: 1, tete: 1, puisard: 0 },
            point60: { ml: 0, tete: 0, puisard: 0 },
            pointToc80: { ml: 1, tete: 1, puisard: 0 }
        }
    };

    const calculateWood = () => {
        const data = WOOD_DATA[calculatorParams.sectionType];
        if (!data) return {};

        const results = {
            lattes: 0,
            chevron: 0,
            planches: 0,
            panneaux: 0,
            madrier: 0,
            point80: 0,
            point60: 0,
            pointToc80: 0,
            totalPrice: 0
        };

        Object.keys(results).forEach(key => {
            if (key === 'totalPrice') return;

            const itemData = data[key];
            if (itemData) {
                results[key] = (itemData.ml * calculatorParams.dalotLength) +
                    (itemData.tete * parseInt(calculatorParams.tetes)) +
                    (itemData.puisard * parseInt(calculatorParams.puisard));

                results.totalPrice += results[key] * (WOOD_PRICES[key] || 0);
            }
        });

        return results;
    };

    // Iron Calculator Data
    const IRON_DATA = {
        "1x1": {
            "Φ8": { ml: 5, tete: 17, puisard: 14 },
            "Φ10": { ml: 9, tete: 0, puisard: 17 },
            "Φ12": { ml: 0.3, tete: 0, puisard: 0 }
        },
        "2x2x1": {
            "Φ8": { ml: 1, tete: 0, puisard: 0 },
            "Φ10": { ml: 0, tete: 33, puisard: 0 },
            "Φ12": { ml: 19, tete: 0, puisard: 0 },
            "Φ14": { ml: 16, tete: 0, puisard: 0 }
        },
        "2x1.5x2": {
            "Φ8": { ml: 2, tete: 0, puisard: 0 },
            "Φ10": { ml: 20, tete: 41, puisard: 0 },
            "Φ14": { ml: 15, tete: 0, puisard: 0 }
        },
        "1x3x3": {
            "Φ8": { ml: 2, tete: 0, puisard: 0 },
            "Φ10": { ml: 0, tete: 102, puisard: 0 },
            "Φ12": { ml: 10, tete: 0, puisard: 0 },
            "Φ14": { ml: 27, tete: 0, puisard: 0 }
        },
        "1x1.5x2": {
            "Φ8": { ml: 1, tete: 0, puisard: 0 },
            "Φ10": { ml: 10, tete: 40, puisard: 0 },
            "Φ12": { ml: 13, tete: 0, puisard: 0 }
        },
        "1x2x1": {
            "Φ8": { ml: 1, tete: 0, puisard: 0 },
            "Φ10": { ml: 9, tete: 24, puisard: 0 },
            "Φ12": { ml: 12, tete: 0, puisard: 0 }
        }
    };

    const calculateIron = (diameter) => {
        const data = IRON_DATA[calculatorParams.sectionType]?.[diameter];
        if (!data) return 0;

        const total = (calculatorParams.dalotLength * data.ml) +
            (parseInt(calculatorParams.tetes) * data.tete) +
            (parseInt(calculatorParams.puisard) * data.puisard);

        // Format to max 2 decimal places if needed, or integer if it represents bars
        return Math.round(total * 100) / 100;
    };

    // Concrete Calculator Data
    const CONCRETE_DATA = {
        "1x1": {
            bp: { ml: 0.16, tete: 0.33, puisard: 0.315 },
            radier: { ml: 0.28, tete: 0.83, puisard: 0.532 },
            piedroit: { ml: 0.4, tete: 0.405, puisard: 3.48 },
            dalle: { ml: 0.28, tete: 0.084, puisard: 0 }
        },
        "2x2x1": {
            bp: { ml: 0.495, tete: 0.81366, puisard: 0 },
            radier: { ml: 1.1875, tete: 2.46795, puisard: 0 },
            piedroit: { ml: 0.75, tete: 0.5308, puisard: 0 },
            dalle: { ml: 1.1875, tete: 0.2375, puisard: 0 }
        },
        "2x1.5x2": {
            bp: { ml: 0.395, tete: 1.656, puisard: 0 },
            radier: { ml: 0.9375, tete: 3.97, puisard: 0 },
            piedroit: { ml: 1.5, tete: 1.87, puisard: 0 },
            dalle: { ml: 0.9375, tete: 0.225, puisard: 0 }
        },
        "1x3x3": {
            bp: { ml: 0.4, tete: 3.1062, puisard: 0 },
            radier: { ml: 1.52, tete: 12.8, puisard: 0 },
            piedroit: { ml: 2.4, tete: 6.882, puisard: 0 },
            dalle: { ml: 1.52, tete: 0.228, puisard: 0 }
        },
        "1x1.5x2": {
            bp: { ml: 0.22, tete: 1.14, puisard: 0 },
            radier: { ml: 0.5, tete: 3.13, puisard: 0 },
            piedroit: { ml: 1, tete: 1.87, puisard: 0 },
            dalle: { ml: 0.5, tete: 0.12, puisard: 0 }
        },
        "1x2x1": {
            bp: { ml: 0.27, tete: 0.47, puisard: 0 },
            radier: { ml: 0.625, tete: 1.431, puisard: 0 },
            piedroit: { ml: 0.5, tete: 0.53, puisard: 0 },
            dalle: { ml: 0.625, tete: 0.15, puisard: 0 }
        }
    };

    const calculateConcreteVolume = (part) => {
        const data = CONCRETE_DATA[calculatorParams.sectionType]?.[part];
        if (!data) return 0;

        const total = (calculatorParams.dalotLength * data.ml) +
            (parseInt(calculatorParams.tetes) * data.tete) +
            (parseInt(calculatorParams.puisard) * data.puisard);

        return Math.round(total * 1000) / 1000; // 3 decimal places for volume
    };

    const calculateTotalVolume = () => {
        const parts = ['bp', 'radier', 'piedroit', 'dalle'];
        const total = parts.reduce((sum, part) => sum + calculateConcreteVolume(part), 0);
        return Math.round(total * 1000) / 1000;
    };

    const calculateBags = (part) => {
        const volume = calculateConcreteVolume(part);
        const rate = part === 'bp' ? 5 : 8;
        return Math.ceil(volume * rate);
    };

    const calculateTotalBags = () => {
        // Calculate total volume for BP
        const bpVolume = calculateConcreteVolume('bp');
        const bpBags = Math.ceil(bpVolume * 5);

        // Calculate total volume for Reinforced Concrete (Radier + Piedroit + Dalle)
        const rcParts = ['radier', 'piedroit', 'dalle'];
        const rcVolume = rcParts.reduce((sum, part) => sum + calculateConcreteVolume(part), 0);
        const rcBags = Math.ceil(rcVolume * 8);

        return bpBags + rcBags;
    };

    // Wood Calculator State
    // Placeholder for now

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
                        <div className="input-grid">
                            <div className="form-group">
                                <label>{t('sectionType')}</label>
                                <div className="input-wrapper">
                                    <BrickWall size={18} className="input-icon" />
                                    <select
                                        value={calculatorParams.sectionType}
                                        onChange={(e) => {
                                            const newSectionType = e.target.value;
                                            let newTetes = calculatorParams.tetes;
                                            let newPuisard = calculatorParams.puisard;

                                            if (newSectionType !== '1x1') {
                                                newTetes = '2';
                                                newPuisard = '0';
                                            }

                                            setCalculatorParams({
                                                ...calculatorParams,
                                                sectionType: newSectionType,
                                                tetes: newTetes,
                                                puisard: newPuisard
                                            });
                                        }}
                                    >
                                        <option value="1x1">1x1</option>
                                        <option value="2x2x1">2x2x1</option>
                                        <option value="1x3x3">1x3x3</option>
                                        <option value="2x1.5x2">2x1.5x2</option>
                                        <option value="1x2x1">1x2x1</option>
                                        <option value="1x1.5x2">1x1.5x2</option>
                                    </select>
                                    <ChevronDown size={16} className="select-arrow" />
                                </div>
                            </div>

                            {/* Configuration Trigger for 1x1 Section */}
                            {calculatorParams.sectionType === '1x1' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>{t('configuration')}</label>
                                    <ConfigTrigger
                                        isPuisard={calculatorParams.puisard === '1'}
                                        onToggle={() => {
                                            const isPuisard = calculatorParams.puisard === '1';
                                            setCalculatorParams({
                                                ...calculatorParams,
                                                tetes: isPuisard ? '2' : '1',
                                                puisard: isPuisard ? '0' : '1'
                                            });
                                        }}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>{t('specifyDalotLength')}</label>
                                <div className="input-wrapper">
                                    <Ruler size={18} className="input-icon" />
                                    <input
                                        type="number"
                                        value={calculatorParams.dalotLength}
                                        onChange={(e) => setCalculatorParams({ ...calculatorParams, dalotLength: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="results-container">
                            <h3>{t('calculatedRequirements')}</h3>
                            <div className="results-grid">
                                <div className={`result-card ${calculateIron("Φ6") > 0 ? 'active' : ''} color-phi6`}>
                                    <span className="result-label">Φ6</span>
                                    <span className="result-value">{calculateIron("Φ6") || "-"}</span>
                                    <span className="result-unit">{t('bars')}</span>
                                </div>
                                <div className={`result-card ${calculateIron("Φ8") > 0 ? 'active' : ''} color-phi8`}>
                                    <span className="result-label">Φ8</span>
                                    <span className="result-value">{calculateIron("Φ8") || "-"}</span>
                                    <span className="result-unit">{t('bars')}</span>
                                </div>
                                <div className={`result-card ${calculateIron("Φ10") > 0 ? 'active' : ''} color-phi10`}>
                                    <span className="result-label">Φ10</span>
                                    <span className="result-value">{calculateIron("Φ10") || "-"}</span>
                                    <span className="result-unit">{t('bars')}</span>
                                </div>
                                <div className={`result-card ${calculateIron("Φ12") > 0 ? 'active' : ''} color-phi12`}>
                                    <span className="result-label">Φ12</span>
                                    <span className="result-value">{calculateIron("Φ12") || "-"}</span>
                                    <span className="result-unit">{t('bars')}</span>
                                </div>
                                <div className={`result-card ${calculateIron("Φ14") > 0 ? 'active' : ''} color-phi14`}>
                                    <span className="result-label">Φ14</span>
                                    <span className="result-value">{calculateIron("Φ14") || "-"}</span>
                                    <span className="result-unit">{t('bars')}</span>
                                </div>
                                <div className={`result-card ${calculateIron("Φ16") > 0 ? 'active' : ''} color-phi16`}>
                                    <span className="result-label">Φ16</span>
                                    <span className="result-value">{calculateIron("Φ16") || "-"}</span>
                                    <span className="result-unit">{t('bars')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'concrete' && (
                    <div className="calculator-section">
                        {/* Re-use the same input grid for now as dimensions are likely needed */}
                        <div className="input-grid">
                            <div className="form-group">
                                <label>{t('sectionType')}</label>
                                <div className="input-wrapper">
                                    <BrickWall size={18} className="input-icon" />
                                    <select
                                        value={calculatorParams.sectionType}
                                        onChange={(e) => {
                                            const newSectionType = e.target.value;
                                            let newTetes = calculatorParams.tetes;
                                            let newPuisard = calculatorParams.puisard;

                                            if (newSectionType !== '1x1') {
                                                newTetes = '2';
                                                newPuisard = '0';
                                            }

                                            setCalculatorParams({
                                                ...calculatorParams,
                                                sectionType: newSectionType,
                                                tetes: newTetes,
                                                puisard: newPuisard
                                            });
                                        }}
                                    >
                                        <option value="1x1">1x1</option>
                                        <option value="2x2x1">2x2x1</option>
                                        <option value="1x3x3">1x3x3</option>
                                        <option value="2x1.5x2">2x1.5x2</option>
                                        <option value="1x2x1">1x2x1</option>
                                        <option value="1x1.5x2">1x1.5x2</option>
                                    </select>
                                    <ChevronDown size={16} className="select-arrow" />
                                </div>
                            </div>

                            {/* Configuration Trigger for 1x1 Section */}
                            {calculatorParams.sectionType === '1x1' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>{t('configuration')}</label>
                                    <ConfigTrigger
                                        isPuisard={calculatorParams.puisard === '1'}
                                        onToggle={() => {
                                            const isPuisard = calculatorParams.puisard === '1';
                                            setCalculatorParams({
                                                ...calculatorParams,
                                                tetes: isPuisard ? '2' : '1',
                                                puisard: isPuisard ? '0' : '1'
                                            });
                                        }}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>{t('specifyDalotLength')}</label>
                                <div className="input-wrapper">
                                    <Ruler size={18} className="input-icon" />
                                    <input
                                        type="number"
                                        value={calculatorParams.dalotLength}
                                        onChange={(e) => setCalculatorParams({ ...calculatorParams, dalotLength: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="results-container">
                            <h3>{t('volumeM3')}</h3>
                            <div className="concrete-grid mb-8">
                                <div className="concrete-card">
                                    <span className="result-label">B.P</span>
                                    <span className="result-value">{calculateConcreteVolume('bp')}</span>
                                    <span className="result-unit">m³</span>
                                </div>
                                <div className="concrete-card">
                                    <span className="result-label">Radier</span>
                                    <span className="result-value">{calculateConcreteVolume('radier')}</span>
                                    <span className="result-unit">m³</span>
                                </div>
                                <div className="concrete-card">
                                    <span className="result-label">Piedroits</span>
                                    <span className="result-value">{calculateConcreteVolume('piedroit')}</span>
                                    <span className="result-unit">m³</span>
                                </div>
                                <div className="concrete-card">
                                    <span className="result-label">Dalle</span>
                                    <span className="result-value">{calculateConcreteVolume('dalle')}</span>
                                    <span className="result-unit">m³</span>
                                </div>
                                <div className="concrete-card total">
                                    <span className="result-label">Total</span>
                                    <span className="result-value">{calculateTotalVolume()}</span>
                                    <span className="result-unit">m³</span>
                                </div>
                            </div>

                            <h3>{t('cementBags')}</h3>
                            <div className="concrete-grid">
                                <div className="concrete-card">
                                    <span className="result-label">B.P</span>
                                    <span className="result-value">{calculateBags('bp')}</span>
                                    <span className="result-unit">{t('bags')}</span>
                                </div>
                                <div className="concrete-card">
                                    <span className="result-label">Radier</span>
                                    <span className="result-value">{calculateBags('radier')}</span>
                                    <span className="result-unit">{t('bags')}</span>
                                </div>
                                <div className="concrete-card">
                                    <span className="result-label">Piedroits</span>
                                    <span className="result-value">{calculateBags('piedroit')}</span>
                                    <span className="result-unit">{t('bags')}</span>
                                </div>
                                <div className="concrete-card">
                                    <span className="result-label">Dalle</span>
                                    <span className="result-value">{calculateBags('dalle')}</span>
                                    <span className="result-unit">{t('bags')}</span>
                                </div>
                                <div className="concrete-card total">
                                    <span className="result-label">Total</span>
                                    <span className="result-value">{calculateTotalBags()}</span>
                                    <span className="result-unit">{t('bags')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'wood' && (
                    <div className="calculator-section">
                        <div className="input-grid">
                            <div className="form-group">
                                <label>{t('sectionType')}</label>
                                <div className="input-wrapper">
                                    <BrickWall size={18} className="input-icon" />
                                    <select
                                        value={calculatorParams.sectionType}
                                        onChange={(e) => {
                                            const newSectionType = e.target.value;
                                            let newTetes = calculatorParams.tetes;
                                            let newPuisard = calculatorParams.puisard;

                                            if (newSectionType !== '1x1') {
                                                newTetes = '2';
                                                newPuisard = '0';
                                            }

                                            setCalculatorParams({
                                                ...calculatorParams,
                                                sectionType: newSectionType,
                                                tetes: newTetes,
                                                puisard: newPuisard
                                            });
                                        }}
                                    >
                                        <option value="1x1">1x1</option>
                                        <option value="2x2x1">2x2x1</option>
                                        <option value="1x3x3">1x3x3</option>
                                        <option value="2x1.5x2">2x1.5x2</option>
                                        <option value="1x2x1">1x2x1</option>
                                        <option value="1x1.5x2">1x1.5x2</option>
                                    </select>
                                    <ChevronDown size={16} className="select-arrow" />
                                </div>
                            </div>

                            {/* Configuration Trigger for 1x1 Section */}
                            {calculatorParams.sectionType === '1x1' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>{t('configuration')}</label>
                                    <ConfigTrigger
                                        isPuisard={calculatorParams.puisard === '1'}
                                        onToggle={() => {
                                            const isPuisard = calculatorParams.puisard === '1';
                                            setCalculatorParams({
                                                ...calculatorParams,
                                                tetes: isPuisard ? '2' : '1',
                                                puisard: isPuisard ? '0' : '1'
                                            });
                                        }}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>{t('specifyDalotLength')}</label>
                                <div className="input-wrapper">
                                    <Ruler size={18} className="input-icon" />
                                    <input
                                        type="number"
                                        value={calculatorParams.dalotLength}
                                        onChange={(e) => setCalculatorParams({ ...calculatorParams, dalotLength: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="results-container">
                            <h3>{t('woodRequirements')}</h3>
                            <div className="results-grid">
                                {Object.entries(calculateWood()).map(([key, value]) => {
                                    if (key === 'totalPrice') return null;
                                    return (
                                        <div key={key} className={`result-card ${value > 0 ? 'active' : ''}`}>
                                            <span className="result-label" style={{ textTransform: 'capitalize' }}>{key}</span>
                                            <span className="result-value">{Math.ceil(value)}</span>
                                            <span className="result-unit">{t('units')}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="total-price-card" style={{
                                marginTop: '1.5rem',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                color: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                            }}>
                                <span style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>{t('estimatedTotalCost')}</span>
                                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {calculateWood().totalPrice?.toLocaleString()} FCFA
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === '3d' && (
                    <div className="calculator-section">
                        <div className="input-grid">
                            <div className="form-group">
                                <label>{t('sectionType')}</label>
                                <div className="input-wrapper">
                                    <BrickWall size={18} className="input-icon" />
                                    <select
                                        value={calculatorParams.sectionType}
                                        onChange={(e) => {
                                            const newSectionType = e.target.value;
                                            let newTetes = calculatorParams.tetes;
                                            let newPuisard = calculatorParams.puisard;

                                            // Rule: Only '1x1' can have custom Tetes/Puisard.
                                            // All others must be 2 Tetes, 0 Puisard.
                                            if (newSectionType !== '1x1') {
                                                newTetes = '2';
                                                newPuisard = '0';
                                            }

                                            setCalculatorParams({
                                                ...calculatorParams,
                                                sectionType: newSectionType,
                                                tetes: newTetes,
                                                puisard: newPuisard
                                            });
                                        }}
                                    >
                                        <option value="1x1">1x1</option>
                                        <option value="2x2x1">2x2x1</option>
                                        <option value="1x3x3">1x3x3</option>
                                        <option value="2x1.5x2">2x1.5x2</option>
                                        <option value="1x2x1">1x2x1</option>
                                        <option value="1x1.5x2">1x1.5x2</option>
                                    </select>
                                    <ChevronDown size={16} className="select-arrow" />
                                </div>
                            </div>

                            {/* Configuration Trigger for 1x1 Section */}
                            {calculatorParams.sectionType === '1x1' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>{t('configuration')}</label>
                                    <ConfigTrigger
                                        isPuisard={calculatorParams.puisard === '1'}
                                        onToggle={() => {
                                            const isPuisard = calculatorParams.puisard === '1';
                                            setCalculatorParams({
                                                ...calculatorParams,
                                                tetes: isPuisard ? '2' : '1',
                                                puisard: isPuisard ? '0' : '1'
                                            });
                                        }}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Length (ml)</label>
                                <div className="input-wrapper">
                                    <Ruler size={18} className="input-icon" />
                                    <input
                                        type="number"
                                        value={calculatorParams.dalotLength}
                                        onChange={(e) => setCalculatorParams({ ...calculatorParams, dalotLength: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        <style>{`
                            .trigger-btn {
                                width: 100%;
                                padding: 0.75rem 1rem;
                                border-radius: var(--radius-md);
                                border: none;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                position: relative;
                                overflow: hidden;
                            }

                            .standard-mode {
                                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                                color: white;
                                box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
                            }

                            .puisard-mode {
                                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                                color: white;
                                box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2), 0 2px 4px -1px rgba(217, 119, 6, 0.1);
                            }

                            .trigger-btn:hover {
                                transform: translateY(-1px);
                                filter: brightness(1.1);
                            }

                            .trigger-btn:active {
                                transform: translateY(1px);
                            }

                            .trigger-content {
                                display: flex;
                                align-items: center;
                                gap: 0.75rem;
                                font-weight: 600;
                                font-size: 0.95rem;
                            }

                            .indicator-dot {
                                width: 8px;
                                height: 8px;
                                border-radius: 50%;
                                background: white;
                                box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
                                animation: pulse 2s infinite;
                            }

                            @keyframes pulse {
                                0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                                70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
                                100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                            }
                        `}</style>



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
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    justify-content: center;
                    padding: 0.5rem;
                    background: white;
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-sm);
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                    flex-wrap: wrap; /* Allow wrapping on very small screens */
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
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    font-weight: 500;
                    color: var(--text-secondary);
                    border-radius: var(--radius-md);
                    transition: all 0.2s;
                    white-space: nowrap; /* Prevent text wrapping inside tab */
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

                .input-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 0.75rem;
                    color: var(--text-secondary);
                    pointer-events: none;
                }

                .select-arrow {
                    position: absolute;
                    right: 0.75rem;
                    color: var(--text-secondary);
                    pointer-events: none;
                }

                .calculator-section select, 
                .calculator-section input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    font-size: 1rem;
                    background: white;
                    color: var(--text-main);
                    transition: border-color 0.2s;
                    appearance: none;
                }

                .calculator-section select:focus, 
                .calculator-section input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1);
                }

                .results-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 1rem;
                }

                .result-card {
                    background: var(--bg-secondary);
                    padding: 1.5rem 1rem;
                    border-radius: var(--radius-md);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }

                .result-card.active {
                    background: white;
                    border-color: var(--border);
                    box-shadow: var(--shadow-sm);
                }

                .color-phi6.active { border-bottom: 3px solid #f59e0b; }
                .color-phi8.active { border-bottom: 3px solid #1e293b; }
                .color-phi10.active { border-bottom: 3px solid #10b981; }
                .color-phi12.active { border-bottom: 3px solid #8b5cf6; }
                .color-phi14.active { border-bottom: 3px solid #ef4444; }
                .color-phi16.active { border-bottom: 3px solid #ec4899; }

                .result-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }

                .result-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-main);
                }

                .result-unit {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }

                .concrete-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 1rem;
                }

                .mb-8 {
                    margin-bottom: 2rem;
                }

                .concrete-card {
                    background: var(--bg-secondary);
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                    border: 1px solid transparent;
                }

                .concrete-card.total {
                    background: var(--primary-light);
                    color: white;
                }
                
                .concrete-card.wood-total {
                    grid-column: 1 / -1;
                }

                .concrete-card.total .result-label,
                .concrete-card.total .result-value,
                .concrete-card.total .result-unit {
                    color: white;
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

                .result-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-main);
                    word-break: break-word;
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

                    .input-grid {
                        grid-template-columns: 1fr; /* Stack inputs on mobile */
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }

                    .results-grid, .concrete-grid {
                        grid-template-columns: repeat(2, 1fr); /* 2 columns for results */
                    }
                    
                    .result-value {
                        font-size: 1.25rem;
                    }
                }

                            .trigger-btn {
                                width: 100%;
                                padding: 0.75rem 1rem;
                                border-radius: var(--radius-md);
                                border: none;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                position: relative;
                                overflow: hidden;
                            }
                            
                            .standard-mode {
                                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                                color: white;
                                box-shadow: 0 4px 6px -1px rgba(30, 41, 59, 0.2), 0 2px 4px -1px rgba(30, 41, 59, 0.1);
                            }

                            .puisard-mode {
                                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                                color: white;
                                box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2), 0 2px 4px -1px rgba(217, 119, 6, 0.1);
                            }

                            .trigger-btn:hover {
                                transform: translateY(-1px);
                                filter: brightness(1.1);
                            }

                            .trigger-btn:active {
                                transform: translateY(1px);
                            }

                            .trigger-content {
                                display: flex;
                                align-items: center;
                                gap: 0.75rem;
                                font-weight: 600;
                                font-size: 0.95rem;
                            }

                            .indicator-dot {
                                width: 8px;
                                height: 8px;
                                border-radius: 50%;
                                background: white;
                                box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
                                animation: pulse 2s infinite;
                            }

                            @keyframes pulse {
                                0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                                70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
                                100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                            }
            `}</style>
        </div >
    );
};

export default CalculatorPage;
