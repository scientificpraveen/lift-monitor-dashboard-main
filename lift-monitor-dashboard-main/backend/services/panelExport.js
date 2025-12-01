import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { getPanelLogs } from '../panelLogContext.js';

export const generateExcel = async (filters) => {
  try {
    const logs = await getPanelLogs(filters);
    
    if (logs.length === 0) {
      throw new Error('No data available for export');
    }

    const workbook = XLSX.utils.book_new();
    
    const logsByDate = logs.reduce((acc, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {});

    Object.entries(logsByDate).forEach(([date, dateLogs]) => {
      dateLogs.sort((a, b) => a.time.localeCompare(b.time));
      
      const sheetData = [];
      const merges = [];
      let row = 0;

      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      sheetData.push([`Panel Log Sheet - ${formattedDate}`]);
      merges.push({ s: { r: row, c: 0 }, e: { r: row, c: 17 } });
      row++;
      sheetData.push([]);
      row++;

      const htLogs = dateLogs.filter(log => log.htPanel);
      if (htLogs.length > 0) {
        sheetData.push(['HT PANEL']);
        merges.push({ s: { r: row, c: 0 }, e: { r: row, c: 17 } });
        row++;

        sheetData.push(['Time (Hrs)', 'I/C From TNEB', 'Main Incomer Supply', '', '', '', '', '', 'Out Going to Tr-1 (2000 Kva)', '', '', 'Out Going to Tr-2 (2000 Kva)', '', '', 'Out Going to Tr-3 (2000 Kva)', '', '', 'REMARK']);
        merges.push({ s: { r: row, c: 0 }, e: { r: row + 2, c: 0 } }); // Time
        merges.push({ s: { r: row, c: 1 }, e: { r: row + 2, c: 1 } }); // I/C
        merges.push({ s: { r: row, c: 2 }, e: { r: row, c: 7 } }); // Main Incomer
        merges.push({ s: { r: row, c: 8 }, e: { r: row, c: 10 } }); // Tr-1
        merges.push({ s: { r: row, c: 11 }, e: { r: row, c: 13 } }); // Tr-2
        merges.push({ s: { r: row, c: 14 }, e: { r: row, c: 16 } }); // Tr-3
        merges.push({ s: { r: row, c: 17 }, e: { r: row + 2, c: 17 } }); // Remark
        row++;

        sheetData.push(['', '', 'Volt (kv)', 'Current Amp', '', '', '', '', 'Current Amp & winding Temp.', '', '', 'Current Amp & winding Temp.', '', '', 'Current Amp & winding Temp.', '', '', '']);
        merges.push({ s: { r: row, c: 2 }, e: { r: row + 1, c: 2 } }); // Volt
        merges.push({ s: { r: row, c: 3 }, e: { r: row, c: 7 } }); // Current Amp
        merges.push({ s: { r: row, c: 8 }, e: { r: row, c: 10 } }); // Tr-1 details
        merges.push({ s: { r: row, c: 11 }, e: { r: row, c: 13 } }); // Tr-2 details
        merges.push({ s: { r: row, c: 14 }, e: { r: row, c: 16 } }); // Tr-3 details
        row++;

        sheetData.push(['', '', '', 'R', 'Y', 'B', 'PF', 'Hz', 'R', 'Y', 'B', 'R', 'Y', 'B', 'R', 'Y', 'B', '']);
        row++;

        htLogs.forEach(log => {
          sheetData.push([
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
            log.htPanel.outgoingTr3?.currentAmp?.b || '-'
          ]);
          merges.push({ s: { r: row, c: 0 }, e: { r: row + 1, c: 0 } });
          merges.push({ s: { r: row, c: 1 }, e: { r: row + 1, c: 1 } });
          merges.push({ s: { r: row, c: 2 }, e: { r: row + 1, c: 2 } });
          merges.push({ s: { r: row, c: 3 }, e: { r: row + 1, c: 3 } });
          merges.push({ s: { r: row, c: 4 }, e: { r: row + 1, c: 4 } });
          merges.push({ s: { r: row, c: 5 }, e: { r: row + 1, c: 5 } });
          merges.push({ s: { r: row, c: 6 }, e: { r: row + 1, c: 6 } });
          merges.push({ s: { r: row, c: 7 }, e: { r: row + 1, c: 7 } });
          merges.push({ s: { r: row, c: 17 }, e: { r: row + 1, c: 17 } });
          row++;

          sheetData.push([
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
          row++;
        });

        sheetData.push([]);
        row++;
      }

      const ltLogs = dateLogs.filter(log => log.ltPanel);
      if (ltLogs.length > 0) {
        sheetData.push(['LT PANEL']);
        merges.push({ s: { r: row, c: 0 }, e: { r: row, c: 24 } });
        row++;

        sheetData.push(['Time (Hrs)', 'Incomer-1 (From Tr-1)', '', '', '', '', '', '', '', 'Incomer-2 (From Tr-2)', '', '', '', '', '', '', '', 'Incomer-3 (From Tr-3)', '', '', '', '', '', '', '']);
        merges.push({ s: { r: row, c: 0 }, e: { r: row + 2, c: 0 } });
        merges.push({ s: { r: row, c: 1 }, e: { r: row, c: 8 } });
        merges.push({ s: { r: row, c: 9 }, e: { r: row, c: 16 } });
        merges.push({ s: { r: row, c: 17 }, e: { r: row, c: 24 } });
        row++;

        sheetData.push(['', 'Voltage', '', '', 'Current Amp', '', '', 'TAP No.', 'KWH', 'Voltage', '', '', 'Current Amp', '', '', 'TAP No.', 'KWH', 'Voltage', '', '', 'Current Amp', '', '', 'TAP No.', 'KWH']);
        merges.push({ s: { r: row, c: 1 }, e: { r: row, c: 3 } });
        merges.push({ s: { r: row, c: 4 }, e: { r: row, c: 6 } });
        merges.push({ s: { r: row, c: 7 }, e: { r: row + 1, c: 7 } });
        merges.push({ s: { r: row, c: 8 }, e: { r: row + 1, c: 8 } });
        merges.push({ s: { r: row, c: 9 }, e: { r: row, c: 11 } });
        merges.push({ s: { r: row, c: 12 }, e: { r: row, c: 14 } });
        merges.push({ s: { r: row, c: 15 }, e: { r: row + 1, c: 15 } });
        merges.push({ s: { r: row, c: 16 }, e: { r: row + 1, c: 16 } });
        merges.push({ s: { r: row, c: 17 }, e: { r: row, c: 19 } });
        merges.push({ s: { r: row, c: 20 }, e: { r: row, c: 22 } });
        merges.push({ s: { r: row, c: 23 }, e: { r: row + 1, c: 23 } });
        merges.push({ s: { r: row, c: 24 }, e: { r: row + 1, c: 24 } });
        row++;

        sheetData.push(['', 'RY', 'YB', 'BR', 'R', 'Y', 'B', '', '', 'RY', 'YB', 'BR', 'R', 'Y', 'B', '', '', 'RY', 'YB', 'BR', 'R', 'Y', 'B', '', '']);
        row++;

        ltLogs.forEach(log => {
          sheetData.push([
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
          row++;
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws['!merges'] = merges;

      // Set column widths
      const colWidths = Array(25).fill({ wch: 7 });
      colWidths[0] = { wch: 10 }; // Time
      colWidths[1] = { wch: 8 };  // I/C
      colWidths[2] = { wch: 8 };  // Volt
      colWidths[17] = { wch: 15 }; // Remark

      ws['!cols'] = colWidths;

      const sheetName = new Date(date).toLocaleDateString('en-US').replace(/\//g, '-');
      XLSX.utils.book_append_sheet(workbook, ws, sheetName.substring(0, 31));
    });

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
};

export const generatePDF = async (filters) => {
  try {
    const logs = await getPanelLogs(filters);
    
    if (logs.length === 0) {
      throw new Error('No data available for export');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ 
        size: 'A4', 
        layout: 'landscape',
        margins: { top: 25, bottom: 25, left: 25, right: 25 }
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Group logs by date
      const logsByDate = logs.reduce((acc, log) => {
        if (!acc[log.date]) acc[log.date] = [];
        acc[log.date].push(log);
        return acc;
      }, {});

      let isFirstPage = true;

      Object.entries(logsByDate).forEach(([date, dateLogs]) => {
        dateLogs.sort((a, b) => a.time.localeCompare(b.time));
        
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Title
        doc.fontSize(11).font('Helvetica-Bold').text(`Panel Log Sheet - ${formattedDate}`, { align: 'center' });
        doc.moveDown(0.5);

        let yPos = doc.y;
        const startX = 30;

        // HT Panel
        const htLogs = dateLogs.filter(log => log.htPanel);
        if (htLogs.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').text('HT PANEL', startX, yPos);
          yPos += 15;

          // Draw HT Table - optimized for landscape A4
          const cellH = 10;
          const timeW = 28;
          const icW = 22;
          const smallW = 18;
          const trW = 22; // Smaller width for transformer boxes to fit on page
          let x = startX;

          doc.fontSize(5).font('Helvetica-Bold');

          // Headers - Row 1: Main sections (all with increased height)
          doc.rect(x, yPos, timeW, cellH * 3.35).stroke();
          doc.text('Time\n(Hrs)', x + 1, yPos + cellH + 3, { width: timeW - 2, align: 'center', fontSize: 5 });
          x += timeW;

          doc.rect(x, yPos, icW, cellH * 3.35).stroke();
          doc.text('I/C\nFrom\nTNEB', x + 1, yPos + cellH + 3, { width: icW - 2, align: 'center', fontSize: 5 });
          x += icW;

          // Main Incomer Supply (matching height)
          doc.rect(x, yPos, smallW * 6, cellH * 1.35).stroke();
          doc.text('Main Incomer Supply', x + 1, yPos + 3, { width: smallW * 6 - 2, align: 'center', fontSize: 5 });
          
          doc.rect(x, yPos + cellH * 1.35, smallW, cellH * 2).stroke();
          doc.text('Volt\n(kv)', x + 1, yPos + cellH * 1.35 + 4, { width: smallW - 2, align: 'center', fontSize: 5 });
          
          doc.rect(x + smallW, yPos + cellH * 1.35, smallW * 5, cellH).stroke();
          doc.text('Current Amp', x + smallW + 1, yPos + cellH * 1.35 + 2, { width: smallW * 5 - 2, align: 'center', fontSize: 5 });
          
          ['R', 'Y', 'B', 'PF', 'Hz'].forEach((lbl, i) => {
            doc.rect(x + smallW * (i + 1), yPos + cellH * 2.35, smallW, cellH).stroke();
            doc.text(lbl, x + smallW * (i + 1) + 1, yPos + cellH * 2.35 + 2, { width: smallW - 2, align: 'center', fontSize: 5 });
          });
          x += smallW * 6;

          // Transformers - separated Current Amp and Winding Temp
          ['Tr-1', 'Tr-2', 'Tr-3'].forEach(tr => {
            // Transformer heading (matching height)
            doc.rect(x, yPos, trW * 6, cellH * 1.35).stroke();
            doc.text(`Out Going to ${tr}\n(2000 Kva)`, x + 1, yPos + 2, { width: trW * 6 - 2, align: 'center', fontSize: 4 });
            
            // Current Amp heading
            doc.rect(x, yPos + cellH * 1.35, trW * 3, cellH).stroke();
            doc.text('Current Amp', x + 1, yPos + cellH * 1.35 + 2, { width: trW * 3 - 2, align: 'center', fontSize: 5 });
            
            // Winding Temp heading
            doc.rect(x + trW * 3, yPos + cellH * 1.35, trW * 3, cellH).stroke();
            doc.text('Winding Temp.', x + trW * 3 + 1, yPos + cellH * 1.35 + 2, { width: trW * 3 - 2, align: 'center', fontSize: 4 });
            
            // R, Y, B columns for Current Amp
            ['R', 'Y', 'B'].forEach((lbl, i) => {
              doc.rect(x + trW * i, yPos + cellH * 2.35, trW, cellH).stroke();
              doc.text(lbl, x + trW * i + 1, yPos + cellH * 2.35 + 2, { width: trW - 2, align: 'center', fontSize: 5 });
            });
            
            // R, Y, B columns for Winding Temp
            ['R', 'Y', 'B'].forEach((lbl, i) => {
              doc.rect(x + trW * 3 + trW * i, yPos + cellH * 2.35, trW, cellH).stroke();
              doc.text(lbl, x + trW * 3 + trW * i + 1, yPos + cellH * 2.35 + 2, { width: trW - 2, align: 'center', fontSize: 5 });
            });
            
            x += trW * 6;
          });

          yPos += cellH * 3.35;

          // Data rows
          doc.fontSize(4).font('Helvetica');
          htLogs.forEach(log => {
            x = startX;
            
            doc.rect(x, yPos, timeW, cellH).stroke();
            doc.text(log.time, x + 1, yPos + 2, { width: timeW - 2, align: 'center', fontSize: 4 });
            x += timeW;

            doc.rect(x, yPos, icW, cellH).stroke();
            doc.text(log.htPanel.icFromTneb || 'EB', x + 1, yPos + 2, { width: icW - 2, align: 'center', fontSize: 4 });
            x += icW;

            doc.rect(x, yPos, smallW, cellH).stroke();
            doc.text(String(log.htPanel.voltageFromWreb?.volt || '-').substring(0, 5), x + 1, yPos + 2, { width: smallW - 2, align: 'center', fontSize: 4 });
            x += smallW;

            [log.htPanel.currentAmp?.r, log.htPanel.currentAmp?.y, log.htPanel.currentAmp?.b, log.htPanel.currentAmp?.pf, log.htPanel.currentAmp?.hz].forEach(val => {
              doc.rect(x, yPos, smallW, cellH).stroke();
              doc.text(String(val || '-').substring(0, 4), x + 1, yPos + 2, { width: smallW - 2, align: 'center', fontSize: 4 });
              x += smallW;
            });

            // Current Amp and Winding Temp for all transformers
            let trIdx = 0;
            [log.htPanel.outgoingTr1, log.htPanel.outgoingTr2, log.htPanel.outgoingTr3].forEach(tr => {
              // Current Amp columns (R, Y, B)
              ['r', 'y', 'b'].forEach(ph => {
                doc.rect(x, yPos, trW, cellH).stroke();
                doc.text(String(tr?.currentAmp?.[ph] || '-').substring(0, 4), x + 1, yPos + 2, { width: trW - 2, align: 'center', fontSize: 4 });
                x += trW;
              });
              // Winding Temp columns (R, Y, B)
              ['r', 'y', 'b'].forEach(ph => {
                doc.rect(x, yPos, trW, cellH).stroke();
                doc.text(String(tr?.windingTemp?.[ph] || '-').substring(0, 4), x + 1, yPos + 2, { width: trW - 2, align: 'center', fontSize: 4 });
                x += trW;
              });
              trIdx++;
            });

            yPos += cellH;
          });

          yPos += 10;
        }

        // LT Panel (similar structure, compressed to fit)
        const ltLogs = dateLogs.filter(log => log.ltPanel);
        if (ltLogs.length > 0 && yPos < 500) {
          doc.fontSize(10).font('Helvetica-Bold').text('LT PANEL', startX, yPos);
          yPos += 15;

          const cellH = 11;
          const timeW = 30;
          const tinyW = 23;
          let x = startX;

          doc.fontSize(6).font('Helvetica-Bold');

          doc.rect(x, yPos, timeW, cellH * 3).stroke();
          doc.text('Time\n(Hrs)', x + 2, yPos + cellH, { width: timeW - 4, align: 'center' });
          x += timeW;

          ['Inc-1', 'Inc-2', 'Inc-3'].forEach(inc => {
            const incW = tinyW * 8;
            doc.rect(x, yPos, incW, cellH).stroke();
            doc.text(`Incomer-${inc.slice(-1)} (From Tr-${inc.slice(-1)})`, x + 1, yPos + 3, { width: incW - 2, align: 'center' });
            
            doc.rect(x, yPos + cellH, tinyW * 3, cellH).stroke();
            doc.text('Voltage', x + 1, yPos + cellH + 3, { width: tinyW * 3 - 2, align: 'center' });
            ['RY', 'YB', 'BR'].forEach((lbl, i) => {
              doc.rect(x + tinyW * i, yPos + cellH * 2, tinyW, cellH).stroke();
              doc.text(lbl, x + tinyW * i + 1, yPos + cellH * 2 + 3, { width: tinyW - 2, align: 'center' });
            });
            
            doc.rect(x + tinyW * 3, yPos + cellH, tinyW * 3, cellH).stroke();
            doc.text('Current Amp', x + tinyW * 3 + 1, yPos + cellH + 3, { width: tinyW * 3 - 2, align: 'center' });
            ['R', 'Y', 'B'].forEach((lbl, i) => {
              doc.rect(x + tinyW * (3 + i), yPos + cellH * 2, tinyW, cellH).stroke();
              doc.text(lbl, x + tinyW * (3 + i) + 1, yPos + cellH * 2 + 3, { width: tinyW - 2, align: 'center' });
            });
            
            ['TAP\nNo.', 'KWH'].forEach((lbl, i) => {
              doc.rect(x + tinyW * (6 + i), yPos + cellH, tinyW, cellH * 2).stroke();
              doc.text(lbl, x + tinyW * (6 + i) + 1, yPos + cellH + 4, { width: tinyW - 2, align: 'center' });
            });
            
            x += incW;
          });

          yPos += cellH * 3;

          doc.fontSize(5).font('Helvetica');
          ltLogs.forEach(log => {
            x = startX;
            
            doc.rect(x, yPos, timeW, cellH).stroke();
            doc.text(log.time, x + 2, yPos + 3, { width: timeW - 4, align: 'center' });
            x += timeW;

            [log.ltPanel.incomer1, log.ltPanel.incomer2, log.ltPanel.incomer3].forEach(inc => {
              ['ry', 'yb', 'br'].forEach(ph => {
                doc.rect(x, yPos, tinyW, cellH).stroke();
                doc.text(String(inc?.voltage?.[ph] || '-').substring(0, 4), x + 1, yPos + 3, { width: tinyW - 2, align: 'center' });
                x += tinyW;
              });
              
              ['r', 'y', 'b'].forEach(ph => {
                doc.rect(x, yPos, tinyW, cellH).stroke();
                doc.text(String(inc?.currentAmp?.[ph] || '-').substring(0, 4), x + 1, yPos + 3, { width: tinyW - 2, align: 'center' });
                x += tinyW;
              });
              
              doc.rect(x, yPos, tinyW, cellH).stroke();
              doc.text(String(inc?.tap || '-').substring(0, 3), x + 1, yPos + 3, { width: tinyW - 2, align: 'center' });
              x += tinyW;
              
              doc.rect(x, yPos, tinyW, cellH).stroke();
              doc.text(String(inc?.kwh || '-').substring(0, 5), x + 1, yPos + 3, { width: tinyW - 2, align: 'center' });
              x += tinyW;
            });

            yPos += cellH;
          });

          yPos += 10;
        }

        // Power Failure Section
        const powerFailures = dateLogs.find(log => log.powerFailure);
        if (powerFailures && powerFailures.powerFailure && powerFailures.powerFailure.length > 0) {
          if (yPos > 650) doc.addPage();
          
          doc.fontSize(10).font('Helvetica-Bold').text('POWER FAILURE LOG', startX, yPos);
          yPos += 15;

          const cellH = 12;
          const fromW = 80;
          const toW = 80;
          const reasonW = 200;
          let x = startX;

          doc.fontSize(7).font('Helvetica-Bold');

          // Headers
          doc.rect(x, yPos, fromW, cellH).stroke();
          doc.text('From Time', x + 2, yPos + 3, { width: fromW - 4, align: 'center' });
          x += fromW;

          doc.rect(x, yPos, toW, cellH).stroke();
          doc.text('To Time', x + 2, yPos + 3, { width: toW - 4, align: 'center' });
          x += toW;

          doc.rect(x, yPos, reasonW, cellH).stroke();
          doc.text('Reason', x + 2, yPos + 3, { width: reasonW - 4, align: 'center' });

          yPos += cellH;

          // Power Failure Data
          doc.fontSize(6).font('Helvetica');
          powerFailures.powerFailure.forEach(failure => {
            x = startX;

            doc.rect(x, yPos, fromW, cellH).stroke();
            doc.text(failure.fromHrs || '-', x + 2, yPos + 3, { width: fromW - 4, align: 'center' });
            x += fromW;

            doc.rect(x, yPos, toW, cellH).stroke();
            doc.text(failure.toHrs || '-', x + 2, yPos + 3, { width: toW - 4, align: 'center' });
            x += toW;

            doc.rect(x, yPos, reasonW, cellH).stroke();
            const reason = failure.reason || '-';
            doc.text(reason.substring(0, 50), x + 2, yPos + 3, { width: reasonW - 4, align: 'left' });

            yPos += cellH;
          });
        }
      });

      doc.end();
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
