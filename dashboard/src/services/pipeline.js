
export const EXCLUDED_USERNAMES = new Set([
  "delhipollution",
  "ani",
  "ani_news",
  "epccdpunjab",
  "epapunjab",
  "pscasafecities"
]);

export const OFF_TOPIC_PATTERNS = [
  [/\bcricket\b/i, "Cricket sports scheduling & matches"],
  [/\bpcbmedia\b/i, "Pakistan Cricket Board media"],
  [/\bchampions trophy\b/i, "Cricket Champions Trophy"],
  [/\bbcci\b/i, "Indian cricket board banter"],
  [/\bgadani\b/i, "Gadani maritime ship scrapping"],
  [/\bship breaking\b/i, "Maritime ship breaking"],
  [/\bship-breaking\b/i, "Maritime ship breaking"],
  [/\bmaritime\b/i, "Maritime ship issues"],
  [/\bship\b.*salvage/i, "Ship salvage discussions"],
  [/\bbeach\b.*steel/i, "Beached vessel steel salvaging"],
  [/\bsalvaged\b.*steel/i, "Beached vessel steel salvaging"],
  [/\bpizza\b/i, "Food / Pizza chain discussions"],
  [/\bcheezious\b/i, "Fast food restaurant discussion"],
  [/\bkababjees\b/i, "Fast food restaurant discussion"],
  [/\bwedding\b/i, "Personal wedding / fitness remarks"],
  [/\barunachal\b/i, "Arunachal Pradesh / Brahmaputra dam controversy"],
  [/\bbrahmaputra\b/i, "Brahmaputra dam controversy"],
  [/\bshillong\b/i, "Northeast India state discussions"],
  [/\bmanipur\b/i, "Manipur politics discussions"],
  [/\bzog\b/i, "Online political flame wars"],
  [/\bturkroach\b/i, "Online ethnic slurs"],
  [/\binbred\b/i, "Online ethnic slurs"],
  [/\biq in the world\b/i, "Online trolling query"],
  [/\bamerica\b.*allegory/i, "Beached ship allegory commentary"]
];

export const INDIAN_DOMESTIC_PATTERNS = [
  [/\bdelhi\b/i, "Delhi domestic pollution discourse"],
  [/\bdehli\b/i, "Delhi domestic pollution discourse"],
  [/\bncr\b/i, "National Capital Region (India)"],
  [/\bharyana\b/i, "Haryana state (India)"],
  [/\bnoida\b/i, "Noida (India)"],
  [/\bgurugram\b/i, "Gurugram (India)"],
  [/\bgurgaon\b/i, "Gurgaon (India)"],
  [/\bcaqm\b/i, "Commission for Air Quality Management (India)"],
  [/\bfaridkot\b/i, "Faridkot district (Indian Punjab)"],
  [/\bludhiana\b/i, "Ludhiana (Indian Punjab)"],
  [/\bchandigarh\b/i, "Chandigarh (India)"],
  [/\bpatiala\b/i, "Patiala (Indian Punjab)"],
  [/\bbathinda\b/i, "Bathinda (Indian Punjab)"],
  [/\bjalandhar\b/i, "Jalandhar (Indian Punjab)"],
  [/\baap punjab\b/i, "Aam Aadmi Party Punjab (India)"],
  [/\baamaadmiparty\b/i, "Aam Aadmi Party (India)"],
  [/\bbjp\b/i, "Bharatiya Janata Party politics"],
  [/\bdiwali\b/i, "Diwali firecracker pollution debates"],
  [/\bcrackers\b/i, "Diwali firecracker debates"],
  [/\bbrahmos\b/i, "Indian missile banter"],
  [/\brekha gov\b/i, "Indian local government praise/criticism"],
  [/\bnarendramodi\b/i, "Indian Prime Minister political banter"],
  [/\bcongress\b/i, "Indian Congress Party political banter"],
  [/\bcm mann\b/i, "Chief Minister Bhagwant Mann (Punjab, India)"],
  [/\bbhagwant mann\b/i, "Chief Minister Bhagwant Mann (Punjab, India)"],
  [/\bbuddha nullah\b/i, "Buddha Nullah water pollution (Ludhiana, India)"],
  [/\bchitti bein\b/i, "Chitti Bein river pollution (Indian Punjab)"],
  [/\bsatluj\b/i, "Satluj river pollution movement (Indian Punjab)"],
  [/\bcpcb\b/i, "Central Pollution Control Board (India)"],
  [/\bkejriwal\b/i, "Arvind Kejriwal Delhi air pollution debates"]
];

