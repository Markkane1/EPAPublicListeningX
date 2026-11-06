"""
EPA Punjab Air Quality Intelligence — Canonical Taxonomy
Defines the full 16-category Noise Taxonomy and 6-category Relevant Taxonomy.
Used across deterministic rule induction, operator curation, and Tier-1 ML classification.
"""

from typing import Dict, Any, List, Optional

NOISE_TAXONOMY: Dict[str, Dict[str, Any]] = {
    "GOVT_BUREAUCRATIC_PR": {
        "label": "Government Protocol / Meeting PR",
        "description": "Institutional meeting minutes, photo-ops, ceremonial visits, delegations ('chaired meeting', 'reviewed progress', 'shields presented') lacking actionable field data or enforcement.",
        "group": "Institutional & Commercial",
        "icon": "AccountBalanceRounded",
        "sample_phrases": [
            "chaired review meeting",
            "chaired meeting",
            "meeting held regarding",
            "delegation called on",
            "reviewed progress",
            "shields presented",
            "inaugurated the",
            "press release"
        ]
    },
    "FOREIGN_AGENCY_DOMESTIC": {
        "label": "Foreign Regulatory Agency (CAQM/India)",
        "description": "Indian regulatory boards, orders, and policies (CAQM, CPCB, DPCC, GRAP stages, Delhi municipal rules).",
        "group": "Geographic & Indian Context",
        "icon": "PublicRounded",
        "sample_phrases": [
            "caqm",
            "cpcb",
            "grap stage",
            "grap-iv",
            "grap 4",
            "delhi pollution control committee",
            "dpcc"
        ]
    },
    "INDIAN_DOMESTIC_GOVERNANCE": {
        "label": "Indian Domestic Politics & Debates",
        "description": "Indian party politics, politicians, and electoral debates (BJP vs AAP, CM Mann, Indian Punjab district politics in Ludhiana, Faridkot, Bathinda).",
        "group": "Geographic & Indian Context",
        "icon": "PolicyRounded",
        "sample_phrases": [
            "cm mann",
            "bhagwant mann",
            "aap punjab",
            "bjp",
            "kejriwal",
            "aam aadmi party",
            "faridkot",
            "patiala"
        ]
    },
    "GURMUKHI_SCRIPT_DOMESTIC": {
        "label": "Gurmukhi Script (Indian Punjab)",
        "description": "Posts in Gurmukhi script concerning Indian Punjab domestic matters.",
        "group": "Geographic & Indian Context",
        "icon": "TranslateRounded",
        "sample_phrases": []
    },
    "INDIAN_FIRECRACKER_DEBATES": {
        "label": "Indian Diwali & Firecracker Debates",
        "description": "Seasonal Indian Diwali and firecracker disputes (diwali, crackers) without cross-border relevance.",
        "group": "Geographic & Indian Context",
        "icon": "LocalFireDepartmentRounded",
        "sample_phrases": [
            "diwali crackers",
            "green crackers",
            "bursting crackers",
            "firecracker ban"
        ]
    },
    "INDIAN_WATER_DISPUTES": {
        "label": "Indian River / Water Pollution Disputes",
        "description": "Indian river and nullah pollution movements (Buddha Nullah, Chitti Bein, Satluj) scraped under generic pollution queries.",
        "group": "Geographic & Indian Context",
        "icon": "WaterDamageRounded",
        "sample_phrases": [
            "buddha nullah",
            "chitti bein",
            "satluj river pollution",
            "ludhiana nullah"
        ]
    },
    "METAPHORICAL_OR_SARCASTIC": {
        "label": "Metaphorical or Sarcastic Smog",
        "description": "Figurative or symbolic usage of smog words ('smog of corruption', 'political fog', 'toxic boss', 'mental smog').",
        "group": "Language & Metaphors",
        "icon": "PsychologyRounded",
        "sample_phrases": [
            "smog of corruption",
            "political smog",
            "toxic culture",
            "toxic boss",
            "mental fog"
        ]
    },
    "BENIGN_WEATHER_FOG": {
        "label": "Benign Weather / Ordinary Winter Fog",
        "description": "Normal winter fog (dhund) or routine weather forecasts with no air quality hazard, smoke, or AQI crisis.",
        "group": "Language & Metaphors",
        "icon": "CloudRounded",
        "sample_phrases": [
            "morning fog",
            "pleasant morning",
            "winter fog",
            "weather update cold"
        ]
    },
    "SPORTS_AND_ENTERTAINMENT": {
        "label": "Sports, Cricket & Entertainment",
        "description": "Cricket scheduling, match banter, PCB news, Champions Trophy, concerts, and celebrity events.",
        "group": "Off-Topic Subjects",
        "icon": "SportsCricketRounded",
        "sample_phrases": [
            "cricket match",
            "champions trophy",
            "pcb media",
            "bcci",
            "t20 match"
        ]
    },
    "COMMERCIAL_SPAM_AND_ADS": {
        "label": "Commercial Advertising & Spam",
        "description": "Sales pitches for air purifiers, masks, HVAC filters, clinic ads, crypto, and marketing bots.",
        "group": "Institutional & Commercial",
        "icon": "CampaignRounded",
        "sample_phrases": [
            "air purifier sale",
            "hepa filter discount",
            "order on whatsapp",
            "flat discount",
            "dm for price"
        ]
    },
    "LIFESTYLE_AND_FOOD": {
        "label": "Lifestyle, Dining & Restaurant Reviews",
        "description": "Restaurant reviews (e.g. Cheezious, Kababjees), weddings, fitness, and personal life remarks.",
        "group": "Off-Topic Subjects",
        "icon": "RestaurantRounded",
        "sample_phrases": [
            "cheezious",
            "kababjees",
            "pizza deal",
            "wedding fitness",
            "best pizza"
        ]
    },
    "MARITIME_AND_SALVAGE": {
        "label": "Maritime & Ship Scrapping (Gadani)",
        "description": "Gadani ship-breaking, beached vessel steel salvaging discussions.",
        "group": "Off-Topic Subjects",
        "icon": "DirectionsBoatRounded",
        "sample_phrases": [
            "gadani",
            "ship breaking",
            "beached vessel",
            "steel salvage"
        ]
    },
    "ONLINE_TROLLING_AND_FLAME_WARS": {
        "label": "Online Trolling & Flame Wars",
        "description": "Online flame wars, ethnic slurs, and trolling banter (zog, inbred, turkroach).",
        "group": "Off-Topic Subjects",
        "icon": "ReportProblemRounded",
        "sample_phrases": [
            "turkroach",
            "inbred",
            "iq in the world",
            "zog"
        ]
    },
    "UNRELATED_GEOPOLITICS": {
        "label": "Unrelated Regional Geopolitics",
        "description": "Northeast India state controversies, Brahmaputra dam disputes, Manipur politics.",
        "group": "Off-Topic Subjects",
        "icon": "FlagRounded",
        "sample_phrases": [
            "brahmaputra dam",
            "arunachal pradesh",
            "manipur",
            "shillong"
        ]
    },
    "NO_AIR_QUALITY_RELEVANCE": {
        "label": "No Air Quality or Pollution Relevance",
        "description": "General chatter completely devoid of any environmental, air quality, or atmospheric terms.",
        "group": "Relevance & Geography",
        "icon": "BlockRounded",
        "sample_phrases": []
    },
    "NO_GEOGRAPHIC_RELEVANCE": {
        "label": "No Geographic Link to Punjab/Pakistan",
        "description": "Genuine pollution discussions that are entirely global or outside Pakistan (e.g. California, London).",
        "group": "Relevance & Geography",
        "icon": "WrongLocationRounded",
        "sample_phrases": []
    }
}

