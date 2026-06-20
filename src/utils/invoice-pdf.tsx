import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';

function formatCurrency(amount: number) {
  return `\u20B9${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const THEMES = {
  1: { primary: '#2563EB', primaryDark: '#1D4ED8', light: '#EFF6FF', border: '#BFDBFE', accent: '#93C5FD', headerText: '#FFFFFF', text: '#1E293B', subtext: '#64748B' },
  2: { primary: '#059669', primaryDark: '#047857', light: '#ECFDF5', border: '#A7F3D0', accent: '#6EE7B7', headerText: '#FFFFFF', text: '#1E293B', subtext: '#64748B' },
  3: { primary: '#334155', primaryDark: '#1E293B', light: '#F8FAFC', border: '#E2E8F0', accent: '#94A3B8', headerText: '#FFFFFF', text: '#1E293B', subtext: '#64748B' },
  4: { primary: '#7C3AED', primaryDark: '#6D28D9', light: '#F5F3FF', border: '#DDD6FE', accent: '#C4B5FD', headerText: '#FFFFFF', text: '#1E293B', subtext: '#64748B' },
} as const;

function buildStyles(tid: number) {
  const c = THEMES[tid as keyof typeof THEMES] ?? THEMES[1];
  return StyleSheet.create({
    page: { fontFamily: 'Helvetica', fontSize: 9, color: c.text, backgroundColor: '#FFFFFF', paddingTop: 0, paddingBottom: 50, paddingHorizontal: 0 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: c.primary, paddingHorizontal: 36, paddingVertical: 28 },
    bizName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: c.headerText, marginBottom: 4 },
    bizSub: { fontSize: 8, color: c.accent, lineHeight: 1.6 },
    invLabel: { fontSize: 8, color: c.accent, textAlign: 'right', fontFamily: 'Helvetica-Bold', marginBottom: 4 },
    invNum: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: c.headerText, textAlign: 'right' },

    body: { paddingHorizontal: 36, paddingTop: 20 },

    billRow: { flexDirection: 'row', marginBottom: 16 },
    billBox: { flex: 1, backgroundColor: c.light, borderRadius: 6, padding: 14, marginRight: 12 },
    billBoxLast: { flex: 1, backgroundColor: c.light, borderRadius: 6, padding: 14 },
    billLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.primaryDark, marginBottom: 6 },
    billName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: c.text, marginBottom: 3 },
    billDetail: { fontSize: 8, color: c.subtext, lineHeight: 1.6 },

    detailsBar: { flexDirection: 'row', backgroundColor: c.light, borderRadius: 6, padding: 14, marginBottom: 20 },
    detailCell: { flex: 1, marginRight: 8 },
    detailLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.primaryDark, marginBottom: 4 },
    detailValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.text },

    statusPaid: { backgroundColor: '#D1FAE5', color: '#065F46', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' },
    statusUnpaid: { backgroundColor: '#FEE2E2', color: '#991B1B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' },
    statusPartial: { backgroundColor: '#FEF3C7', color: '#92400E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' },

    tHead: { flexDirection: 'row', backgroundColor: c.primary, paddingVertical: 8, paddingHorizontal: 8, marginBottom: 1 },
    tHCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
    tRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: c.border },
    tRowOdd: { backgroundColor: '#FFFFFF' },
    tRowEven: { backgroundColor: c.light },
    tCell: { fontSize: 8, color: c.text },
    tCellRight: { fontSize: 8, color: c.text, textAlign: 'right' },
    tCellMuted: { fontSize: 7, color: c.subtext, marginTop: 2 },

    cSno: { width: '5%' },
    cItem: { width: '28%' },
    cQty: { width: '7%', textAlign: 'right' },
    cPrice: { width: '16%', textAlign: 'right' },
    cDisc: { width: '14%', textAlign: 'right' },
    cGst: { width: '10%', textAlign: 'right' },
    cTotal: { width: '20%', textAlign: 'right' },

    totalsWrap: { alignItems: 'flex-end', marginTop: 16 },
    totalsBox: { width: '44%' },
    totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: c.border },
    totLabel: { fontSize: 8, color: c.subtext },
    totValue: { fontSize: 8, color: c.text, fontFamily: 'Helvetica-Bold' },
    totDiscValue: { fontSize: 8, color: '#16A34A', fontFamily: 'Helvetica-Bold' },
    grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: c.primary, borderRadius: 4, marginTop: 4 },
    grandLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
    grandValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

    notesRow: { flexDirection: 'row', marginTop: 20, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: c.border },
    notesBlock: { flex: 1, marginRight: 12 },
    notesBlockLast: { flex: 1 },
    notesLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.text, marginBottom: 5 },
    notesText: { fontSize: 8, color: c.subtext, lineHeight: 1.6 },

    footer: { position: 'absolute', bottom: 16, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: 8 },
    footerLeft: { fontSize: 7, color: c.subtext },
    footerRight: { fontSize: 7, color: c.subtext },

    watermarkWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    watermarkText: { fontSize: 52, color: '#0000001A', fontFamily: 'Helvetica-Bold', transform: 'rotate(-45deg)' },
  });
}

function statusStyle(s: string, styles: ReturnType<typeof buildStyles>) {
  if (s === 'PAID') return styles.statusPaid;
  if (s === 'PARTIAL') return styles.statusPartial;
  return styles.statusUnpaid;
}

function InvoiceDoc({ invoice, business, plan }: { invoice: any; business: any; plan: string }) {
  const tid = Number(invoice.templateId) || 1;
  const st = buildStyles(tid);
  const isFree = plan === 'FREE';
  const items: any[] = invoice.items || [];

  const bizLines = [
    business?.address,
    business?.phone ? `Ph: ${business.phone}` : null,
    business?.email,
    business?.gstNumber ? `GST: ${business.gstNumber}` : null,
  ].filter(Boolean).join('\n');

  const custLines = [
    invoice.customer?.address,
    invoice.customer?.phone ? `Ph: ${invoice.customer.phone}` : null,
    invoice.customer?.email,
    invoice.customer?.gstNumber ? `GST: ${invoice.customer.gstNumber}` : null,
  ].filter(Boolean).join('\n');

  return (
    <Document title={`Invoice ${invoice.invoiceNumber}`} author={business?.businessName || 'BillMate'}>
      <Page size="A4" style={st.page}>

        {isFree && (
          <View fixed style={st.watermarkWrap}>
            <Text style={st.watermarkText}>BillMate</Text>
          </View>
        )}

        {/* Coloured header band */}
        <View style={st.header}>
          <View>
            <Text style={st.bizName}>{business?.businessName || 'Your Business'}</Text>
            {bizLines ? <Text style={st.bizSub}>{bizLines}</Text> : null}
          </View>
          <View>
            <Text style={st.invLabel}>TAX INVOICE</Text>
            <Text style={st.invNum}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Main body */}
        <View style={st.body}>

          {/* Bill From / Bill To */}
          <View style={st.billRow}>
            <View style={st.billBox}>
              <Text style={st.billLabel}>FROM</Text>
              <Text style={st.billName}>{business?.businessName || ''}</Text>
              {bizLines ? <Text style={st.billDetail}>{bizLines}</Text> : null}
            </View>
            <View style={st.billBoxLast}>
              <Text style={st.billLabel}>BILL TO</Text>
              <Text style={st.billName}>{invoice.customer?.name || ''}</Text>
              {custLines ? <Text style={st.billDetail}>{custLines}</Text> : null}
            </View>
          </View>

          {/* Details bar */}
          <View style={st.detailsBar}>
            <View style={st.detailCell}>
              <Text style={st.detailLabel}>INVOICE DATE</Text>
              <Text style={st.detailValue}>{formatDate(invoice.invoiceDate)}</Text>
            </View>
            <View style={st.detailCell}>
              <Text style={st.detailLabel}>DUE DATE</Text>
              <Text style={st.detailValue}>{invoice.dueDate ? formatDate(invoice.dueDate) : 'On Receipt'}</Text>
            </View>
            <View style={st.detailCell}>
              <Text style={st.detailLabel}>STATUS</Text>
              <Text style={statusStyle(invoice.paymentStatus, st)}>{invoice.paymentStatus}</Text>
            </View>
            <View style={st.detailCell}>
              <Text style={st.detailLabel}>PAYMENT</Text>
              <Text style={st.detailValue}>
                {invoice.paymentMethod ? invoice.paymentMethod.replace(/_/g, ' ') : '\u2014'}
              </Text>
            </View>
          </View>

          {/* Items table */}
          <View>
            {/* Table header - repeats on each page via fixed */}
            <View style={st.tHead} fixed>
              <Text style={[st.tHCell, st.cSno]}>#</Text>
              <Text style={[st.tHCell, st.cItem]}>ITEM / DESCRIPTION</Text>
              <Text style={[st.tHCell, st.cQty]}>QTY</Text>
              <Text style={[st.tHCell, st.cPrice]}>UNIT PRICE</Text>
              <Text style={[st.tHCell, st.cDisc]}>DISCOUNT</Text>
              <Text style={[st.tHCell, st.cGst]}>GST %</Text>
              <Text style={[st.tHCell, st.cTotal]}>TOTAL</Text>
            </View>

            {items.map((item, idx) => (
              <View key={idx} wrap={false} style={[st.tRow, idx % 2 === 0 ? st.tRowOdd : st.tRowEven]}>
                <Text style={[st.tCell, st.cSno]}>{idx + 1}</Text>
                <View style={st.cItem}>
                  <Text style={st.tCell}>{item.name || ''}</Text>
                  {item.description ? <Text style={st.tCellMuted}>{item.description}</Text> : null}
                </View>
                <Text style={[st.tCellRight, st.cQty]}>{item.quantity}</Text>
                <Text style={[st.tCellRight, st.cPrice]}>{formatCurrency(Number(item.unitPrice))}</Text>
                <Text style={[st.tCellRight, st.cDisc]}>
                  {item.discount ? formatCurrency(Number(item.discount)) : '\u2014'}
                </Text>
                <Text style={[st.tCellRight, st.cGst]}>{item.gstPercentage}%</Text>
                <Text style={[st.tCellRight, st.cTotal]}>{formatCurrency(Number(item.subtotal))}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View wrap={false} style={st.totalsWrap}>
            <View style={st.totalsBox}>
              <View style={st.totRow}>
                <Text style={st.totLabel}>Subtotal</Text>
                <Text style={st.totValue}>{formatCurrency(Number(invoice.subtotal))}</Text>
              </View>
              {Number(invoice.totalDiscount) > 0 && (
                <View style={st.totRow}>
                  <Text style={st.totLabel}>Discount</Text>
                  <Text style={st.totDiscValue}>-{formatCurrency(Number(invoice.totalDiscount))}</Text>
                </View>
              )}
              <View style={st.totRow}>
                <Text style={st.totLabel}>GST / Tax</Text>
                <Text style={st.totValue}>{formatCurrency(Number(invoice.totalTax))}</Text>
              </View>
              <View style={st.grandRow}>
                <Text style={st.grandLabel}>GRAND TOTAL</Text>
                <Text style={st.grandValue}>{formatCurrency(Number(invoice.grandTotal))}</Text>
              </View>
            </View>
          </View>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.termsConditions) && (
            <View wrap={false} style={st.notesRow}>
              {invoice.notes && (
                <View style={invoice.termsConditions ? st.notesBlock : st.notesBlockLast}>
                  <Text style={st.notesLabel}>Notes</Text>
                  <Text style={st.notesText}>{invoice.notes}</Text>
                </View>
              )}
              {invoice.termsConditions && (
                <View style={st.notesBlockLast}>
                  <Text style={st.notesLabel}>Terms & Conditions</Text>
                  <Text style={st.notesText}>{invoice.termsConditions}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer on every page */}
        <View fixed style={st.footer}>
          <Text style={st.footerLeft}>
            {isFree ? 'Generated with BillMate (Free Plan)' : `Thank you, ${invoice.customer?.name || ''}!`}
          </Text>
          <Text
            style={st.footerRight}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  );
}

export async function generatePdf(invoice: any, business: any, plan = 'FREE') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await (pdf as any)(
    <InvoiceDoc invoice={invoice} business={business} plan={plan} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${invoice.invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}
