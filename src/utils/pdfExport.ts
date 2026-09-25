/**
 * Utility to export records tables as a formatted PDF document,
 * utilizing the existing print styles (A4 landscape/portrait, exact borders,
 * record-table-grid styling, farm branding headers, audit stamps).
 */

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  records: Record<string, any>[];
  filename: string;
  farmName?: string;
  userEmail?: string;
  farmLocation?: string;
  farmLogo?: string;
  filtersApplied?: string;
}

/**
 * Escapes HTML characters to prevent XSS in exported documents
 */
const escapeHTML = (str: any): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generates the self-contained printable HTML document string
 * using the project's existing print styles.
 */
export const generateRecordsPrintableHTML = (options: PDFExportOptions): string => {
  const {
    title,
    subtitle,
    records,
    filename,
    farmName = 'Smart Goat Manager',
    userEmail = '',
    farmLocation = '',
    farmLogo = '',
    filtersApplied = '',
  } = options;

  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  const isWide = headers.length > 6;
  const orientation = isWide ? 'landscape' : 'portrait';
  const docRefId = `SGM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)} - ${escapeHTML(farmName)}</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }
    @page {
      size: A4 ${orientation};
      margin: 10mm 12mm;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0 auto;
      padding: 16px 20px;
      line-height: 1.4;
      font-size: 11px;
      width: ${isWide ? '297mm' : '210mm'};
      max-width: ${isWide ? '297mm' : '210mm'};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-btn-bar {
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .header-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #059669;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .farm-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .farm-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: cover;
      border: 1px solid #cbd5e1;
    }
    .farm-avatar-fallback {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #059669;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
    }
    .farm-title {
      font-size: 20px;
      font-weight: 900;
      margin: 0;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .farm-email {
      font-size: 11px;
      font-weight: 600;
      color: #059669;
      margin-top: 2px;
    }
    .farm-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-meta {
      text-align: right;
      font-size: 10.5px;
      color: #475569;
    }
    .doc-meta strong {
      color: #0f172a;
    }
    .report-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 9.5px;
      letter-spacing: 0.5px;
      margin-top: 5px;
      text-transform: uppercase;
    }

    /* Record Table Grid utilizing established print styles */
    table.record-table-grid {
      width: 100% !important;
      border-collapse: collapse !important;
      margin-top: 12px !important;
      margin-bottom: 20px !important;
      font-size: 10px !important;
      border: 2px solid #334155 !important;
    }
    table.record-table-grid th,
    table.record-table-grid td {
      border: 1px solid #64748b !important;
      padding: 6px 8px !important;
      text-align: left;
    }
    table.record-table-grid th {
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      font-size: 9px !important;
      letter-spacing: 0.3px !important;
      border-bottom: 1.5px solid #334155 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table.record-table-grid tbody tr:nth-child(even) {
      background-color: #f8fafc !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table.record-table-grid tbody tr:hover {
      background-color: #f1f5f9;
    }
    .badge-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }
    .badge-emerald { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-rose { background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    .badge-blue { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }

    .summary-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 10px;
      color: #334155;
      margin-bottom: 14px;
    }

    .report-footer {
      border-top: 1.5px solid #cbd5e1;
      margin-top: 24px;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }

    @media print {
      .print-btn-bar { display: none !important; }
      body { padding: 0 !important; width: 100% !important; max-width: 100% !important; }
      @page { size: A4 ${orientation}; margin: 10mm 12mm; }
      table.record-table-grid { border: 2px solid #334155 !important; page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      th { border: 1.5px solid #334155 !important; background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      td { border: 1px solid #64748b !important; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <div>
      <span style="font-weight:700;font-size:13px;color:#065f46;">
        📑 Professional Formatted PDF Document Ready
      </span>
      <span style="font-size:11px;color:#047857;margin-left:8px;">
        Formatted with high-contrast borders and executive typography
      </span>
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="window.print()" style="background:#059669;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:11.5px;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
        🖨️ Save as PDF / Print
      </button>
    </div>
  </div>

  <div class="header-box">
    <div class="farm-brand">
      ${
        farmLogo
          ? `<img src="${escapeHTML(farmLogo)}" alt="Logo" class="farm-logo" onerror="this.style.display='none'" />`
          : `<div class="farm-avatar-fallback">${escapeHTML((farmName || 'S').charAt(0).toUpperCase())}</div>`
      }
      <div>
        <h1 class="farm-title">${escapeHTML(farmName)}</h1>
        ${userEmail ? `<div class="farm-email">${escapeHTML(userEmail)}</div>` : ''}
        <div class="farm-meta">
          ${farmLocation ? `${escapeHTML(farmLocation)} • ` : ''}Smart Goat Manager Records System
        </div>
      </div>
    </div>

    <div class="doc-meta">
      <div style="font-size:14px;font-weight:800;color:#0f172a;text-transform:uppercase;">
        ${escapeHTML(title)}
      </div>
      <div>Generated: <strong>${formattedDate}</strong> at ${formattedTime}</div>
      <div>Audit Ref: <strong style="font-family:monospace;">${docRefId}</strong></div>
      <div class="report-badge">${records.length} TOTAL RECORDS</div>
    </div>
  </div>

  ${
    subtitle || filtersApplied
      ? `<div class="summary-strip">
          <div><strong>Scope:</strong> ${escapeHTML(subtitle || title)}</div>
          ${filtersApplied ? `<div><strong>Filter Applied:</strong> ${escapeHTML(filtersApplied)}</div>` : ''}
          <div><strong>Format:</strong> Executive A4 (${orientation.toUpperCase()})</div>
        </div>`
      : ''
  }

  <table class="record-table-grid">
    <thead>
      <tr>
        <th style="width:40px;text-align:center;">#</th>
        ${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${
        records.length === 0
          ? `<tr><td colspan="${headers.length + 1}" style="text-align:center;padding:24px;color:#64748b;">No records available to display.</td></tr>`
          : records
              .map((row, idx) => {
                return `<tr>
                  <td style="text-align:center;font-weight:600;color:#64748b;font-size:9.5px;">${idx + 1}</td>
                  ${headers
                    .map(h => {
                      const val = row[h];
                      const str = val !== null && val !== undefined ? String(val) : '—';
                      // Highlight common statuses
                      if (str === 'Healthy' || str === 'Active') {
                        return `<td><span class="badge-pill badge-emerald">${escapeHTML(str)}</span></td>`;
                      }
                      if (str === 'Pregnant' || str === 'Female (Doe)') {
                        return `<td><span class="badge-pill badge-purple">${escapeHTML(str)}</span></td>`;
                      }
                      if (str === 'Male (Buck)') {
                        return `<td><span class="badge-pill badge-blue">${escapeHTML(str)}</span></td>`;
                      }
                      if (str === 'Sold' || str === 'Under Treatment' || str === 'Critical') {
                        return `<td><span class="badge-pill badge-rose">${escapeHTML(str)}</span></td>`;
                      }
                      if (str === 'Observation' || str === 'Pending') {
                        return `<td><span class="badge-pill badge-amber">${escapeHTML(str)}</span></td>`;
                      }
                      return `<td>${escapeHTML(str)}</td>`;
                    })
                    .join('')}
                </tr>`;
              })
              .join('')
      }
    </tbody>
  </table>

  <div class="report-footer">
    <div>
      Smart Goat Manager Caprine Enterprise Records • Verified Farm Archive
    </div>
    <div>
      Document Ref: <strong style="font-family:monospace;">${docRefId}</strong> • Page 1 of 1
    </div>
  </div>
</body>
</html>`;
};

/**
 * Triggers the PDF export workflow:
 * 1. Assembles formatted HTML with exact print styles
 * 2. Uses a dedicated hidden iframe to trigger the system print / "Save as PDF" dialog
 * 3. Falls back gracefully to new window print if iframe is restricted
 */
export const exportTableToPDF = (options: PDFExportOptions): boolean => {
  try {
    const htmlContent = generateRecordsPrintableHTML(options);

    // Create an isolated hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print failed, falling back to new window:', e);
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(htmlContent);
            win.document.close();
            win.focus();
            win.print();
          }
        } finally {
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch {
              // Ignore removal errors
            }
          }, 4000);
        }
      }, 500);
      return true;
    }

    // Fallback: new window
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      printWin.print();
      return true;
    }

    return false;
  } catch (err) {
    console.error('Failed to export table as PDF:', err);
    return false;
  }
};
