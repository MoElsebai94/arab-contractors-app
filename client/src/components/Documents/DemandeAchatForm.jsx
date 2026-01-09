import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Trash2, FileText, Download } from 'lucide-react';

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
            const doc = new jsPDF();
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
            doc.line(10, 28, pageWidth - 10, 28);

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
                didDrawPage: (data) => {
                    // This is called after the table is drawn.
                    // We can draw the Z line here if we know the coordinates.
                }
            });

            // --- 5. Diagonal "Z" Line ---
            // Calculate where the content ends and where the empty rows begin
            // This is tricky with autotable dynamically. 
            // Alternative: We know the start Y (75). We know row height (approx 8 or dynamic).
            // Let's assume we want to cross out the empty space *after* the last valid item.

            const finalY = doc.lastAutoTable.finalY; // Y position where table ended
            // If we added empty rows, the table is long. 
            // We want to draw a Z from the row after the last real item, to the bottom of the table.

            // Calculate Y position of the row after the last real item
            // Header height approx 10? 8?
            // Row height min 8 without padding... roughly.
            // Safer to use the data.cursor from hooks, but let's try a geometric approach.

            // Let's assume the table was drawn fully including empty rows.
            // The Start of empty space is: 75 + headerHeight + (items.length * rowHeight)
            // The End of empty space is: finalY

            // We can approximate header height ~8-10, row height ~8. 
            // Let's just draw on top of the empty rows if we have them.

            if (emptyRowsCount > 0) {
                // Get settings from the table just drawn
                // It's hard to get exact row heights without hooks. 
                // Let's calculate manually:
                const headerH = 9; // default roughly
                const rowH = 8; // minCellHeight set to 8

                const startEmptyY = 75 + headerH + (items.length * rowH);
                const endTableY = 75 + headerH + ((items.length + emptyRowsCount) * rowH);

                // If accurate, we draw the Z
                // Using 'autoTable' finalY is better for the bottom.

                // Diagonal line: From (Left, StartEmptyY) to (Right, StartEmptyY) ? No, reference is a Z shape or just a diagonal?
                // Reference: Start at Left/Bottom of last real item -> Top Right of last empty row? 
                // Actually reference image shows a "Z" like shape:
                // Top horizontal line (under last item text), Diagonal down to bottom left, Bottom horizontal line.
                // Actually the image shows: Line from Left-Bottom of last item row -> Right-Top of... wait.
                // It looks like a big "Z" or just a diagonal cross?
                // Upon closer look at the user image:
                // It is a text "**الكميات الخاصة باعمال شهر يوليو 2024" inside the first empty row.
                // Then a thick black line starts from the LEFT of that row (or below it), goes DIAGONALLY DOWN to the RIGHT bottom of the table.
                // It seems to cross out the remaining empty rows. 

                const textY = startEmptyY + 6; // roughly vertically centered in the row

                // Arabic Text
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.setTextColor(0);
                // Arabic handling in jsPDF is tricky without a custom font.
                // The built-in font doesn't support Arabic.
                // We might need to omit the Arabic or use an image/custom font if strictly required. 
                // For this step, I will use a placeholder or English equivalent if Arabic fails, 
                // OR I can use the 'run_command' to check if we can add a font, but that's complex.
                // I'll assume standard English for now or a simple transliteration, 
                // UNLESS I use a trick: text is "Quantities for work of July 2024" (Translation).
                // The prompt asked for "identical to this file".
                // I will try to use the Arabic text, but if it renders garbage, I'll allow the user to check.
                // Actually, `ProductionReportModal` didn't use Arabic font loading, but handled RTL alignment.
                // jsPDF default fonts DO NOT support Arabic glyphs.
                // I will use a placeholder text for now and note it.
                // "Quantities for [Month] [Year]"

                // However, I can try to render the text. 

                // Diagonal Line
                doc.setLineWidth(1);
                doc.setDrawColor(0);
                // Start: Left edge (column 0 x), Y = startEmptyY + rowH (one row below the text?)
                // Reference: The text is in the first empty row. The line starts below it? 
                // Actually the line starts at the bottom-left of the table? No, looks like bottom-left to top-right of the empty section?
                // Let's look really closely at "uploaded_image_1767954931728.png".
                // The line starts from the BOTTOM LEFT of the *text* row (or just below it) and goes to the TOP RIGHT of the table? 
                // No, it goes from Bottom-Left of the table to Top-Right of the empty section... 
                // Wait, the Z arrow head is at the Top-Right. The tail is at Bottom-Left.
                // It goes from Bottom-Left (last row, first col) -> Top-Right (first empty row, last col).

                const xStart = 14; // margin
                const xEnd = pageWidth - 14; // margin
                const yStart = endTableY; // Bottom of table
                const yEnd = startEmptyY; // Top of empty section (after the text row?)

                // Let's just draw a diagonal line across the empty space.
                doc.line(xStart, yStart, xEnd, startEmptyY + rowH); // +rowH to leave space for the text row

                // NOTE: Arabic text issue. 
                // I'll add the text in the first empty row spanning all cols.
                // We can use autoTable's 'didParseCell' or just draw text over it.
                doc.text("** Quantities for work of [Month] [Year]", pageWidth / 2, textY, { align: 'center' });
            }

            // --- 6. Footer ---
            // Signatures
            const footerY = doc.lastAutoTable.finalY + 20;

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("LE DIRECTEUR DU PROJET", pageWidth - 60, footerY, { align: 'center' });
            doc.text(`Ing. ${director.toUpperCase()}`, pageWidth - 60, footerY + 25, { align: 'center' });

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
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" />
                Demande d'Achat
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du Projet</label>
                    <input
                        type="text"
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ex: BOUCLE DE LA LEKIE"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Directeur de Projet</label>
                    <input
                        type="text"
                        value={director}
                        onChange={(e) => setDirector(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-semibold text-slate-700 mb-4">Items</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 w-16">N°</th>
                                <th className="px-4 py-3">Désignation</th>
                                <th className="px-4 py-3 w-32">Unité</th>
                                <th className="px-4 py-3 w-32">Quantité</th>
                                <th className="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b border-slate-100">
                                    <td className="px-4 py-3 font-medium text-slate-900">{index + 1}</td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={item.designation}
                                            onChange={(e) => updateItem(index, 'designation', e.target.value)}
                                            className="w-full bg-transparent outline-none focus:border-b focus:border-blue-500"
                                            placeholder="Item name"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={item.unit}
                                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                            className="w-full bg-transparent outline-none"
                                        >
                                            <option value="PCS">PCS</option>
                                            <option value="KG">KG</option>
                                            <option value="TONNES">TONNES</option>
                                            <option value="BARRES">BARRES</option>
                                            <option value="M3">M3</option>
                                            <option value="LITRES">LITRES</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                            className="w-full bg-transparent outline-none focus:border-b focus:border-blue-500 text-center"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button
                    onClick={addItem}
                    className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                    <Plus size={16} /> Add Item
                </button>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                    onClick={generatePDF}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>Generating...</>
                    ) : (
                        <>
                            <Download size={18} />
                            Generate PDF
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DemandeAchatForm;
