import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { RepairOrder } from '@/types/repair-order';
import { calculateTotals } from './repair-orders';

export const generateRepairOrderPDF = async (order: RepairOrder) => {
  const { partsTotal, laborTotal, subtotal, taxableAmount, cgstAmount, sgstAmount, totalGST, finalAmount } = calculateTotals(order.spareParts, order.laborCharges, order.discount, order.gstInfo);
  
  const hasGST = order.gstInfo?.garageGSTIN ? true : false;
  
  let partsHtml = '';
  if (order.spareParts.length > 0) {
    partsHtml = `
      <h3 style="margin-top: 20px;">Spare Parts</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="border-bottom: 1px solid #ccc; background-color: #f9f9f9;">
          <th style="text-align: left; padding: 8px;">Part Name</th>
          <th style="text-align: left; padding: 8px;">HSN</th>
          <th style="text-align: right; padding: 8px;">Qty</th>
          <th style="text-align: right; padding: 8px;">Rate</th>
          <th style="text-align: right; padding: 8px;">Total</th>
        </tr>
        ${order.spareParts.map(p => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${p.partName}</td>
            <td style="padding: 8px;">${p.hsnCode || '-'}</td>
            <td style="text-align: right; padding: 8px;">${p.quantity}</td>
            <td style="text-align: right; padding: 8px;">₹${p.rate.toFixed(2)}</td>
            <td style="text-align: right; padding: 8px;">₹${p.total.toFixed(2)}</td>
          </tr>
        `).join('')}
        <tr>
          <td colspan="4" style="text-align: right; padding: 8px; font-weight: bold;">Parts Total:</td>
          <td style="text-align: right; padding: 8px; font-weight: bold;">₹${partsTotal.toFixed(2)}</td>
        </tr>
      </table>
    `;
  }

  let laborHtml = '';
  if (order.laborCharges.length > 0) {
    laborHtml = `
      <h3 style="margin-top: 20px;">Labor & Services</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="border-bottom: 1px solid #ccc; background-color: #f9f9f9;">
          <th style="text-align: left; padding: 8px;">Description</th>
          <th style="text-align: right; padding: 8px;">Amount</th>
        </tr>
        ${order.laborCharges.map(l => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">${l.description}</td>
            <td style="text-align: right; padding: 8px;">₹${l.amount.toFixed(2)}</td>
          </tr>
        `).join('')}
        <tr>
          <td style="text-align: right; padding: 8px; font-weight: bold;">Labor Total:</td>
          <td style="text-align: right; padding: 8px; font-weight: bold;">₹${laborTotal.toFixed(2)}</td>
        </tr>
      </table>
    `;
  }

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .title { font-size: 28px; font-weight: bold; color: #111; margin: 0 0 10px 0; }
          .invoice-details { text-align: right; }
          .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-box { width: 48%; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
          .summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .summary-table td { padding: 8px; border-bottom: 1px solid #eee; }
          .total-row { background: #f0f4f8; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${hasGST ? 'TAX INVOICE' : 'REPAIR INVOICE'}</h1>
            ${hasGST ? `<p style="margin: 0;">Garage GSTIN: <strong>${order.gstInfo.garageGSTIN}</strong></p>` : ''}
          </div>
          <div class="invoice-details">
            <h2 style="margin: 0; color: #555;">RO #: ${order.roNumber}</h2>
            <p style="margin: 5px 0 0 0; color: #777;">Date: ${new Date(order.dateIn).toLocaleDateString('en-IN')}</p>
            <p style="margin: 5px 0 0 0; color: #777;">Status: <strong>${order.status}</strong></p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3 style="margin-top: 0; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Customer Details</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${order.customerName}</p>
            <p style="margin: 5px 0;"><strong>Mobile:</strong> ${order.mobileNumber}</p>
            ${hasGST && order.gstInfo.customerGSTIN ? `<p style="margin: 5px 0;"><strong>GSTIN:</strong> ${order.gstInfo.customerGSTIN}</p>` : ''}
          </div>
          <div class="info-box">
            <h3 style="margin-top: 0; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Vehicle Details</h3>
            <p style="margin: 5px 0;"><strong>Number:</strong> ${order.vehicleNumber}</p>
            <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${order.brand} ${order.model} (${order.vehicleType})</p>
          </div>
        </div>

        ${order.customerComplaints ? `<div style="margin-bottom: 20px;"><strong>Customer Complaints:</strong> ${order.customerComplaints}</div>` : ''}
        
        ${partsHtml}
        ${laborHtml}

        <div style="width: 50%; margin-left: auto; margin-top: 30px;">
          <table class="summary-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Discount</td>
              <td style="text-align: right; color: red;">-₹${order.discount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Taxable Amount</td>
              <td style="text-align: right;">₹${taxableAmount.toFixed(2)}</td>
            </tr>
            ${hasGST ? `
            <tr>
              <td>CGST (${order.gstInfo.cgstRate}%)</td>
              <td style="text-align: right;">₹${cgstAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>SGST (${order.gstInfo.sgstRate}%)</td>
              <td style="text-align: right;">₹${sgstAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td style="padding-top: 15px; padding-bottom: 15px; color: #0f172a;">Final Amount ${hasGST ? '(Incl. GST)' : ''}</td>
              <td style="text-align: right; padding-top: 15px; padding-bottom: 15px; color: #0f172a;">₹${finalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 60px; display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
          <div style="text-align: center;">
            <p style="margin: 0 0 40px 0;">Customer Signature</p>
            <div style="width: 200px; border-bottom: 1px solid #333;"></div>
          </div>
          <div style="text-align: center;">
            <p style="margin: 0 0 40px 0;">Authorized Signatory</p>
            <div style="width: 200px; border-bottom: 1px solid #333;"></div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