export const AIR_QUALITY_PATTERNS = [
  /\baqi\b/i, /air quality/i, /pollution/i, /polluted/i, /smog/i, /clean air/i,
  /cleaner air/i, /pm2\.5/i, /pm10/i, /stubble burning/i, /crop-fire/i, /crop fire/i,
  /crop residue/i, /parali/i, /smoke/i, /respiratory/i, /air index/i, /haze/i,
  /anti-smog/i, /smog gun/i, /environment/i, /green lockdown/i, /artificial rain/i,
  /air burning/i, /hazardous air/i, /toxic air/i
];

export const URDU_AQ_TERMS = ['سموگ', 'آلودہ', 'آلودگی', 'ہوا', 'ماحول'];

export const PAK_GEO_PATTERNS = [
  /\blahore\b/i, /\bgujranwala\b/i, /\bpakistan\b/i, /\bpunjab\b/i, /\bfaisalabad\b/i,
  /\bmultan\b/i, /\brawalpindi\b/i, /\bislamabad\b/i, /\bsialkot\b/i, /\battock\b/i,
  /\bsheikhupura\b/i, /\bkasur\b/i, /\bsargodha\b/i, /\bbahawalpur\b/i, /\bsahiwal\b/i,
  /\bpeshawar\b/i, /\bkarachi\b/i, /\bgwmc\b/i, /\blwmc\b/i, /\bmaryam\b/i, /\bshehbaz\b/i
];

export const URDU_GEO_TERMS = ['لاہور', 'پنجاب', 'پاکستان', 'گوجرانوالہ', 'فیصل آباد', 'ملتان', 'راولپنڈی', 'اسلام آباد'];

export const COMMON_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself',
  'yourselves', 'will', 'today', 'yesterday', 'tomorrow', 'also', 'people', 'many', 'much', 'like', 'news'
]);

export const COMMON_PUNJAB_LOCALITIES = [
  'muridke', 'kasur', 'raiwind', 'okara', 'wazirabad', 'kamoke', 'changa manga',
  'kot lakhpat', 'gulberg', 'model town', 'dha', 'mall road', 'anarkali', 'shahdara',
  'johar town', 'mughalpura', 'cantt', 'wapda town', 'burewala', 'vehari', 'pakpattan',
  'jhang', 'chiniot', 'khanewal', 'muzaffargarh', 'dera ghazi khan', 'dg khan',
  'mianwali', 'bhakkar', 'khushab', 'chakwal', 'jhelum', 'gujrat', 'hafizabad',
  'nankana', 'nankana sahib', 'chunian', 'pattoki', 'lodhran', 'layyah', 'bahawalnagar',
  'toba tek singh', 'mandi bahauddin', 'narowal', 'attock', 'sharaqpur', 'sheikhupura'
];

export const COMMON_AIR_HEALTH_TERMS = [
  'dhund', 'ghutan', 'fog', 'foggy', 'throat', 'cough', 'coughing', 'chest', 'breathing',
  'breathe', 'suffocating', 'suffocation', 'allergy', 'masks', 'mask', 'haze', 'hazy',
  'visibility', 'air index', 'atmosphere', 'inversion', 'toxic', 'smoke', 'dust', 'burning eyes',
  'burning throat', 'eye irritation', 'smoggy', 'air quality', 'air crisis', 'pollution'
];