RELEVANT_TAXONOMY: Dict[str, Dict[str, Any]] = {
    "CITIZEN_GROUND_TRUTH": {
        "label": "Citizen Ground Truth / Public Outcry",
        "description": "Authentic citizen complaints, sensory reports (burning eyes, throat irritation, zero visibility), local smoke.",
        "icon": "RecordVoiceOverRounded",
        "sample_phrases": [
            "burning eyes",
            "throat irritation",
            "cannot breathe",
            "zero visibility",
            "suffocating",
            "smog is unbearable"
        ]
    },
    "OFFICIAL_ENFORCEMENT": {
        "label": "Government & Field Enforcement Action",
        "description": "Concrete, actionable field operations with real numbers (factories sealed, anti-smog guns, fines, arrests).",
        "icon": "SecurityRounded",
        "sample_phrases": [
            "factory sealed",
            "fine imposed",
            "anti-smog squad",
            "kilns demolished",
            "challan issued",
            "impounded"
        ]
    },
    "MEASUREMENT_AQI_DATA": {
        "label": "AQI Measurement & Sensor Data",
        "description": "Quantitative sensor readings, PM2.5 / PM10 numbers, and satellite monitoring (IQAir, PAQI).",
        "icon": "AnalyticsRounded",
        "sample_phrases": [
            "aqi 4",
            "aqi 5",
            "pm2.5",
            "air quality index",
            "iqair ranking",
            "hazardous air"
        ]
    },
    "PUBLIC_HEALTH_ADVISORY": {
        "label": "Public Health Advisory & Hospital Alert",
        "description": "Genuine medical warnings, hospital alerts, mask mandates, and health precautions.",
        "icon": "LocalHospitalRounded",
        "sample_phrases": [
            "wear masks",
            "hospital advisory",
            "respiratory infection",
            "emergency ward",
            "health alert"
        ]
    },
    "AGRICULTURAL_STUBBLE_BURNING": {
        "label": "Agricultural Stubble Burning (Parali)",
        "description": "Stubble burning reports and crop residue fires directly affecting Punjab air quality.",
        "icon": "AgricultureRounded",
        "sample_phrases": [
            "stubble burning",
            "crop fire",
            "parali",
            "residue burning",
            "smoke from fields"
        ]
    },
    "CROSS_BORDER_INSIGHT": {
        "label": "Cross-Border / Transboundary Analysis",
        "description": "Legitimate transboundary environmental science (wind trajectories, cross-border smog flow).",
        "icon": "CompareArrowsRounded",
        "sample_phrases": [
            "cross-border wind",
            "transboundary pollution",
            "eastern wind lahore",
            "wind direction smog"
        ]
    }
}

