/**
 * EPA Punjab Air Quality Intelligence — Canonical Frontend Taxonomy
 * Complete 16-category Noise Taxonomy and 6-category Relevant Taxonomy.
 */

export const NOISE_TAXONOMY = {
  GOVT_BUREAUCRATIC_PR: {
    code: 'GOVT_BUREAUCRATIC_PR',
    label: 'Government Protocol / Meeting PR',
    description: 'Meeting minutes, photo-ops, ceremonial visits, speeches, or protocol without field data/enforcement',
    group: 'Institutional & Commercial',
    icon: 'AccountBalanceRounded',
    color: '#64748b',
    samplePhrases: ['chaired review meeting', 'chaired meeting', 'delegation called on', 'reviewed progress']
  },
  FOREIGN_AGENCY_DOMESTIC: {
    code: 'FOREIGN_AGENCY_DOMESTIC',
    label: 'Foreign Regulatory Agency (CAQM/India)',
    description: 'Indian regulatory boards, orders, and policies (CAQM, CPCB, DPCC, GRAP stages, Delhi municipal rules)',
    group: 'Geographic & Indian Context',
    icon: 'PublicRounded',
    color: '#0284c7',
    samplePhrases: ['caqm', 'cpcb', 'grap stage', 'delhi pollution control committee']
  },
  INDIAN_DOMESTIC_GOVERNANCE: {
    code: 'INDIAN_DOMESTIC_GOVERNANCE',
    label: 'Indian Domestic Politics & Debates',
    description: 'Indian party politics and debates (BJP vs AAP, CM Mann, Indian Punjab district politics)',
    group: 'Geographic & Indian Context',
    icon: 'PolicyRounded',
    color: '#0369a1',
    samplePhrases: ['cm mann', 'bhagwant mann', 'aap punjab', 'bjp', 'kejriwal']
  },
  GURMUKHI_SCRIPT_DOMESTIC: {
    code: 'GURMUKHI_SCRIPT_DOMESTIC',
    label: 'Gurmukhi Script (Indian Punjab)',
    description: 'Posts in Gurmukhi script concerning Indian Punjab domestic matters',
    group: 'Geographic & Indian Context',
    icon: 'TranslateRounded',
    color: '#0891b2',
    samplePhrases: []
  },
  INDIAN_FIRECRACKER_DEBATES: {
    code: 'INDIAN_FIRECRACKER_DEBATES',
    label: 'Indian Diwali & Firecracker Debates',
    description: 'Seasonal Indian Diwali and firecracker disputes (diwali, crackers) without cross-border relevance',
    group: 'Geographic & Indian Context',
    icon: 'LocalFireDepartmentRounded',
    color: '#ea580c',
    samplePhrases: ['diwali crackers', 'green crackers', 'firecracker ban']
  },
  INDIAN_WATER_DISPUTES: {
    code: 'INDIAN_WATER_DISPUTES',
    label: 'Indian River / Water Pollution Disputes',
    description: 'Indian river and nullah pollution movements (Buddha Nullah, Chitti Bein, Satluj)',
    group: 'Geographic & Indian Context',
    icon: 'WaterDamageRounded',
    color: '#2563eb',
    samplePhrases: ['buddha nullah', 'chitti bein', 'satluj river pollution']
  },
  METAPHORICAL_OR_SARCASTIC: {
    code: 'METAPHORICAL_OR_SARCASTIC',
    label: 'Metaphorical or Sarcastic Smog',
    description: "Figurative or symbolic usage of smog words ('smog of corruption', 'political fog', 'toxic boss')",
    group: 'Language & Metaphors',
    icon: 'PsychologyRounded',
    color: '#9333ea',
    samplePhrases: ['smog of corruption', 'political smog', 'toxic culture', 'toxic boss']
  },
  BENIGN_WEATHER_FOG: {
    code: 'BENIGN_WEATHER_FOG',
    label: 'Benign Weather / Ordinary Winter Fog',
    description: 'Normal winter fog (dhund) or routine forecasts with no air quality hazard, smoke, or AQI crisis',
    group: 'Language & Metaphors',
    icon: 'CloudRounded',
    color: '#6b7280',
    samplePhrases: ['morning fog', 'pleasant morning', 'winter fog cold']
  },
  SPORTS_AND_ENTERTAINMENT: {
    code: 'SPORTS_AND_ENTERTAINMENT',
    label: 'Sports, Cricket & Entertainment',
    description: 'Cricket scheduling, match banter, PCB news, Champions Trophy, concerts, and celebrity events',
    group: 'Off-Topic Subjects',
    icon: 'SportsCricketRounded',
    color: '#16a34a',
    samplePhrases: ['cricket match', 'champions trophy', 'pcb media', 'bcci']
  },
  COMMERCIAL_SPAM_AND_ADS: {
    code: 'COMMERCIAL_SPAM_AND_ADS',
    label: 'Commercial Advertising & Spam',
    description: 'Sales pitches for air purifiers, masks, HVAC filters, clinic ads, crypto, and marketing bots',
    group: 'Institutional & Commercial',
    icon: 'CampaignRounded',
    color: '#d97706',
    samplePhrases: ['air purifier sale', 'hepa filter discount', 'order on whatsapp']
  },
  LIFESTYLE_AND_FOOD: {
    code: 'LIFESTYLE_AND_FOOD',
    label: 'Lifestyle, Dining & Restaurant Reviews',
    description: 'Restaurant reviews (e.g. Cheezious, Kababjees), weddings, fitness, and personal life remarks',
    group: 'Off-Topic Subjects',
    icon: 'RestaurantRounded',
    color: '#f59e0b',
    samplePhrases: ['cheezious', 'kababjees', 'pizza deal', 'wedding fitness']
  },
  MARITIME_AND_SALVAGE: {
    code: 'MARITIME_AND_SALVAGE',
    label: 'Maritime & Ship Scrapping (Gadani)',
    description: 'Gadani ship-breaking, beached vessel steel salvaging discussions',
    group: 'Off-Topic Subjects',
    icon: 'DirectionsBoatRounded',
    color: '#475569',
    samplePhrases: ['gadani', 'ship breaking', 'beached vessel steel']
  },
  ONLINE_TROLLING_AND_FLAME_WARS: {
    code: 'ONLINE_TROLLING_AND_FLAME_WARS',
    label: 'Online Trolling & Flame Wars',
    description: 'Online flame wars, ethnic slurs, and trolling banter (zog, inbred, turkroach)',
    group: 'Off-Topic Subjects',
    icon: 'ReportProblemRounded',
    color: '#dc2626',
    samplePhrases: ['turkroach', 'inbred', 'iq in the world', 'zog']
  },
  UNRELATED_GEOPOLITICS: {
    code: 'UNRELATED_GEOPOLITICS',
    label: 'Unrelated Regional Geopolitics',
    description: 'Northeast India state controversies, Brahmaputra dam disputes, Manipur politics',
    group: 'Off-Topic Subjects',
    icon: 'FlagRounded',
    color: '#7c3aed',
    samplePhrases: ['brahmaputra dam', 'arunachal pradesh', 'manipur']
  },
  NO_AIR_QUALITY_RELEVANCE: {
    code: 'NO_AIR_QUALITY_RELEVANCE',
    label: 'No Air Quality or Pollution Relevance',
    description: 'General chatter completely devoid of any environmental, air quality, or atmospheric terms',
    group: 'Relevance & Geography',
    icon: 'BlockRounded',
    color: '#ef4444',
    samplePhrases: []
  },
  NO_GEOGRAPHIC_RELEVANCE: {
    code: 'NO_GEOGRAPHIC_RELEVANCE',
    label: 'No Geographic Link to Punjab/Pakistan',
    description: 'Genuine pollution discussions that are entirely global or outside Pakistan (e.g. California, London)',
    group: 'Relevance & Geography',
    icon: 'WrongLocationRounded',
    color: '#f97316',
    samplePhrases: []
  }
};

