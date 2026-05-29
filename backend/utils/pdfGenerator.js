import fs from 'fs';
import path from 'path';

/**
 * Wraps text into lines based on a maximum character width.
 * Safe for special characters (replaces non-ASCII characters with standard ASCII equivalents).
 */
const wrapText = (text, maxChars = 85) => {
      if (!text) return [];
      
      // Clean up string to avoid encoding issues in standard PDF Helvetica fonts (WinAnsiEncoding)
      const cleanText = text
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2212]/g, '-')
            .replace(/[^\x00-\x7F]/g, '?'); // replace any non-ascii character
      
      const paragraphs = cleanText.split('\n');
      const lines = [];

      for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
                  lines.push('');
                  continue;
            }

            const words = paragraph.split(' ');
            let currentLine = '';

            for (const word of words) {
                  if ((currentLine + ' ' + word).trim().length <= maxChars) {
                        currentLine = currentLine === '' ? word : currentLine + ' ' + word;
                  } else {
                        lines.push(currentLine);
                        currentLine = word;
                  }
            }
            if (currentLine !== '') {
                  lines.push(currentLine);
            }
      }

      return lines;
};

/**
 * Escapes special characters for PDF text streams.
 */
const escapePdfText = (text) => {
      if (!text) return '';
      return text
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
};

/**
 * Builds a valid PDF binary buffer from a page stream.
 */
const buildPdfBuffer = (streamData) => {
      const chunks = [];
      let offset = 0;

      const write = (str) => {
            const buf = Buffer.from(str, 'latin1');
            chunks.push(buf);
            offset += buf.length;
      };

      const objOffsets = {};

      write('%PDF-1.4\n');

      const startObj = (id) => {
            objOffsets[id] = offset;
            write(`${id} 0 obj\n`);
      };

      const endObj = () => {
            write('endobj\n');
      };

      // Obj 1: Catalog
      startObj(1);
      write('<< /Type /Catalog /Pages 2 0 R >>\n');
      endObj();

      // Obj 2: Pages Tree
      startObj(2);
      write('<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\n');
      endObj();

      // Obj 3: Page Definition (A4: 595.28 x 841.89 points)
      startObj(3);
      write('<< /Type /Page /Parent 2 0 R /Resources 4 0 R /Contents 5 0 R /MediaBox [ 0 0 595.28 841.89 ] >>\n');
      endObj();

      // Obj 4: Resources (Font configuration)
      startObj(4);
      write('<< /Font << /F1 6 0 R /F2 7 0 R >> >>\n');
      endObj();

      // Obj 5: Stream Content
      const streamBuf = Buffer.from(streamData, 'latin1');
      startObj(5);
      write(`<< /Length ${streamBuf.length} >>\n`);
      write('stream\n');
      chunks.push(streamBuf);
      offset += streamBuf.length;
      write('\nendstream\n');
      endObj();

      // Obj 6: Font Regular (Helvetica)
      startObj(6);
      write('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\n');
      endObj();

      // Obj 7: Font Bold (Helvetica-Bold)
      startObj(7);
      write('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\n');
      endObj();

      // Xref Table
      const xrefOffset = offset;
      write('xref\n');
      write('0 8\n');
      write('0000000000 65535 f \n');
      for (let i = 1; i <= 7; i++) {
            const offStr = String(objOffsets[i]).padStart(10, '0');
            write(`${offStr} 00000 n \n`);
      }

      write('trailer\n');
      write('<< /Size 8 /Root 1 0 R >>\n');
      write('startxref\n');
      write(`${xrefOffset}\n`);
      write('%%EOF\n');

      return Buffer.concat(chunks);
};

/**
 * Main function to generate a stylized complaint resolution report PDF.
 */
