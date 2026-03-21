/**
 * Majaz AI OS — Google Sheets Dark Theme
 * Paste this into Extensions > Apps Script in your Google Sheet.
 * Run: applyMajazTheme() to style all sheets.
 * 
 * Colors match Obsidian theme: dark background + gold accent (#D4A574)
 * 
 * [AUTH: Majaz_OS | sheets_theme | 1.0.0 | 2026-03-21]
 */

// --- Color Constants (matching Obsidian majaz-dark-theme.css) ---
const COLORS = {
  BG_DARK:     '#0D1117',   // deepest background
  BG_MID:      '#161B22',   // row background
  BG_ALT:      '#1C2128',   // alternating rows
  BG_HEADER:   '#21262D',   // header background
  BORDER:      '#30363D',   // borders
  GOLD:        '#D4A574',   // accent (headers, highlights)
  GOLD_LIGHT:  '#E0B990',   // lighter gold
  TEXT_LIGHT:  '#E6EDF3',   // primary text
  TEXT_MUTED:  '#8B949E',   // secondary text
  RED:         '#F85149',   // overdue / critical
  ORANGE:      '#D29922',   // warning / major
  GREEN:       '#3FB950',   // ok / closed
  BLUE:        '#79C0FF',   // links / info
};


/**
 * Apply Majaz dark theme to ALL sheets in the spreadsheet.
 * Run this function from the Apps Script editor.
 */
function applyMajazTheme() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  sheets.forEach(sheet => {
    const name = sheet.getName().toLowerCase();
    styleSheet(sheet);
    
    // Apply conditional formatting + dropdowns based on sheet type
    if (name.includes('crm') || name.includes('pipeline')) {
      addCrmFormatting(sheet);
      addCrmDropdowns(sheet);
    } else if (name.includes('project')) {
      addProjectFormatting(sheet);
      addProjectDropdowns(sheet);
    } else if (name.includes('supervision')) {
      addSupervisionFormatting(sheet);
      addSupervisionDropdowns(sheet);
    }
  });
  
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Majaz dark theme applied!');
}


/**
 * Base styling for any sheet.
 */
function styleSheet(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 50);
  const lastCol = Math.max(sheet.getLastColumn(), 15);
  const fullRange = sheet.getRange(1, 1, lastRow, lastCol);
  
  // --- Background: dark ---
  fullRange
    .setBackground(COLORS.BG_DARK)
    .setFontColor(COLORS.TEXT_LIGHT)
    .setFontFamily('Inter')
    .setFontSize(11)
    .setVerticalAlignment('middle')
    .setWrap(true);
  
  // --- Header row: gold accent (no wrap, single line) ---
  if (sheet.getLastRow() >= 1) {
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    headerRange
      .setBackground(COLORS.BG_HEADER)
      .setFontColor(COLORS.GOLD)
      .setFontWeight('bold')
      .setFontSize(11)
      .setHorizontalAlignment('center')
      .setWrap(false)
      .setBorder(false, false, true, false, false, false, COLORS.GOLD, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.setRowHeight(1, 36);
  }
  
  // --- Data rows: comfortable height ---
  if (sheet.getLastRow() >= 2) {
    for (let row = 2; row <= Math.min(sheet.getLastRow(), 50); row++) {
      sheet.setRowHeight(row, 32);
    }
  }
  
  // --- Alternating row colors ---
  if (sheet.getLastRow() >= 2) {
    for (let row = 2; row <= lastRow; row++) {
      const rowRange = sheet.getRange(row, 1, 1, lastCol);
      if (row % 2 === 0) {
        rowRange.setBackground(COLORS.BG_ALT);
      } else {
        rowRange.setBackground(COLORS.BG_MID);
      }
    }
  }
  
  // --- Borders: subtle ---
  fullRange.setBorder(
    true, true, true, true, true, true,
    COLORS.BORDER, SpreadsheetApp.BorderStyle.SOLID
  );
  
  // --- Freeze header row ---
  sheet.setFrozenRows(1);
  
  // --- Smart column sizing: auto-fit then clamp ---
  const headers = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    : [];
  
  for (let col = 1; col <= Math.min(lastCol, 15); col++) {
    sheet.autoResizeColumn(col);
    const currentWidth = sheet.getColumnWidth(col);
    const header = (headers[col - 1] || '').toString().toLowerCase();
    
    // Smart width based on content type
    if (header.includes('id') || header.includes('score')) {
      sheet.setColumnWidth(col, Math.max(currentWidth, 80));
    } else if (header.includes('notes') || header.includes('issues') || header.includes('action') || header.includes('finding')) {
      sheet.setColumnWidth(col, Math.min(Math.max(currentWidth, 200), 350));
    } else if (header.includes('name') || header.includes('client') || header.includes('project')) {
      sheet.setColumnWidth(col, Math.min(Math.max(currentWidth, 150), 250));
    } else {
      sheet.setColumnWidth(col, Math.min(Math.max(currentWidth, 100), 300));
    }
  }
  
  // --- Tab color: gold ---
  sheet.setTabColor(COLORS.GOLD);
}


