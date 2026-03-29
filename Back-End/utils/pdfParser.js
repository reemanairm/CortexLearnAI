import fs from 'fs/promises';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdf = require('pdf-parse');

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<{text: string, numPages: number}>}
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    console.log(`[PDF Parser] Attempting to read PDF from: ${filePath}`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
      console.log(`[PDF Parser] File exists: ${filePath}`);
    } catch (accessError) {
      console.error(`[PDF Parser] File access error: ${filePath}`, accessError.message);
      throw new Error(`Cannot access file: ${filePath}`);
    }
    
    const dataBuffer = await fs.readFile(filePath);
    console.log(`[PDF Parser] File read successfully, size: ${dataBuffer.length} bytes`);
    
    // Use pdf-parse (CommonJS module via createRequire)
    const data = await pdf(dataBuffer);

    console.log(`[PDF Parser] PDF parsed successfully: ${data.numpages} pages, ${data.text?.length || 0} characters`);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info || {},
    };
  } catch (error) {
    console.error("[PDF Parser] Error:", error);
    throw new Error(`PDF Parser Error: ${error.message}`);
  }
};