const { GoogleGenerativeAI } = require("@google/generative-ai");

class BaseAIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('Warning: GEMINI_API_KEY not found in environment variables. AI service will be disabled.');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Check if AI service is configured and available
   */
  isConfigured() {
    return this.genAI !== null;
  }

  /**
   * Get AI model instance
   */
  getModel(modelName = "gemini-2.0-flash") {
    if (!this.genAI) {
      throw new Error('AI service is not configured. Please provide a GEMINI_API_KEY.');
    }
    return this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Generic method to generate content with error handling
   */
  async generateContent(prompt, modelName = "gemini-2.0-flash") {
    if (!this.genAI) {
      throw new Error('AI service is not configured. Please provide a GEMINI_API_KEY.');
    }

    try {
      const model = this.getModel(modelName);
      const result = await model.generateContent(prompt);
      const response = await result.response;

      if (!response || !response.text()) {
        throw new Error('Received an empty response from the AI service.');
      }

      return response.text().trim();
    } catch (error) {
      console.error('AI Service Error:', error.message);
      throw error;
    }
  }

  /**
   * Test the AI service connection by sending a simple prompt
   */
  async testConnection(serviceName = 'AI Service') {
    if (!this.genAI) {
      return { 
        success: false, 
        message: `${serviceName} is not configured (missing API key).` 
      };
    }

    try {
      const model = this.getModel("gemini-2.0-flash");
      const result = await model.generateContent("Hello");
      const response = await result.response;
      
      if (response && response.text()) {
        return { 
          success: true, 
          message: `${serviceName} connected successfully.` 
        };
      }
      
      throw new Error("Received an empty response during test.");
    } catch (error) {
      return { 
        success: false, 
        message: `${serviceName} connection failed: ${error.message}` 
      };
    }
  }

  /**
   * Parse JSON response with fallback handling
   */
  parseJSONResponse(aiResponse, fallbackValue = null) {
    try {
      let cleanResponse = aiResponse;
      
      // Remove markdown code blocks
      if (aiResponse.includes('```json')) {
        cleanResponse = aiResponse.replace(/```json\s*|\s*```/g, '');
      } else if (aiResponse.includes('```')) {
        cleanResponse = aiResponse.replace(/```\s*|\s*```/g, '');
      }

      // Try to find JSON in the response
      const jsonMatch = cleanResponse.match(/[\{\[][\s\S]*[\}\]]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the entire cleaned response
        return JSON.parse(cleanResponse.trim());
      }
    } catch (parseError) {
      console.warn('Failed to parse AI JSON response:', parseError.message);
      console.warn('Raw response:', aiResponse);
      return fallbackValue;
    }
  }
}

module.exports = BaseAIService;