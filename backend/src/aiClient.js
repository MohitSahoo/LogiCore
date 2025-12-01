// backend/src/aiClient.js
import { GoogleGenAI } from '@google/genai';

// By default it reads GEMINI_API_KEY from env (see Gemini docs)
const ai = new GoogleGenAI({});

export default ai;
