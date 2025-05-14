import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// Initialize Anthropic client
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * AI chat endpoint
 * Handles user messages and provides AI responses
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, context = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Create prompt from context + new message
    const systemPrompt = `You are a helpful assistant for the Shillong Teer betting application. 
    Be polite, concise, and informative. Provide helpful information about the application, 
    betting rules, and general guidance to users.`;
    
    // Build the messages array for Claude - system prompt goes in system parameter
    const messages = [
      ...context.map((msg: any) => ({ 
        role: msg.role === 'system' ? 'assistant' : msg.role, 
        content: msg.content 
      })),
      { role: 'user', content: message }
    ];
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages,
    });
    
    // Extract text from the content block
    let responseText = '';
    if (response.content && response.content.length > 0) {
      const contentBlock = response.content[0];
      // TypeScript doesn't know the exact structure, so we need to use type assertion
      if ('type' in contentBlock && contentBlock.type === 'text' && 'text' in contentBlock) {
        responseText = contentBlock.text as string;
      }
    }
    
    return res.json({ 
      message: responseText || 'No response generated',
      status: 'success'
    });
  } catch (error: any) {
    console.error('Error in AI chat:', error.message || error);
    return res.status(500).json({ 
      error: 'Failed to process AI request',
      message: 'Sorry, I encountered an error. Please try again later.'
    });
  }
});

/**
 * Help content generation
 * Generates help content for specific topics
 */
router.post('/help', async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    const systemPrompt = `You are a helpful guide for the Shillong Teer betting application.
    Provide clear, concise, and accurate information about the requested topic.
    Format your response using Markdown for better readability.`;
    
    const userPrompt = `Please provide help information about "${topic}" in the context of Shillong Teer betting.`;
    
    // Create message request with system prompt as a parameter
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });
    
    // Extract text from the content block
    let responseText = '';
    if (response.content && response.content.length > 0) {
      const contentBlock = response.content[0];
      // TypeScript doesn't know the exact structure, so we need to use type assertion
      if ('type' in contentBlock && contentBlock.type === 'text' && 'text' in contentBlock) {
        responseText = contentBlock.text as string;
      }
    }
    
    return res.json({ 
      content: responseText || 'No help content generated',
      status: 'success' 
    });
  } catch (error: any) {
    console.error('Error generating help content:', error.message || error);
    return res.status(500).json({ 
      error: 'Failed to generate help content',
      content: 'Sorry, I couldn\'t generate help content at this time. Please try again later.'
    });
  }
});

export default router;