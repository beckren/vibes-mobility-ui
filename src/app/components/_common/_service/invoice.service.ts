import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CheckoutPayload,
  AdditionalFeeRecord
} from './checkout.service';

export interface VehicleInfo {
  licensePlate?: string;
  carModel?: string;
  fuel?: string;
  mileage?: string;
  transmission?: string;
  color?: string;
}

export interface InvoiceData {
  payload: CheckoutPayload;
  vehicle: VehicleInfo;
  taxRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Generates and prints an invoice in a new window.
   */
  printInvoice(data: InvoiceData): void {
    const invoiceHtml = this.generateInvoiceHtml(data);
    this.openPrintWindow(invoiceHtml);
  }

  /**
   * Generates invoice HTML string from checkout data.
   */
  generateInvoiceHtml(data: InvoiceData): string {
    const { payload, vehicle, taxRate } = data;
    const customer = payload.customerRecord;
    const pricing = payload.checkoutPricingRecord;
    const payment = payload.paymentRecord;

    // Generate invoice number (timestamp-based)
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceDate = this.formatDateGerman(new Date());

    // Calculate rental duration
    const checkoutDate = new Date(pricing.checkoutDate);
    const checkinDate = new Date(pricing.expectedCheckinDate);
    const durationMs = checkinDate.getTime() - checkoutDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Build additional fees HTML
    const { html: additionalFeesHtml, total: additionalFeesTotal } = this.buildAdditionalFeesHtml(pricing.additionalFees);

    // Build discount HTML
    const { html: discountHtml, amount: discountAmount } = this.buildDiscountHtml(pricing.discount, pricing.grossListSalePrice);

    // Build additional drivers HTML
    const additionalDriversHtml = this.buildAdditionalDriversHtml(payload.additionalDriverRecords);

    const netAmount = parseFloat(pricing.targetSalePrice || '0');
    const grossAmount = parseFloat(pricing.grossListSalePrice || '0');
    const taxAmount = grossAmount - netAmount;

    return `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Rechnung ${invoiceNumber}</title>
        <style>
          ${this.getInvoiceStyles()}
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${this.buildHeaderHtml(invoiceNumber, invoiceDate, payload.mva)}
          ${this.buildAddressesHtml(customer, pricing, durationDays)}
          ${this.buildVehicleInfoHtml(pricing.carGroupName, vehicle)}
          ${additionalDriversHtml}
          ${this.buildServicesHtml(pricing.carGroupName, durationDays, netAmount, additionalFeesTotal, additionalFeesHtml, discountHtml)}
          ${this.buildTotalsHtml(netAmount, taxRate, taxAmount, grossAmount)}
          ${this.buildPaymentInfoHtml(payment)}
          ${customer.customerNote ? this.buildNotesHtml(customer.customerNote) : ''}
          ${this.buildFooterHtml()}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Opens a new window with the invoice HTML and triggers print.
   */
  private openPrintWindow(html: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      this.snackBar.open('Popup-Blocker verhindert das Drucken. Bitte erlauben Sie Popups.', 'Schließen', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['error-snackbar']
      });
    }
  }

  /**
   * Formats a date to German locale string (DD.MM.YYYY).
   */
  formatDateGerman(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /**
   * Formats a datetime to German locale string (DD.MM.YYYY HH:mm).
   */
  formatDateTimeGerman(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Formats a camelCase or PascalCase string by inserting spaces before uppercase letters.
   */
  formatFeeName(name: string): string {
    if (!name) return '';
    return name.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  private buildAdditionalFeesHtml(additionalFees: AdditionalFeeRecord[] | null | undefined): { html: string; total: number } {
    let html = '';
    let total = 0;
    if (additionalFees && additionalFees.length > 0) {
      additionalFees.forEach(fee => {
        const amount = parseFloat(fee.amount) || 0;
        total += amount;
        html += `
          <tr>
            <td>${this.formatFeeName(fee.name)}</td>
            <td style="text-align: right;">€${amount.toFixed(2)}</td>
          </tr>
        `;
      });
    }
    return { html, total };
  }

  private buildDiscountHtml(discount: any, grossListSalePrice: string | null | undefined): { html: string; amount: number } {
    let html = '';
    let amount = 0;
    if (discount) {
      const percentage = parseFloat(discount.percentage) || 0;
      const grossAmount = parseFloat(grossListSalePrice || '0');
      amount = (grossAmount * percentage) / 100;
      html = `
        <tr class="discount-row">
          <td>Rabatt (${percentage}%) - ${discount.reason || 'Kein Grund angegeben'}</td>
          <td style="text-align: right; color: #dc3545;">-€${amount.toFixed(2)}</td>
        </tr>
      `;
    }
    return { html, amount };
  }

  private buildAdditionalDriversHtml(additionalDriverRecords: any[] | undefined): string {
    if (!additionalDriverRecords || additionalDriverRecords.length === 0) return '';
    return `
      <div class="section">
        <h3>Zusätzliche Fahrer</h3>
        <table>
          ${additionalDriverRecords.map((driver, index) => `
            <tr>
              <td><strong>Fahrer ${index + 1}:</strong></td>
              <td>${driver.personRecord.firstName} ${driver.personRecord.lastName}</td>
            </tr>
            <tr>
              <td>Führerschein-Nr.:</td>
              <td>${driver.driverRecord.licenseNumber}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  private buildHeaderHtml(invoiceNumber: string, invoiceDate: string, mva: string): string {
    return `
      <div class="header">
        <div class="company-info">
          <h1>Vibes Mobility</h1>
          <p>Musterstraße 123</p>
          <p>12345 Musterstadt</p>
          <p>Tel: +49 123 456789</p>
          <p>E-Mail: info@vibes-mobility.de</p>
        </div>
        <div class="invoice-details">
          <h2>RECHNUNG</h2>
          <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
          <p><strong>Rechnungsdatum:</strong> ${invoiceDate}</p>
          <p><strong>MVA:</strong> ${mva}</p>
        </div>
      </div>
    `;
  }

  private buildAddressesHtml(customer: any, pricing: any, durationDays: number): string {
    return `
      <div class="addresses">
        <div class="address-block">
          <h3>Rechnungsadresse</h3>
          <p><strong>${customer.personRecord.academicTitle ? customer.personRecord.academicTitle + ' ' : ''}${customer.personRecord.firstName} ${customer.personRecord.lastName}</strong></p>
          ${customer.billingAddressRecord.companyName ? `<p>${customer.billingAddressRecord.companyName}</p>` : ''}
          <p>${customer.billingAddressRecord.addressline1}}</p>
          <p>${customer.billingAddressRecord.postalCode} ${customer.billingAddressRecord.city}</p>
          <p>${customer.billingAddressRecord.country}</p>
          <p>E-Mail: ${customer.personRecord.email}</p>
          <p>Tel: ${customer.personRecord.phone}</p>
        </div>
        <div class="address-block">
          <h3>Mietdetails</h3>
          <p><strong>Abholung:</strong> ${this.formatDateTimeGerman(pricing.checkoutDate)}</p>
          <p><strong>Rückgabe:</strong> ${this.formatDateTimeGerman(pricing.expectedCheckinDate)}</p>
          <p><strong>Mietdauer:</strong> ${durationDays} Tag(e)</p>
          <p><strong>Führerschein-Nr.:</strong> ${customer.driverRecord.licenseNumber}</p>
          <p><strong>Ausweis-Nr.:</strong> ${customer.personRecord.idNumber}</p>
        </div>
      </div>
    `;
  }

  private buildVehicleInfoHtml(carGroupName: string, vehicle: VehicleInfo): string {
    return `
      <div class="section">
        <h3>Fahrzeuginformationen</h3>
        <div class="vehicle-info">
          <table>
            <tr>
              <td><strong>Fahrzeuggruppe:</strong></td>
              <td>${carGroupName}</td>
              <td><strong>Kennzeichen:</strong></td>
              <td>${vehicle.licensePlate || '-'}</td>
            </tr>
            <tr>
              <td><strong>Modell:</strong></td>
              <td>${vehicle.carModel || '-'}</td>
              <td><strong>Kraftstoff:</strong></td>
              <td>${vehicle.fuel || '-'}</td>
            </tr>
            <tr>
              <td><strong>Kilometerstand:</strong></td>
              <td>${vehicle.mileage || '-'} km</td>
              <td><strong>Getriebe:</strong></td>
              <td>${vehicle.transmission || '-'}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  }

  private buildServicesHtml(carGroupName: string, durationDays: number, netAmount: number, additionalFeesTotal: number, additionalFeesHtml: string, discountHtml: string): string {
    return `
      <div class="section">
        <h3>Leistungen</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Beschreibung</th>
              <th style="text-align: right;">Betrag</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Fahrzeugmiete ${carGroupName} (${durationDays} Tag(e))</td>
              <td style="text-align: right;">€${(netAmount - additionalFeesTotal).toFixed(2)}</td>
            </tr>
            ${additionalFeesHtml}
            ${discountHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  private buildTotalsHtml(netAmount: number, taxRate: number, taxAmount: number, grossAmount: number): string {
    return `
      <table class="totals-table">
        <tr>
          <td>Zwischensumme (netto):</td>
          <td style="text-align: right;">€${netAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>MwSt. (${taxRate}%):</td>
          <td style="text-align: right;">€${taxAmount.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Gesamtbetrag (brutto):</td>
          <td style="text-align: right;">€${grossAmount.toFixed(2)}</td>
        </tr>
      </table>
    `;
  }

  private buildPaymentInfoHtml(payment: any): string {
    return `
      <div class="payment-info">
        <h3>Zahlungsinformationen</h3>
        <table>
          <tr>
            <td><strong>Kartentyp:</strong></td>
            <td>${payment.cardType || '-'}</td>
            <td><strong>Kartennummer:</strong></td>
            <td>**** **** **** ${payment.cardNumber ? payment.cardNumber.slice(-4) : '****'}</td>
          </tr>
          <tr>
            <td><strong>Kaution:</strong></td>
            <td>€${payment.amountOnHold || '0.00'}</td>
            <td><strong>Zahlungsstatus:</strong></td>
            <td>${payment.paymentStatus || 'Ausstehend'}</td>
          </tr>
          ${payment.authorizationCode ? `
          <tr>
            <td><strong>Autorisierungscode:</strong></td>
            <td colspan="3">${payment.authorizationCode}</td>
          </tr>
          ` : ''}
        </table>
      </div>
    `;
  }

  private buildNotesHtml(note: string): string {
    return `
      <div class="section">
        <h3>Anmerkungen</h3>
        <p>${note}</p>
      </div>
    `;
  }

  private buildFooterHtml(): string {
    return `
      <div class="footer">
        <p>Vibes Mobility GmbH | Musterstraße 123 | 12345 Musterstadt</p>
        <p>Geschäftsführer: Max Mustermann | Amtsgericht Musterstadt HRB 12345 | USt-IdNr.: DE123456789</p>
        <p>IBAN: DE89 3704 0044 0532 0130 00 | BIC: COBADEFFXXX</p>
        <p style="margin-top: 10px;">Vielen Dank für Ihr Vertrauen!</p>
      </div>
    `;
  }

  private getInvoiceStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.5;
        color: #333;
        padding: 20px;
      }
      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        background: #fff;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 3px solid #1976d2;
        padding-bottom: 20px;
        margin-bottom: 20px;
      }
      .company-info h1 {
        color: #1976d2;
        font-size: 28px;
        margin-bottom: 5px;
      }
      .company-info p {
        color: #666;
        font-size: 11px;
      }
      .invoice-details {
        text-align: right;
      }
      .invoice-details h2 {
        color: #1976d2;
        font-size: 24px;
        margin-bottom: 10px;
      }
      .invoice-details p {
        margin: 3px 0;
      }
      .invoice-details strong {
        color: #333;
      }
      .addresses {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
      }
      .address-block {
        width: 48%;
      }
      .address-block h3 {
        color: #1976d2;
        font-size: 14px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
        margin-bottom: 10px;
      }
      .section {
        margin-bottom: 25px;
      }
      .section h3 {
        color: #1976d2;
        font-size: 14px;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
        margin-bottom: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      table td {
        padding: 8px 5px;
        vertical-align: top;
      }
      .items-table {
        margin-top: 10px;
      }
      .items-table th {
        background: #1976d2;
        color: #fff;
        padding: 10px;
        text-align: left;
      }
      .items-table th:last-child {
        text-align: right;
      }
      .items-table td {
        border-bottom: 1px solid #eee;
      }
      .items-table tr:hover {
        background: #f9f9f9;
      }
      .totals-table {
        width: 300px;
        margin-left: auto;
        margin-top: 20px;
      }
      .totals-table td {
        padding: 8px 5px;
      }
      .totals-table .total-row {
        font-size: 16px;
        font-weight: bold;
        border-top: 2px solid #1976d2;
        color: #1976d2;
      }
      .discount-row td {
        color: #dc3545;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        color: #666;
        font-size: 10px;
      }
      .payment-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin-top: 20px;
      }
      .payment-info h3 {
        margin-bottom: 10px;
      }
      .vehicle-info {
        background: #e3f2fd;
        padding: 15px;
        border-radius: 5px;
      }
      @media print {
        body {
          padding: 0;
        }
        .invoice-container {
          max-width: 100%;
        }
      }
    `;
  }
}
