const { JobListing, JobSource, SavedJob } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const jobDataService = require('../services/jobDataService');
const fraudDetectionEngine = require('../jobs/fraudDetectionEngine');

exports.syncJobs = asyncHandler(async (req, res, next) => {
  const syncResult = await jobDataService.syncJobsFromProviders();
  return ApiResponse.success(res, 'Job feed synchronization completed successfully', syncResult, 200);
});

exports.getJobSources = asyncHandler(async (req, res, next) => {
  const sources = await JobSource.find().sort({ lastIngestedAt: -1 });
  return ApiResponse.success(res, 'Permitted job sources retrieved successfully', sources, 200);
});

exports.getJobListings = asyncHandler(async (req, res, next) => {
  const { jobType, riskLevel, search, page = 1, limit = 10 } = req.query;
  const query = {};

  if (jobType && jobType !== 'All') query.jobType = jobType;
  if (riskLevel && riskLevel !== 'All') query.riskLevel = riskLevel;
  if (search && search.trim()) {
    const searchQuery = search.trim();
    query.$or = [
      { title: { $regex: searchQuery, $options: 'i' } },
      { companyName: { $regex: searchQuery, $options: 'i' } },
      { location: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const existingCount = await JobListing.countDocuments();
  if (existingCount === 0) {
    await jobDataService.syncJobsFromProviders();
  }

  const total = await JobListing.countDocuments(query);
  const jobs = await JobListing.find(query)
    .populate('jobSourceRef', 'providerName sourceType apiEndpointUrl')
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, 'Job listings retrieved successfully', {
    total, page: pageNum, pages: Math.ceil(total / limitNum), count: jobs.length, jobs
  }, 200);
});

exports.searchJobs = asyncHandler(async (req, res, next) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return ApiResponse.error(res, 'Please provide search query "q"', 400);
  }

  const searchQuery = q.trim();
  const jobs = await JobListing.find({
    $or: [
      { title: { $regex: searchQuery, $options: 'i' } },
      { companyName: { $regex: searchQuery, $options: 'i' } },
      { location: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } }
    ]
  }).populate('jobSourceRef', 'providerName sourceType');

  return ApiResponse.success(res, `Found ${jobs.length} matching jobs`, { query: searchQuery, count: jobs.length, jobs }, 200);
});

exports.getJobById = asyncHandler(async (req, res, next) => {
  const job = await JobListing.findById(req.params.id).populate('jobSourceRef');
  if (!job) {
    return ApiResponse.error(res, 'Job listing not found', 404);
  }
  return ApiResponse.success(res, 'Job details retrieved successfully', job, 200);
});

/**
 * @desc    On-demand AI Fraud Risk Analysis for custom job text
 * @route   POST /api/v1/jobs/analyze-fraud
 * @access  Public / Authenticated
 */
exports.analyzeJobFraud = asyncHandler(async (req, res, next) => {
  const { title, companyName, description, salaryRange, officialApplyUrl, contactEmail } = req.body;

  if (!title || !description) {
    return ApiResponse.error(res, 'Please provide title and description for fraud analysis', 400);
  }

  const analysisResult = fraudDetectionEngine.analyzeJobListing({
    title, companyName, description, salaryRange, officialApplyUrl, contactEmail
  });

  return ApiResponse.success(res, 'AI Fraud Risk Analysis completed successfully', analysisResult, 200);
});

exports.saveJob = asyncHandler(async (req, res, next) => {
  const jobId = req.params.id;
  const userId = req.user.id;

  const job = await JobListing.findById(jobId);
  if (!job) return ApiResponse.error(res, 'Job listing not found', 404);

  const existingSave = await SavedJob.findOne({ userId, jobId });
  if (existingSave) return ApiResponse.error(res, 'Job is already saved in your bookmarks', 400);

  const savedJob = await SavedJob.create({ userId, jobId });
  return ApiResponse.success(res, 'Job bookmarked successfully', savedJob, 201);
});

exports.removeSavedJob = asyncHandler(async (req, res, next) => {
  const jobId = req.params.id;
  const userId = req.user.id;

  const deleted = await SavedJob.findOneAndDelete({ userId, jobId });
  if (!deleted) return ApiResponse.error(res, 'Saved job bookmark not found', 404);

  return ApiResponse.success(res, 'Saved job removed successfully', null, 200);
});

exports.getSavedJobs = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const savedJobs = await SavedJob.find({ userId }).populate({
    path: 'jobId',
    populate: { path: 'jobSourceRef', select: 'providerName' }
  }).sort({ createdAt: -1 });

  return ApiResponse.success(res, 'User saved jobs retrieved successfully', { count: savedJobs.length, savedJobs }, 200);
});
