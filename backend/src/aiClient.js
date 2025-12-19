// backend/src/aiClient.js
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey === 'YOUR_NEW_API_KEY_HERE') {
  console.warn('⚠️  GEMINI_API_KEY not configured. AI features will be disabled.');
  console.warn('   Get a new key from: https://aistudio.google.com/app/apikey');
}

// Initialize AI client
const ai = apiKey && apiKey !== 'YOUR_NEW_API_KEY_HERE' 
  ? new GoogleGenAI({}) 
  : null;

export default ai;