export function extractLearningCandidates(post, exclusionCategory = '', exclusionReason = '') {
  const candidates = [];
  const text = (post.text || '').trim();
  const textLower = text.toLowerCase();
  const handle = (post.authorUsername || '').toLowerCase().trim().replace('@', '');

  if (handle) {
    candidates.push({
      rule_type: 'author_whitelist',
      rule_value: handle,
      label: `Trust Author: @${handle}`,
      description: `Whitelist @${handle} as trusted source (bypasses generic filter constraints)`,
      recommended: true
    });
  }

  if (exclusionCategory === 'NO_AIR_QUALITY_RELEVANCE' || exclusionReason.toLowerCase().includes('air quality')) {
    const foundTerms = new Set();
    for (const term of COMMON_AIR_HEALTH_TERMS) {
      const reg = new RegExp(`\\b${term}\\b`, 'i');
      if (reg.test(textLower)) {
        foundTerms.add(term);
        candidates.push({
          rule_type: 'aq_keyword',
          rule_value: term,
          label: `Learn AQ Term: "${term}"`,
          description: `Add '${term}' to the positive air quality vocabulary dictionary`,
          recommended: true
        });
      }
    }

    const cleanTokens = textLower.match(/\b[a-z]{4,}\b/g) || [];
    const unseen = cleanTokens.filter(w => !COMMON_STOP_WORDS.has(w) && !foundTerms.has(w) && w !== handle).slice(0, 2);
    unseen.forEach(token => {
      candidates.push({
        rule_type: 'aq_keyword',
        rule_value: token,
        label: `Candidate AQ Keyword: "${token}"`,
        description: `Add word '${token}' from post to air quality dictionary`,
        recommended: false
      });
    });
  }

  if (exclusionCategory === 'NO_GEOGRAPHIC_RELEVANCE' || exclusionReason.toLowerCase().includes('geographic')) {
    const foundLocs = new Set();
    for (const loc of COMMON_PUNJAB_LOCALITIES) {
      const reg = new RegExp(`\\b${loc}\\b`, 'i');
      if (reg.test(textLower)) {
        foundLocs.add(loc);
        const titleLoc = loc.charAt(0).toUpperCase() + loc.slice(1);
        candidates.push({
          rule_type: 'geo_keyword',
          rule_value: titleLoc,
          label: `Learn Punjab Locality: "${titleLoc}"`,
          description: `Add '${titleLoc}' to recognized Punjab target geography`,
          recommended: true
        });
      }
    }

    const capitalized = text.match(/\b[A-Z][a-z]{3,}\b/g) || [];
    capitalized.forEach(cap => {
      const capLower = cap.toLowerCase();
      if (!COMMON_STOP_WORDS.has(capLower) && !foundLocs.has(capLower) && capLower !== handle) {
        candidates.push({
          rule_type: 'geo_keyword',
          rule_value: cap,
          label: `Candidate Locality: "${cap}"`,
          description: `Register '${cap}' as a target locality in Punjab`,
          recommended: false
        });
      }
    });
  }

  if (exclusionCategory === 'OFF_TOPIC' || exclusionReason.toLowerCase().includes('unrelated topic')) {
    let matchedTrigger = 'off_topic';
    for (const [pat] of OFF_TOPIC_PATTERNS) {
      const m = textLower.match(pat);
      if (m) {
        matchedTrigger = m[0];
        break;
      }
    }
    candidates.push({
      rule_type: 'off_topic_exception',
      rule_value: `${matchedTrigger}+smog`,
      label: `Contextual Exception: "${matchedTrigger} + smog"`,
      description: `Do not discard posts mentioning '${matchedTrigger}' when smog/AQI context is present`,
      recommended: true
    });
  }

  if (exclusionCategory === 'EXCLUDED_INDIAN_CONTEXT') {
    candidates.push({
      rule_type: 'indian_exception',
      rule_value: 'cross_border_comparison',
      label: 'Allow Transboundary/Comparison Exception',
      description: 'Permit posts comparing Indian and Pakistani pollution when Pakistan/Lahore is referenced',
      recommended: true
    });
  }

  return candidates;
}