export const RELEVANT_TAXONOMY = {
  CITIZEN_GROUND_TRUTH: {
    code: 'CITIZEN_GROUND_TRUTH',
    label: 'Citizen Ground Truth / Public Outcry',
    description: 'Authentic citizen complaints, sensory reports (burning eyes, throat irritation, zero visibility), local smoke',
    icon: 'RecordVoiceOverRounded',
    color: '#e11d48'
  },
  OFFICIAL_ENFORCEMENT: {
    code: 'OFFICIAL_ENFORCEMENT',
    label: 'Government & Field Enforcement Action',
    description: 'Concrete, actionable field operations with real numbers (factories sealed, anti-smog guns, fines, arrests)',
    icon: 'SecurityRounded',
    color: '#059669'
  },
  MEASUREMENT_AQI_DATA: {
    code: 'MEASUREMENT_AQI_DATA',
    label: 'AQI Measurement & Sensor Data',
    description: 'Quantitative sensor readings, PM2.5 / PM10 numbers, and satellite monitoring (IQAir, PAQI)',
    icon: 'AnalyticsRounded',
    color: '#7c3aed'
  },
  PUBLIC_HEALTH_ADVISORY: {
    code: 'PUBLIC_HEALTH_ADVISORY',
    label: 'Public Health Advisory & Hospital Alert',
    description: 'Genuine medical warnings, hospital alerts, mask mandates, and health precautions',
    icon: 'LocalHospitalRounded',
    color: '#2563eb'
  },
  AGRICULTURAL_STUBBLE_BURNING: {
    code: 'AGRICULTURAL_STUBBLE_BURNING',
    label: 'Agricultural Stubble Burning (Parali)',
    description: 'Stubble burning reports and crop residue fires directly affecting Punjab air quality',
    icon: 'AgricultureRounded',
    color: '#d97706'
  },
  CROSS_BORDER_INSIGHT: {
    code: 'CROSS_BORDER_INSIGHT',
    label: 'Cross-Border / Transboundary Analysis',
    description: 'Legitimate transboundary environmental science (wind trajectories, cross-border smog flow)',
    icon: 'CompareArrowsRounded',
    color: '#0284c7'
  }
};

