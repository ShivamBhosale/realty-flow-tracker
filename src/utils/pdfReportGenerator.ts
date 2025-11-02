import { jsPDF } from 'jspdf';

interface ReportMetrics {
  calls_made: number;
  contacts_reached: number;
  appointments_set: number;
  appointments_attended: number;
  listings_taken: number;
  buyers_signed: number;
  closed_deals: number;
  volume_closed: number;
}

interface ReportData {
  startDate: string;
  endDate: string;
  totals: ReportMetrics;
  contactRate: string;
  apptRate: string;
  timeframe: 'week' | 'month';
}

export function generatePDFReport(data: ReportData): void {
  const doc = new jsPDF();
  const { startDate, endDate, totals, contactRate, apptRate, timeframe } = data;

  // Set colors
  const primaryColor = [102, 126, 234]; // #667eea
  const darkColor = [51, 51, 51];
  const lightGray = [102, 102, 102];

  // Header with gradient effect
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 45, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text(`${timeframe === 'week' ? 'Weekly' : 'Monthly'} Performance Report`, 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 105, 32, { align: 'center' });

  // Reset text color for content
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  // Metrics Grid
  let yPos = 60;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Activity Metrics', 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const metrics = [
    { label: 'Calls Made', value: totals.calls_made },
    { label: 'Contacts Reached', value: totals.contacts_reached },
    { label: 'Appointments Set', value: totals.appointments_set },
    { label: 'Appointments Attended', value: totals.appointments_attended },
    { label: 'Listings Taken', value: totals.listings_taken },
    { label: 'Buyers Signed', value: totals.buyers_signed },
    { label: 'Closed Deals', value: totals.closed_deals },
    { label: 'Volume Closed', value: `$${totals.volume_closed.toLocaleString()}` },
  ];

  // Draw metrics in a grid
  metrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const xPos = 20 + (col * 95);
    const metricYPos = yPos + (row * 25);

    // Background box
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(xPos, metricYPos, 85, 20, 3, 3, 'F');

    // Label
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setFontSize(9);
    doc.text(metric.label.toUpperCase(), xPos + 42.5, metricYPos + 7, { align: 'center' });

    // Value
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(metric.value), xPos + 42.5, metricYPos + 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Conversion Rates Section
  yPos += 110;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Conversion Rates', 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const conversions = [
    { label: 'Calls → Contacts', value: `${contactRate}%` },
    { label: 'Contacts → Appointments', value: `${apptRate}%` },
  ];

  conversions.forEach((conversion, index) => {
    const convYPos = yPos + (index * 18);
    
    // Background box
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(20, convYPos, 170, 15, 3, 3, 'F');

    // Label
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(conversion.label, 25, convYPos + 10);

    // Value
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(conversion.value, 185, convYPos + 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  });

  // Footer
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setFontSize(10);
  doc.text('Keep up the great work! 🎯', 105, 280, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 287, { align: 'center' });

  // Save the PDF
  const fileName = `performance-report-${timeframe}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
