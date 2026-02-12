// backend/src/aiClient.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const primaryApiKey = process.env.GEMINI_API_KEY;
const fallbackApiKey = process.env.GEMINI_FALLBACK_API_KEY;

if (!primaryApiKey || primaryApiKey === 'YOUR_NEW_API_KEY_HERE') {
  console.warn('⚠️  GEMINI_API_KEY not configured. AI features will be disabled.');
  console.warn('   Get a new key from: https://aistudio.google.com/app/apikey');
}

if (!fallbackApiKey) {
  console.warn('⚠️  GEMINI_FALLBACK_API_KEY not configured. No fallback available.');
}

// Initialize primary AI client
let primaryAI = null;
let fallbackAI = null;

if (primaryApiKey && primaryApiKey !== 'YOUR_NEW_API_KEY_HERE') {
  primaryAI = new GoogleGenerativeAI(primaryApiKey);
  console.log('✅ Primary Gemini AI client initialized');
}

if (fallbackApiKey && fallbackApiKey !== 'YOUR_NEW_API_KEY_HERE') {
  fallbackAI = new GoogleGenerativeAI(fallbackApiKey);
  console.log('✅ Fallback Gemini AI client initialized');
}

// Enhanced AI client with fallback support
class EnhancedAIClient {
  constructor() {
    this.primaryAI = primaryAI;
    this.fallbackAI = fallbackAI;
    this.usingFallback = false;
    this.primaryFailures = 0;
    this.maxPrimaryFailures = 3; // Switch to fallback after 3 consecutive failures
  }

  // Get the appropriate AI client
  getClient() {
    if (this.usingFallback && this.fallbackAI) {
      return this.fallbackAI;
    }
    return this.primaryAI;
  }

  // Get model with fallback support
  getGenerativeModel(config) {
    const client = this.getClient();
    if (!client) {
      throw new Error('No AI client available. Please check your API keys.');
    }
    return client.getGenerativeModel(config);
  }

  // Test API key validity
  async testApiKey(client, keyType = 'primary') {
    try {
      const model = client.getGenerativeModel({ model: "models/gemini-2.5-flash" });
      const result = await model.generateContent("Test connection");
      const response = await result.response;
      response.text(); // This will throw if the response is invalid
      console.log(`✅ ${keyType} API key is working`);
      return true;
    } catch (error) {
      console.error(`❌ ${keyType} API key failed:`, error.message);
      return false;
    }
  }

  // Handle API failures and switch to fallback if needed
  async handleApiFailure(error) {
    this.primaryFailures++;
    console.error(`❌ Primary API failure ${this.primaryFailures}/${this.maxPrimaryFailures}:`, error.message);

    // Switch to fallback after max failures
    if (this.primaryFailures >= this.maxPrimaryFailures && this.fallbackAI && !this.usingFallback) {
      console.log('🔄 Switching to fallback API key...');
      
      // Test fallback key before switching
      const fallbackWorks = await this.testApiKey(this.fallbackAI, 'fallback');
      
      if (fallbackWorks) {
        this.usingFallback = true;
        console.log('✅ Successfully switched to fallback API key');
        return true;
      } else {
        console.error('❌ Fallback API key also failed');
        return false;
      }
    }

    return false;
  }

  // Reset to primary API (call this periodically or after successful operations)
  resetToPrimary() {
    if (this.usingFallback && this.primaryAI) {
      console.log('🔄 Attempting to reset to primary API key...');
      this.usingFallback = false;
      this.primaryFailures = 0;
      console.log('✅ Reset to primary API key');
    }
  }

  // Get current status
  getStatus() {
    return {
      usingFallback: this.usingFallback,
      primaryFailures: this.primaryFailures,
      primaryAvailable: !!this.primaryAI,
      fallbackAvailable: !!this.fallbackAI,
      currentKey: this.usingFallback ? 'fallback' : 'primary'
    };
  }

  // Generate content with automatic fallback
  async generateContent(prompt, config = {}) {
    const maxRetries = 2;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = this.getGenerativeModel({ 
          model: "models/gemini-2.5-flash",
          ...config 
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Reset primary failures on success
        if (this.primaryFailures > 0 && !this.usingFallback) {
          this.primaryFailures = 0;
        }
        
        return { response, usingFallback: this.usingFallback };
        
      } catch (error) {
        lastError = error;
        console.error(`❌ AI generation attempt ${attempt} failed:`, error.message);
        
        // Try to switch to fallback
        const switchedToFallback = await this.handleApiFailure(error);
        
        if (switchedToFallback && attempt < maxRetries) {
          console.log('🔄 Retrying with fallback API...');
          continue;
        }
        
        // If we're on the last attempt or can't switch, throw the error
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    // All attempts failed
    const status = this.getStatus();
    throw new Error(`AI generation failed after ${maxRetries} attempts. Status: ${JSON.stringify(status)}. Last error: ${lastError.message}`);
  }
}

// Export enhanced client instance
const enhancedAI = new EnhancedAIClient();

// Backward compatibility - export the enhanced client as default
export default enhancedAI;

// Also export the raw clients for direct access if needed
export { primaryAI, fallbackAI, EnhancedAIClient };
