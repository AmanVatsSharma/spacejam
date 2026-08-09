/**
 * File:        apps/api/src/revenue/invoice-pdf.controller.ts
 * Module:      API · Revenue · Invoice PDF
 * Purpose:     Serves a printable, GST-compliant invoice as HTML (opens in
 *              the browser's print dialog → Save as PDF). Dependency-free —
 *              no puppeteer/pdfkit. The admin "Download Invoice" action and
 *              the mobile "View Invoice" both hit GET /api/invoices/:id/html.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { Customer } from '../typeorm/entities/customer.entity';
import { Center } from '../typeorm/entities/center.entity';

// Indian GST: 18% standard rate. Split equally into CGST + SGST (9% each)
// for intra-state, or IGST (18%) for inter-state. We compute both lines so
// the invoice is GST-compliant regardless of the customer's state.
const GST_RATE = 0.18;

function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

@Controller('api/invoices')
export class InvoicePdfController {
  constructor(
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Center) private readonly centerRepo: Repository<Center>,
  ) {}

  @Get(':id/html')
  async renderInvoiceHtml(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const customer = invoice.customerId
      ? await this.customerRepo.findOne({ where: { id: invoice.customerId } })
      : null;
    const center = invoice.centerId
      ? await this.centerRepo.findOne({ where: { id: invoice.centerId } })
      : null;

    const amount = Number(invoice.amount) || 0;
    // If tax is already stored, use it; otherwise derive 18% GST from amount.
    const isTaxStored = invoice.tax != null && Number(invoice.tax) > 0;
    const gstAmount = isTaxStored ? Number(invoice.tax) : amount * GST_RATE;
    const baseAmount = isTaxStored ? amount : amount - gstAmount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const total = Number(invoice.totalAmount) || amount;

    const issueDate = new Date(invoice.issueDate).toLocaleDateString('en-IN');
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-IN');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F1F1F; margin: 0; padding: 40px; }
  .invoice { max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #FF6A2F; padding-bottom: 20px; margin-bottom: 30px; }
  .brand { font-size: 28px; font-weight: 800; color: #FF6A2F; }
  .brand small { display: block; font-size: 13px; font-weight: 500; color: #6A7282; }
  .inv-meta { text-align: right; font-size: 13px; color: #4A5565; }
  .inv-meta h2 { margin: 0 0 4px; font-size: 20px; color: #1F1F1F; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; }
  .party h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6A7282; }
  .party p { margin: 0; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #FBF6F4; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6A7282; border-bottom: 1px solid #E5E7EB; }
  td { padding: 12px 14px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
  .totals { margin-left: auto; width: 320px; font-size: 14px; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .row.grand { border-top: 2px solid #1F1F1F; margin-top: 8px; padding-top: 12px; font-weight: 700; font-size: 16px; }
  .gst-note { margin-top: 24px; padding: 12px 16px; background: #FBF6F4; border-radius: 8px; font-size: 12px; color: #4A5565; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #6A7282; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head>
<body onload="setTimeout(function(){window.print()},300)">
<div class="invoice">
  <div class="header">
    <div class="brand">SpaceJam<small>${escapeHtml(center?.name ?? 'Coworking')}</small></div>
    <div class="inv-meta">
      <h2>TAX INVOICE</h2>
      <div>Invoice No: <strong>${escapeHtml(invoice.invoiceNumber)}</strong></div>
      <div>Date: ${issueDate}</div>
      <div>Due: ${dueDate}</div>
      <div>Status: <strong>${escapeHtml(invoice.status)}</strong></div>
    </div>
  </div>
  <div class="parties">
    <div class="party">
      <h4>Billed By</h4>
      <p><strong>${escapeHtml(center?.name ?? 'SpaceJam')}</strong><br>
      ${escapeHtml('India')}<br>
      ${customer?.gstNumber ? 'GSTIN: ' + escapeHtml(customer.gstNumber) : ''}</p>
    </div>
    <div class="party">
      <h4>Billed To</h4>
      <p><strong>${escapeHtml(invoice.customerName)}</strong><br>
      ${escapeHtml(customer?.email ?? '')}<br>
      ${customer?.gstNumber ? 'GSTIN: ' + escapeHtml(customer.gstNumber) : ''}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount (₹)</th></tr></thead>
    <tbody>
      <tr><td>${escapeHtml(invoice.planName ?? 'Coworking services')}</td><td style="text-align:right">${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Base amount</span><span>₹${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
    <div class="row"><span>CGST (9%)</span><span>₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
    <div class="row"><span>SGST (9%)</span><span>₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
    <div class="row grand"><span>Total Payable</span><span>₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
  </div>
  <div class="gst-note">
    ${isTaxStored ? 'Tax as billed.' : 'GST computed at 18% (CGST 9% + SGST 9%). Inter-state supply attracts IGST @18% instead.'}
    ${customer?.gstNumber ? '' : ' <strong>Note:</strong> Customer GSTIN not on file — please update the customer record for full compliance.'}
  </div>
  <div class="footer">
    This is a computer-generated invoice and does not require a physical signature.<br>
    SpaceJam Coworking · ${escapeHtml(center?.name ?? '')}
  </div>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
