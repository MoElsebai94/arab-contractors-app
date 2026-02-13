import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_LABELS = {
    pending: { en: 'Pending', ar: 'قيد الانتظار', color: [180, 180, 180] },
    in_progress: { en: 'In Progress', ar: 'قيد التنفيذ', color: [59, 130, 246] },
    finished: { en: 'Finished', ar: 'مكتمل', color: [34, 197, 94] },
    cancelled: { en: 'Cancelled', ar: 'ملغى', color: [239, 68, 68] }
};

const loadLogo = async () => {
    try {
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = '/logo_circular.png';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
};

/**
 * Export dalots data as a professional PDF report.
 * @param {Object} params
 * @param {Array} params.sections - Array of section objects
 * @param {Array} params.dalots - Array of dalot objects
 * @param {Object} params.stats - Stats object { total, finished, in_progress, cancelled, validated }
 * @param {boolean} params.isRTL - Whether the language is Arabic (RTL)
 * @param {Function} params.getDalotsBySection - Function to get filtered/sorted dalots for a section
 */
export const exportDalotsPDF = async ({ sections, dalots, stats, isRTL, getDalotsBySection }) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoImg = await loadLogo();

    // ── Header ──
    let y = 12;

    if (logoImg) {
        const logoH = 16;
        const logoW = logoH * (logoImg.width / logoImg.height);
        doc.addImage(logoImg, 'PNG', 14, y - 4, logoW, logoH);
    }

    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'bold');
    doc.text('Arab Contractors Cameroon', pageWidth / 2, y, { align: 'center' });

    y += 8;
    doc.setFontSize(14);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');
    doc.text(
        isRTL ? 'Dalots Management Report / تقرير إدارة الدالوت' : 'Dalots Management Report',
        pageWidth / 2, y, { align: 'center' }
    );

    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(130);
    const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Generated: ${dateStr}`, pageWidth / 2, y, { align: 'center' });

    // Separator line
    y += 4;
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);

    // ── Summary Statistics ──
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'bold');
    doc.text(isRTL ? 'Summary / الملخص' : 'Summary', 14, y);

    y += 2;
    const summaryData = [
        [
            String(stats.total || 0),
            String(stats.finished || 0),
            String(stats.in_progress || 0),
            String(stats.cancelled || 0),
            String((stats.total || 0) - (stats.finished || 0) - (stats.in_progress || 0) - (stats.cancelled || 0)),
            String(stats.validated || 0)
        ]
    ];

    autoTable(doc, {
        startY: y,
        head: [[
            isRTL ? 'Total / الإجمالي' : 'Total',
            isRTL ? 'Finished / مكتمل' : 'Finished',
            isRTL ? 'In Progress / قيد التنفيذ' : 'In Progress',
            isRTL ? 'Cancelled / ملغى' : 'Cancelled',
            isRTL ? 'Pending / قيد الانتظار' : 'Pending',
            isRTL ? 'Validated / تم التحقق' : 'Validated'
        ]],
        body: summaryData,
        theme: 'grid',
        headStyles: {
            fillColor: [21, 67, 96],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 2
        },
        bodyStyles: {
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 3,
            textColor: [30, 30, 30]
        },
        columnStyles: {
            0: { textColor: [0, 51, 102] },
            1: { textColor: [34, 197, 94] },
            2: { textColor: [59, 130, 246] },
            3: { textColor: [239, 68, 68] },
            4: { textColor: [150, 150, 150] },
            5: { textColor: [16, 185, 129] }
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto'
    });

    y = doc.lastAutoTable.finalY + 10;

    // ── Section Tables ──
    const tableHead = [[
        '#',
        isRTL ? 'N° Transmis\nرقم المنشأة المرسل' : 'N° Transmis',
        isRTL ? "N° d'Étude\nرقم الدراسة" : "N° d'Étude",
        isRTL ? 'N° Définitif\nالرقم النهائي' : 'N° Définitif',
        isRTL ? "PK d'Étude\nنقطة الدراسة" : "PK d'Étude",
        isRTL ? 'PK Transmis\nنقطة المرسل' : 'PK Transmis',
        isRTL ? 'Dimension\nالأبعاد' : 'Dimension',
        isRTL ? 'Length (m)\nالطول' : 'Length (m)',
        isRTL ? 'Status\nالحالة' : 'Status',
        isRTL ? 'Validated\nتحقق' : 'Validated',
        isRTL ? 'Notes\nملاحظات' : 'Notes'
    ]];

    for (const section of sections) {
        const sectionDalots = getDalotsBySection(section.id);
        if (sectionDalots.length === 0) continue;

        // Check if we have enough space, otherwise new page
        if (y > pageHeight - 40) {
            doc.addPage();
            y = 14;
        }

        // Section header
        doc.setFontSize(11);
        doc.setTextColor(0, 51, 102);
        doc.setFont('helvetica', 'bold');

        const finishedCount = sectionDalots.filter(d => d.status === 'finished').length;
        const progress = sectionDalots.length > 0 ? Math.round((finishedCount / sectionDalots.length) * 100) : 0;

        let sectionTitle = `${section.name}`;
        if (section.route_name) sectionTitle += ` — ${section.route_name}`;
        sectionTitle += `  (${sectionDalots.length} dalots, ${progress}% complete)`;

        doc.text(sectionTitle, 14, y);
        y += 2;

        // Build table rows
        const tableBody = sectionDalots.map((dalot, index) => {
            const statusInfo = STATUS_LABELS[dalot.status] || STATUS_LABELS.pending;
            const statusText = isRTL ? `${statusInfo.en} / ${statusInfo.ar}` : statusInfo.en;
            const validatedText = dalot.is_validated
                ? (isRTL ? 'Yes / نعم' : 'Yes')
                : (isRTL ? 'No / لا' : 'No');

            return [
                String(index + 1),
                dalot.ouvrage_transmis || '-',
                dalot.ouvrage_etude || '-',
                dalot.ouvrage_definitif || '-',
                dalot.pk_etude || '-',
                dalot.pk_transmis || '-',
                dalot.dimension || '-',
                dalot.length > 0 ? String(dalot.length) : '-',
                statusText,
                validatedText,
                dalot.notes || ''
            ];
        });

        autoTable(doc, {
            startY: y,
            head: tableHead,
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [21, 67, 96],
                textColor: 255,
                fontSize: 7.5,
                fontStyle: 'bold',
                halign: 'center',
                cellPadding: 1.5,
                lineWidth: 0.1,
                lineColor: [200, 200, 200],
                minCellHeight: 8
            },
            bodyStyles: {
                textColor: [40, 40, 40],
                fontSize: 7.5,
                halign: 'center',
                cellPadding: 1.5,
                lineWidth: 0.1,
                lineColor: [220, 220, 220],
                minCellHeight: 6
            },
            columnStyles: {
                0: { cellWidth: 8, halign: 'center' },
                1: { cellWidth: 22, fontStyle: 'bold', halign: 'left' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
                5: { cellWidth: 22, halign: 'center' },
                6: { cellWidth: 22, halign: 'center' },
                7: { cellWidth: 18, halign: 'center' },
                8: { cellWidth: 24, halign: 'center' },
                9: { cellWidth: 18, halign: 'center' },
                10: { halign: 'left', cellWidth: 'auto' }
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            margin: { left: 14, right: 14 },
            didParseCell: function (data) {
                if (data.section === 'body') {
                    // Color-code status column (index 8)
                    if (data.column.index === 8) {
                        const rawRow = tableBody[data.row.index];
                        if (rawRow) {
                            const dalot = sectionDalots[data.row.index];
                            if (dalot) {
                                const statusInfo = STATUS_LABELS[dalot.status];
                                if (statusInfo) {
                                    data.cell.styles.textColor = statusInfo.color;
                                    data.cell.styles.fontStyle = 'bold';
                                }
                            }
                        }
                    }
                    // Color-code validated column (index 9)
                    if (data.column.index === 9) {
                        const dalot = sectionDalots[data.row.index];
                        if (dalot && dalot.is_validated) {
                            data.cell.styles.textColor = [16, 185, 129];
                            data.cell.styles.fontStyle = 'bold';
                        } else {
                            data.cell.styles.textColor = [180, 180, 180];
                        }
                    }
                    // Highlight special note rows
                    if (data.column.index === 10) {
                        const dalot = sectionDalots[data.row.index];
                        if (dalot?.notes?.includes('NOUVEAU DALOT')) {
                            data.cell.styles.textColor = [59, 130, 246];
                            data.cell.styles.fontStyle = 'bold';
                        } else if (dalot?.notes?.includes('LE PONT')) {
                            data.cell.styles.textColor = [168, 85, 247];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                }
            }
        });

        y = doc.lastAutoTable.finalY + 10;
    }

    // ── Footer on every page ──
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(160);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Arab Contractors Cameroon — Dalots Report — Generated: ${dateStr}`,
            14, pageHeight - 6
        );
        doc.text(
            `Page ${i} / ${totalPages}`,
            pageWidth - 14, pageHeight - 6,
            { align: 'right' }
        );
    }

    // ── Save ──
    const fileName = `Dalots_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
