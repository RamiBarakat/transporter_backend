const { GoogleGenerativeAI } = require("@google/generative-ai");

class DashboardAIService {
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
   * Generates enhanced AI insights based on dashboard metrics data
   */
  async generateEnhancedAIInsights(insights, startDate, endDate) {
    if (!this.genAI) {
      console.warn('AI service not configured, returning original insights');
      return insights;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = this.buildDashboardInsightPrompt(insights, startDate, endDate);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;

      if (!response || !response.text()) {
        console.warn('Empty AI response, returning original insights');
        return insights;
      }

      const aiResponse = response.text().trim();
      console.log(aiResponse, "here is ai response");
      
      // Try to parse the JSON response ai response
      let additionalInsights = [];
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          additionalInsights = JSON.parse(jsonMatch[0]);
        } else {
          additionalInsights = JSON.parse(aiResponse);
        }
      } catch (parseError) {
        console.warn('Failed to parse AI JSON response:', parseError.message);
        // Generate fallback AI insights
        additionalInsights = this.generateFallbackAIInsights(insights);
      }

      const combinedInsights = [...insights.slice(0, 2), ...additionalInsights];
      return combinedInsights;

    } catch (error) {
      console.error('Dashboard AI Service Error:', error.message);
      return insights; 
    }
  }





  

  /**
   * Generates AI analysis for transporter comparison data
   */
  async generateTransporterAIAnalysis(transporters, trends) {
    if (!this.genAI) {
      console.warn('AI service not configured, returning basic analysis');
      return {
        summary: 'AI analysis unavailable - missing API configuration',
        topPerformers: transporters.slice(0, 3),
        recommendations: [],
        marketInsights: null
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = this.buildTransporterAnalysisPrompt(transporters, trends);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;

      if (!response || !response.text()) {
        throw new Error('Received an empty response from the AI service.');
      }

      const aiResponse = response.text().trim();
      console.log(aiResponse, "here is ai response");
      return {
        summary: this.extractSummary(aiResponse),
        topPerformers: this.identifyTopPerformers(transporters),
        aiAnalysis: aiResponse,
        recommendations: this.extractRecommendations(aiResponse),
        marketInsights: this.extractMarketInsights(aiResponse),
        competitiveAdvantage: this.analyzeCompetitiveAdvantage(transporters),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Transporter AI Service Error:', error.message);
      return {
        summary: 'AI analysis failed - using fallback analysis',
        topPerformers: this.identifyTopPerformers(transporters),
        recommendations: this.generateFallbackTransporterRecommendations(transporters),
        marketInsights: null,
        error: error.message
      };
    }
  }

  buildDashboardInsightPrompt(insights, startDate, endDate) {
    const systemInstructions = `You are an expert transportation and logistics analyst. Generate additional insights based on the provided data.

Requirements:
- Generate 2-3 additional insights in JSON format
- Keep descriptions to exactly 10 words or less
- Use severity levels: "high", "medium", "low"
- Include actionable recommendations
- Focus on operational efficiency and cost optimization

Response format must be valid JSON array only, no other text:`;

    let prompt = `${systemInstructions}

**ANALYSIS PERIOD:** ${startDate} to ${endDate}

**EXISTING INSIGHTS:**`;

    insights.forEach((insight, index) => {
      prompt += `\n${index + 1}. ${insight.title}: ${insight.description} (Severity: ${insight.severity})`;
    });

    prompt += `\n\n**GENERATE 2-3 ADDITIONAL INSIGHTS in this exact JSON format:**
[
  {
    "id": "ai-insight-1",
    "title": "Short Title",
    "description": "Exactly 10 words or less describing the issue",
    "severity": "high|medium|low",
    "recommendation": "Specific actionable recommendation"
  }
]

Return ONLY the JSON array, no other text.`;

    return prompt;
  }

  buildTransporterAnalysisPrompt(transporters, trends) {
    const systemInstructions = `You are an expert procurement and vendor management analyst specializing in transportation services.

Your role is to:
- Analyze transporter performance metrics and market positioning
- Evaluate competitive advantages and service quality
- Provide strategic vendor management recommendations
- Assess market trends and pricing dynamics
- Identify partnership opportunities and risks

Guidelines:
- Keep analysis concise but comprehensive (2-3 paragraphs max)
- Focus on strategic vendor selection and relationship management
- Highlight competitive differentiators and value propositions
- Consider cost, quality, reliability, and scalability factors
- Provide specific recommendations for vendor optimization`;

    let prompt = `${systemInstructions}

---

Please analyze the following transporter performance data and provide strategic vendor insights:

**TRANSPORTER PERFORMANCE DATA:**`;

    transporters.slice(0, 10).forEach((transporter, index) => {
      prompt += `\n${index + 1}. **${transporter.name}:**`;
      prompt += `\n   - AI Score: ${transporter.aiScore || 'N/A'}/100`;
      prompt += `\n   - On-Time Rate: ${transporter.onTimeRate || 'N/A'}%`;
      prompt += `\n   - Driver Rating: ${transporter.driverRating || 'N/A'}/5`;
      prompt += `\n   - Total Deliveries: ${transporter.totalDeliveries || 'N/A'}`;
      prompt += `\n   - Cost Variance: ${transporter.costVariance || 'N/A'}%`;
      
      if (trends && trends[transporter.driverId]) {
        const trend = trends[transporter.driverId];
        prompt += `\n   - Performance Trend: ${trend.aiScore > 0 ? '↗' : trend.aiScore < 0 ? '↘' : '→'} ${trend.aiScore}%`;
      }
    });

    prompt += `\n\n**REQUIRED ANALYSIS:**
Please provide:
1. **Market Overview:** Overall transporter ecosystem assessment and key trends
2. **Top Performers:** Analysis of best-performing transporters and success factors
3. **Vendor Strategy:** Recommendations for vendor portfolio optimization
4. **Cost Management:** Insights on pricing trends and cost optimization opportunities
5. **Risk Mitigation:** Vendor concentration risks and diversification strategies
6. **Partnership Opportunities:** Strategic partnerships for mutual growth

Focus on insights that will help optimize vendor relationships, reduce costs, and improve service quality.`;

    return prompt;
  }

  extractSummary(aiResponse) {
    const lines = aiResponse.split('\n');
    const summarySection = lines.find(line => 
      line.toLowerCase().includes('summary') || 
      line.toLowerCase().includes('overview')
    );
    
    if (summarySection) {
      const summaryIndex = lines.indexOf(summarySection);
      const nextSectionIndex = lines.findIndex((line, index) => 
        index > summaryIndex && line.includes('**')
      );
      
      const summaryLines = lines.slice(
        summaryIndex + 1, 
        nextSectionIndex > -1 ? nextSectionIndex : summaryIndex + 3
      );
      
      return summaryLines.join(' ').trim();
    }
    
    return aiResponse.split('\n').slice(0, 2).join(' ').trim();
  }

  extractRecommendations(aiResponse) {
    const recommendations = [];
    const lines = aiResponse.split('\n');
    
    let inRecommendationSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('recommendation')) {
        inRecommendationSection = true;
        continue;
      }
      
      if (inRecommendationSection && line.trim()) {
        if (line.includes('**') && !line.toLowerCase().includes('recommendation')) {
          break;
        }
        
        if (line.trim().match(/^\d+\.|^-|^\*/)) {
          recommendations.push(line.trim().replace(/^\d+\.\s*|\*\s*|-\s*/, ''));
        }
      }
    }
    
    return recommendations.slice(0, 5);
  }

  assessRiskLevel(insights) {
    console.log(insights, "here is insights");
    const highRiskIndicators = insights.filter(insight => 
      insight.severity === 'high' || 
      insight?.description?.toLowerCase().includes('risk') ||
      insight?.description?.toLowerCase().includes('critical') ||
      insight?.title?.toLowerCase().includes('alert')
    );
    
    if (highRiskIndicators.length >= 3) return 'high';
    if (highRiskIndicators.length >= 1) return 'medium';
    return 'low';
  }

  identifyTopPerformers(transporters) {
    return transporters
      .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
      .slice(0, 5);
  }

  extractMarketInsights(aiResponse) {
    const lines = aiResponse.split('\n');
    const marketSection = lines.find(line => 
      line.toLowerCase().includes('market') || 
      line.toLowerCase().includes('trend')
    );
    
    if (marketSection) {
      const marketIndex = lines.indexOf(marketSection);
      const nextSectionIndex = lines.findIndex((line, index) => 
        index > marketIndex && line.includes('**')
      );
      
      const marketLines = lines.slice(
        marketIndex + 1, 
        nextSectionIndex > -1 ? nextSectionIndex : marketIndex + 3
      );
      
      return marketLines.join(' ').trim();
    }
    
    return null;
  }

  analyzeCompetitiveAdvantage(transporters) {
    const sorted = transporters.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    const topPerformer = sorted[0];
    const avgScore = transporters.reduce((sum, t) => sum + (t.aiScore || 0), 0) / transporters.length;
    
    return {
      leader: topPerformer?.name || 'Unknown',
      leaderScore: topPerformer?.aiScore || 0,
      marketAverage: Math.round(avgScore * 100) / 100,
      competitiveGap: Math.round(((topPerformer?.aiScore || 0) - avgScore) * 100) / 100
    };
  }

  generateFallbackRecommendations(insights) {
    const recommendations = [];
    
    if (insights.some(i => i.type === 'cost_anomaly')) {
      recommendations.push('Review cost variations and implement better pricing controls');
    }
    
    if (insights.some(i => i.type === 'route_efficiency')) {
      recommendations.push('Optimize route planning to improve delivery efficiency');
    }
    
    if (insights.some(i => i.type === 'driver_performance')) {
      recommendations.push('Implement driver training programs to enhance performance');
    }
    
    return recommendations;
  }

  generateFallbackAIInsights(insights) {
    const fallbackInsights = [];
    
    // Generate insights based on existing patterns
    const highSeverityCount = insights.filter(i => i.severity === 'high').length;
    const costIssues = insights.filter(i => i.description.toLowerCase().includes('cost')).length;
    const driverIssues = insights.filter(i => i.description.toLowerCase().includes('driver')).length;
    
    if (highSeverityCount > 2) {
      fallbackInsights.push({
        id: 'ai-pattern-1',
        title: 'Multiple Critical Issues Detected',
        description: 'High number of critical alerts requires immediate attention',
        severity: 'high',
        recommendation: 'Prioritize urgent issues and implement systematic monitoring'
      });
    }
    
    if (costIssues > 0) {
      fallbackInsights.push({
        id: 'ai-pattern-2',
        title: 'Cost Optimization Opportunity',
        description: 'Cost-related issues detected across multiple areas',
        severity: 'medium',
        recommendation: 'Conduct comprehensive cost analysis and optimization review'
      });
    }
    
    if (driverIssues > 1) {
      fallbackInsights.push({
        id: 'ai-pattern-3',
        title: 'Driver Performance Focus Needed',
        description: 'Multiple driver-related performance issues identified',
        severity: 'medium',
        recommendation: 'Implement targeted driver training and support programs'
      });
    }
    
    return fallbackInsights;
  }

  generateFallbackTransporterRecommendations(transporters) {
    const recommendations = [];
    
    const lowPerformers = transporters.filter(t => (t.aiScore || 0) < 70);
    if (lowPerformers.length > 0) {
      recommendations.push('Review performance contracts with underperforming transporters');
    }
    
    const topPerformer = transporters.reduce((best, current) => 
      (current.aiScore || 0) > (best.aiScore || 0) ? current : best
    );
    
    if (topPerformer) {
      recommendations.push(`Consider expanding partnerships with top performer: ${topPerformer.name}`);
    }
    
    return recommendations;
  }

  async testConnection() {
    if (!this.genAI) {
      return { success: false, message: 'Dashboard AI Service is not configured (missing API key).' };
    }
    
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Test dashboard AI connection");
      const response = await result.response;
      
      if (response && response.text()) {
        return { success: true, message: 'Dashboard AI service connected successfully.' };
      }
      
      throw new Error("Received an empty response during test.");
    } catch (error) {
      return { 
        success: false, 
        message: `Dashboard AI service connection failed: ${error.message}` 
      };
    }
  }
}

module.exports = new DashboardAIService();