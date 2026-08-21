const axios = require('axios');

class AiProvider {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'mock';
    this.apiKey = process.env.AI_API_KEY || '';
  }

  async simplifyPolicy(policyData, targetLanguage = 'en') {
    try {
      if (this.provider === 'openai' && this.apiKey) {
        return await this.simplifyWithOpenAI(policyData, targetLanguage);
      } else if (this.provider === 'gemini' && this.apiKey) {
        return await this.simplifyWithGemini(policyData, targetLanguage);
      } else {
        return this.simplifyWithMockEngine(policyData, targetLanguage);
      }
    } catch (err) {
      console.warn(`[AiProvider Warning]: ${err.message}. Falling back to Rule-Based Simplification Engine.`);
      return this.simplifyWithMockEngine(policyData, targetLanguage);
    }
  }

  /**
   * Grounded Natural Language Policy Q&A Engine
   */
  async answerPolicyQuestion(userQuestion, contextSchemes, conversationHistory = []) {
    try {
      if (this.provider === 'openai' && this.apiKey) {
        return await this.chatWithOpenAI(userQuestion, contextSchemes, conversationHistory);
      } else {
        return this.chatWithMockEngine(userQuestion, contextSchemes);
      }
    } catch (err) {
      console.warn(`[AiProvider Chat Warning]: ${err.message}. Using Grounded Fallback Engine.`);
      return this.chatWithMockEngine(userQuestion, contextSchemes);
    }
  }

  async chatWithOpenAI(userQuestion, contextSchemes, conversationHistory) {
    const contextText = contextSchemes.map(s => `Scheme: ${s.title}\nCategory: ${s.category}\nBenefits: ${s.benefits.join('; ')}\nEligibility: ${s.eligibilityCriteria.join('; ')}\nProcedure: ${s.applicationProcedure.join('; ')}\nURL: ${s.officialSourceUrl}`).join('\n\n');

    const systemPrompt = `You are the official Government Policy Assistance AI Chatbot.
Answer the user's question STRICTLY based on the provided official scheme context below.
DO NOT invent, guess, or make up government policies or benefits.
If the information is not present in the context, explicitly state: "Information not found in official scheme database. Please check the official government portal."

OFFICIAL SCHEME CONTEXT:
${contextText}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'USER' ? 'user' : 'assistant',
        content: msg.messageText
      })),
      { role: 'user', content: userQuestion }
    ];

    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.3
    }, { headers: { Authorization: `Bearer ${this.apiKey}` } });

    return res.data.choices[0].message.content;
  }

  chatWithMockEngine(userQuestion, contextSchemes) {
    if (!contextSchemes || contextSchemes.length === 0) {
      return `I could not find a specific government scheme matching "${userQuestion}" in the official database. Please verify your query or search directly on the official myScheme portal at https://www.myscheme.gov.in/`;
    }

    const primaryScheme = contextSchemes[0];
    const benefitsList = primaryScheme.benefits && primaryScheme.benefits.length > 0 ? primaryScheme.benefits.join(' ') : 'Direct financial and social assistance.';
    const eligibilityList = primaryScheme.eligibilityCriteria && primaryScheme.eligibilityCriteria.length > 0 ? primaryScheme.eligibilityCriteria.join(' ') : 'Subject to ministry guidelines.';

    return `Based on official records for **${primaryScheme.title}** (${primaryScheme.category}):

• **Key Benefits:** ${benefitsList}
• **Eligibility:** ${eligibilityList}
• **How to Apply:** Visit the official portal at ${primaryScheme.officialSourceUrl} or apply via nearest Common Service Centre (CSC).

If you have specific eligibility questions, please verify on the official government website: ${primaryScheme.officialSourceUrl}`;
  }

  simplifyWithMockEngine(policyData, targetLanguage) {
    const summary = `${policyData.title} provides direct government support to eligible citizens. It aims to reduce financial hardship and improve public welfare access.`;
    return {
      summary,
      simplifiedEligibility: policyData.eligibilityCriteria || ['Open to eligible citizens.'],
      simplifiedBenefits: policyData.benefits || ['Direct benefit transfer.'],
      requiredDocuments: policyData.requiredDocuments || ['Aadhaar Card', 'Bank Passbook'],
      applicationProcedure: policyData.applicationProcedure || [`Apply online at ${policyData.officialSourceUrl}`],
      importantNotice: `Official Ref: ${policyData.officialSchemeId}. Verify at ${policyData.officialSourceUrl}`
    };
  }
}

module.exports = new AiProvider();
