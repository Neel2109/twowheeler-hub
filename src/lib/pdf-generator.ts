import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RepairOrder } from '@/types/repair-order';
import { calculateTotals } from '@/lib/repair-orders';

export function generateRepairOrderPDF(order: RepairOrder) {
  const doc = new jsPDF();
  const { partsTotal, laborTotal, subtotal, finalAmount } = calculateTotals(
    order.spareParts, order.laborCharges, order.discount
  );

  // Header
  doc.setFillColor(30, 35, 50);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 165, 0);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIDAR AUTO CARE', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Two-Wheeler Service Center', 105, 26, { align: 'center' });
  doc.text('Repair Order', 105, 33, { align: 'center' });

  // RO Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  let y = 50;
  doc.text(`RO Number: ${order.roNumber}`, 14, y);
  doc.text(`Date: ${new Date(order.dateIn).toLocaleDateString('en-IN')}`, 140, y);
  doc.text(`Status: ${order.status}`, 14, y + 7);

  // Customer & Vehicle
  y = 70;
  doc.setFillColor(245, 245, 245);
  doc.rect(10, y - 4, 190, 36, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER DETAILS', 14, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.customerName}`, 14, y + 10);
  doc.text(`Mobile: ${order.mobileNumber}`, 14, y + 17);
  doc.text(`Vehicle: ${order.vehicleNumber}`, 14, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE DETAILS', 110, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`Type: ${order.vehicleType}`, 110, y + 10);
  doc.text(`${order.brand} ${order.model}`, 110, y + 17);

  // Complaints
  y = 112;
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER COMPLAINTS', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const complaints = doc.splitTextToSize(order.customerComplaints || 'N/A', 180);
  doc.text(complaints, 14, y + 7);
  y += 7 + complaints.length * 5;

  if (order.serviceDetails) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SERVICE DETAILS', 14, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const details = doc.splitTextToSize(order.serviceDetails, 180);
    doc.text(details, 14, y + 10);
    y += 10 + details.length * 5;
  }

  // Parts table
  if (order.spareParts.length > 0) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['#', 'Part Name', 'Qty', 'Rate (₹)', 'Total (₹)']],
      body: order.spareParts.map((p, i) => [
        i + 1, p.partName, p.quantity, p.rate.toFixed(2), p.total.toFixed(2)
      ]),
      foot: [['', '', '', 'Parts Total', `₹${partsTotal.toFixed(2)}`]],
      theme: 'striped',
      headStyles: { fillColor: [30, 35, 50], textColor: [255, 165, 0] },
      footStyles: { fillColor: [240, 240, 240], textColor: [30, 35, 50], fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // Labor table
  if (order.laborCharges.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Service Description', 'Amount (₹)']],
      body: order.laborCharges.map((l, i) => [
        i + 1, l.description, l.amount.toFixed(2)
      ]),
      foot: [['', 'Labor Total', `₹${laborTotal.toFixed(2)}`]],
      theme: 'striped',
      headStyles: { fillColor: [30, 35, 50], textColor: [255, 165, 0] },
      footStyles: { fillColor: [240, 240, 240], textColor: [30, 35, 50], fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // Totals
  autoTable(doc, {
    startY: y,
    body: [
      ['Subtotal', `₹${subtotal.toFixed(2)}`],
      ['Discount', `₹${order.discount.toFixed(2)}`],
      ['FINAL AMOUNT', `₹${finalAmount.toFixed(2)}`],
    ],
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'right', cellWidth: 140 },
      1: { fontStyle: 'bold', halign: 'right', cellWidth: 46 },
    },
    styles: { fontSize: 11 },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = [255, 165, 0];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontSize = 13;
      }
    },
  });

  // Signature
  y = (doc as any).lastAutoTable.finalY + 20;
  if (y > 260) { doc.addPage(); y = 30; }
  doc.setDrawColor(150);
  doc.line(14, y, 80, y);
  doc.line(130, y, 196, y);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Customer Signature', 30, y + 5);
  doc.text('Authorized Signature', 148, y + 5);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Patidar Auto Care — Thank you for your business!', 105, 290, { align: 'center' });

  doc.save(`${order.roNumber}.pdf`);
}