/**
 * Add dropdown validations to CRM sheet.
 */
function addCrmDropdowns(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 50);
  
  const statusCol = findColumnByHeader(sheet, 'Status');
  if (statusCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, statusCol, lastRow, 1).setDataValidation(rule);
  }
  
  const icpCol = findColumnByHeader(sheet, 'ICP Score');
  if (icpCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['1', '2', '3', '4', '5'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, icpCol, lastRow, 1).setDataValidation(rule);
  }
  
  const typeCol = findColumnByHeader(sheet, 'Type');
  if (typeCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Villa', 'Townhouse', 'Apartment', 'Commercial', 'Renovation', 'Other'], true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, typeCol, lastRow, 1).setDataValidation(rule);
  }
  
  const sourceCol = findColumnByHeader(sheet, 'Source');
  if (sourceCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Instagram DM', 'Instagram/WhatsApp', 'WhatsApp', 'Referral', 'Direct', 'Website', 'LinkedIn', 'Other'], true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, sourceCol, lastRow, 1).setDataValidation(rule);
  }
}


/**
 * Add dropdown validations to Projects sheet.
 */
function addProjectDropdowns(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 50);
  
  const phaseCol = findColumnByHeader(sheet, 'Phase');
  if (phaseCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Proposal', 'Concept', 'Working Drawings', 'Municipality', 'Construction', 'Supervision', 'Handover', 'Completed'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, phaseCol, lastRow, 1).setDataValidation(rule);
  }
  
  const locationCol = findColumnByHeader(sheet, 'Location');
  if (locationCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Reem Island AD', 'Saadiyat Island AD', 'Yas Island AD', 'Khalifa City AD',
        'Al Shamkha AD', 'MBZ City AD', 'Al Raha AD',
        'Jumeirah Dubai', 'Emirates Hills Dubai', 'Dubai Hills Dubai', 'Al Barsha Dubai',
        'Other'
      ], true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange(2, locationCol, lastRow, 1).setDataValidation(rule);
  }
}


/**
 * Add dropdown validations to Supervision sheet.
 */
function addSupervisionDropdowns(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 50);
  
  const sevCol = findColumnByHeader(sheet, 'Severity');
  if (sevCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Critical', 'Major', 'Minor', 'Observation'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, sevCol, lastRow, 1).setDataValidation(rule);
  }
  
  const catCol = findColumnByHeader(sheet, 'Category');
  if (catCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Structural', 'MEP', 'Finishing', 'Landscape', 'Safety'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, catCol, lastRow, 1).setDataValidation(rule);
  }
  
  const statusCol = findColumnByHeader(sheet, 'Status');
  if (statusCol > 0) {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Open', 'In Progress', 'Closed'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, statusCol, lastRow, 1).setDataValidation(rule);
  }
}


/**
 * CRM-specific conditional formatting.
 */
