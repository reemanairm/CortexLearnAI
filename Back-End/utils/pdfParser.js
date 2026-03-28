import fs from 'fs/promises';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<{text: string, numPages: number}>}
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    
    // Handle the modern pdf-parse (v2.x) API
    // It's a class that needs instantiation
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: dataBuffer });
    
    // getText() returns an object with 'text' and 'total' (numPages)
    const result = await parser.getText();

    console.log(`Successfully extracted ${result.text?.length || 0} characters from PDF: ${filePath}`);

    return {
      text: result.text,
      numPages: result.total,
      info: {}, // Modern API might store this differently, but we mainly need text
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`PDF Parser Error: ${error.message}`);
  }
};