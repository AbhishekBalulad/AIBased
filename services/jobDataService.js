const { JobListing, JobSource } = require('../models');
const jobApiAdapter = require('../integrations/jobApiAdapter');
const fraudDetectionEngine = require('../jobs/fraudDetectionEngine');

class JobDataService {
  async syncJobsFromProviders() {
    console.log('[JobDataService] Starting job ingestion & AI fraud analysis pipeline...');

    const rawResult = await jobApiAdapter.fetchFromNcsGovtPortal();
    const providerInfo = rawResult.provider;
    const records = rawResult.records;

    let jobSourceDoc = await JobSource.findOne({ providerName: providerInfo.name });
    if (!jobSourceDoc) {
      jobSourceDoc = await JobSource.create({
        providerName: providerInfo.name,
        sourceType: providerInfo.type,
        apiEndpointUrl: providerInfo.endpoint,
        isPermittedSource: true
      });
    }

    let syncedCount = 0;

    for (const item of records) {
      const normalizedJob = this.normalizeJobRecord(item, jobSourceDoc._id);

      // Execute AI Fraud Risk Analysis Engine
      const fraudAnalysis = fraudDetectionEngine.analyzeJobListing(normalizedJob);

      normalizedJob.fraudRiskScore = fraudAnalysis.fraudRiskScore;
      normalizedJob.riskLevel = fraudAnalysis.riskLevel;
      normalizedJob.suspiciousIndicators = fraudAnalysis.suspiciousIndicators;
      normalizedJob.riskExplanation = fraudAnalysis.riskExplanation;
      normalizedJob.safetyWarnings = fraudAnalysis.safetyWarnings;

      await JobListing.findOneAndUpdate(
        { externalJobId: normalizedJob.externalJobId },
        { $set: normalizedJob },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    return { provider: jobSourceDoc.providerName, syncedCount, timestamp: jobSourceDoc.lastIngestedAt };
  }

  normalizeJobRecord(item, jobSourceObjectId) {
    return {
      externalJobId: item.job_id || `JOB-${Date.now()}`,
      title: item.job_title || 'General Employment Position',
      companyName: item.company || 'Government / Public Sector',
      location: item.location || 'Pan India',
      salaryRange: item.salary || 'Not Specified',
      jobType: item.employment_type || 'Full-Time',
      description: item.description_text || 'No description provided.',
      requirements: item.requirements_list || [],
      officialApplyUrl: item.apply_url || 'https://www.ncs.gov.in/',
      contactEmail: item.contact_email || '',
      jobSourceRef: jobSourceObjectId
    };
  }
}

module.exports = new JobDataService();
