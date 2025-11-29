import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export const generateExcelReport = (logs) => {
  const workbook = XLSX.utils.book_new();
  
  const logsByDate = {};
  logs.forEach(log => {
    if (!logsByDate[log.date]) {
      logsByDate[log.date] = [];
    }
    logsByDate[log.date].push(log);
  });

  Object.keys(logsByDate).sort().forEach(date => {
    const dailyLogs = logsByDate[date].sort((a, b) => a.time.localeCompare(b.time));
    const hasHT = dailyLogs.some(log => log.htPanel);
    const hasLT = dailyLogs.some(log => log.ltPanel);
    
    const ws_data = [];
    
    ws_data.push([`Panel Log Sheet - ${new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    })}`]);
    ws_data.push([]);

    if (hasHT) {
      ws_data.push(['HT PANEL']);
      ws_data.push([]);
      
      ws_data.push([
        'Time (Hrs)', 'I/C From TNEB', 
        'Main Incomer Supply', '', '', '', '', '',
        'Out Going to Tr-1 (2000 Kva)', '', '',
        'Out Going to Tr-2 (2000 Kva)', '', '',
        'Out Going to Tr-3 (2000 Kva)', '', '',
        'REMARK'
      ]);
      
      ws_data.push([
        '', '',
        'Current Amp', '', '', '', '', '',
        'Current Amp & winding Temp.', '', '',
        'Current Amp & winding Temp.', '', '',
        'Current Amp & winding Temp.', '', '',
        ''
      ]);
      
      ws_data.push([
        '', '',
        'Volt (kv)', 'R', 'Y', 'B', 'PF', 'Hz',
        'R', 'Y', 'B',
        'R', 'Y', 'B',
        'R', 'Y', 'B',
        ''
      ]);

      dailyLogs.forEach(log => {
        if (log.htPanel) {
          ws_data.push([
            log.time,
            log.htPanel.icFromTneb || 'EB',
            log.htPanel.voltageFromWreb?.volt || '-',
            log.htPanel.currentAmp?.r || '-',
            log.htPanel.currentAmp?.y || '-',
            log.htPanel.currentAmp?.b || '-',
            log.htPanel.currentAmp?.pf || '-',
            log.htPanel.currentAmp?.hz || '-',
            log.htPanel.outgoingTr1?.currentAmp?.r || '-',
            log.htPanel.outgoingTr1?.currentAmp?.y || '-',
            log.htPanel.outgoingTr1?.currentAmp?.b || '-',
            log.htPanel.outgoingTr2?.currentAmp?.r || '-',
            log.htPanel.outgoingTr2?.currentAmp?.y || '-',
            log.htPanel.outgoingTr2?.currentAmp?.b || '-',
            log.htPanel.outgoingTr3?.currentAmp?.r || '-',
            log.htPanel.outgoingTr3?.currentAmp?.y || '-',
            log.htPanel.outgoingTr3?.currentAmp?.b || '-',
            log.remarks || '-'
          ]);
          
          ws_data.push([
            '', '', '', '', '', '', '', '',
            log.htPanel.outgoingTr1?.windingTemp?.r || '-',
            log.htPanel.outgoingTr1?.windingTemp?.y || '-',
            log.htPanel.outgoingTr1?.windingTemp?.b || '-',
            log.htPanel.outgoingTr2?.windingTemp?.r || '-',
            log.htPanel.outgoingTr2?.windingTemp?.y || '-',
            log.htPanel.outgoingTr2?.windingTemp?.b || '-',
            log.htPanel.outgoingTr3?.windingTemp?.r || '-',
            log.htPanel.outgoingTr3?.windingTemp?.y || '-',
            log.htPanel.outgoingTr3?.windingTemp?.b || '-',
            ''
          ]);
        }
      });

      ws_data.push([]);
      ws_data.push([]);
    }


    if (hasLT) {
      ws_data.push(['LT PANEL']);
      ws_data.push([]); // Empty row
      
      // Header rows for LT Panel
      ws_data.push([
        'Time (Hrs)',
        'Incomer -1 (From -Tr-1)', '', '', '', '', '', '', '',
        'Incomer -2 (From -Tr-2)', '', '', '', '', '', '', '',
        'Incomer -3 (From -Tr-3)', '', '', '', '', '', '', ''
      ]);
      
      ws_data.push([
        '',
        'Voltage', '', '', 'Current Amp', '', '', 'TAP No.', 'KWH',
        'Voltage', '', '', 'Current Amp', '', '', 'TAP No.', 'KWH',
        'Voltage', '', '', 'Current Amp', '', '', 'TAP No.', 'KWH'
      ]);
      
      ws_data.push([
        '',
        'RY', 'YB', 'BR', 'R', 'Y', 'B', '', '',
        'RY', 'YB', 'BR', 'R', 'Y', 'B', '', '',
        'RY', 'YB', 'BR', 'R', 'Y', 'B', '', ''
      ]);

      dailyLogs.forEach(log => {
        if (log.ltPanel) {
          ws_data.push([
            log.time,
            log.ltPanel.incomer1?.voltage?.ry || '-',
            log.ltPanel.incomer1?.voltage?.yb || '-',
            log.ltPanel.incomer1?.voltage?.br || '-',
            log.ltPanel.incomer1?.currentAmp?.r || '-',
            log.ltPanel.incomer1?.currentAmp?.y || '-',
            log.ltPanel.incomer1?.currentAmp?.b || '-',
            log.ltPanel.incomer1?.tap || '-',
            log.ltPanel.incomer1?.kwh || '-',
            log.ltPanel.incomer2?.voltage?.ry || '-',
            log.ltPanel.incomer2?.voltage?.yb || '-',
            log.ltPanel.incomer2?.voltage?.br || '-',
            log.ltPanel.incomer2?.currentAmp?.r || '-',
            log.ltPanel.incomer2?.currentAmp?.y || '-',
            log.ltPanel.incomer2?.currentAmp?.b || '-',
            log.ltPanel.incomer2?.tap || '-',
            log.ltPanel.incomer2?.kwh || '-',
            log.ltPanel.incomer3?.voltage?.ry || '-',
            log.ltPanel.incomer3?.voltage?.yb || '-',
            log.ltPanel.incomer3?.voltage?.br || '-',
            log.ltPanel.incomer3?.currentAmp?.r || '-',
            log.ltPanel.incomer3?.currentAmp?.y || '-',
            log.ltPanel.incomer3?.currentAmp?.b || '-',
            log.ltPanel.incomer3?.tap || '-',
            log.ltPanel.incomer3?.kwh || '-'
          ]);
        }
      });
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    const colWidths = [
      { wch: 10 },  // Time
      { wch: 8 },   // I/C
      { wch: 10 },  // Volt
      { wch: 8 }, { wch: 8 }, { wch: 8 },  // R, Y, B
      { wch: 8 }, { wch: 8 },  // PF, Hz
      { wch: 8 }, { wch: 8 }, { wch: 8 },  // Tr-1 R, Y, B
      { wch: 8 }, { wch: 8 }, { wch: 8 },  // Tr-2 R, Y, B
      { wch: 8 }, { wch: 8 }, { wch: 8 },  // Tr-3 R, Y, B
      { wch: 20 }   // Remark
    ];
    ws['!cols'] = colWidths;
    
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        
        ws[cellAddress].s.alignment = {
          wrapText: true,
          vertical: 'center',
          horizontal: 'center'
        };
        
        ws[cellAddress].s.font = {
          sz: 10
        };
        
        ws[cellAddress].s.border = {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        };
      }
    }
    
    // Set row heights to auto-fit content
    if (!ws['!rows']) ws['!rows'] = [];
    for (let i = 0; i <= range.e.r; i++) {
      ws['!rows'][i] = { hpx: 20 }; // Default height in pixels
    }
    
    // Add the sheet to workbook
    const sheetName = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  });

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
};