export const generateResolutionPdf = async (complaint, citizen, officer, resolvedAtDate) => {
      const citizenName = citizen?.name || 'Citizen';
      const officerName = officer?.name || 'Assigned Officer';
      const category = complaint.category || 'General';
      const departmentName = complaint.department?.name || 'Public Grievance Department';
      const dateStr = resolvedAtDate ? new Date(resolvedAtDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
      }) : new Date().toLocaleDateString('en-IN');

      let stream = '';

      // --- Draw Top Header Accent ---
      // Navy Blue Header bar (RGB: 0.08, 0.18, 0.36)
      stream += '0.08 0.18 0.36 rg\n';
      stream += '50 780 495 30 re f\n';

      // Header Text
      stream += 'BT\n';
      stream += '/F2 11 Tf\n'; // Helvetica-Bold 11pt
      stream += '1 1 1 rg\n'; // White text
      stream += '70 790 Td\n';
      stream += `(${escapePdfText('GOVERNMENT GRIEIVANCE RESOLUTION REPORT - e-SAMADHAN AI')}) Tj\n`;
      stream += 'ET\n';

      // --- Portal branding on top right ---
      stream += 'BT\n';
      stream += '/F2 16 Tf\n'; // Helvetica-Bold 16pt
      stream += '0.08 0.18 0.36 rg\n'; // Navy Blue
      stream += '50 740 Td\n';
      stream += `(${escapePdfText('e-Samadhan AI')}) Tj\n`;
      stream += 'ET\n';

      stream += 'BT\n';
      stream += '/F1 8 Tf\n'; // Helvetica 8pt
      stream += '0.4 0.4 0.4 rg\n'; // Dark Gray
      stream += '50 728 Td\n';
      stream += `(${escapePdfText('Empowering Citizens, Ensuring Transparency')}) Tj\n`;
      stream += 'ET\n';

      // --- Metadata Grid ---
      // Draw grid outline box
      stream += '0.8 0.8 0.8 RG\n'; // Light Gray stroke
      stream += '0.5 w\n'; // Thin line
      stream += '50 600 495 110 re S\n';

      // Divider line in grid
      stream += '50 655 m 545 655 l S\n';
      stream += '297.5 600 m 297.5 710 l S\n';

      const gridData = [
            { label: 'COMPLAINT ID', val: complaint.complaintId || 'N/A', x: 60, y: 695, isBold: true },
            { label: 'CITIZEN NAME', val: citizenName, x: 307.5, y: 695 },
            { label: 'DEPARTMENT', val: departmentName, x: 60, y: 677 },
            { label: 'CATEGORY', val: category.toUpperCase(), x: 307.5, y: 677 },
            { label: 'RESOLVED BY', val: officerName, x: 60, y: 640 },
            { label: 'RESOLUTION DATE', val: dateStr, x: 307.5, y: 640 },
            { label: 'COMPLAINT TITLE', val: complaint.title || 'N/A', x: 60, y: 622 }
      ];

      for (const item of gridData) {
            // Label
            stream += 'BT\n';
            stream += '/F2 7 Tf\n'; // Helvetica-Bold 7pt
            stream += '0.4 0.4 0.4 rg\n';
            stream += `${item.x} ${item.y + 7} Td\n`;
            stream += `(${escapePdfText(item.label)}) Tj\n`;
            stream += 'ET\n';

            // Value
            stream += 'BT\n';
            stream += item.isBold ? '/F2 9 Tf\n' : '/F1 9 Tf\n';
            stream += '0.1 0.1 0.1 rg\n';
            stream += `${item.x} ${item.y} Td\n`;
            stream += `(${escapePdfText(item.val)}) Tj\n`;
            stream += 'ET\n';
      }

      // --- Original Complaint Brief ---
      stream += 'BT\n';
      stream += '/F2 11 Tf\n';
      stream += '0.08 0.18 0.36 rg\n';
      stream += '50 575 Td\n';
      stream += `(${escapePdfText('Original Complaint Description:')}) Tj\n`;
      stream += 'ET\n';

      // Wrap and render the original complaint text (max 3 lines to fit page)
      const descLines = wrapText(complaint.description, 95).slice(0, 3);
      let descY = 560;
      for (const line of descLines) {
            stream += 'BT\n';
            stream += '/F1 8.5 Tf\n';
            stream += '0.2 0.2 0.2 rg\n';
            stream += `50 ${descY} Td\n`;
            stream += `(${escapePdfText(line)}) Tj\n`;
            stream += 'ET\n';
            descY -= 11;
      }

      // --- Divider Line ---
      stream += '0.8 0.8 0.8 RG\n';
      stream += `50 ${descY - 5} m 545 ${descY - 5} l S\n`;

      // --- AI RESOLUTION REPORT SECTION ---
      let y = descY - 20;

      stream += 'BT\n';
      stream += '/F2 12 Tf\n';
      stream += '0.08 0.18 0.36 rg\n';
      stream += `50 ${y} Td\n`;
      stream += `(${escapePdfText('AI-Generated Grievance Resolution Assessment')}) Tj\n`;
      stream += 'ET\n';

      y -= 15;

      // Wrap the report content
      const reportLines = wrapText(complaint.resolutionReport || 'No report content available.', 90);
      
      for (const line of reportLines) {
            if (y < 80) {
                  // If we exceed page space, truncate gracefully (this keeps it to a clean single page PDF)
                  stream += 'BT\n';
                  stream += '/F2 9 Tf\n';
                  stream += '0.5 0.1 0.1 rg\n';
                  stream += `50 75 Td\n`;
                  stream += `(${escapePdfText('[Report continues on official e-Samadhan portal...]')}) Tj\n`;
                  stream += 'ET\n';
                  break;
            }

            if (line.trim() === '') {
                  y -= 10;
                  continue;
            }

            // Detect headers (e.g. "1. Executive Summary" or "Executive Summary:")
            const isHeader = /^[1-7]\.\s+[A-Za-z]/.test(line) || /^[A-Z][A-Za-z\s]+:$/.test(line);

            stream += 'BT\n';
            if (isHeader) {
                  stream += '/F2 9.5 Tf\n'; // Bold and slightly larger
                  stream += '0.08 0.18 0.36 rg\n';
                  y -= 5;
            } else {
                  stream += '/F1 8.5 Tf\n';
                  stream += '0.2 0.2 0.2 rg\n';
            }
            stream += `50 ${y} Td\n`;
            stream += `(${escapePdfText(line)}) Tj\n`;
            stream += 'ET\n';

            y -= 12;
      }

      // --- Citizen Rating Section ---
      y = Math.max(y, 110); // make sure it's above the footer
      stream += '0.9 0.9 0.9 RG\n';
      stream += `50 ${y} m 545 ${y} l S\n`;
      y -= 15;

      stream += 'BT\n';
      stream += '/F2 9 Tf\n';
      stream += '0.1 0.1 0.1 rg\n';
      stream += `50 ${y} Td\n`;
      stream += `(${escapePdfText('Citizen Satisfaction Rating Section:')}) Tj\n`;
      stream += 'ET\n';

      stream += 'BT\n';
      stream += '/F1 8.5 Tf\n';
      stream += '0.4 0.4 0.4 rg\n';
      stream += `230 ${y} Td\n`;
      stream += `(${escapePdfText('Citizens can rate and submit feedback on the e-Samadhan portal.')}) Tj\n`;
      stream += 'ET\n';

      // --- Footer ---
      stream += '0.08 0.18 0.36 rg\n';
      stream += '50 45 495 1.5 re f\n';

      stream += 'BT\n';
      stream += '/F1 7.5 Tf\n';
      stream += '0.5 0.5 0.5 rg\n';
      stream += '50 32 Td\n';
      stream += `(${escapePdfText('This is an AI-assisted automated report generated based on official officer resolution inputs.')}) Tj\n`;
      stream += 'ET\n';

      stream += 'BT\n';
      stream += '/F2 7.5 Tf\n';
      stream += '0.08 0.18 0.36 rg\n';
      stream += '445 32 Td\n';
      stream += `(${escapePdfText('e-Samadhan AI Portal')}) Tj\n`;
      stream += 'ET\n';

      const pdfBuffer = buildPdfBuffer(stream);

      // Save PDF to uploads/reports/
      const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');
      if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `report_${complaint._id}.pdf`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, pdfBuffer);

      // Return local url
      return `/uploads/reports/${filename}`;
};
