/**
 * Pagination Utility
 * 
 * WHY: Enforce pagination on all list endpoints.
 * Prevents performance issues and enforces max limits.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from request
 * @param {Object} req - Express request object
 * @returns {Object} { page, limit, skip }
 */
const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Format paginated response
 * @param {Object} data - Paginated data
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items
 * @returns {Object} Formatted pagination response
 */
const formatPaginationResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  getPaginationParams,
  formatPaginationResponse,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT
};