export const generatePDFReport = (logs) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        layout: 'landscape',
        margins: { top: 30, bottom: 30, left: 30, right: 30 }
      });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Group logs by date
      const logsByDate = {};
      logs.forEach(log => {
        if (!logsByDate[log.date]) {
          logsByDate[log.date] = [];
        }
        logsByDate[log.date].push(log);
      });

      let firstPage = true;

      Object.keys(logsByDate).sort().forEach(date => {
        const dailyLogs = logsByDate[date].sort((a, b) => a.time.localeCompare(b.time));
        const hasHT = dailyLogs.some(log => log.htPanel);
        const hasLT = dailyLogs.some(log => log.ltPanel);

        if (!firstPage) {
          doc.addPage();
        }
        firstPage = false;

        // Title
        doc.fontSize(16).font('Helvetica-Bold')
          .text(`Panel Log Sheet - ${new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}`, { align: 'center' });
        doc.moveDown(1);

        // HT Panel Table
        if (hasHT) {
          doc.fontSize(10).font('Helvetica-Bold').text('HT PANEL');
          doc.moveDown(0.3);

          const htTableTop = doc.y;
          const rowHeight = 12;
          const smallCell = 22;
          const timeCell = 28;
          const icCell = 28;
          const htStartX = 15;
          
          let currentX = htStartX;
          let currentY = htTableTop;
          
          // Draw HT table with 3-row headers
          doc.fontSize(5.5).font('Helvetica-Bold');
          
          // Time (merged 3 rows)
          doc.rect(currentX, currentY, timeCell, rowHeight * 3).stroke();
          doc.text('Time\n(Hrs)', currentX + 1, currentY + rowHeight, { width: timeCell - 2, align: 'center' });
          currentX += timeCell;
          
          // I/C From TNEB (merged 3 rows)
          doc.rect(currentX, currentY, icCell, rowHeight * 3).stroke();
          doc.text('I/C\nFrom\nTNEB', currentX + 1, currentY + rowHeight - 2, { width: icCell - 2, align: 'center' });
          currentX += icCell;
          
          // Main Incomer Supply header (row 1 - spans Volt + 5 current amp cells = 6 cells)
          const mainIncomerWidth = smallCell * 6;
          doc.rect(currentX, currentY, mainIncomerWidth, rowHeight).stroke();
          doc.text('Main Incomer Supply', currentX + 1, currentY + 3, { width: mainIncomerWidth - 2, align: 'center' });
          
          // Volt (merged rows 2-3)
          doc.rect(currentX, currentY + rowHeight, smallCell, rowHeight * 2).stroke();
          doc.text('Volt\n(kv)', currentX + 1, currentY + rowHeight + 3, { width: smallCell - 2, align: 'center' });
          
          // Current Amp header (row 2 - spans 5 cells)
          doc.rect(currentX + smallCell, currentY + rowHeight, smallCell * 5, rowHeight).stroke();
          doc.text('Current Amp', currentX + smallCell + 1, currentY + rowHeight + 3, { width: smallCell * 5 - 2, align: 'center' });
          
          // Row 3 - R, Y, B, PF, Hz
          ['R', 'Y', 'B', 'PF', 'Hz'].forEach((lbl, idx) => {
            doc.rect(currentX + smallCell + (smallCell * idx), currentY + rowHeight * 2, smallCell, rowHeight).stroke();
            doc.text(lbl, currentX + smallCell + (smallCell * idx) + 1, currentY + rowHeight * 2 + 3, { width: smallCell - 2, align: 'center' });
          });
          currentX += mainIncomerWidth;
          
          // Transformers (Tr-1, Tr-2, Tr-3)
          ['Tr-1', 'Tr-2', 'Tr-3'].forEach(tr => {
            const trWidth = smallCell * 3;
            
            // Row 1
            doc.rect(currentX, currentY, trWidth, rowHeight).stroke();
            doc.text(`Out Going to ${tr}\n(2000 Kva)`, currentX + 1, currentY + 1, { width: trWidth - 2, align: 'center', lineBreak: false });
            
            // Row 2
            doc.rect(currentX, currentY + rowHeight, trWidth, rowHeight).stroke();
            doc.text('Current Amp &\nwinding Temp', currentX + 1, currentY + rowHeight + 1, { width: trWidth - 2, align: 'center', lineBreak: false });
            
            // Row 3 - R, Y, B
            ['R', 'Y', 'B'].forEach((lbl, idx) => {
              doc.rect(currentX + (smallCell * idx), currentY + rowHeight * 2, smallCell, rowHeight).stroke();
              doc.text(lbl, currentX + (smallCell * idx) + 1, currentY + rowHeight * 2 + 3, { width: smallCell - 2, align: 'center' });
            });
            currentX += trWidth;
          });
          
          currentY += rowHeight * 3;
          
          // Draw HT data rows
          doc.fontSize(6).font('Helvetica');
          dailyLogs.forEach(log => {
            if (log.htPanel) {
              const dataRowHeight = rowHeight * 2;
              currentX = htStartX;
              
              // Time (merged 2 rows)
              doc.rect(currentX, currentY, timeCell, dataRowHeight).stroke();
              doc.text(log.time, currentX + 1, currentY + dataRowHeight / 2 - 2, { width: timeCell - 2, align: 'center' });
              currentX += timeCell;
              
              // I/C From TNEB (merged 2 rows)
              doc.rect(currentX, currentY, icCell, dataRowHeight).stroke();
              doc.text(log.htPanel.icFromTneb || 'EB', currentX + 1, currentY + dataRowHeight / 2 - 2, { width: icCell - 2, align: 'center' });
              currentX += icCell;
              
              // Volt (merged 2 rows)
              doc.rect(currentX, currentY, smallCell, dataRowHeight).stroke();
              const voltText = String(log.htPanel.voltageFromWreb?.volt || '-');
              doc.fontSize(voltText.length > 4 ? 5 : 6);
              doc.text(voltText.substring(0, 6), currentX + 1, currentY + dataRowHeight / 2 - 2, { width: smallCell - 2, align: 'center' });
              doc.fontSize(6);
              currentX += smallCell;
              
              // Current Amp R, Y, B, PF, Hz (merged 2 rows each)
              [log.htPanel.currentAmp?.r, log.htPanel.currentAmp?.y, log.htPanel.currentAmp?.b, 
               log.htPanel.currentAmp?.pf, log.htPanel.currentAmp?.hz].forEach(val => {
                doc.rect(currentX, currentY, smallCell, dataRowHeight).stroke();
                const valText = String(val || '-');
                doc.fontSize(valText.length > 4 ? 4.5 : 6);
                doc.text(valText.substring(0, 5), currentX + 1, currentY + dataRowHeight / 2 - 2, { width: smallCell - 2, align: 'center' });
                doc.fontSize(6);
                currentX += smallCell;
              });
              
              // Transformers - Current Amp (row 1) & Winding Temp (row 2)
              [log.htPanel.outgoingTr1, log.htPanel.outgoingTr2, log.htPanel.outgoingTr3].forEach(tr => {
                ['r', 'y', 'b'].forEach(phase => {
                  // Row 1 - Current Amp
                  doc.rect(currentX, currentY, smallCell, rowHeight).stroke();
                  const ampText = String(tr?.currentAmp?.[phase] || '-');
                  doc.fontSize(ampText.length > 4 ? 4.5 : 6);
                  doc.text(ampText.substring(0, 5), currentX + 1, currentY + 3, { width: smallCell - 2, align: 'center' });
                  
                  // Row 2 - Winding Temp
                  doc.rect(currentX, currentY + rowHeight, smallCell, rowHeight).stroke();
                  const tempText = String(tr?.windingTemp?.[phase] || '-');
                  doc.fontSize(tempText.length > 4 ? 4.5 : 6);
                  doc.text(tempText.substring(0, 5), currentX + 1, currentY + rowHeight + 3, { width: smallCell - 2, align: 'center' });
                  doc.fontSize(6);
                  
                  currentX += smallCell;
                });
              });
              
              currentY += dataRowHeight;
            }
          });

          doc.moveDown(1.5);
        }

        // LT Panel Table
        if (hasLT) {
          doc.fontSize(10).font('Helvetica-Bold').text('LT PANEL');
          doc.moveDown(0.3);

          const ltTableTop = doc.y;
          const ltRowHeight = 12;
          const ltTimeCell = 28;
          const ltSmallCell = 22;
          const ltStartX = 15;
          
          let currentX = ltStartX;
          let currentY = ltTableTop;
          
          // Draw LT table with 3-row headers
          doc.fontSize(5).font('Helvetica-Bold');
          
          // Time (merged 3 rows)
          doc.rect(currentX, currentY, ltTimeCell, ltRowHeight * 3).stroke();
          doc.text('Time\n(Hrs)', currentX + 1, currentY + ltRowHeight, { width: ltTimeCell - 2, align: 'center' });
          currentX += ltTimeCell;
          
          // Incomer sections (3 incomers, each with 8 cells)
          ['Incomer-1 (From Tr-1)', 'Incomer-2 (From Tr-2)', 'Incomer-3 (From Tr-3)'].forEach(incLabel => {
            const incomerWidth = ltSmallCell * 8;
            const incomerStartX = currentX;
            
            // Row 1 - Incomer label
            doc.rect(currentX, currentY, incomerWidth, ltRowHeight).stroke();
            doc.text(incLabel, currentX + 1, currentY + 3, { width: incomerWidth - 2, align: 'center' });
            
            // Row 2 - Voltage, Current Amp, TAP, KWH
            // Voltage (3 cells)
            doc.rect(currentX, currentY + ltRowHeight, ltSmallCell * 3, ltRowHeight).stroke();
            doc.text('Voltage', currentX + 1, currentY + ltRowHeight + 3, { width: ltSmallCell * 3 - 2, align: 'center' });
            
            // Current Amp (3 cells)
            doc.rect(currentX + ltSmallCell * 3, currentY + ltRowHeight, ltSmallCell * 3, ltRowHeight).stroke();
            doc.text('Current Amp', currentX + ltSmallCell * 3 + 1, currentY + ltRowHeight + 3, { width: ltSmallCell * 3 - 2, align: 'center' });
            
            // TAP (merged 2 rows)
            doc.rect(currentX + ltSmallCell * 6, currentY + ltRowHeight, ltSmallCell, ltRowHeight * 2).stroke();
            doc.text('TAP\nNo.', currentX + ltSmallCell * 6 + 1, currentY + ltRowHeight + 3, { width: ltSmallCell - 2, align: 'center' });
            
            // KWH (merged 2 rows)
            doc.rect(currentX + ltSmallCell * 7, currentY + ltRowHeight, ltSmallCell, ltRowHeight * 2).stroke();
            doc.text('KWH', currentX + ltSmallCell * 7 + 1, currentY + ltRowHeight + 5, { width: ltSmallCell - 2, align: 'center' });
            
            // Row 3 - Voltage phases (RY, YB, BR) and Current Amp phases (R, Y, B)
            ['RY', 'YB', 'BR', 'R', 'Y', 'B'].forEach((lbl, idx) => {
              doc.rect(currentX + ltSmallCell * idx, currentY + ltRowHeight * 2, ltSmallCell, ltRowHeight).stroke();
              doc.text(lbl, currentX + ltSmallCell * idx + 1, currentY + ltRowHeight * 2 + 3, { width: ltSmallCell - 2, align: 'center' });
            });
            
            currentX += incomerWidth;
          });
          
          currentY += ltRowHeight * 3;
          
          // Draw LT data rows
          doc.fontSize(5.5).font('Helvetica');
          dailyLogs.forEach(log => {
            if (log.ltPanel) {
              // Reset to start position for each row
              currentX = ltStartX;
              
              // Time
              doc.rect(currentX, currentY, ltTimeCell, ltRowHeight).stroke();
              doc.text(log.time, currentX + 1, currentY + 3, { width: ltTimeCell - 2, align: 'center' });
              currentX += ltTimeCell;
              
              // Incomer data (3 incomers)
              [log.ltPanel.incomer1, log.ltPanel.incomer2, log.ltPanel.incomer3].forEach(inc => {
                // Voltage - RY, YB, BR
                ['ry', 'yb', 'br'].forEach(phase => {
                  doc.rect(currentX, currentY, ltSmallCell, ltRowHeight).stroke();
                  const voltText = String(inc?.voltage?.[phase] || '-');
                  const fontSize = voltText.length > 4 ? 4.5 : 5.5;
                  doc.fontSize(fontSize);
                  doc.text(voltText.substring(0, 5), currentX + 1, currentY + 3, { width: ltSmallCell - 2, align: 'center' });
                  doc.fontSize(5.5);
                  currentX += ltSmallCell;
                });
                
                // Current Amp - R, Y, B
                ['r', 'y', 'b'].forEach(phase => {
                  doc.rect(currentX, currentY, ltSmallCell, ltRowHeight).stroke();
                  const ampText = String(inc?.currentAmp?.[phase] || '-');
                  const fontSize = ampText.length > 4 ? 4.5 : 5.5;
                  doc.fontSize(fontSize);
                  doc.text(ampText.substring(0, 5), currentX + 1, currentY + 3, { width: ltSmallCell - 2, align: 'center' });
                  doc.fontSize(5.5);
                  currentX += ltSmallCell;
                });
                
                // TAP
                doc.rect(currentX, currentY, ltSmallCell, ltRowHeight).stroke();
                const tapText = String(inc?.tap || '-');
                const tapFontSize = tapText.length > 3 ? 4.5 : 5.5;
                doc.fontSize(tapFontSize);
                doc.text(tapText.substring(0, 4), currentX + 1, currentY + 3, { width: ltSmallCell - 2, align: 'center' });
                doc.fontSize(5.5);
                currentX += ltSmallCell;
                
                // KWH
                doc.rect(currentX, currentY, ltSmallCell, ltRowHeight).stroke();
                const kwhText = String(inc?.kwh || '-');
                const kwhFontSize = kwhText.length > 5 ? 4 : 5.5;
                doc.fontSize(kwhFontSize);
                doc.text(kwhText.substring(0, 7), currentX + 1, currentY + 3, { width: ltSmallCell - 2, align: 'center' });
                doc.fontSize(5.5);
                currentX += ltSmallCell;
              });
              
              currentY += ltRowHeight;
            }
          });
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
