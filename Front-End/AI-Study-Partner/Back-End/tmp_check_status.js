import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

import Document from './models/Document.js';

const checkStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const docs = await Document.find().sort({ createdAt: -1 }).limit(5);
    console.log('\n--- Latests Documents ---');
    docs.forEach(d => {
      console.log(`ID: ${d._id}`);
      console.log(`Title: ${d.title}`);
      console.log(`Status: ${d.status}`);
      console.log(`FilePath: ${d.filePath}`);
      console.log(`Error Reason: ${d.errorReason || 'None'}`);
      console.log(`Text Length: ${d.extractedText?.length || 0}`);
      console.log('------------------------');
    });
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};

checkStatus();
