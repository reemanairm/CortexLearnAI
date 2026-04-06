import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generatePDF = (title, notesText, filename) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const outputPath = path.join(__dirname, '..', 'uploads', 'documents', filename);
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // Title
      doc.font('Helvetica-Bold')
         .fontSize(20)
         .text(title, { align: 'center' })
         .moveDown(2);

      // Notes Content
      doc.font('Helvetica')
         .fontSize(12)
         .text(notesText, {
           align: 'justify',
           lineGap: 4
         });

      doc.end();

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};