export function normalizeTextForDedup(text) {
  if (!text) return '';
  let t = text.replace(/^(?:@\w+\s*)+/g, '');
  t = t.replace(/https?:\/\/\S+/g, '');
  t = t.replace(/[^\w\s]/g, '');
  return t.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function enrichPost(p) {
  const text = (p.text || '').trim();
  const textLower = text.toLowerCase();

  let aqiVal = null;
  const m = textLower.match(/\baqi\b\s*(?:of|is|reached|crossed|at|around)?\s*[:=-]?\s*([0-9]{2,4})/);
  if (m) {
    const val = parseInt(m[1], 10);
    if (!isNaN(val)) aqiVal = val;
  }
  if (!aqiVal) {
    const m2 = textLower.match(/([0-9]{2,4})\s*(?:\+)?\s*\baqi\b/);
    if (m2) {
      const val = parseInt(m2[1], 10);
      if (!isNaN(val)) aqiVal = val;
    }
  }

  let severity = "Unspecified";
  let severityCode = "unspecified";
  if (aqiVal) {
    if (aqiVal >= 301) {
      severity = "Hazardous";
      severityCode = "hazardous";
    } else if (aqiVal >= 201) {
      severity = "Very Unhealthy";
      severityCode = "very_unhealthy";
    } else if (aqiVal >= 151) {
      severity = "Unhealthy";
      severityCode = "unhealthy";
    } else if (aqiVal >= 101) {
      severity = "Unhealthy for Sensitive Groups";
      severityCode = "sensitive";
    } else if (aqiVal >= 51) {
      severity = "Moderate";
      severityCode = "moderate";
    } else {
      severity = "Good";
      severityCode = "good";
    }
  } else {
    if (['hazardous', 'emergency', 'toxic', 'highest in world', 'deadly', 'chamber', 'alarm'].some(w => textLower.includes(w))) {
      severity = "Severe / Hazardous Alert";
      severityCode = "hazardous";
    }
  }

  let city = "Punjab Region";
  if (/\blahore\b/i.test(textLower) || text.includes('لاہور')) {
    city = "Lahore";
  } else if (/\bgujranwala\b/i.test(textLower) || text.includes('گوجرانوالہ')) {
    city = "Gujranwala";
  } else if (/\bfaisalabad\b/i.test(textLower) || text.includes('فیصل آباد')) {
    city = "Faisalabad";
  } else if (/\bmultan\b/i.test(textLower) || text.includes('ملتان')) {
    city = "Multan";
  } else if (/\battock\b/i.test(textLower)) {
    city = "Attock";
  } else if (/\brawalpindi\b/i.test(textLower) || text.includes('راولپنڈی')) {
    city = "Rawalpindi";
  } else if (/\bislamabad\b/i.test(textLower) || text.includes('اسلام آباد')) {
    city = "Islamabad";
  } else if (/\bsialkot\b/i.test(textLower)) {
    city = "Sialkot";
  }

  let category = "Citizen Outcry & Reaction";
  if (['advisory', 'masks', 'health', 'hospital', 'infection', 'breathe', 'children', 'eyes'].some(w => textLower.includes(w))) {
    category = "Public Health Alert";
  } else if (['enforcement', 'squad', 'anti-smog gun', 'crackdown', 'fines', 'challan', 'arrest', 'buses', 'e-buses', 'suthra', 'inspection'].some(w => textLower.includes(w))) {
    category = "Government & Enforcement Action";
  } else if (['nasa', 'satellite', 'ranking', 'tops', 'charts', 'readings', 'monitored', 'iqair', 'paqi'].some(w => textLower.includes(w))) {
    category = "AQI Measurement & Satellite Data";
  } else if (['stubble', 'crop fire', 'parali', 'farmers', 'straw', 'burning'].some(w => textLower.includes(w))) {
    category = "Agricultural Stubble Burning";
  }

  let sentiment = "Informative / Neutral";
  if (['hell', 'killing', 'burn', 'dying', 'villain', 'worst', 'disaster', 'suffocating', 'shame', 'choking'].some(w => textLower.includes(w))) {
    sentiment = "Critical / Alarmed";
  } else if (['alhamdulillah', 'mashallah', 'progress', 'cleaning', 'cleanest', 'solution', 'e-buses', 'commendable', 'milestone'].some(w => textLower.includes(w))) {
    sentiment = "Positive / Solution-Oriented";
  } else if (['concern', 'plea', 'wear masks', 'request', 'advise', 'stay safe', 'precaution'].some(w => textLower.includes(w))) {
    sentiment = "Concerned";
  }

  let mediaList = [];
  const rawMedia = p.mediaUrls;
  if (typeof rawMedia === 'string') {
    mediaList = rawMedia.split(';').map(u => u.trim()).filter(Boolean);
  } else if (Array.isArray(rawMedia)) {
    mediaList = rawMedia.filter(u => typeof u === 'string' && u.trim());
  }

  const likes = parseInt(p.likes, 10) || 0;
  const retweets = parseInt(p.retweets, 10) || 0;
  const replies = parseInt(p.replies, 10) || 0;
  const quotes = parseInt(p.quotes, 10) || 0;
  const views = parseInt(p.views, 10) || 0;
  const totalEngagement = likes + (retweets * 2) + (replies * 2) + (quotes * 2);

  return {
    ...p,
    clean_id: String(p.id || ''),
    postUrl: p.postUrl || `https://x.com/${p.authorUsername}/status/${p.id}`,
    aqi_value: aqiVal,
    severity,
    severity_code: severityCode,
    city_detected: city,
    category,
    sentiment,
    mediaUrls: mediaList,
    has_media: mediaList.length > 0,
    media_count: mediaList.length,
    total_engagement: totalEngagement,
    authorVerified: Boolean(p.authorVerified)
  };
}

export function processRawPosts(rawPosts, existingPosts = [], learnedRules = null) {
  const seenIds = new Set(existingPosts.map(p => String(p.id || p.clean_id)));
  const seenNormalizedTexts = new Map();

  const learnedAuthors = new Set((learnedRules?.author_whitelist || []).map(a => a.toLowerCase().trim().replace('@', '')));
  const learnedAqList = (learnedRules?.aq_keywords || []).map(k => k.trim().toLowerCase()).filter(Boolean);
  const learnedGeoList = (learnedRules?.geo_keywords || []).map(k => k.trim().toLowerCase()).filter(Boolean);
  const learnedExceptions = (learnedRules?.off_topic_exceptions || []).map(e => e.trim().toLowerCase()).filter(Boolean);
  const hasIndianComparison = (learnedRules?.indian_exceptions || []).some(e => e.includes('comparison') || e.includes('cross_border'));

  existingPosts.forEach(ep => {
    const norm = normalizeTextForDedup(ep.text);
    if (norm.length > 15) {
      seenNormalizedTexts.set(norm, ep);
    }
  });

  const validPosts = [...existingPosts];
  const newlyAddedPosts = [];
  const auditLog = [];
  const noisePosts = [];

  const recordNoise = (idx, pid, handle, text, category, reason, p) => {
    let mediaList = [];
    if (Array.isArray(p.mediaUrls)) {
      mediaList = p.mediaUrls;
    } else if (typeof p.mediaUrls === 'string') {
      mediaList = p.mediaUrls.split(';').map(u => u.trim()).filter(Boolean);
    }

    auditLog.push({
      index: idx,
      id: pid,
      author: handle,
      status: "REMOVED",
      category,
      reason,
      text
    });

    noisePosts.push({
      id: pid,
      clean_id: pid,
      authorUsername: handle,
      authorName: p.authorName || handle,
      text,
      createdAt: p.createdAt || new Date().toISOString(),
      postUrl: p.postUrl || `https://x.com/${handle}/status/${pid}`,
      mediaUrls: mediaList,
      likes: parseInt(p.likes, 10) || 0,
      retweets: parseInt(p.retweets, 10) || 0,
      replies: parseInt(p.replies, 10) || 0,
      quotes: parseInt(p.quotes, 10) || 0,
      views: p.views,
      authorAvatar: p.authorAvatar || '',
      authorVerified: Boolean(p.authorVerified),
      authorDescription: p.authorDescription || '',
      exclusionCategory: category,
      exclusionReason: reason,
      status: 'EXCLUDED'
    });
  };

  rawPosts.forEach((p, idx) => {
    const pid = String(p.id || '');
    const handle = (p.authorUsername || '').toLowerCase().trim().replace('@', '');
    const text = (p.text || '').trim();
    const textLower = text.toLowerCase();
    const authorBio = (p.authorDescription || '').toLowerCase();

    const isTrustedAuthor = learnedAuthors.has(handle);

    if (seenIds.has(pid)) {
      auditLog.push({
        index: idx,
        id: pid,
        author: handle,
        status: "REMOVED",
        category: "DUPLICATE_ID",
        reason: `Duplicate post ID ${pid} (already indexed)`,
        text
      });
      return;
    }

    if (EXCLUDED_USERNAMES.has(handle) && !isTrustedAuthor) {
      recordNoise(idx, pid, handle, text, "EXCLUDED_ACCOUNT",
        `Author @${handle} matches negative search query constraint (-from:@${handle})`, p);
      return;
    }

    if (/[\u0a00-\u0a7f]/.test(text)) {
      recordNoise(idx, pid, handle, text, "EXCLUDED_INDIAN_CONTEXT",
        "Contains Gurmukhi script associated with Indian Punjab domestic affairs", p);
      return;
    }

    let offTopicReason = null;
    for (const [pat, desc] of OFF_TOPIC_PATTERNS) {
      if (pat.test(textLower)) {
        
        let hasException = false;
        for (const exc of learnedExceptions) {
          const parts = exc.split('+').map(pt => pt.trim()).filter(Boolean);
          if (parts.length && parts.every(pt => textLower.includes(pt))) {
            hasException = true;
            break;
          }
        }

        const hasStrongAq = AIR_QUALITY_PATTERNS.some(a => a.test(textLower));
        const hasStrongGeo = PAK_GEO_PATTERNS.some(g => g.test(textLower));

        if (isTrustedAuthor || hasException || (hasStrongAq && hasStrongGeo && textLower.includes('cricket') && textLower.includes('smog'))) {
          offTopicReason = null;
          break;
        } else {
          offTopicReason = desc;
          break;
        }
      }
    }
    if (offTopicReason) {
      recordNoise(idx, pid, handle, text, "OFF_TOPIC", `Unrelated topic: ${offTopicReason}`, p);
      return;
    }

    let indianReason = null;
    for (const [pat, desc] of INDIAN_DOMESTIC_PATTERNS) {
      if (pat.test(textLower)) {
        const hasPakPrimary = ['lahore', 'pakistan', 'maryam nawaz', 'pakistani'].some(g => textLower.includes(g));
        const isPureIndianAuthor = [
          'faridkotpolice', 'caqm_official', 'pb_khabarnama', 'drshamamohd',
          'rohini_sgh', 'archiesriva', 'rahul1979601', 'sharma_views', 'gss_views',
          'navdeepdahiya55', 'kushanmitra', 'johnsmith28vu', 'nikku_aap', 'tejasvi_minhas', 'aappunjab'
        ].includes(handle);
        const hasPureIndianTerms = [
          'caqm', 'faridkot', 'cm mann', 'bhagwant mann', 'buddha nullah',
          'brahmos', 'gurgaon', 'gurugram', 'jalandhar', 'sutlej', 'chitti bein'
        ].some(k => textLower.includes(k));

        if (hasIndianComparison && hasPakPrimary && !isPureIndianAuthor) {
          indianReason = null;
          break;
        } else if (isPureIndianAuthor || hasPureIndianTerms || !hasPakPrimary) {
          indianReason = desc;
          break;
        }
      }
    }
    if (indianReason && !isTrustedAuthor) {
      recordNoise(idx, pid, handle, text, "EXCLUDED_INDIAN_CONTEXT",
        `Matches negative query criteria: ${indianReason}`, p);
      return;
    }

    const hasAq = (
      isTrustedAuthor ||
      AIR_QUALITY_PATTERNS.some(pat => pat.test(textLower)) ||
      URDU_AQ_TERMS.some(t => text.includes(t)) ||
      learnedAqList.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(textLower))
    );
    if (!hasAq) {
      recordNoise(idx, pid, handle, text, "NO_AIR_QUALITY_RELEVANCE",
        "Does not contain positive air quality, smog, or pollution keywords", p);
      return;
    }

    let hasGeo = (
      isTrustedAuthor ||
      PAK_GEO_PATTERNS.some(pat => pat.test(textLower)) ||
      URDU_GEO_TERMS.some(t => text.includes(t)) ||
      learnedGeoList.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(textLower))
    );
    if (!hasGeo && ['pakistan', 'lahore', 'punjab'].some(pat => authorBio.includes(pat))) {
      hasGeo = true;
    }

    if (!hasGeo) {
      recordNoise(idx, pid, handle, text, "NO_GEOGRAPHIC_RELEVANCE",
        "Does not relate geographically to Lahore, Pakistani Punjab, or Pakistan", p);
      return;
    }

    const normText = normalizeTextForDedup(text);
    if (normText.length > 15 && seenNormalizedTexts.has(normText)) {
      const primaryPost = seenNormalizedTexts.get(normText);
      
      let pMedia = p.mediaUrls || [];
      if (typeof pMedia === 'string') pMedia = pMedia.split(';').map(u => u.trim()).filter(Boolean);
      const existingMedia = new Set(primaryPost.mediaUrls || []);
      pMedia.forEach(u => existingMedia.add(u));
      primaryPost.mediaUrls = Array.from(existingMedia);
      primaryPost.media_count = primaryPost.mediaUrls.length;
      primaryPost.has_media = primaryPost.media_count > 0;

      ['likes', 'retweets', 'replies', 'quotes', 'views'].forEach(metric => {
        primaryPost[metric] = Math.max(parseInt(primaryPost[metric], 10) || 0, parseInt(p[metric], 10) || 0);
      });

      auditLog.push({
        index: idx,
        id: pid,
        author: handle,
        status: "DUPLICATE_MERGED",
        category: "SEMANTIC_DUPLICATE",
        reason: `Semantic duplicate of post ID ${primaryPost.id || primaryPost.clean_id} (merged media and engagement)`,
        text,
        merged_into_id: primaryPost.id || primaryPost.clean_id
      });
      return;
    }

    const enriched = enrichPost(p);
    seenIds.add(pid);
    if (normText.length > 15) {
      seenNormalizedTexts.set(normText, enriched);
    }
    validPosts.push(enriched);
    newlyAddedPosts.push(enriched);

    auditLog.push({
      index: idx,
      id: pid,
      author: handle,
      status: "KEPT",
      category: "VERIFIED_VALID",
      reason: `Verified air quality post for ${enriched.city_detected} (${enriched.category})`,
      text,
      aqi_value: enriched.aqi_value,
      severity: enriched.severity,
      city: enriched.city_detected
    });
  });

  return {
    cleanPosts: validPosts,
    newlyAddedPosts,
    auditLog,
    noisePosts,
    stats: {
      totalIngested: rawPosts.length,
      newCleanCount: newlyAddedPosts.length,
      totalCleanCount: validPosts.length,
      duplicatesMerged: auditLog.filter(a => a.status === 'DUPLICATE_MERGED').length,
      removedCount: noisePosts.length
    }
  };
}