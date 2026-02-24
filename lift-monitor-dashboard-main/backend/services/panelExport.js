import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { getPanelLogs } from '../panelLogContext.js';

// Helper function to safely extract temperature value
const getSafeTemp = (temp) => {
  if (!temp) return '-';
  if (typeof temp === 'string') return temp;
  if (typeof temp === 'object' && temp.r !== undefined) return temp.r || '-';
  return String(temp);
};

export const getBuildingConfig = (buildingName) => {
  const config = {
    hasTr3: true,
    hasInc3: true,
    hasHtOilTemp: true,
    hasHtTap: false,
    hasLtTap: true,
  };

  switch (buildingName) {
    case "PRESTIGE POLYGON":
      break;
    case "PRESTIGE PALLADIUM":
    case "PRESTIGE COSMOPOLITAN":
      config.hasTr3 = false;
      config.hasInc3 = false;
      break;
    case "PRESTIGE METROPOLITAN":
      config.hasTr3 = false;
      config.hasInc3 = false;
      config.hasHtTap = true;
      config.hasLtTap = false;
      break;
    case "PRESTIGE CYBER TOWERS":
      config.hasTr3 = false;
      config.hasInc3 = false;
      config.hasHtOilTemp = false;
      config.hasHtTap = true;
      config.hasLtTap = false;
      break;
    default:
      break;
  }
  return config;
};

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

      const firstLog = dateLogs[0];
      const config = getBuildingConfig(firstLog?.building || "PRESTIGE POLYGON");

      const htLogs = dateLogs.filter(log => log.htPanel);
      if (htLogs.length > 0) {
        sheetData.push(['HT PANEL']);

        const trCols = 3 + 1 + (config.hasHtOilTemp ? 1 : 0) + (config.hasHtTap ? 1 : 0);
        const totalTrs = config.hasTr3 ? 3 : 2;
        const totalHtCols = 8 + (totalTrs * trCols);

        merges.push({ s: { r: row, c: 0 }, e: { r: row, c: totalHtCols - 1 } });
        row++;

        const row1 = ['Time (Hrs)', 'I/C From TNEB', 'Main Incomer Supply', '', '', '', '', ''];
        [1, 2, 3].forEach(i => {
          if (i < 3 || config.hasTr3) {
            row1.push(`Out Going to Tr-${i} (2000 Kva)`);
            for (let j = 1; j < trCols; j++) row1.push(''); // fill empty spaces for merge
          }
        });
        sheetData.push(row1);

        merges.push({ s: { r: row, c: 0 }, e: { r: row + 2, c: 0 } }); // Time
        merges.push({ s: { r: row, c: 1 }, e: { r: row + 2, c: 1 } }); // I/C
        merges.push({ s: { r: row, c: 2 }, e: { r: row, c: 7 } }); // Main Incomer

        // Merges for Tr-1, 2, 3
        let currentCol = 8;
        [1, 2, 3].forEach(i => {
          if (i < 3 || config.hasTr3) {
            merges.push({ s: { r: row, c: currentCol }, e: { r: row, c: currentCol + trCols - 1 } });
            currentCol += trCols;
          }
        });
        row++;

        const row2 = ['', '', 'Volt (kv)', 'Current Amp', '', '', '', ''];
        currentCol = 8;
        merges.push({ s: { r: row, c: 2 }, e: { r: row + 1, c: 2 } }); // Volt
        merges.push({ s: { r: row, c: 3 }, e: { r: row, c: 7 } }); // Current Amp

        [1, 2, 3].forEach(i => {
          if (i < 3 || config.hasTr3) {
            row2.push('Current Amp');
            row2.push('');
            row2.push('');

            // temp
            row2.push('TEMP');
            if (config.hasHtOilTemp) row2.push('');

            // tap
            if (config.hasHtTap) {
              row2.push('TAP NO.');
            }

            merges.push({ s: { r: row, c: currentCol }, e: { r: row, c: currentCol + 2 } }); // Current Amp

            const tempCols = 1 + (config.hasHtOilTemp ? 1 : 0);
            if (tempCols > 1) {
              merges.push({ s: { r: row, c: currentCol + 3 }, e: { r: row, c: currentCol + 3 + tempCols - 1 } });
            }
            if (config.hasHtTap) {
              merges.push({ s: { r: row, c: currentCol + 3 + tempCols }, e: { r: row + 1, c: currentCol + 3 + tempCols } }); // tap rowSpan 2
            }

            currentCol += trCols;
          }
        });
        sheetData.push(row2);
        row++;

        const row3 = ['', '', '', 'R', 'Y', 'B', 'PF', 'Hz'];
        [1, 2, 3].forEach(i => {
          if (i < 3 || config.hasTr3) {
            row3.push('R', 'Y', 'B', 'Wind');
            if (config.hasHtOilTemp) row3.push('Oil');
            if (config.hasHtTap) row3.push(''); // placeholder under merged TAP NO.
          }
        });
        sheetData.push(row3);
        row++;

        htLogs.forEach(log => {
          const dataRow = [
            log.time,
            log.htPanel.icFromTneb || 'EB',
            log.htPanel.voltageFromWreb?.volt || '-',
            log.htPanel.currentAmp?.r || '-',
            log.htPanel.currentAmp?.y || '-',
            log.htPanel.currentAmp?.b || '-',
            log.htPanel.currentAmp?.pf || '-',
            log.htPanel.currentAmp?.hz || '-'
          ];

          [1, 2, 3].forEach(i => {
            if (i < 3 || config.hasTr3) {
              const tr = log.htPanel[`outgoingTr${i}`];
              dataRow.push(tr?.currentAmp?.r || '-');
              dataRow.push(tr?.currentAmp?.y || '-');
              dataRow.push(tr?.currentAmp?.b || '-');
              dataRow.push(getSafeTemp(tr?.windingTemp));
              if (config.hasHtOilTemp) dataRow.push(getSafeTemp(tr?.oilTemp));
              if (config.hasHtTap) dataRow.push(tr?.tap || '-');
            }
          });
          sheetData.push(dataRow);
          row++;
        });

        sheetData.push([]);
        row++;
      }

      const ltLogs = dateLogs.filter(log => log.ltPanel);
      if (ltLogs.length > 0) {
        sheetData.push(['LT PANEL']);

        const incCols = 6 + 1 + (config.hasLtTap ? 1 : 0);
        const totalIncs = config.hasInc3 ? 3 : 2;
        const totalLtCols = 1 + (totalIncs * incCols);

        merges.push({ s: { r: row, c: 0 }, e: { r: row, c: totalLtCols - 1 } });
        row++;

        const row1 = ['Time (Hrs)'];
        [1, 2, 3].forEach(i => {
          if (i < 3 || config.hasInc3) {
            row1.push(`Incomer-${i} (From Tr-${i})`);
            for (let j = 1; j < incCols; j++) row1.push('');
          }
        });
        sheetData.push(row1);

        merges.push({ s: { r: row, c: 0 }, e: { r: row + 2, c: 0 } }); // Time

        let currentCol = 1;
        [1, 2, 3].forEach(i => {
          if (i < 3 || config.hasInc3) {
            merges.push({ s: { r: row, c: currentCol }, e: { r: row, c: currentCol + incCols - 1 } });
            currentCol += incCols;
          }
        });
        row++;

        const row2 = [''];
        currentCol = 1;

        [1, 2, 3].forEach(i => {
          if (i < 3 || config.hasInc3) {
            row2.push('Voltage');
            row2.push('');
            row2.push('');

            row2.push('Current Amp');
            row2.push('');
            row2.push('');

            if (config.hasLtTap) {
              row2.push('TAP No.');
            }
            row2.push('KWH');

            merges.push({ s: { r: row, c: currentCol }, e: { r: row, c: currentCol + 2 } }); // Voltage
            merges.push({ s: { r: row, c: currentCol + 3 }, e: { r: row, c: currentCol + 5 } }); // Current Amp

            if (config.hasLtTap) {
              merges.push({ s: { r: row, c: currentCol + 6 }, e: { r: row + 1, c: currentCol + 6 } }); // Tap
              merges.push({ s: { r: row, c: currentCol + 7 }, e: { r: row + 1, c: currentCol + 7 } }); // KWH
            } else {
              merges.push({ s: { r: row, c: currentCol + 6 }, e: { r: row + 1, c: currentCol + 6 } }); // KWH
            }

            currentCol += incCols;
          }
        });
        sheetData.push(row2);
        row++;

        const row3 = [''];
        [1, 2, 3].forEach(i => {
          if (i < 3 || config.hasInc3) {
            row3.push('RY', 'YB', 'BR', 'R', 'Y', 'B');
            if (config.hasLtTap) row3.push(''); // Tap
            row3.push(''); // KWH
          }
        });
        sheetData.push(row3);
        row++;

        ltLogs.forEach(log => {
          const dataRow = [log.time];

          [1, 2, 3].forEach(i => {
            if (i < 3 || config.hasInc3) {
              const inc = log.ltPanel[`incomer${i}`];
              dataRow.push(inc?.voltage?.ry || '-');
              dataRow.push(inc?.voltage?.yb || '-');
              dataRow.push(inc?.voltage?.br || '-');
              dataRow.push(inc?.currentAmp?.r || '-');
              dataRow.push(inc?.currentAmp?.y || '-');
              dataRow.push(inc?.currentAmp?.b || '-');
              if (config.hasLtTap) dataRow.push(inc?.tap || '-');
              dataRow.push(inc?.kwh || '-');
            }
          });
          sheetData.push(dataRow);
          row++;
        });
      }

      // Add Shift Incharge, Remarks, and Power Failures section
      sheetData.push([]);
      row++;

      // Get first log to extract shift incharge and remarks
      // Shift Incharge
      sheetData.push(['SHIFT INCHARGE']);
      row++;
      sheetData.push(['Name:', firstLog?.shiftIncharge || '-']);
      row++;

      sheetData.push([]);
      row++;

      // Remarks
      sheetData.push(['REMARKS']);
      row++;
      sheetData.push([firstLog?.remarks || '-']);
      row++;

      sheetData.push([]);
      row++;

      // Power Failures
      sheetData.push(['POWER FAILURE LOG']);
      row++;
      sheetData.push(['From Time', 'To Time', 'Reason']);
      row++;

      const powerFailures = firstLog?.powerFailure || [];
      if (powerFailures.length > 0) {
        powerFailures.forEach(pf => {
          sheetData.push([
            pf.fromHrs || '-',
            pf.toHrs || '-',
            pf.reason || '-'
          ]);
          row++;
        });
      } else {
        sheetData.push(['No power failures recorded']);
        row++;
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws['!merges'] = merges;

      // Set column widths
      const colWidths = Array(Math.max(sheetData[0]?.length || 20, 30)).fill({ wch: 8 });
      colWidths[0] = { wch: 10 }; // Time
      colWidths[1] = { wch: 10 }; // I/C

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

    // If no logs but a specific date is requested (e.g. for daily emails), continue to generate an empty template
    if (logs.length === 0 && !filters.date) {
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

      // For automated daily emails with zero logs, ensure the date exists as an empty array to render headers
      if (Object.keys(logsByDate).length === 0 && filters.date) {
        logsByDate[filters.date] = [];
      }

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

        // Get building config from the first log (or from filters if no logs)
        const firstLog = dateLogs[0];
        const config = getBuildingConfig(firstLog?.building || filters?.building || 'PRESTIGE POLYGON');

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
          const totalTrs = config.hasTr3 ? 3 : 2;
          const trColCount = 3 + (config.hasHtOilTemp ? 2 : 1) + (config.hasHtTap ? 1 : 0);
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

          // Transformers - building-specific (1-2 or 1-3)
          for (let ti = 1; ti <= totalTrs; ti++) {
            const trTotalW = trW * trColCount;
            // Transformer heading
            doc.rect(x, yPos, trTotalW, cellH * 1.35).stroke();
            doc.text(`Out Going to Tr-${ti}\n(2000 Kva)`, x + 1, yPos + 2, { width: trTotalW - 2, align: 'center', fontSize: 4 });

            // Current Amp heading
            doc.rect(x, yPos + cellH * 1.35, trW * 3, cellH).stroke();
            doc.text('Current Amp', x + 1, yPos + cellH * 1.35 + 2, { width: trW * 3 - 2, align: 'center', fontSize: 5 });

            // Temperatures heading
            const tempCols = config.hasHtOilTemp ? 2 : 1;
            doc.rect(x + trW * 3, yPos + cellH * 1.35, trW * tempCols, cellH).stroke();
            doc.text(config.hasHtOilTemp ? 'Temp (\u00b0C)' : 'Wind', x + trW * 3 + 1, yPos + cellH * 1.35 + 2, { width: trW * tempCols - 2, align: 'center', fontSize: 4 });

            if (config.hasHtTap) {
              doc.rect(x + trW * (3 + tempCols), yPos + cellH * 1.35, trW, cellH * 2).stroke();
              doc.text('TAP\nNo.', x + trW * (3 + tempCols) + 1, yPos + cellH * 1.35 + 2, { width: trW - 2, align: 'center', fontSize: 4 });
            }

            // R, Y, B columns for Current Amp
            ['R', 'Y', 'B'].forEach((lbl, i) => {
              doc.rect(x + trW * i, yPos + cellH * 2.35, trW, cellH).stroke();
              doc.text(lbl, x + trW * i + 1, yPos + cellH * 2.35 + 2, { width: trW - 2, align: 'center', fontSize: 5 });
            });
            doc.rect(x + trW * 3, yPos + cellH * 2.35, trW, cellH).stroke();
            doc.text('Wind', x + trW * 3 + 1, yPos + cellH * 2.35 + 2, { width: trW - 2, align: 'center', fontSize: 5 });
            if (config.hasHtOilTemp) {
              doc.rect(x + trW * 4, yPos + cellH * 2.35, trW, cellH).stroke();
              doc.text('Oil', x + trW * 4 + 1, yPos + cellH * 2.35 + 2, { width: trW - 2, align: 'center', fontSize: 5 });
            }

            x += trTotalW;
          }

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

            // Transformer data - building-specific number and columns
            for (let ti = 1; ti <= totalTrs; ti++) {
              const tr = log.htPanel[`outgoingTr${ti}`];
              ['r', 'y', 'b'].forEach(ph => {
                doc.rect(x, yPos, trW, cellH).stroke();
                doc.text(String(tr?.currentAmp?.[ph] || '-').substring(0, 4), x + 1, yPos + 2, { width: trW - 2, align: 'center', fontSize: 4 });
                x += trW;
              });
              doc.rect(x, yPos, trW, cellH).stroke();
              doc.text(String(getSafeTemp(tr?.windingTemp)).substring(0, 4), x + 1, yPos + 2, { width: trW - 2, align: 'center', fontSize: 4 });
              x += trW;
              if (config.hasHtOilTemp) {
                doc.rect(x, yPos, trW, cellH).stroke();
                doc.text(String(getSafeTemp(tr?.oilTemp)).substring(0, 4), x + 1, yPos + 2, { width: trW - 2, align: 'center', fontSize: 4 });
                x += trW;
              }
              if (config.hasHtTap) {
                doc.rect(x, yPos, trW, cellH).stroke();
                doc.text(String(tr?.tap || '-').substring(0, 4), x + 1, yPos + 2, { width: trW - 2, align: 'center', fontSize: 4 });
                x += trW;
              }
            }

            yPos += cellH;
          });

          yPos += 10;
        }

        // LT Panel (similar structure, compressed to fit)
        const ltLogs = dateLogs.filter(log => log.ltPanel);
        if (ltLogs.length > 0 && yPos < 500) {
          doc.fontSize(10).font('Helvetica-Bold').text('LT PANEL', startX, yPos);
          yPos += 15;

          const totalIncs = config.hasInc3 ? 3 : 2;
          const incColCount = 6 + (config.hasLtTap ? 1 : 0) + 1; // Voltage(3)+CurrentAmp(3)+optional TAP+KWH
          const incW = tinyW * incColCount;
          let x = startX;

          doc.fontSize(6).font('Helvetica-Bold');

          doc.rect(x, yPos, timeW, cellH * 3).stroke();
          doc.text('Time\n(Hrs)', x + 2, yPos + cellH, { width: timeW - 4, align: 'center' });
          x += timeW;

          for (let ii = 1; ii <= totalIncs; ii++) {
            doc.rect(x, yPos, incW, cellH).stroke();
            doc.text(`Incomer-${ii} (From Tr-${ii})`, x + 1, yPos + 3, { width: incW - 2, align: 'center' });

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

            let tapOffset = 6;
            if (config.hasLtTap) {
              doc.rect(x + tinyW * tapOffset, yPos + cellH, tinyW, cellH * 2).stroke();
              doc.text('TAP\nNo.', x + tinyW * tapOffset + 1, yPos + cellH + 4, { width: tinyW - 2, align: 'center' });
              tapOffset++;
            }
            doc.rect(x + tinyW * tapOffset, yPos + cellH, tinyW, cellH * 2).stroke();
            doc.text('KWH', x + tinyW * tapOffset + 1, yPos + cellH + 5, { width: tinyW - 2, align: 'center' });

            x += incW;
          }

          yPos += cellH * 3;

          doc.fontSize(5).font('Helvetica');
          ltLogs.forEach(log => {
            x = startX;

            doc.rect(x, yPos, timeW, cellH).stroke();
            doc.text(log.time, x + 2, yPos + 3, { width: timeW - 4, align: 'center' });
            x += timeW;

            for (let ii = 1; ii <= totalIncs; ii++) {
              const inc = log.ltPanel[`incomer${ii}`];
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
              if (config.hasLtTap) {
                doc.rect(x, yPos, tinyW, cellH).stroke();
                doc.text(String(inc?.tap || '-').substring(0, 3), x + 1, yPos + 3, { width: tinyW - 2, align: 'center' });
                x += tinyW;
              }
              doc.rect(x, yPos, tinyW, cellH).stroke();
              doc.text(String(inc?.kwh || '-').substring(0, 5), x + 1, yPos + 3, { width: tinyW - 2, align: 'center' });
              x += tinyW;
            }

            yPos += cellH;
          });


          yPos += 10;
        }

        // Shift Incharge, Remarks, and Power Failure Section
        if (yPos > 650) doc.addPage();

        // Get first log to extract shift incharge and remarks (firstLog already declared above)

        // Shift Incharge Section
        doc.fontSize(10).font('Helvetica-Bold').text('SHIFT INCHARGE', startX, yPos);
        yPos += 12;

        doc.fontSize(9).font('Helvetica');
        doc.text(firstLog?.shiftIncharge || '-', startX + 10, yPos);
        yPos += 15;

        // Remarks Section
        doc.fontSize(10).font('Helvetica-Bold').text('REMARKS', startX, yPos);
        yPos += 12;

        doc.fontSize(9).font('Helvetica');
        const remarks = firstLog?.remarks || '-';
        doc.text(remarks.substring(0, 100), startX + 10, yPos, { width: 500 });
        yPos += 20;

        // Power Failure Section
        const powerFailures = firstLog?.powerFailure || [];
        doc.fontSize(10).font('Helvetica-Bold').text('POWER FAILURE LOG', startX, yPos);
        yPos += 15;

        if (powerFailures.length > 0) {
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
          powerFailures.forEach(failure => {
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
        } else {
          doc.fontSize(9).font('Helvetica');
          doc.text('No power failures recorded', startX + 10, yPos);
          // Add empty slots rendering if building is fully empty? Not strictly required since headers show it's blank.

          // Add Verified By Signature at the bottom of the page
          doc.moveDown(4);
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Verified By:', 30, doc.y, { align: 'left' });
          doc.text('_______________________', 100, doc.y - 10, { align: 'left' });

        }
      });

      doc.end();
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