export const NOISE_GROUPS = [
  {
    groupName: 'Institutional & Commercial',
    categories: ['GOVT_BUREAUCRATIC_PR', 'COMMERCIAL_SPAM_AND_ADS']
  },
  {
    groupName: 'Geographic & Indian Context',
    categories: [
      'FOREIGN_AGENCY_DOMESTIC',
      'INDIAN_DOMESTIC_GOVERNANCE',
      'GURMUKHI_SCRIPT_DOMESTIC',
      'INDIAN_FIRECRACKER_DEBATES',
      'INDIAN_WATER_DISPUTES'
    ]
  },
  {
    groupName: 'Language & Metaphors',
    categories: ['METAPHORICAL_OR_SARCASTIC', 'BENIGN_WEATHER_FOG']
  },
  {
    groupName: 'Off-Topic Subjects',
    categories: [
      'SPORTS_AND_ENTERTAINMENT',
      'LIFESTYLE_AND_FOOD',
      'MARITIME_AND_SALVAGE',
      'ONLINE_TROLLING_AND_FLAME_WARS',
      'UNRELATED_GEOPOLITICS'
    ]
  },
  {
    groupName: 'Relevance & Geography',
    categories: ['NO_AIR_QUALITY_RELEVANCE', 'NO_GEOGRAPHIC_RELEVANCE']
  }
];

export function getNoiseCategoryInfo(code) {
  return NOISE_TAXONOMY[code] || {
    code: code || 'UNKNOWN',
    label: code || 'Unclassified Noise',
    description: 'General filtered noise',
    group: 'Other',
    color: '#64748b'
  };
}

export function getRelevantCategoryInfo(code) {
  return RELEVANT_TAXONOMY[code] || {
    code: code || 'UNKNOWN',
    label: code || 'Verified Air Quality Post',
    description: 'Clean intelligence feed post',
    color: '#16a34a'
  };
}
