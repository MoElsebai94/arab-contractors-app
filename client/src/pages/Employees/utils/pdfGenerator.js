import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

export const renderEmployeeReport = async (doc, employee, startDate, endDate, title, logoImg) => {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Fetch data
    const response = await axios.get(`/api/attendance/${employee.id}?startDate=${startStr}&endDate=${endStr}`);
    const attendanceDataRaw = response.data.data || [];

    const attendanceMap = new Map();
    attendanceDataRaw.forEach(record => {
        const d = new Date(record.date).toISOString().split('T')[0];
        attendanceMap.set(d, record);
    });

    // Add Logo
    if (logoImg) {
        doc.addImage(logoImg, 'PNG', 14, 8, 20, 20 * (logoImg.height / logoImg.width));
    }

    // --- Header Section ---
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("Arab Contractors Cameroon", 105, 18, { align: "center" });

    // Report Title
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(title || "Employee Attendance Report", 105, 26, { align: "center" });

    // Line Separator
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);

    // --- Employee Details ---
    doc.setFontSize(10);
    doc.setTextColor(50);

    const startY = 38;
    doc.text(`Name:`, 14, startY);
    doc.setFont("helvetica", "bold");
    doc.text(`${employee.name}`, 30, startY);
    doc.setFont("helvetica", "normal");

    doc.text(`Role:`, 14, startY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(`${employee.role || 'N/A'}`, 30, startY + 5);
    doc.setFont("helvetica", "normal");

    // Status
    if (employee.is_active === 0) {
        doc.setTextColor(231, 76, 60);
        doc.setFont("helvetica", "bold");
        doc.text("STATUS: INACTIVE", 196, startY, { align: "right" });
    } else {
        doc.setTextColor(39, 174, 96);
        doc.setFont("helvetica", "bold");
        doc.text("STATUS: ACTIVE", 196, startY, { align: "right" });
    }

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.setFontSize(9);
    const rangeText = `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    doc.text(rangeText, 196, startY + 5, { align: "right" });

    // --- Attendance Table ---
    const tableColumn = ["DATE", "STATUS", "TIME IN", "TIME OUT", "NOTES"];
    const tableRows = [];

    let loopDate = new Date(startDate);
    const stopDate = new Date(endDate);

    while (loopDate <= stopDate) {
        const dayStr = loopDate.toISOString().split('T')[0];
        const record = attendanceMap.get(dayStr);

        const dateOptions = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
        let dateDisplay = loopDate.toLocaleDateString('fr-FR', dateOptions);
        dateDisplay = dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1);

        const status = record ? (record.status || 'Present').toUpperCase() : '';
        const timeIn = record ? (record.start_time || '-') : '';
        const timeOut = record ? (record.end_time || '-') : '';
        const notes = record ? (record.notes || '') : '';

        tableRows.push([dateDisplay, status, timeIn, timeOut, notes]);
        loopDate.setDate(loopDate.getDate() + 1);
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY + 12,
        theme: 'grid',
        headStyles: {
            fillColor: [21, 67, 96],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 1.5,
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        bodyStyles: {
            textColor: 40,
            fontSize: 8,
            halign: 'center',
            cellPadding: 1.5,
            lineWidth: 0.1,
            lineColor: [220, 220, 220]
        },
        columnStyles: {
            0: { halign: 'left' },
            4: { halign: 'left' }
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        },
        margin: { top: 10, bottom: 10 },
        didParseCell: function (data) {
            if (data.section === 'body') {
                const dateStr = data.row.raw[0].toLowerCase();
                if (dateStr.startsWith('samedi') || dateStr.startsWith('dimanche')) {
                    data.cell.styles.fillColor = [252, 248, 227];
                }
                if (data.column.index === 1) {
                    const statusText = (data.cell.raw || '').toString().toUpperCase();
                    if (statusText === 'PRESENT') {
                        data.cell.styles.textColor = [39, 174, 96];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (statusText === 'ABSENT' || statusText.includes('ABSENT')) {
                        data.cell.styles.textColor = [231, 76, 60];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (statusText === 'LATE') {
                        data.cell.styles.textColor = [243, 156, 18];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        }
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
};

export const loadLogo = async () => {
    try {
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = '/logo_circular.png';
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        });
    } catch (err) {
        console.warn("Logo load failed", err);
        return null;
    }
};

export const generateAttendancePDF = async (employee, startDate, endDate, title) => {
    try {
        const doc = new jsPDF();
        const logoImg = await loadLogo();
        await renderEmployeeReport(doc, employee, startDate, endDate, title, logoImg);

        const sanitizedName = employee.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const sanitizedMonth = title ? title.replace(/[^a-z0-9]/gi, '_') : 'report';
        doc.save(`Attendance_${sanitizedName}_${sanitizedMonth}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate report. Please try again.");
    }
};

export const generateGlobalAttendancePDF = async (employees, startDate, endDate, title, onProgress) => {
    try {
        const doc = new jsPDF();
        const logoImg = await loadLogo();

        // Iterate all employees
        const total = employees.length;
        for (let i = 0; i < total; i++) {
            if (onProgress) onProgress(i + 1, total);

            const emp = employees[i];
            if (i > 0) doc.addPage();
            await renderEmployeeReport(doc, emp, startDate, endDate, title, logoImg);

            // Small delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        const sanitizedMonth = title ? title.replace(/[^a-z0-9]/gi, '_') : 'global_report';
        doc.save(`Global_Attendance_${sanitizedMonth}.pdf`);
    } catch (error) {
        console.error("Error generating Global PDF:", error);
        alert("Failed to generate global report.");
    }
};
