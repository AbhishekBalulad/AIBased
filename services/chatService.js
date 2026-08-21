const { GovtScheme, ChatConversation, ChatMessage } = require('../models');
const aiProvider = require('../ai/aiProvider');

class ChatService {
  /**
   * Process user chat question, retrieve grounded scheme context, & persist message history
   */
  async processUserMessage(userId, questionText, conversationId = null) {
    let conversation;

    // 1. Get or create ChatConversation
    if (conversationId) {
      conversation = await ChatConversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await ChatConversation.create({
        userId,
        title: questionText.substring(0, 40) + '...',
        lastMessage: questionText
      });
    }

    // 2. Save User Message
    const userMessage = await ChatMessage.create({
      conversationId: conversation._id,
      sender: 'USER',
      messageText: questionText
    });

    // 3. Search database for relevant scheme context
    const searchTerms = questionText.replace(/[^\w\s]/gi, '').trim();
    const matchingSchemes = await GovtScheme.find({
      $or: [
        { title: { $regex: searchTerms, $options: 'i' } },
        { rawDescription: { $regex: searchTerms, $options: 'i' } },
        { category: { $regex: searchTerms, $options: 'i' } },
        { benefits: { $regex: searchTerms, $options: 'i' } },
        { eligibilityCriteria: { $regex: searchTerms, $options: 'i' } }
      ]
    }).limit(3);

    // If specific search yields 0 matches, pull top default schemes as reference context
    let contextSchemes = matchingSchemes;
    if (contextSchemes.length === 0) {
      contextSchemes = await GovtScheme.find().limit(2);
    }

    // 4. Fetch recent conversation history for multi-turn follow-up context
    const recentHistory = await ChatMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(6);

    // 5. Generate Grounded AI Answer
    const aiAnswerText = await aiProvider.answerPolicyQuestion(
      questionText,
      contextSchemes,
      recentHistory.reverse()
    );

    // 6. Build Citation Cards
    const citations = contextSchemes.map(scheme => ({
      title: scheme.title,
      url: scheme.officialSourceUrl
    }));

    // 7. Save AI Assistant Message
    const aiMessage = await ChatMessage.create({
      conversationId: conversation._id,
      sender: 'AI_ASSISTANT',
      messageText: aiAnswerText,
      referencedSchemeId: contextSchemes.length > 0 ? contextSchemes[0]._id : null,
      citations
    });

    // Update conversation metadata
    conversation.lastMessage = aiAnswerText.substring(0, 60);
    await conversation.save();

    return {
      conversationId: conversation._id,
      userMessage,
      aiMessage,
      citations
    };
  }
}

module.exports = new ChatService();