function addCrmFormatting(sheet) {
  const rules = sheet.getConditionalFormatRules();
  const lastRow = Math.max(sheet.getLastRow(), 50);
  
  // Status column coloring (column E = Status)
  const statusCol = findColumnByHeader(sheet, 'Status');
  if (statusCol > 0) {
    const statusRange = sheet.getRange(2, statusCol, lastRow, 1);
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('New')
      .setBackground('#1A3D5C').setFontColor(COLORS.BLUE)
      .setRanges([statusRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Contacted')
      .setBackground('#1A3040').setFontColor('#58A6FF')
      .setRanges([statusRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Qualified')
      .setBackground('#1A3528').setFontColor(COLORS.GREEN)
      .setRanges([statusRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Won')
      .setBackground('#1A3A20').setFontColor('#56D364')
      .setRanges([statusRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Lost')
      .setBackground('#3D1A1A').setFontColor(COLORS.RED)
      .setRanges([statusRange]).build());
  }
  
  // ICP Score coloring (column F)
  const icpCol = findColumnByHeader(sheet, 'ICP Score');
  if (icpCol > 0) {
    const icpRange = sheet.getRange(2, icpCol, lastRow, 1);
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(4)
      .setBackground('#1A3A20').setFontColor(COLORS.GREEN)
      .setRanges([icpRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(3)
      .setBackground('#3D3A1A').setFontColor(COLORS.ORANGE)
      .setRanges([icpRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(2)
      .setBackground('#3D1A1A').setFontColor(COLORS.RED)
      .setRanges([icpRange]).build());
  }
  
  // Overdue alerts in Notes column
  const notesCol = findColumnByHeader(sheet, 'Notes');
  if (notesCol > 0) {
    const notesRange = sheet.getRange(2, notesCol, lastRow, 1);
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('⚠️')
      .setBackground('#3D2A1A').setFontColor(COLORS.ORANGE)
      .setRanges([notesRange]).build());
  }
  
  sheet.setConditionalFormatRules(rules);
}


/**
 * Project tracker conditional formatting.
 */
function addProjectFormatting(sheet) {
  const rules = sheet.getConditionalFormatRules();
  const lastRow = Math.max(sheet.getLastRow(), 50);
  
  // Overdue Amount column — red when > 0
  const overdueCol = findColumnByHeader(sheet, 'Overdue Amount');
  if (overdueCol > 0) {
    const overdueRange = sheet.getRange(2, overdueCol, lastRow, 1);
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(0)
      .setBackground('#3D1A1A').setFontColor(COLORS.RED).setBold(true)
      .setRanges([overdueRange]).build());
  }
  
  // Phase column coloring
  const phaseCol = findColumnByHeader(sheet, 'Phase');
  if (phaseCol > 0) {
    const phaseRange = sheet.getRange(2, phaseCol, lastRow, 1);
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Concept')
      .setBackground('#1A3D5C').setFontColor(COLORS.BLUE)
      .setRanges([phaseRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Municipality')
      .setBackground('#3D3A1A').setFontColor(COLORS.ORANGE)
      .setRanges([phaseRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Supervision')
      .setBackground('#1A3A20').setFontColor(COLORS.GREEN)
      .setRanges([phaseRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Proposal')
      .setBackground('#2D1A3D').setFontColor('#BC8CFF')
      .setRanges([phaseRange]).build());
  }
  
  sheet.setConditionalFormatRules(rules);
}


/**
 * Supervision log conditional formatting.
 */
function addSupervisionFormatting(sheet) {
  const rules = sheet.getConditionalFormatRules();
  const lastRow = Math.max(sheet.getLastRow(), 50);
  
  // Severity column
  const sevCol = findColumnByHeader(sheet, 'Severity');
  if (sevCol > 0) {
    const sevRange = sheet.getRange(2, sevCol, lastRow, 1);
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Critical')
      .setBackground('#3D1A1A').setFontColor(COLORS.RED).setBold(true)
      .setRanges([sevRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Major')
      .setBackground('#3D2A1A').setFontColor(COLORS.ORANGE).setBold(true)
      .setRanges([sevRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Minor')
      .setBackground('#3D3A1A').setFontColor('#D2A641')
      .setRanges([sevRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Observation')
      .setBackground('#1A2D3D').setFontColor(COLORS.TEXT_MUTED)
      .setRanges([sevRange]).build());
  }
  
  // Status column
  const statusCol = findColumnByHeader(sheet, 'Status');
  if (statusCol > 0) {
    const statusRange = sheet.getRange(2, statusCol, lastRow, 1);
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Open')
      .setBackground('#3D2A1A').setFontColor(COLORS.ORANGE)
      .setRanges([statusRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('In Progress')
      .setBackground('#1A3D5C').setFontColor(COLORS.BLUE)
      .setRanges([statusRange]).build());
    
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Closed')
      .setBackground('#1A3A20').setFontColor(COLORS.GREEN)
      .setRanges([statusRange]).build());
  }
  
  sheet.setConditionalFormatRules(rules);
}


/**
 * Find column index by header name (case-insensitive).
 */
function findColumnByHeader(sheet, headerName) {
  if (sheet.getLastRow() < 1) return -1;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase().trim() === headerName.toLowerCase().trim()) {
      return i + 1;
    }
  }
  return -1;
}


/**
 * Add a custom menu to the spreadsheet for easy access.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏗️ Majaz OS')
    .addItem('🎨 Apply Dark Theme', 'applyMajazTheme')
    .addItem('🔄 Refresh Formatting', 'applyMajazTheme')
    .addToUi();
}
