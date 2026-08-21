const { GovtScheme, SchemeSource } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const govtDataService = require('../services/govtDataService');

/**
 * @desc    Trigger automated synchronization with official Government APIs/feeds
 * @route   POST /api/v1/schemes/sync
 * @access  Public / System Cron
 */
exports.syncSchemes = asyncHandler(async (req, res, next) => {
  const syncResult = await govtDataService.syncGovernmentSchemes();
  return ApiResponse.success(res, 'Government scheme synchronization completed', syncResult, 200);
});

/**
 * @desc    Get active official government data sources metadata
 * @route   GET /api/v1/schemes/sources
 * @access  Public
 */
exports.getSchemeSources = asyncHandler(async (req, res, next) => {
  const sources = await SchemeSource.find().sort({ lastSyncTimestamp: -1 });
  return ApiResponse.success(res, 'Official government sources retrieved successfully', sources, 200);
});

/**
 * @desc    Get filter options (categories, states, departments) for mobile filter UI
 * @route   GET /api/v1/schemes/filter-options
 * @access  Public
 */
exports.getFilterOptions = asyncHandler(async (req, res, next) => {
  const categories = await GovtScheme.distinct('category');
  const states = await GovtScheme.distinct('state');
  const targetAudiences = await GovtScheme.distinct('targetAudience');

  return ApiResponse.success(res, 'Filter options retrieved successfully', {
    categories: ['All', ...categories],
    states: ['All India', ...states.filter(s => s !== 'All India')],
    targetAudiences: ['All Citizens', ...targetAudiences.filter(t => t !== 'All Citizens')]
  }, 200);
});

/**
 * @desc    Advanced Multi-Filter & Search endpoint for government schemes
 * @route   GET /api/v1/schemes
 * @access  Public
 */
exports.getSchemes = asyncHandler(async (req, res, next) => {
  const { category, state, targetAudience, search, page = 1, limit = 10 } = req.query;
  const query = {};

  if (category && category !== 'All') {
    query.category = category;
  }
  if (state && state !== 'All India') {
    query.$or = [{ state: state }, { state: 'All India' }];
  }
  if (targetAudience && targetAudience !== 'All Citizens') {
    query.targetAudience = targetAudience;
  }
  if (search && search.trim()) {
    const searchQuery = search.trim();
    query.$or = [
      { title: { $regex: searchQuery, $options: 'i' } },
      { rawDescription: { $regex: searchQuery, $options: 'i' } },
      { simplifiedSummary: { $regex: searchQuery, $options: 'i' } },
      { benefits: { $regex: searchQuery, $options: 'i' } },
      { eligibilityCriteria: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const existingCount = await GovtScheme.countDocuments();
  if (existingCount === 0) {
    await govtDataService.syncGovernmentSchemes();
  }

  const total = await GovtScheme.countDocuments(query);
  const schemes = await GovtScheme.find(query)
    .populate('schemeSourceRef', 'sourceName baseUrl ministryOrDepartment')
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Government schemes retrieved successfully', {
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: schemes.length,
    schemes
  }, 200);
});

/**
 * @desc    Search government schemes/policies by text query
 * @route   GET /api/v1/schemes/search
 * @access  Public
 */
exports.searchSchemes = asyncHandler(async (req, res, next) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return ApiResponse.error(res, 'Please provide a search query parameter "q"', 400);
  }

  const searchQuery = q.trim();
  const schemes = await GovtScheme.find({
    $or: [
      { title: { $regex: searchQuery, $options: 'i' } },
      { rawDescription: { $regex: searchQuery, $options: 'i' } },
      { category: { $regex: searchQuery, $options: 'i' } },
      { benefits: { $regex: searchQuery, $options: 'i' } },
      { eligibilityCriteria: { $regex: searchQuery, $options: 'i' } }
    ]
  }).populate('schemeSourceRef', 'sourceName baseUrl ministryOrDepartment');

  return ApiResponse.success(res, `Found ${schemes.length} matching government schemes`, {
    query: searchQuery,
    count: schemes.length,
    schemes
  }, 200);
});

/**
 * @desc    Get single government scheme details by ID
 * @route   GET /api/v1/schemes/:id
 * @access  Public
 */
exports.getSchemeById = asyncHandler(async (req, res, next) => {
  const scheme = await GovtScheme.findById(req.params.id).populate('schemeSourceRef');

  if (!scheme) {
    return ApiResponse.error(res, 'Government scheme not found', 404);
  }

  return ApiResponse.success(res, 'Scheme details retrieved successfully', scheme, 200);
});
