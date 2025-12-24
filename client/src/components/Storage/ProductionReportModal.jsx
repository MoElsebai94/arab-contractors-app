import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, FileText, PieChart } from 'lucide-react';

const ProductionReportModal = ({ data, onClose, t, language }) => {
    const [loading, setLoading] = useState(false);

    // Calculate Stats for Preview
    const totalItems = data.length;
    const completedItems = data.filter(i => i.current_quantity >= i.target_quantity).length;
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const generatePDF = async () => {
        setLoading(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // --- 1. Load Logo ---
            let logoImg = null;
            try {
                logoImg = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = '/logo_circular.png';
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(e);
                });
            } catch (err) { console.warn("Logo load failed", err); }

            // --- 2. Header ---
            if (logoImg) {
                doc.addImage(logoImg, 'PNG', 14, 8, 20, 20 * (logoImg.height / logoImg.width));
            }
            doc.setFontSize(18);
            doc.setTextColor(0, 51, 102);
            doc.setFont("helvetica", "bold");
            doc.text("Arab Contractors Cameroon", pageWidth / 2, 18, { align: "center" });

            // --- English Only Strings ---
            const text = {
                title: "Production Status Report",
                generated: "Generated on",
                summary: "Production Summary",
                status: "Status Distribution",
                categories: "Category Breakdown",
                details: "Detailed Item Analysis",
                item: "Item",
                progress: "Progress",
                estTime: "Est. Time",
                done: "Done",
                days: "days"
            };

            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.setFont("helvetica", "normal");
            doc.text(text.title, pageWidth / 2, 26, { align: "center" });

            const dateStr = new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            doc.text(`${text.generated}: ${dateStr}`, pageWidth / 2, 32, { align: "center" });

            doc.setDrawColor(200);
            doc.line(14, 38, pageWidth - 14, 38);

            let yPos = 50;

            // --- 3. Summary Charts (Page 1) ---
            doc.setFontSize(14);
            doc.setTextColor(0, 51, 102);
            doc.text(text.summary, 14, yPos);
            yPos += 15;

            // Enhanced Summary Visualization
            // 1. Overall Completion Progress Bar
            const done = data.filter(i => i.current_quantity >= i.target_quantity).length;
            const inProgress = data.filter(i => i.current_quantity > 0 && i.current_quantity < i.target_quantity).length;
            const notStarted = data.filter(i => i.current_quantity === 0).length;
            const total = data.length;

            // Draw Summary Box
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(14, yPos, 85, 65, 3, 3, 'FD');

            doc.setFontSize(11);
            doc.setTextColor(50);
            doc.text("Overall Completion", 56, yPos + 10, { align: 'center' });

            const donePct = total > 0 ? (done / total) : 0;
            const progressPct = total > 0 ? (inProgress / total) : 0;

            // Draw Main Percentage
            const totalProgress = Math.round(data.reduce((acc, i) => acc + (i.target_quantity > 0 ? Math.min(1, i.current_quantity / i.target_quantity) : 0), 0) / (total || 1) * 100);

            doc.setFontSize(28);
            doc.setTextColor(22, 163, 74); // Green
            doc.text(`${totalProgress}%`, 56, yPos + 28, { align: 'center' });

            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text("Average Progress", 56, yPos + 36, { align: 'center' });

            // Small Status Bars below
            const barY = yPos + 48;
            const barW = 60;
            const barH = 4;
            const barX = 26;

            // Background
            doc.setFillColor(226, 232, 240);
            doc.rect(barX, barY, barW, barH, 'F');

            // Fill
            doc.setFillColor(22, 163, 74);
            doc.rect(barX, barY, barW * (totalProgress / 100), barH, 'F');


            // Category Summary Box
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(105, yPos, 90, 65, 3, 3, 'FD');
            doc.setFontSize(11);
            doc.setTextColor(50);
            doc.text("Category Breakdown", 150, yPos + 10, { align: 'center' });

            let catY = yPos + 25;
            const categories = {};
            data.forEach(item => categories[item.category] = (categories[item.category] || 0) + 1);
            const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5

            sortedCats.forEach(([cat, count]) => {
                const pct = Math.round((count / total) * 100);
                doc.setFontSize(9);
                doc.setTextColor(70);
                doc.text(`${cat}`, 115, catY);
                doc.text(`${count} (${pct}%)`, 185, catY, { align: 'right' });

                // Mini bar
                doc.setFillColor(226, 232, 240);
                doc.rect(115, catY + 2, 70, 1.5, 'F');
                doc.setFillColor(59, 130, 246); // Blue
                doc.rect(115, catY + 2, 70 * (count / total), 1.5, 'F');

                catY += 9;
            });

            yPos += 80;

            // --- 4. Detailed Item Visualization (Cards) ---
            doc.setFontSize(14);
            doc.setTextColor(0, 51, 102);
            doc.text(text.details, 14, yPos);
            yPos += 10;

            for (let i = 0; i < data.length; i++) {
                const item = data[i];

                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Item Container
                doc.setDrawColor(226, 232, 240);
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(14, yPos, 182, 35, 2, 2, 'FD'); // Draw border and white fill

                // Left: Info
                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42); // slate-900
                doc.setFont("helvetica", "bold");
                doc.text(item.name, 20, yPos + 10);

                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.setFont("helvetica", "normal");
                doc.text(item.category.toUpperCase(), 20, yPos + 16);

                doc.text(`Rate: ${item.daily_rate}/day`, 20, yPos + 24);

                // Middle: Progress Stats
                const pct = Math.min(100, Math.round((item.current_quantity / (item.target_quantity || 1)) * 100));
                const remaining = item.target_quantity - item.current_quantity;
                let daysLeft = remaining <= 0 ? text.done : `${Math.ceil(remaining / (item.daily_rate || 1))} ${text.days}`;
                if (item.daily_rate === 0 && remaining > 0) daysLeft = "∞";

                doc.setFontSize(10);
                doc.setTextColor(50);
                doc.text(`${text.progress}: ${item.current_quantity} / ${item.target_quantity}`, 90, yPos + 12);
                doc.text(`${text.estTime}: ${daysLeft}`, 90, yPos + 20);

                // Right: Visual Bar Chart
                const chartX = 140;
                const chartY = yPos + 12;
                const chartW = 45;
                const chartH = 6;

                // Label
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text("Completion", chartX, chartY - 2);
                doc.text(`${pct}%`, chartX + chartW, chartY - 2, { align: 'right' });

                // Bar Background
                doc.setFillColor(241, 245, 249);
                doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'F');

                // Bar Fill
                if (pct > 0) {
                    doc.setFillColor(pct >= 100 ? 34 : 59, pct >= 100 ? 197 : 130, pct >= 100 ? 94 : 246); // Green or Blue
                    // Clamp width
                    const fillW = Math.max(2, (pct / 100) * chartW);
                    doc.roundedRect(chartX, chartY, fillW, chartH, 2, 2, 'F');
                }

                yPos += 42;
            }

            doc.save(`Production_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            onClose();

        } catch (err) {
            console.error("PDF Gen Error", err);
            alert("Failed to generate PDF");
        } finally {
            setLoading(false);
        }
    };

    const isRTL = language === 'ar';

    return (
        <div className="modal-overlay" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <div className="modal-card" style={{ maxWidth: '400px' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <h3 style={{ textAlign: isRTL ? 'right' : 'left' }}>{t('productionReport') || "Production Report"}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <div className="report-preview" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexDirection: isRTL ? 'row' : 'row' }}>
                        <div style={{ padding: '0.8rem', background: '#dbeafe', color: '#1e40af', borderRadius: '50%' }}>
                            <PieChart size={24} />
                        </div>
                        <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{t('statusSnapshot') || "Status Snapshot"}</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', direction: 'ltr', textAlign: isRTL ? 'right' : 'left' }}>
                                {/* Force LTR for numbers to prevent garbling, but align right for Arabic */}
                                <span style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', gap: '0.5rem', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                                    <span>{totalItems} {t('items') || "Items"}</span>
                                    <span>•</span>
                                    <span>{progress}% {t('completed') || "Completed"}</span>
                                </span>
                            </p>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: isRTL ? 'right' : 'left' }}>
                        {t('reportDesc') || "Generate a comprehensive PDF report including current progress status, completion estimates, and category breakdowns."}
                    </p>
                </div>

                <div className="modal-actions" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('cancel')}</button>
                    <button className="btn btn-primary" onClick={generatePDF} disabled={loading}>
                        {loading ? t('generating') + "..." : t('generatePDF')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductionReportModal;
