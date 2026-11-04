
(function () {
  "use strict";

  const state = {
    rawPosts: [],
    cleanedPosts: [],
    auditLog: [],
    currentView: "cards", 
    activeTableTab: "all", 
    filters: {
      search: "",
      city: "all",
      severity: "all",
      category: "all",
      sentiment: "all",
      media: "all",
      sort: "newest"
    },
    lightbox: {
      images: [],
      currentIndex: 0
    },
    charts: {}
  };

  const EXCLUDED_USERNAMES = new Set([
    "delhipollution", "ani", "ani_news", "epccdpunjab", "epapunjab", "pscasafecities"
  ]);

  const OFF_TOPIC_REGEX = [
    { pattern: /\bcricket\b/i, reason: "Cricket sports scheduling" },
    { pattern: /\bpcbmedia\b/i, reason: "Pakistan Cricket Board media" },
    { pattern: /\bchampions trophy\b/i, reason: "Cricket Champions Trophy" },
    { pattern: /\bbcci\b/i, reason: "Indian cricket board banter" },
    { pattern: /\bgadani\b/i, reason: "Gadani maritime ship scrapping" },
    { pattern: /\bship breaking\b/i, reason: "Maritime ship breaking" },
    { pattern: /\bship-breaking\b/i, reason: "Maritime ship breaking" },
    { pattern: /\bmaritime\b/i, reason: "Maritime ship issues" },
    { pattern: /\bship\b.*salvage/i, reason: "Ship salvage discussions" },
    { pattern: /\bbeach\b.*steel/i, reason: "Beached vessel steel salvaging" },
    { pattern: /\bsalvaged\b.*steel/i, reason: "Beached vessel steel salvaging" },
    { pattern: /\bpizza\b/i, reason: "Food / Pizza chain discussions" },
    { pattern: /\bcheezious\b/i, reason: "Fast food restaurant discussion" },
    { pattern: /\bkababjees\b/i, reason: "Fast food restaurant discussion" },
    { pattern: /\bwedding\b/i, reason: "Personal wedding / fitness remarks" },
    { pattern: /\barunachal\b/i, reason: "Arunachal Pradesh / Brahmaputra controversy" },
    { pattern: /\bbrahmaputra\b/i, reason: "Brahmaputra dam controversy" },
    { pattern: /\bshillong\b/i, reason: "Northeast India state discussions" },
    { pattern: /\bmanipur\b/i, reason: "Manipur politics discussions" },
    { pattern: /\bzog\b/i, reason: "Online political flame wars" },
    { pattern: /\bturkroach\b/i, reason: "Online ethnic slurs" },
    { pattern: /\binbred\b/i, reason: "Online ethnic slurs" },
    { pattern: /\biq in the world\b/i, reason: "Online trolling query" },
    { pattern: /\bamerica\b.*allegory/i, reason: "Beached ship allegory commentary" }
  ];

  const INDIAN_DOMESTIC_REGEX = [
    { pattern: /\bdelhi\b/i, reason: "Delhi domestic pollution discourse" },
    { pattern: /\bdehli\b/i, reason: "Delhi domestic pollution discourse" },
    { pattern: /\bncr\b/i, reason: "National Capital Region (India)" },
    { pattern: /\bharyana\b/i, reason: "Haryana state (India)" },
    { pattern: /\bnoida\b/i, reason: "Noida (India)" },
    { pattern: /\bgurugram\b/i, reason: "Gurugram (India)" },
    { pattern: /\bgurgaon\b/i, reason: "Gurgaon (India)" },
    { pattern: /\bcaqm\b/i, reason: "Commission for Air Quality Management (India)" },
    { pattern: /\bfaridkot\b/i, reason: "Faridkot district (Indian Punjab)" },
    { pattern: /\bludhiana\b/i, reason: "Ludhiana (Indian Punjab)" },
    { pattern: /\bchandigarh\b/i, reason: "Chandigarh (India)" },
    { pattern: /\bpatiala\b/i, reason: "Patiala (Indian Punjab)" },
    { pattern: /\bbathinda\b/i, reason: "Bathinda (Indian Punjab)" },
    { pattern: /\bjalandhar\b/i, reason: "Jalandhar (Indian Punjab)" },
    { pattern: /\baap punjab\b/i, reason: "Aam Aadmi Party Punjab (India)" },
    { pattern: /\baamaadmiparty\b/i, reason: "Aam Aadmi Party (India)" },
    { pattern: /\bbjp\b/i, reason: "Bharatiya Janata Party politics" },
    { pattern: /\bdiwali\b/i, reason: "Diwali firecracker pollution debates" },
    { pattern: /\bcrackers\b/i, reason: "Diwali firecracker debates" },
    { pattern: /\bbrahmos\b/i, reason: "Indian missile banter" },
    { pattern: /\brekha gov\b/i, reason: "Indian local government praise/criticism" },
    { pattern: /\bnarendramodi\b/i, reason: "Indian Prime Minister political banter" },
    { pattern: /\bcongress\b/i, reason: "Indian Congress Party political banter" },
    { pattern: /\bcm mann\b/i, reason: "Chief Minister Bhagwant Mann (Punjab, India)" },
    { pattern: /\bbhagwant mann\b/i, reason: "Chief Minister Bhagwant Mann (Punjab, India)" },
    { pattern: /\bbuddha nullah\b/i, reason: "Buddha Nullah water pollution (Ludhiana, India)" },
    { pattern: /\bchitti bein\b/i, reason: "Chitti Bein river pollution (Indian Punjab)" },
    { pattern: /\bsatluj\b/i, reason: "Satluj river pollution movement (Indian Punjab)" },
    { pattern: /\bcpcb\b/i, reason: "Central Pollution Control Board (India)" },
    { pattern: /\bkejriwal\b/i, reason: "Arvind Kejriwal Delhi air pollution debates" }
  ];

  const AIR_QUALITY_REGEX = [
    /\baqi\b/i, /air quality/i, /pollution/i, /polluted/i, /smog/i, /clean air/i,
    /cleaner air/i, /pm2\.5/i, /pm10/i, /stubble burning/i, /crop-fire/i, /crop fire/i,
    /crop residue/i, /parali/i, /smoke/i, /respiratory/i, /air index/i, /haze/i,
    /anti-smog/i, /smog gun/i, /environment/i, /green lockdown/i, /artificial rain/i,
    /air burning/i, /hazardous air/i, /toxic air/i
  ];
  const URDU_AQ_TERMS = ['سموگ', 'آلودہ', 'آلودگی', 'ہوا', 'ماحول'];

  const PAK_GEO_REGEX = [
    /\blahore\b/i, /\bgujranwala\b/i, /\bpakistan\b/i, /\bpunjab\b/i, /\bfaisalabad\b/i,
    /\bmultan\b/i, /\brawalpindi\b/i, /\bislamabad\b/i, /\bsialkot\b/i, /\battock\b/i,
    /\bsheikhupura\b/i, /\bkasur\b/i, /\bsargodha\b/i, /\bbahawalpur\b/i, /\bsahiwal\b/i,
    /\bpeshawar\b/i, /\bkarachi\b/i, /\bgwmc\b/i, /\blwmc\b/i, /\bmaryam\b/i, /\bshehbaz\b/i
  ];
  const URDU_GEO_TERMS = ['لاہور', 'پنجاب', 'پاکستان', 'گوجرانوالہ', 'فیصل آباد', 'ملتان', 'راولپنڈی', 'اسلام آباد'];

  function normalizeTextForDedup(text) {
    if (!text) return "";
    let t = text.replace(/^(?:@\w+\s*)+/g, ''); 
    t = t.replace(/https?:\/\/\S+/g, ''); 
    t = t.replace(/[^\w\s]/g, ''); 
    return t.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function enrichPostRecord(p) {
    const text = (p.text || '').trim();
    const textLower = text.toLowerCase();

    let aqiVal = null;
    let aqiMatch = textLower.match(/\baqi\b\s*(?:of|is|reached|crossed|at|around)?\s*[:=-]?\s*([0-9]{2,4})/);
    if (aqiMatch) {
      aqiVal = parseInt(aqiMatch[1], 10);
    } else {
      let altMatch = textLower.match(/([0-9]{2,4})\s*(?:\+)?\s*\baqi\b/);
      if (altMatch) aqiVal = parseInt(altMatch[1], 10);
    }

    let severity = "Unspecified";
    let severityCode = "unspecified";
    if (aqiVal) {
      if (aqiVal >= 301) { severity = "Hazardous"; severityCode = "hazardous"; }
      else if (aqiVal >= 201) { severity = "Very Unhealthy"; severityCode = "very_unhealthy"; }
      else if (aqiVal >= 151) { severity = "Unhealthy"; severityCode = "unhealthy"; }
      else if (aqiVal >= 101) { severity = "Unhealthy for Sensitive Groups"; severityCode = "sensitive"; }
      else if (aqiVal >= 51) { severity = "Moderate"; severityCode = "moderate"; }
      else { severity = "Good"; severityCode = "good"; }
    } else {
      if (/hazardous|emergency|toxic|highest in world|deadly|chamber|alarm/i.test(textLower)) {
        severity = "Severe / Hazardous Alert";
        severityCode = "hazardous";
      }
    }

    let city = "Punjab Region";
    if (/\blahore\b/i.test(textLower) || text.includes('لاہور')) city = "Lahore";
    else if (/\bgujranwala\b/i.test(textLower) || text.includes('گوجرانوالہ')) city = "Gujranwala";
    else if (/\bfaisalabad\b/i.test(textLower) || text.includes('فیصل آباد')) city = "Faisalabad";
    else if (/\bmultan\b/i.test(textLower) || text.includes('ملتان')) city = "Multan";
    else if (/\battock\b/i.test(textLower)) city = "Attock";
    else if (/\brawalpindi\b/i.test(textLower) || text.includes('راولپنڈی')) city = "Rawalpindi";
    else if (/\bislamabad\b/i.test(textLower) || text.includes('اسلام آباد')) city = "Islamabad";
    else if (/\bsialkot\b/i.test(textLower)) city = "Sialkot";

    let category = "Citizen Outcry & Reaction";
    if (/advisory|masks|health|hospital|infection|breathe|children|eyes/i.test(textLower)) {
      category = "Public Health Alert";
    } else if (/enforcement|squad|anti-smog gun|crackdown|fines|challan|arrest|buses|e-buses|suthra|inspection/i.test(textLower)) {
      category = "Government & Enforcement Action";
    } else if (/nasa|satellite|ranking|tops|charts|readings|monitored|iqair|paqi/i.test(textLower)) {
      category = "AQI Measurement & Satellite Data";
    } else if (/stubble|crop fire|parali|farmers|straw|burning/i.test(textLower)) {
      category = "Agricultural Stubble Burning";
    }

    let sentiment = "Informative / Neutral";
    if (/hell|killing|burn|dying|villain|worst|disaster|suffocating|shame|choking/i.test(textLower)) {
      sentiment = "Critical / Alarmed";
    } else if (/alhamdulillah|mashallah|progress|cleaning|cleanest|solution|e-buses|commendable|milestone/i.test(textLower)) {
      sentiment = "Positive / Solution-Oriented";
    } else if (/concern|plea|wear masks|request|advise|stay safe|precaution/i.test(textLower)) {
      sentiment = "Concerned";
    }

    let mediaList = [];
    if (typeof p.mediaUrls === "string") {
      mediaList = p.mediaUrls.split(";").map(u => u.trim()).filter(Boolean);
    } else if (Array.isArray(p.mediaUrls)) {
      mediaList = p.mediaUrls.map(u => (typeof u === "string" ? u.trim() : "")).filter(Boolean);
    }

    const likes = parseInt(p.likes || 0, 10);
    const retweets = parseInt(p.retweets || 0, 10);
    const replies = parseInt(p.replies || 0, 10);
    const quotes = parseInt(p.quotes || 0, 10);
    const views = parseInt(p.views || 0, 10);
    const engagement = likes + retweets * 2 + replies * 2 + quotes * 2;

    const enriched = Object.assign({}, p, {
      clean_id: String(p.id || ""),
      postUrl: p.postUrl || `https://x.com/${p.authorUsername}/status/${p.id}`,
      aqi_value: aqiVal,
      severity: severity,
      severity_code: severityCode,
      city_detected: city,
      category: category,
      sentiment: sentiment,
      mediaUrls: mediaList,
      has_media: mediaList.length > 0,
      media_count: mediaList.length,
      total_engagement: engagement,
      authorVerified: Boolean(p.authorVerified)
    });

    return enriched;
  }

  function processScrapedPosts(rawList) {
    const seenIds = new Set();
    const seenNormTexts = new Map();
    const cleanList = [];
    const auditList = [];

    const pureIndianAuthors = new Set([
      'faridkotpolice', 'caqm_official', 'pb_khabarnama', 'drshamamohd', 
      'rohini_sgh', 'archiesriva', 'rahul1979601', 'sharma_views', 'gss_views',
      'navdeepdahiya55', 'kushanmitra', 'johnsmith28vu', 'nikku_aap', 'tejasvi_minhas', 'aappunjab'
    ]);

    for (let idx = 0; idx < rawList.length; idx++) {
      const p = rawList[idx];
      const pid = String(p.id || "");
      const handle = (p.authorUsername || "").toLowerCase().trim();
      const text = (p.text || "").trim();
      const textLower = text.toLowerCase();
      const authorBio = (p.authorDescription || "").toLowerCase();

      if (seenIds.has(pid)) {
        auditList.push({
          index: idx, id: pid, author: handle, status: "REMOVED",
          category: "DUPLICATE_ID", reason: `Duplicate post ID ${pid}`, text: text
        });
        continue;
      }

      if (EXCLUDED_USERNAMES.has(handle)) {
        auditList.push({
          index: idx, id: pid, author: handle, status: "REMOVED",
          category: "EXCLUDED_ACCOUNT", reason: `Author @${handle} matches negative filter (-from:@${handle})`, text: text
        });
        continue;
      }

      if (/[\u0a00-\u0a7f]/.test(text)) {
        auditList.push({
          index: idx, id: pid, author: handle, status: "REMOVED",
          category: "EXCLUDED_INDIAN_CONTEXT", reason: "Contains Gurmukhi script associated with Indian Punjab domestic affairs", text: text
        });
        continue;
      }

      let offTopic = null;
      for (const item of OFF_TOPIC_REGEX) {
        if (item.pattern.test(textLower)) {
          offTopic = item.reason;
          break;
        }
      }
      if (offTopic) {
        auditList.push({
          index: idx, id: pid, author: handle, status: "REMOVED",
          category: "OFF_TOPIC", reason: `Unrelated topic: ${offTopic}`, text: text
        });
        continue;
      }

      let indianExcl = null;
      for (const item of INDIAN_DOMESTIC_REGEX) {
        if (item.pattern.test(textLower)) {
          const hasPakPrimary = /lahore|pakistan|maryam nawaz|pakistani/i.test(textLower);
          const isPureIndian = pureIndianAuthors.has(handle);
          const hasPureIndianTerm = /caqm|faridkot|cm mann|bhagwant mann|buddha nullah|brahmos|gurgaon|gurugram|jalandhar|sutlej|chitti bein/i.test(textLower);
          
          if (isPureIndian || hasPureIndianTerm || !hasPakPrimary) {
            indianExcl = item.reason;
            break;
          }
        }
      }
      if (indianExcl) {
        auditList.push({
          index: idx, id: pid, author: handle, status: "REMOVED",
          category: "EXCLUDED_INDIAN_CONTEXT", reason: `Matches negative query criteria: ${indianExcl}`, text: text
        });
        continue;
      }

      const hasAq = AIR_QUALITY_REGEX.some(r => r.test(textLower)) || URDU_AQ_TERMS.some(t => text.includes(t));
      if (!hasAq) {
        auditList.push({
          index: idx, id: pid, author: handle, status: "REMOVED",
          category: "NO_AIR_QUALITY_RELEVANCE", reason: "Does not contain positive air quality or smog keywords", text: text
        });
        continue;
      }

      let hasGeo = PAK_GEO_REGEX.some(r => r.test(textLower)) || URDU_GEO_TERMS.some(t => text.includes(t));
      if (!hasGeo && /pakistan|lahore|punjab/i.test(authorBio)) {
        hasGeo = true;
      }
      if (!hasGeo) {
        auditList.push({
          index: idx, id: pid, author: handle, status: "REMOVED",
          category: "NO_GEOGRAPHIC_RELEVANCE", reason: "Does not relate geographically to Lahore, Pakistani Punjab, or Pakistan", text: text
        });
        continue;
      }

      const normText = normalizeTextForDedup(text);
      if (normText.length > 15 && seenNormTexts.has(normText)) {
        const primaryPost = seenNormTexts.get(normText);
        
        let pMedia = [];
        if (typeof p.mediaUrls === "string") {
          pMedia = p.mediaUrls.split(";").map(u => u.trim()).filter(Boolean);
        } else if (Array.isArray(p.mediaUrls)) {
          pMedia = p.mediaUrls;
        }
        const existingMedia = new Set(primaryPost.mediaUrls || []);
        pMedia.forEach(m => existingMedia.add(m));
        primaryPost.mediaUrls = Array.from(existingMedia);
        primaryPost.media_count = primaryPost.mediaUrls.length;
        primaryPost.has_media = primaryPost.media_count > 0;

        ['likes', 'retweets', 'replies', 'quotes', 'views'].forEach(metric => {
          primaryPost[metric] = Math.max(parseInt(primaryPost[metric] || 0, 10), parseInt(p[metric] || 0, 10));
        });

        auditList.push({
          index: idx, id: pid, author: handle, status: "DUPLICATE_MERGED",
          category: "SEMANTIC_DUPLICATE", reason: `Consolidated into primary post ID ${primaryPost.clean_id} (identical content or spam repost)`, text: text
        });
        continue;
      }

      const enriched = enrichPostRecord(p);
      seenIds.add(pid);
      seenNormTexts.set(normText, enriched);
      cleanList.push(enriched);

      auditList.push({
        index: idx, id: pid, author: handle, status: "KEPT",
        category: "VERIFIED_VALID", reason: `Verified air quality post for ${enriched.city_detected} (${enriched.category})`,
        text: text, aqi_value: enriched.aqi_value, severity: enriched.severity, city: enriched.city_detected
      });
    }

    return { cleanList, auditList };
  }

  function init() {
    
    if (Array.isArray(window.EPA_POSTS_DATA)) {
      state.cleanedPosts = window.EPA_POSTS_DATA;
    } else if (Array.isArray(window.PRELOADED_CLEANED_POSTS)) {
      state.cleanedPosts = window.PRELOADED_CLEANED_POSTS;
    }
    if (window.PRELOADED_AUDIT_LOG && Array.isArray(window.PRELOADED_AUDIT_LOG)) {
      state.auditLog = window.PRELOADED_AUDIT_LOG;
    }

    setupEventListeners();
    updateKpiMetrics();
    renderMainContent();
  }

  function setupEventListeners() {
    
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function (e) {
        state.filters.search = e.target.value.toLowerCase().trim();
        renderMainContent();
      });
    }

    const bindFilter = (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", function (e) {
          state.filters[key] = e.target.value;
          renderMainContent();
        });
      }
    };
    bindFilter("city-filter", "city");
    bindFilter("severity-filter", "severity");
    bindFilter("category-filter", "category");
    bindFilter("sentiment-filter", "sentiment");
    bindFilter("media-filter", "media");
    bindFilter("sort-filter", "sort");

    document.querySelectorAll(".view-tab-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".view-tab-btn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        state.currentView = this.getAttribute("data-view");
        renderMainContent();
      });
    });

    const ingestBtn = document.getElementById("ingest-btn");
    const ingestModal = document.getElementById("ingest-modal");
    const closeModalBtn = document.getElementById("close-ingest-modal");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input");

    if (ingestBtn && ingestModal) {
      ingestBtn.addEventListener("click", () => ingestModal.classList.add("open"));
    }
    if (closeModalBtn && ingestModal) {
      closeModalBtn.addEventListener("click", () => ingestModal.classList.remove("open"));
    }
    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragover"); });
      dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleUploadedFile(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleUploadedFile(e.target.files[0]);
        }
      });
    }

    const exportJsonBtn = document.getElementById("export-json-btn");
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", exportCleanedJson);
    }
    const exportCsvBtn = document.getElementById("export-csv-btn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", exportCleanedCsv);
    }

    const lightboxModal = document.getElementById("lightbox-modal");
    const lightboxClose = document.getElementById("lightbox-close");
    const lightboxPrev = document.getElementById("lightbox-prev");
    const lightboxNext = document.getElementById("lightbox-next");

    if (lightboxClose && lightboxModal) {
      lightboxClose.addEventListener("click", closeLightbox);
      lightboxModal.addEventListener("click", (e) => {
        if (e.target === lightboxModal) closeLightbox();
      });
    }
    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", () => navigateLightbox(-1));
    }
    if (lightboxNext) {
      lightboxNext.addEventListener("click", () => navigateLightbox(1));
    }
    document.addEventListener("keydown", (e) => {
      if (!lightboxModal.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    });
  }

  function handleUploadedFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const rawJson = JSON.parse(e.target.result);
        if (!Array.isArray(rawJson)) {
          alert("Error: Uploaded file must be a JSON array of posts.");
          return;
        }

        const { cleanList, auditList } = processScrapedPosts(rawJson);
        state.cleanedPosts = cleanList;
        state.auditLog = auditList;

        const ingestModal = document.getElementById("ingest-modal");
        if (ingestModal) ingestModal.classList.remove("open");

        const mergedCount = auditList.filter(a => a.status === "DUPLICATE_MERGED").length;
        const removedCount = auditList.filter(a => a.status === "REMOVED").length;

        updateKpiMetrics();
        renderMainContent();

        alert(`✅ Ingestion & Deduplication Complete!\n\n• Ingested: ${rawJson.length} posts\n• Verified Clean: ${cleanList.length} posts\n• Duplicates Eliminated: ${mergedCount}\n• Noise/Indian Excluded: ${removedCount}`);
      } catch (err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function updateKpiMetrics() {
    const totalScraped = state.auditLog.length || state.cleanedPosts.length;
    const cleanCount = state.cleanedPosts.length;
    const dupCount = state.auditLog.filter(a => a.status === "DUPLICATE_MERGED").length;
    const remCount = state.auditLog.filter(a => a.status === "REMOVED").length;

    const aqiValues = state.cleanedPosts.map((p) => {
      const raw = p.aqi_value;
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? n : null;
    }).filter((n) => n !== null);
    const hasAqi = aqiValues.length > 0;
    const peakAqi = hasAqi ? Math.max(...aqiValues) : "—";
    const avgAqi = hasAqi ? (aqiValues.reduce((acc, n) => acc + n, 0) / aqiValues.length).toFixed(1) : "—";

    const cityMap = {};
    state.cleanedPosts.forEach(p => {
      if (!p.city_detected) return;
      cityMap[p.city_detected] = (cityMap[p.city_detected] || 0) + 1;
    });
    const cityNames = Object.keys(cityMap);
    const topCity = cityNames.sort((a, b) => cityMap[b] - cityMap[a])[0] || "—";

    setElementText("kpi-total-scraped", totalScraped);
    setElementText("kpi-clean-posts", cleanCount);
    setElementText("kpi-duplicates-merged", dupCount);
    setElementText("kpi-peak-aqi", peakAqi);
    setElementText("kpi-avg-aqi", avgAqi);
    setElementText("kpi-top-city", topCity);
    setAqiBadge("kpi-peak-badge", hasAqi, typeof peakAqi === "number" && peakAqi >= 301);
    setAqiBadge("kpi-avg-badge", hasAqi, typeof avgAqi === "string" && Number(avgAqi) >= 301);
  }

  function setAqiBadge(id, hasAqi, hazardous) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!hasAqi) {
      el.textContent = "No AQI yet";
      el.className = "kpi-badge kpi-badge-info";
      return;
    }
    if (hazardous) {
      el.textContent = "Hazardous";
      el.className = "kpi-badge kpi-badge-danger";
      return;
    }
    el.textContent = "Recorded";
    el.className = "kpi-badge kpi-badge-info";
  }

  function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function getFilteredPosts() {
    return state.cleanedPosts.filter(p => {
      
      if (state.filters.search) {
        const q = state.filters.search;
        const textMatch = (p.text || "").toLowerCase().includes(q);
        const userMatch = (p.authorUsername || "").toLowerCase().includes(q);
        const nameMatch = (p.authorName || "").toLowerCase().includes(q);
        if (!textMatch && !userMatch && !nameMatch) return false;
      }

      if (state.filters.city !== "all" && p.city_detected !== state.filters.city) {
        return false;
      }

      if (state.filters.severity !== "all") {
        if (state.filters.severity === "hazardous" && p.severity_code !== "hazardous") return false;
        if (state.filters.severity === "very_unhealthy" && p.severity_code !== "very_unhealthy") return false;
        if (state.filters.severity === "unhealthy" && p.severity_code !== "unhealthy") return false;
        if (state.filters.severity === "sensitive" && p.severity_code !== "sensitive") return false;
        if (state.filters.severity === "moderate" && p.severity_code !== "moderate") return false;
        if (state.filters.severity === "unspecified" && p.severity_code !== "unspecified") return false;
      }

      if (state.filters.category !== "all" && p.category !== state.filters.category) {
        return false;
      }

      if (state.filters.sentiment !== "all" && p.sentiment !== state.filters.sentiment) {
        return false;
      }

      if (state.filters.media === "media_only" && !p.has_media) return false;
      if (state.filters.media === "text_only" && p.has_media) return false;

      return true;
    }).sort((a, b) => {
      if (state.filters.sort === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      } else if (state.filters.sort === "engagement") {
        return (b.total_engagement || 0) - (a.total_engagement || 0);
      } else if (state.filters.sort === "aqi_desc") {
        return (b.aqi_value || 0) - (a.aqi_value || 0);
      } else if (state.filters.sort === "likes") {
        return (b.likes || 0) - (a.likes || 0);
      } else if (state.filters.sort === "views") {
        return (b.views || 0) - (a.views || 0);
      }
      return 0;
    });
  }

  function renderMainContent() {
    const cardsView = document.getElementById("cards-view");
    const tableView = document.getElementById("table-view");
    const analyticsView = document.getElementById("analytics-view");

    if (state.currentView === "cards") {
      cardsView.style.display = "grid";
      tableView.style.display = "none";
      analyticsView.style.display = "none";
      renderPostCards();
    } else if (state.currentView === "table") {
      cardsView.style.display = "none";
      tableView.style.display = "block";
      analyticsView.style.display = "none";
      renderAuditTable();
    } else if (state.currentView === "analytics") {
      cardsView.style.display = "none";
      tableView.style.display = "none";
      analyticsView.style.display = "block";
      renderAnalyticsCharts();
    }
  }

  function renderPostCards() {
    const container = document.getElementById("cards-view");
    if (!container) return;

    const posts = getFilteredPosts();
    const counterEl = document.getElementById("filtered-counter");
    if (counterEl) {
      counterEl.textContent = `Showing ${posts.length} of ${state.cleanedPosts.length} clean posts`;
    }

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No matching posts found</h3>
          <p>Try broadening your search term or adjusting filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = posts.map(p => createPostCardHtml(p)).join("");

    container.querySelectorAll(".media-item, .media-grid-1").forEach(item => {
      item.addEventListener("click", function () {
        const mediaUrls = (this.getAttribute("data-media-urls") || "").split(";").filter(Boolean);
        const clickedIdx = parseInt(this.getAttribute("data-index") || "0", 10);
        if (mediaUrls.length > 0) {
          openLightbox(mediaUrls, clickedIdx);
        }
      });
    });
  }

  function createPostCardHtml(p) {
    const initials = getInitials(p.authorName || p.authorUsername || "X");
    const avatarColor = getDeterministicColor(p.authorUsername || "x");
    const formattedDate = formatDate(p.createdAt);
    const highlightedText = highlightTextEntities(p.text || "");
    const mediaHtml = renderMediaGallery(p.mediaUrls || []);

    let severityBadgeClass = "pill-city";
    if (p.severity_code === "hazardous") severityBadgeClass = "pill-aqi-hazardous";
    else if (p.severity_code === "very_unhealthy") severityBadgeClass = "pill-aqi-very-unhealthy";
    else if (p.severity_code === "unhealthy") severityBadgeClass = "pill-aqi-unhealthy";
    else if (p.severity_code === "moderate") severityBadgeClass = "pill-aqi-moderate";

    return `
      <div class="post-card" id="post-${p.clean_id}">
        <div>
          <!-- Header -->
          <div class="post-header">
            <div class="author-meta">
              <div class="avatar-wrapper" style="background: ${avatarColor};">
                ${p.authorAvatar ? `<img src="${p.authorAvatar}" alt="${escapeHtml(p.authorUsername)}" class="avatar-img" onerror="this.style.display='none';">` : initials}
              </div>
              <div class="author-info">
                <div class="author-name-row">
                  <span class="author-name" title="${escapeHtml(p.authorName)}">${escapeHtml(p.authorName || p.authorUsername)}</span>
                  ${p.authorVerified ? `<span class="verified-icon" title="Verified Account">✓</span>` : ""}
                </div>
                <div class="author-handle">@${escapeHtml(p.authorUsername)}</div>
              </div>
            </div>
            
            <!-- External Post Link Button -->
            <a href="${escapeHtml(sanitizeUrl(p.postUrl))}" target="_blank" rel="noopener noreferrer" class="post-link-btn" title="Open live post on X.com">
              <span>View on X</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>

          <!-- Badges -->
          <div class="badge-row">
            <span class="pill-badge pill-city">📍 ${escapeHtml(p.city_detected)}</span>
            ${p.aqi_value ? `<span class="pill-badge ${severityBadgeClass}">⚠️ AQI ${p.aqi_value} • ${p.severity}</span>` : (p.severity_code === "hazardous" ? `<span class="pill-badge pill-aqi-hazardous">⚠️ ${p.severity}</span>` : "")}
            <span class="pill-badge pill-category">${escapeHtml(p.category)}</span>
            <span class="pill-badge pill-sentiment">${escapeHtml(p.sentiment)}</span>
          </div>

          <!-- Body Text -->
          <div class="post-text">${highlightedText}</div>

          <!-- Media Gallery -->
          ${mediaHtml}
        </div>

        <!-- Footer Metrics -->
        <div class="post-footer">
          <div class="post-timestamp" title="${escapeHtml(p.createdAt)}">${formattedDate}</div>
          <div style="display: flex; gap: 0.85rem;">
            <span class="metric-item" title="Likes">❤️ ${formatNumber(p.likes)}</span>
            <span class="metric-item" title="Reposts">🔁 ${formatNumber(p.retweets)}</span>
            <span class="metric-item" title="Replies">💬 ${formatNumber(p.replies)}</span>
            ${p.views ? `<span class="metric-item" title="Views">👁️ ${formatNumber(p.views)}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  function renderMediaGallery(urls) {
    if (!urls || urls.length === 0) return "";
    const serializedUrls = escapeHtml(urls.join(";"));

    if (urls.length === 1) {
      return `
        <div class="media-gallery">
          <div class="media-grid-1" data-media-urls="${serializedUrls}" data-index="0" title="Click to enlarge">
            <img src="${urls[0]}" alt="Post media attachment" loading="lazy">
          </div>
        </div>
      `;
    } else if (urls.length === 2) {
      return `
        <div class="media-gallery">
          <div class="media-grid-2">
            <div class="media-item" data-media-urls="${serializedUrls}" data-index="0" title="Click to enlarge">
              <img src="${urls[0]}" alt="Post media 1" loading="lazy">
            </div>
            <div class="media-item" data-media-urls="${serializedUrls}" data-index="1" title="Click to enlarge">
              <img src="${urls[1]}" alt="Post media 2" loading="lazy">
            </div>
          </div>
        </div>
      `;
    } else {
      const displayUrls = urls.slice(0, 4);
      const remaining = urls.length - 4;
      return `
        <div class="media-gallery">
          <div class="media-grid-multi">
            ${displayUrls.map((url, i) => `
              <div class="media-item" data-media-urls="${serializedUrls}" data-index="${i}" title="Click to enlarge">
                <img src="${url}" alt="Post media ${i + 1}" loading="lazy">
                ${i === 3 && remaining > 0 ? `<div class="media-more-overlay">+${remaining}</div>` : ""}
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
  }

  function renderAuditTable() {
    const container = document.getElementById("table-view");
    if (!container) return;

    const keptCount = state.auditLog.filter(a => a.status === "KEPT").length;
    const dupCount = state.auditLog.filter(a => a.status === "DUPLICATE_MERGED").length;
    const remCount = state.auditLog.filter(a => a.status === "REMOVED").length;
    const totalCount = state.auditLog.length;

    let records = state.auditLog;
    if (state.activeTableTab === "kept") {
      records = state.auditLog.filter(a => a.status === "KEPT");
    } else if (state.activeTableTab === "duplicates") {
      records = state.auditLog.filter(a => a.status === "DUPLICATE_MERGED");
    } else if (state.activeTableTab === "removed") {
      records = state.auditLog.filter(a => a.status === "REMOVED");
    }

    if (state.filters.search) {
      const q = state.filters.search;
      records = records.filter(r => (r.text || "").toLowerCase().includes(q) || (r.author || "").toLowerCase().includes(q));
    }

    container.innerHTML = `
      <div class="audit-table-card">
        <div class="table-tabs">
          <button class="table-tab ${state.activeTableTab === 'all' ? 'active' : ''}" data-tab="all">All Records (${totalCount})</button>
          <button class="table-tab ${state.activeTableTab === 'kept' ? 'active' : ''}" data-tab="kept">✅ Clean & Validated (${keptCount})</button>
          <button class="table-tab ${state.activeTableTab === 'duplicates' ? 'active' : ''}" data-tab="duplicates">⚠️ Eliminated Duplicates (${dupCount})</button>
          <button class="table-tab ${state.activeTableTab === 'removed' ? 'active' : ''}" data-tab="removed">🚫 Excluded Noise (${remCount})</button>
        </div>
        <div class="table-responsive">
          <table class="audit-table">
            <thead>
              <tr>
                <th style="width: 120px;">Status</th>
                <th style="width: 140px;">Author</th>
                <th style="width: 110px;">City</th>
                <th style="width: 100px;">AQI</th>
                <th style="width: 220px;">Category / Reason</th>
                <th>Content Text Snippet</th>
                <th style="width: 90px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => `
                <tr>
                  <td>
                    <span class="status-badge ${r.status === 'KEPT' ? 'status-kept' : (r.status === 'DUPLICATE_MERGED' ? 'status-duplicate' : 'status-removed')}">
                      ${r.status === 'KEPT' ? 'KEPT' : (r.status === 'DUPLICATE_MERGED' ? 'MERGED' : 'EXCLUDED')}
                    </span>
                  </td>
                  <td><strong>@${escapeHtml(r.author || 'unknown')}</strong></td>
                  <td>${escapeHtml(r.city || '-')}</td>
                  <td>${r.aqi_value ? `<span class="pill-badge pill-aqi-hazardous" style="font-size:0.65rem;">AQI ${r.aqi_value}</span>` : '-'}</td>
                  <td><div style="font-size: 0.75rem; color: #cbd5e1;">${escapeHtml(r.reason || r.category || '')}</div></td>
                  <td><div style="max-height: 48px; overflow: hidden; text-overflow: ellipsis; font-size: 0.775rem;">${escapeHtml(r.text || '')}</div></td>
                  <td>
                    ${r.id ? `<a href="https://x.com/${r.author}/status/${r.id}" target="_blank" rel="noopener noreferrer" class="post-link-btn" style="padding: 0.15rem 0.4rem; font-size: 0.7rem;">Link ↗</a>` : '-'}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll(".table-tab").forEach(tab => {
      tab.addEventListener("click", function () {
        state.activeTableTab = this.getAttribute("data-tab");
        renderAuditTable();
      });
    });
  }

  function renderAnalyticsCharts() {
    const container = document.getElementById("analytics-view");
    if (!container) return;

    container.innerHTML = `
      <div class="analytics-grid">
        <!-- Chart 1: AQI Severity -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>AQI Severity Distribution</h3>
            <p>Breakdown of air pollution severity levels across active posts</p>
          </div>
          <div class="chart-wrapper">
            <canvas id="chart-severity"></canvas>
          </div>
        </div>

        <!-- Chart 2: City Breakdown -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Geographic Distribution</h3>
            <p>Active posts count across Pakistani Punjab cities</p>
          </div>
          <div class="chart-wrapper">
            <canvas id="chart-cities"></canvas>
          </div>
        </div>

        <!-- Chart 3: Categories -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Topic Classification</h3>
            <p>Public health alerts vs enforcement vs citizen reactions</p>
          </div>
          <div class="chart-wrapper">
            <canvas id="chart-categories"></canvas>
          </div>
        </div>

        <!-- Chart 4: Sentiments -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Public Sentiment Spectrum</h3>
            <p>Citizen outcry vs official proactive response</p>
          </div>
          <div class="chart-wrapper">
            <canvas id="chart-sentiment"></canvas>
          </div>
        </div>
      </div>

      <!-- Viral Posts Leaderboard -->
      <div class="chart-card" style="margin-top: 1.5rem;">
        <div class="chart-header">
          <h3>Top Influential Air Quality Posts</h3>
          <p>Posts with highest reach and engagement on X.com</p>
        </div>
        <div class="table-responsive">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>City</th>
                <th>Content Snippet</th>
                <th>Likes</th>
                <th>Reposts</th>
                <th>Total Reach</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${state.cleanedPosts.slice().sort((a, b) => b.total_engagement - a.total_engagement).slice(0, 8).map(p => `
                <tr>
                  <td><strong>@${escapeHtml(p.authorUsername)}</strong> ${p.authorVerified ? '✓' : ''}</td>
                  <td>📍 ${escapeHtml(p.city_detected)}</td>
                  <td><div style="font-size: 0.8rem; max-width: 480px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.text)}</div></td>
                  <td>❤️ ${p.likes}</td>
                  <td>🔁 ${p.retweets}</td>
                  <td><strong>${p.total_engagement}</strong></td>
                  <td><a href="${p.postUrl}" target="_blank" rel="noopener noreferrer" class="post-link-btn">View on X ↗</a></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    initCharts();
  }

  function initCharts() {
    if (typeof Chart === "undefined") return;

    Object.values(state.charts).forEach(c => c && c.destroy());

    const severityCtx = document.getElementById("chart-severity");
    if (severityCtx) {
      const counts = { "Hazardous (301+)": 0, "Very Unhealthy (201-300)": 0, "Unhealthy (151-200)": 0, "Moderate/Good": 0, "General Smog Alert": 0 };
      state.cleanedPosts.forEach(p => {
        if (p.severity_code === "hazardous" && p.aqi_value) counts["Hazardous (301+)"]++;
        else if (p.severity_code === "very_unhealthy") counts["Very Unhealthy (201-300)"]++;
        else if (p.severity_code === "unhealthy") counts["Unhealthy (151-200)"]++;
        else if (p.severity_code === "moderate" || p.severity_code === "good") counts["Moderate/Good"]++;
        else counts["General Smog Alert"]++;
      });

      state.charts.severity = new Chart(severityCtx, {
        type: "doughnut",
        data: {
          labels: Object.keys(counts),
          datasets: [{
            data: Object.values(counts),
            backgroundColor: ["#7e22ce", "#b91c1c", "#ea580c", "#ca8a04", "#0284c7"],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "right", labels: { color: "#94a3b8", font: { size: 11 } } } }
        }
      });
    }

    const cityCtx = document.getElementById("chart-cities");
    if (cityCtx) {
      const cityCounts = {};
      state.cleanedPosts.forEach(p => {
        cityCounts[p.city_detected] = (cityCounts[p.city_detected] || 0) + 1;
      });

      state.charts.cities = new Chart(cityCtx, {
        type: "bar",
        data: {
          labels: Object.keys(cityCounts),
          datasets: [{
            label: "Posts",
            data: Object.values(cityCounts),
            backgroundColor: "#0284c7",
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
            y: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    const catCtx = document.getElementById("chart-categories");
    if (catCtx) {
      const catCounts = {};
      state.cleanedPosts.forEach(p => {
        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
      });

      state.charts.categories = new Chart(catCtx, {
        type: "bar",
        data: {
          labels: Object.keys(catCounts),
          datasets: [{
            label: "Posts",
            data: Object.values(catCounts),
            backgroundColor: "#10b981",
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
            y: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    const sentCtx = document.getElementById("chart-sentiment");
    if (sentCtx) {
      const sentCounts = {};
      state.cleanedPosts.forEach(p => {
        sentCounts[p.sentiment] = (sentCounts[p.sentiment] || 0) + 1;
      });

      state.charts.sentiment = new Chart(sentCtx, {
        type: "pie",
        data: {
          labels: Object.keys(sentCounts),
          datasets: [{
            data: Object.values(sentCounts),
            backgroundColor: ["#ef4444", "#f59e0b", "#38bdf8", "#10b981"],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "right", labels: { color: "#94a3b8", font: { size: 11 } } } }
        }
      });
    }
  }

  function openLightbox(images, startIndex) {
    state.lightbox.images = images;
    state.lightbox.currentIndex = startIndex || 0;

    const modal = document.getElementById("lightbox-modal");
    const imgEl = document.getElementById("lightbox-img");
    const counterEl = document.getElementById("lightbox-counter");

    if (modal && imgEl) {
      imgEl.src = state.lightbox.images[state.lightbox.currentIndex];
      if (counterEl) {
        counterEl.textContent = `Image ${state.lightbox.currentIndex + 1} of ${state.lightbox.images.length}`;
      }
      modal.classList.add("open");
    }
  }

  function closeLightbox() {
    const modal = document.getElementById("lightbox-modal");
    if (modal) modal.classList.remove("open");
  }

  function navigateLightbox(dir) {
    if (!state.lightbox.images.length) return;
    state.lightbox.currentIndex = (state.lightbox.currentIndex + dir + state.lightbox.images.length) % state.lightbox.images.length;
    const imgEl = document.getElementById("lightbox-img");
    const counterEl = document.getElementById("lightbox-counter");
    if (imgEl) imgEl.src = state.lightbox.images[state.lightbox.currentIndex];
    if (counterEl) counterEl.textContent = `Image ${state.lightbox.currentIndex + 1} of ${state.lightbox.images.length}`;
  }

  function exportCleanedJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.cleanedPosts, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "cleaned_epa_posts.json");
    dlAnchor.click();
  }

  function exportCleanedCsv() {
    if (state.cleanedPosts.length === 0) return;
    const headers = [
      'clean_id', 'postUrl', 'createdAt', 'authorUsername', 'authorName', 'authorVerified',
      'city_detected', 'aqi_value', 'severity', 'category', 'sentiment',
      'total_engagement', 'likes', 'retweets', 'replies', 'quotes', 'views',
      'has_media', 'media_count', 'mediaUrls', 'text'
    ];

    const rows = state.cleanedPosts.map(p => {
      return headers.map(h => {
        let val = p[h];
        if (Array.isArray(val)) val = val.join(" ; ");
        if (val === null || val === undefined) val = "";
        let strVal = String(val);
        // Neutralize CSV formula injection (CWE-1236)
        if (/^[\=\+\-\@\t\r]/.test(strVal)) {
          strVal = "'" + strVal;
        }
        strVal = strVal.replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", encodeURI(csvContent));
    dlAnchor.setAttribute("download", "cleaned_epa_posts.csv");
    dlAnchor.click();
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function sanitizeUrl(url) {
    if (!url) return "#";
    const s = String(url).trim();
    if (/^(https?:\/\/|\/)/i.test(s)) {
      return s;
    }
    return "#";
  }

  function highlightTextEntities(text) {
    if (!text) return "";
    let safe = escapeHtml(text);
    
    safe = safe.replace(/(#[a-zA-Z0-9_\u0600-\u06FF]+)/g, '<span class="hashtag">$1</span>');
    
    safe = safe.replace(/(@[a-zA-Z0-9_]+)/g, '<span class="mention">$1</span>');
    
    safe = safe.replace(/\b(aqi\s*(?:of|is|reached|crossed|at)?\s*[:=-]?\s*[0-9]{2,4})\b/gi, '<span class="aqi-highlight">$1</span>');
    return safe;
  }

  function getInitials(name) {
    if (!name) return "X";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function getDeterministicColor(str) {
    const palette = [
      "#0284c7", "#0d9488", "#059669", "#d97706", "#dc2626",
      "#7c3aed", "#4f46e5", "#2563eb", "#db2777", "#475569"
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  function formatDate(isoStr) {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoStr;
    }
  }

  function formatNumber(num) {
    const n = parseInt(num || 0, 10);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();