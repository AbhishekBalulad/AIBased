const { GovtScheme, SchemeSource } = require('../models');
const govtApiAdapter = require('../integrations/govtApiAdapter');

class GovtDataService {
  /**
   * Run automated synchronization pipeline from official government API adapters
   */
  async syncGovernmentSchemes() {
    console.log('[GovtDataService] Starting official government scheme synchronization pipeline...');

    // 1. Fetch raw records from Govt API Adapter
    const rawResult = await govtApiAdapter.fetchFromDataGov();
    const sourceInfo = rawResult.source;
    const records = rawResult.records;

    // 2. Ensure SchemeSource record exists in database
    let schemeSourceDoc = await SchemeSource.findOne({ sourceName: sourceInfo.name });
    if (!schemeSourceDoc) {
      schemeSourceDoc = await SchemeSource.create({
        sourceName: sourceInfo.name,
        baseUrl: sourceInfo.baseUrl,
        apiEndpoint: '/resource',
        ministryOrDepartment: sourceInfo.ministry,
        syncStatus: 'SYNCING'
      });
    } else {
      schemeSourceDoc.syncStatus = 'SYNCING';
      await schemeSourceDoc.save();
    }

    let syncedCount = 0;

    // 3. Normalize and Upsert raw scheme data into GovtScheme collection
    for (const item of records) {
      const normalizedScheme = this.normalizeSchemeRecord(item, schemeSourceDoc._id);

      await GovtScheme.findOneAndUpdate(
        { officialSchemeId: normalizedScheme.officialSchemeId },
        { $set: normalizedScheme },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    // 4. Update SchemeSource metadata
    schemeSourceDoc.lastSyncTimestamp = new Date();
    schemeSourceDoc.syncStatus = 'ACTIVE';
    schemeSourceDoc.recordsFetched = syncedCount;
    await schemeSourceDoc.save();

    console.log(`[GovtDataService] Synchronization completed successfully. ${syncedCount} schemes synced into database.`);

    return {
      source: schemeSourceDoc.sourceName,
      syncedCount,
      timestamp: schemeSourceDoc.lastSyncTimestamp
    };
  }

  /**
   * Data Normalizer: Maps raw external API fields to standardized Mongoose GovtScheme schema
   */
  normalizeSchemeRecord(item, sourceObjectId) {
    const parseList = (text) => {
      if (!text) return [];
      if (Array.isArray(text)) return text;
      return text.split('. ').map(s => s.trim()).filter(Boolean);
    };

    return {
      officialSchemeId: item.scheme_id || `GOV-${Date.now()}`,
      title: item.scheme_name || 'Government Welfare Scheme',
      category: item.category || 'General',
      rawDescription: item.raw_content || item.description || 'No raw content provided.',
      simplifiedSummary: item.raw_content || 'Summary available via AI simplification engine.',
      benefits: parseList(item.benefits_text),
      eligibilityCriteria: parseList(item.eligibility_text),
      requiredDocuments: parseList(item.documents_text),
      applicationProcedure: parseList(item.procedure_text),
      officialSourceUrl: item.source_url || 'https://www.myscheme.gov.in/',
      schemeSourceRef: sourceObjectId,
      targetAudience: 'All Eligible Citizens',
      state: item.state || 'All India',
      isSimplified: false
    };
  }
}

module.exports = new GovtDataService();
