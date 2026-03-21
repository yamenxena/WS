/**
 * Majaz AI OS — Google Sheets API
 * Deploy as Web App: Extensions > Apps Script > Deploy > Web App
 * 
 * Endpoints:
 *   GET  ?action=read&sheet=CRM Pipeline        → returns all rows as JSON
 *   POST ?action=create&sheet=CRM Pipeline       → body: JSON row → appends
 *   POST ?action=update&sheet=CRM Pipeline&row=3 → body: JSON row → updates row
 *   POST ?action=delete&sheet=CRM Pipeline&row=3 → deletes row
 *
 * [AUTH: Majaz_OS | sheets_api | 1.0.0 | 2026-03-21]
 */

// --- CORS-safe response wrapper ---
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- GET handler (read data) ---
function doGet(e) {
  try {
    const action = (e.parameter.action || 'read').toLowerCase();
    const sheetName = e.parameter.sheet || 'CRM Pipeline';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return jsonResponse({ error: `Sheet "${sheetName}" not found`, sheets: ss.getSheets().map(s => s.getName()) });
    }

    if (action === 'read') {
      const data = sheet.getDataRange().getValues();
      if (data.length < 1) return jsonResponse({ headers: [], rows: [] });

      const headers = data[0].map(h => h.toString().trim());
      const rows = data.slice(1).map((row, idx) => {
        const obj = { _row: idx + 2 }; // 1-indexed, +1 for header
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });

      return jsonResponse({ headers, rows, count: rows.length, sheet: sheetName });
    }

    if (action === 'sheets') {
      return jsonResponse({ sheets: ss.getSheets().map(s => s.getName()) });
    }

    return jsonResponse({ error: 'Unknown GET action: ' + action });

  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// --- POST handler (create, update, delete) ---
function doPost(e) {
  try {
    const action = (e.parameter.action || '').toLowerCase();
    const sheetName = e.parameter.sheet || 'CRM Pipeline';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return jsonResponse({ error: `Sheet "${sheetName}" not found` });
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => h.toString().trim());

    // --- CREATE: append new row ---
    if (action === 'create') {
      const body = JSON.parse(e.postData.contents);
      const newRow = headers.map(h => body[h] !== undefined ? body[h] : '');
      sheet.appendRow(newRow);
      
      // Re-apply theme to new row
      const lastRow = sheet.getLastRow();
      const rowRange = sheet.getRange(lastRow, 1, 1, headers.length);
      rowRange.setBackground(lastRow % 2 === 0 ? '#1C2128' : '#161B22');
      rowRange.setFontColor('#E6EDF3');
      rowRange.setFontFamily('Inter');
      rowRange.setFontSize(11);
      rowRange.setWrap(true);

      return jsonResponse({ success: true, action: 'create', row: lastRow });
    }

    // --- UPDATE: edit existing row ---
    if (action === 'update') {
      const rowNum = parseInt(e.parameter.row);
      if (!rowNum || rowNum < 2) return jsonResponse({ error: 'Invalid row number' });
      
      const body = JSON.parse(e.postData.contents);
      const updatedRow = headers.map(h => body[h] !== undefined ? body[h] : '');
      sheet.getRange(rowNum, 1, 1, headers.length).setValues([updatedRow]);

      return jsonResponse({ success: true, action: 'update', row: rowNum });
    }

    // --- DELETE: remove row ---
    if (action === 'delete') {
      const rowNum = parseInt(e.parameter.row);
      if (!rowNum || rowNum < 2) return jsonResponse({ error: 'Invalid row number' });

      sheet.deleteRow(rowNum);
      return jsonResponse({ success: true, action: 'delete', row: rowNum });
    }

    return jsonResponse({ error: 'Unknown POST action: ' + action });

  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// --- Menu for easy access ---
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏗️ Majaz OS')
    .addItem('🎨 Apply Dark Theme', 'applyMajazTheme')
    .addItem('🔄 Refresh Formatting', 'applyMajazTheme')
    .addSeparator()
    .addItem('🌐 Deploy API', 'showDeployInstructions')
    .addToUi();
}

function showDeployInstructions() {
  const html = HtmlService.createHtmlOutput(`
    <h3>Deploy as Web App</h3>
    <ol>
      <li>Click <b>Deploy → New deployment</b></li>
      <li>Type: <b>Web app</b></li>
      <li>Execute as: <b>Me</b></li>
      <li>Who has access: <b>Anyone</b></li>
      <li>Click <b>Deploy</b></li>
      <li>Copy the <b>Web app URL</b></li>
      <li>Paste it into your dashboard's <code>CONFIG.API_URL</code></li>
    </ol>
  `).setWidth(400).setHeight(250);
  SpreadsheetApp.getUi().showModalDialog(html, 'API Deployment');
}
