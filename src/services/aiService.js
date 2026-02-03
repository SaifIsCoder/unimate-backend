const AIRequestLog = require('../models/AIRequestLog');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * AI Service Layer
 * 
 * WHY: AI can only suggest, never mutate core data.
 * All AI operations are logged and rate-limited.
 * AI failures must not break core flows.
 */

/**
 * Log AI request
 * @param {Object} params - { tenantId, userId, feature, tokensUsed, status }
 */
const logAIRequest = async (params) => {
  try {
    await AIRequestLog.create({
      tenantId: params.tenantId,
      userId: params.userId,
      feature: params.feature,
      tokensUsed: params.tokensUsed || 0,
      status: params.status || 'success',
      createdAt: new Date()
    });
  } catch (error) {
    // Don't break flow if logging fails
    console.error('AI request logging error:', error);
  }
};

/**
 * Check AI rate limit for tenant
 * @param {String} tenantId - Tenant ID
 * @returns {Boolean} True if within limits
 */
const checkAIRateLimit = async (tenantId) => {
  // Get AI requests in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentRequests = await AIRequestLog.countDocuments({
    tenantId,
    createdAt: { $gte: oneHourAgo }
  });

  // 100 requests per hour per tenant
  const MAX_REQUESTS_PER_HOUR = 100;
  
  return recentRequests < MAX_REQUESTS_PER_HOUR;
};

/**
 * Generate AI suggestion (placeholder - implement with actual AI service)
 * @param {Object} params - { tenantId, userId, feature, prompt }
 * @returns {Object} AI suggestion
 */
const generateSuggestion = async (params) => {
  const { tenantId, userId, feature, prompt } = params;

  // Check rate limit
  const withinLimit = await checkAIRateLimit(tenantId);
  if (!withinLimit) {
    throw new AppError(
      'AI rate limit exceeded',
      429,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      { feature }
    );
  }

  try {
    // TODO: Integrate with actual AI service (OpenAI, etc.)
    // For now, return placeholder
    const suggestion = {
      text: 'AI suggestion placeholder',
      confidence: 0.8,
      metadata: {}
    };

    // Log successful request
    await logAIRequest({
      tenantId,
      userId,
      feature,
      tokensUsed: 0, // Update with actual token count
      status: 'success'
    });

    return suggestion;
  } catch (error) {
    // Log failed request
    await logAIRequest({
      tenantId,
      userId,
      feature,
      tokensUsed: 0,
      status: 'failed'
    });

    // Don't break core flow - return error but don't throw
    console.error('AI service error:', error);
    throw new AppError(
      'AI service temporarily unavailable',
      503,
      ERROR_CODES.INTERNAL_ERROR,
      { feature }
    );
  }
};

/**
 * Validate AI output (never trust AI)
 * @param {Object} aiOutput - AI generated output
 * @param {Object} schema - Validation schema
 * @returns {Boolean} True if valid
 */
const validateAIOutput = (aiOutput, schema) => {
  // Implement validation logic
  // AI output must be validated before use
  return true;
};

module.exports = {
  logAIRequest,
  checkAIRateLimit,
  generateSuggestion,
  validateAIOutput
};
