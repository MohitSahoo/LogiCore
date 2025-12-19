// NLP Processor using Gemini AI for intelligent intent extraction

import ai from './aiClient.js';
import { quotaMonitor } from './aiQuotaMonitor.js';

/**
 * Extract intent and parameters from user query using Gemini AI
 */
export async function processNaturalLanguage(userQuery) {
  // If AI is not available, fall back to keyword matching
  if (!ai) {
    return keywordBasedIntent(userQuery);
  }

  // Check quota before making AI request
  if (!quotaMonitor.canMakeRequest()) {
    console.warn('⚠️  AI quota limit reached, using keyword matching');
    return keywordBasedIntent(userQuery);
  }

  try {
    quotaMonitor.recordRequest();

    // Use Gemini to extract structured intent and parameters
    const prompt = `You are an NLP system for a supply chain management application.
Analyze this user query and extract:
1. Intent (one of: inventory_check, order_status, product_info, forecast, supplier_info, general)
2. Parameters (product names, SKUs, quantities, dates, etc.)
3. Confidence score (0-1)

User query: "${userQuery}"

Respond ONLY with valid JSON in this exact format:
{
  "intent": "intent_name",
  "confidence": 0.95,
  "parameters": {
    "product_name": "extracted name or null",
    "sku": "extracted SKU or null",
    "quantity": "extracted number or null",
    "status": "extracted status or null",
    "time_period": "extracted period or null"
  },
  "reasoning": "brief explanation"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-pro',
      contents: prompt,
    });

    const responseText = response.text.trim();
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const result = JSON.parse(jsonText);
    
    console.log(`🤖 AI Intent: ${result.intent} (confidence: ${result.confidence})`);
    console.log(`📝 Parameters:`, result.parameters);
    
    return {
      intent: result.intent,
      confidence: result.confidence,
      parameters: result.parameters,
      reasoning: result.reasoning,
      method: 'ai'
    };

  } catch (err) {
    console.error('❌ AI NLP failed:', err.message);
    // Fall back to keyword matching
    return keywordBasedIntent(userQuery);
  }
}

/**
 * Fallback keyword-based intent detection
 */
function keywordBasedIntent(userQuery) {
  const query = userQuery.toLowerCase();
  
  // Inventory check patterns
  if (
    query.includes('low stock') ||
    query.includes('restock') ||
    query.includes('running low') ||
    query.includes('need more') ||
    query.includes('inventory level') ||
    query.includes('stock level')
  ) {
    return {
      intent: 'inventory_check',
      confidence: 0.8,
      parameters: {},
      method: 'keyword'
    };
  }
  
  // Order status patterns
  if (
    (query.includes('order') && query.includes('status')) ||
    query.includes('order summary') ||
    query.includes('pending order') ||
    query.includes('completed order')
  ) {
    return {
      intent: 'order_status',
      confidence: 0.8,
      parameters: {},
      method: 'keyword'
    };
  }
  
  // Product info patterns
  if (
    query.includes('tell me about') ||
    query.includes('information about') ||
    query.includes('details of') ||
    query.includes('show me product')
  ) {
    return {
      intent: 'product_info',
      confidence: 0.7,
      parameters: {},
      method: 'keyword'
    };
  }
  
  // Forecast patterns
  if (
    query.includes('forecast') ||
    query.includes('predict') ||
    query.includes('future demand') ||
    query.includes('trend')
  ) {
    return {
      intent: 'forecast',
      confidence: 0.8,
      parameters: {},
      method: 'keyword'
    };
  }
  
  // Supplier info patterns
  if (
    query.includes('supplier') ||
    query.includes('vendor')
  ) {
    return {
      intent: 'supplier_info',
      confidence: 0.8,
      parameters: {},
      method: 'keyword'
    };
  }
  
  // Default to general
  return {
    intent: 'general',
    confidence: 0.5,
    parameters: {},
    method: 'keyword'
  };
}

/**
 * Generate natural language response using Gemini AI
 */
export async function generateNaturalResponse(intent, data, userQuery) {
  if (!ai || !quotaMonitor.canMakeRequest()) {
    return null; // Fall back to template response
  }

  try {
    quotaMonitor.recordRequest();

    const prompt = `You are a helpful supply chain assistant. 
User asked: "${userQuery}"
Intent: ${intent}
Data: ${JSON.stringify(data).substring(0, 500)}

Generate a brief, friendly response (2-3 sentences max) that:
1. Directly answers the question
2. Highlights key insights
3. Uses natural language (not robotic)

Response:`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: prompt,
    });

    return aiResponse.text.trim();
  } catch (err) {
    console.error('❌ AI response generation failed:', err.message);
    return null;
  }
}

export default { processNaturalLanguage, generateNaturalResponse };