# Mapping legacy categories to modern taxonomy
LEGACY_NOISE_MAP = {
    "OFF_TOPIC": "SPORTS_AND_ENTERTAINMENT",
    "EXCLUDED_INDIAN_CONTEXT": "FOREIGN_AGENCY_DOMESTIC",
    "EXCLUDED_ACCOUNT": "GOVT_BUREAUCRATIC_PR",
    "NO_AIR_QUALITY_RELEVANCE": "NO_AIR_QUALITY_RELEVANCE",
    "NO_GEOGRAPHIC_RELEVANCE": "NO_GEOGRAPHIC_RELEVANCE",
    "MANUAL_EXCLUDED": "GOVT_BUREAUCRATIC_PR"
}

LEGACY_RELEVANT_MAP = {
    "Citizen Outcry & Reaction": "CITIZEN_GROUND_TRUTH",
    "Government & Enforcement Action": "OFFICIAL_ENFORCEMENT",
    "AQI Measurement & Satellite Data": "MEASUREMENT_AQI_DATA",
    "Public Health Alert": "PUBLIC_HEALTH_ADVISORY",
    "Agricultural Stubble Burning": "AGRICULTURAL_STUBBLE_BURNING"
}

def normalize_noise_category(category: Optional[str]) -> str:
    """Returns canonical noise category code, resolving legacy names."""
    if not category:
        return "GOVT_BUREAUCRATIC_PR"
    cat_upper = category.strip().upper()
    if cat_upper in NOISE_TAXONOMY:
        return cat_upper
    if category in LEGACY_NOISE_MAP:
        return LEGACY_NOISE_MAP[category]
    if cat_upper in LEGACY_NOISE_MAP:
        return LEGACY_NOISE_MAP[cat_upper]
    return "GOVT_BUREAUCRATIC_PR"

def normalize_relevant_category(category: Optional[str]) -> str:
    """Returns canonical relevant category code, resolving legacy names."""
    if not category:
        return "CITIZEN_GROUND_TRUTH"
    cat_clean = category.strip()
    if cat_clean in RELEVANT_TAXONOMY:
        return cat_clean
    if cat_clean in LEGACY_RELEVANT_MAP:
        return LEGACY_RELEVANT_MAP[cat_clean]
    cat_upper = cat_clean.upper()
    if cat_upper in RELEVANT_TAXONOMY:
        return cat_upper
    return "CITIZEN_GROUND_TRUTH"

def get_taxonomy_dto() -> Dict[str, Any]:
    """Returns frontend-ready taxonomy dictionary with grouped categories."""
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for code, info in NOISE_TAXONOMY.items():
        grp = info["group"]
        if grp not in groups:
            groups[grp] = []
        groups[grp].append({
            "code": code,
            "label": info["label"],
            "description": info["description"],
            "group": grp,
            "icon": info["icon"],
            "samplePhrases": info.get("sample_phrases", [])
        })

    return {
        "noiseCategories": [
            {
                "code": code,
                "label": info["label"],
                "description": info["description"],
                "group": info["group"],
                "icon": info["icon"],
                "samplePhrases": info.get("sample_phrases", [])
            }
            for code, info in NOISE_TAXONOMY.items()
        ],
        "noiseGroups": [
            {"groupName": grp_name, "categories": cats}
            for grp_name, cats in groups.items()
        ],
        "relevantCategories": [
            {
                "code": code,
                "label": info["label"],
                "description": info["description"],
                "icon": info["icon"],
                "samplePhrases": info.get("sample_phrases", [])
            }
            for code, info in RELEVANT_TAXONOMY.items()
        ]
    }
