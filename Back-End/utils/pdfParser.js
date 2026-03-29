import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';

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
    
    // Initialize the parser
    const parser = new PDFParse({ data: dataBuffer });

    // Extract text and info
    const info = await parser.getInfo();
    const textResult = await parser.getText();
    
    // Important: Free resources
    await parser.destroy();

    console.log(`[PDF Parser] PDF parsed successfully: ${info.total} pages, ${textResult.text?.length || 0} characters`);

    return {
      text: textResult.text,
      numPages: info.total,
      info: info.info || {},
    };
  } catch (error) {
    console.error("[PDF Parser] Error:", error);
    throw new Error(`PDF Parser Error: ${error.message}`);
  }
};