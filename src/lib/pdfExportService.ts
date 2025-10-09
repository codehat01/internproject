import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceExportRecord {
  date: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  status: string;
  location: string;
}

interface UserInfo {
  full_name: string;
  badge_number: string;
  rank?: string;
  department?: string;
}

export class PDFExportService {
  exportAttendanceReport(
    attendanceRecords: AttendanceExportRecord[],
    userInfo: UserInfo,
    reportTitle: string = 'Attendance Report'
  ): void {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Police Attendance System', 14, 20);

    doc.setFontSize(14);
    doc.text(reportTitle, 14, 28);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);

    doc.setFontSize(12);
    doc.text('Officer Information', 14, 45);
    doc.setFontSize(10);
    doc.text(`Name: ${userInfo.full_name}`, 14, 52);
    doc.text(`Badge Number: ${userInfo.badge_number}`, 14, 58);
    if (userInfo.rank) {
      doc.text(`Rank: ${userInfo.rank}`, 14, 64);
    }
    if (userInfo.department) {
      doc.text(`Department: ${userInfo.department}`, 14, 70);
    }

    const startY = userInfo.department ? 78 : (userInfo.rank ? 72 : 66);

    const tableData = attendanceRecords.map(record => [
      record.date,
      record.timeIn,
      record.timeOut,
      record.hours,
      record.status,
      record.location
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['Date', 'Time In', 'Time Out', 'Hours', 'Status', 'Location']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [10, 31, 68],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 'auto' }
      },
      margin: { top: 10 }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${totalPages}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const fileName = `attendance_${userInfo.badge_number}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}

export const pdfExportService = new PDFExportService();
