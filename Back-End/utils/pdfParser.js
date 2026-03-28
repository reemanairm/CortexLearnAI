import fs from 'fs/promises';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<{text: string, numPages: number}>}
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    
    // Handle different CJS export styles
    const pdfParser = (typeof pdf === 'function') ? pdf : (pdf.default || pdf);
    
    // pdf-parse expects a Buffer
    const data = await pdfParser(dataBuffer);

    console.log(`Successfully extracted ${data.text?.length || 0} characters from PDF: ${filePath}`);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};