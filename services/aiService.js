const crypto = require('crypto');
const { GovtScheme, AiCache } = require('../models');
const aiProvider = require('../ai/aiProvider');

class AiService {
  /**
   * Simplify policy legalese with automatic MongoDB caching (AiCache)
   */
  async simplifyGovtScheme(schemeId, targetLanguage = 'en') {
    const scheme = await GovtScheme.findById(schemeId);
    if (!scheme) {
      throw new Error('Government scheme not found');
    }

    // Generate unique MD5 hash of raw content + language to use as cache key
    const inputHash = crypto.createHash('md5').update(`${scheme.officialSchemeId}_${scheme.rawDescription}_${targetLanguage}`).digest('hex');
    const cacheKey = `SIMPLIFY_${scheme._id}_${targetLanguage}_${inputHash}`;

    // Check if simplified output exists in AiCache
    const cachedEntry = await AiCache.findOne({ cacheKey });
    if (cachedEntry) {
      console.log(`[AiService Cache Hit]: Serving cached simplification for scheme ${scheme.title}`);
      return {
        schemeId: scheme._id,
        title: scheme.title,
        officialSourceUrl: scheme.officialSourceUrl,
        officialSchemeId: scheme.officialSchemeId,
        cached: true,
        simplifiedData: cachedEntry.cachedOutput
      };
    }

    console.log(`[AiService Cache Miss]: Invoking AI Provider for scheme ${scheme.title}`);
    const simplifiedResult = await aiProvider.simplifyPolicy(scheme, targetLanguage);

    // Save simplified result in MongoDB AiCache (auto-expires in 7 days via TTL index)
    await AiCache.create({
      cacheKey,
      taskType: 'POLICY_SIMPLIFICATION',
      inputHash,
      cachedOutput: simplifiedResult
    });

    // Update scheme record to mark as simplified
    scheme.simplifiedSummary = simplifiedResult.summary;
    scheme.isSimplified = true;
    await scheme.save();

    return {
      schemeId: scheme._id,
      title: scheme.title,
      officialSourceUrl: scheme.officialSourceUrl,
      officialSchemeId: scheme.officialSchemeId,
      cached: false,
      simplifiedData: simplifiedResult
    };
  }
}

module.exports = new AiService();
