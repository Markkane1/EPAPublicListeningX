
const XParser = (() => {
  
  function searchField(obj, fieldName, results = []) {
    if (!obj || typeof obj !== 'object') return results;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        searchField(obj[i], fieldName, results);
      }
      return results;
    }

    for (const key in obj) {
      if (key === fieldName && obj[key] !== undefined && obj[key] !== null) {
        results.push(obj[key]);
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        searchField(obj[key], fieldName, results);
      }
    }
    return results;
  }

  function getBestVideoUrl(media) {
    if (!media?.video_info?.variants || !Array.isArray(media.video_info.variants)) return null;
    const mp4s = media.video_info.variants.filter(v => v.content_type === 'video/mp4');
    if (!mp4s.length) return null;
    mp4s.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    return mp4s[0].url;
  }

  function parseUserShape(u) {
    if (!u) return {};
    const legacy = u.legacy || {};
    const core = u.core || {};
    return {
      description: u.profile_bio?.description || legacy.description || null,
      followers: u.relationship_counts?.followers ?? legacy.followers_count ?? null,
      following: u.relationship_counts?.following ?? legacy.friends_count ?? null,
      posts: u.tweet_counts?.tweets ?? legacy.statuses_count ?? null,
      media: u.tweet_counts?.media_tweets ?? legacy.media_count ?? null,
      likes: u.action_counts?.favorites_count ?? legacy.favourites_count ?? null,
      banner: u.banner?.image_url || legacy.profile_banner_url || null,
      avatar: legacy.profile_image_url_https ? legacy.profile_image_url_https.replace('_normal', '_400x400') : null,
      website: u.website?.url || legacy.url || null,
      location: u.location?.location || legacy.location || null,
      createdAt: core.created_at || legacy.created_at || null,
      name: core.name || legacy.name || null,
      screenName: core.screen_name || legacy.screen_name || null,
      isVerified: typeof u.verification?.verified === 'boolean'
        ? u.verification.verified
        : (typeof legacy.verified === 'boolean' ? legacy.verified : false),
      isBlueVerified: Boolean(u.is_blue_verified)
    };
  }

  function extractPosts(payload, existingSet = new Set()) {
    const posts = [];
    const tweetContainers = searchField(payload, 'tweet_results');

    for (const container of tweetContainers) {
      try {
        const tweetObj = container?.result || container;
        if (!tweetObj) continue;

        if (container.promotedMetadata || tweetObj.promotedMetadata) continue;

        const actualTweet = tweetObj.tweet || tweetObj;
        const legacy = actualTweet.legacy;
        if (!legacy?.id_str) continue;

        const tweetId = legacy.id_str;
        if (existingSet.has(tweetId)) continue;

        const retweetedResult = legacy.retweeted_status_result?.result;
        const isRetweet = Boolean(retweetedResult);
        const sourceTweet = retweetedResult ? (retweetedResult.tweet || retweetedResult) : actualTweet;
        const sourceLegacy = sourceTweet.legacy || legacy;

        const userResult = (sourceTweet.core?.user_results?.result) || (actualTweet.core?.user_results?.result);
        const userShape = parseUserShape(userResult);

        const screenName = userShape.screenName || 'i';

        const mediaItems = sourceLegacy.extended_entities?.media || sourceLegacy.entities?.media || [];
        const mediaUrls = [];
        const mediaTypes = [];

        for (const m of mediaItems) {
          if (m.type === 'video' || m.type === 'animated_gif') {
            const videoUrl = getBestVideoUrl(m);
            if (videoUrl) {
              mediaUrls.push(videoUrl);
              mediaTypes.push(m.type);
            } else if (m.media_url_https) {
              mediaUrls.push(m.media_url_https);
              mediaTypes.push(m.type);
            }
          } else if (m.media_url_https) {
            mediaUrls.push(m.media_url_https);
            mediaTypes.push('photo');
          }
        }

        let fullText = sourceLegacy.full_text || sourceLegacy.text || '';
        const noteTweet = sourceTweet.note_tweet?.note_tweet_results?.result;
        if (noteTweet?.text) {
          fullText = noteTweet.text;
        }

        const viewsCount = sourceTweet.views?.count ?? actualTweet.views?.count ?? null;

        const postRecord = {
          id: tweetId,
          type: isRetweet ? 'Retweet' : 'Post',
          postUrl: `https://x.com/${screenName}/status/${tweetId}`,
          text: fullText,
          createdAt: sourceLegacy.created_at || legacy.created_at || null,
          language: sourceLegacy.lang || null,
          likes: sourceLegacy.favorite_count ?? 0,
          retweets: sourceLegacy.retweet_count ?? 0,
          replies: sourceLegacy.reply_count ?? 0,
          quotes: sourceLegacy.quote_count ?? 0,
          bookmarks: sourceLegacy.bookmark_count ?? 0,
          views: viewsCount ? Number(viewsCount) : null,
          authorName: userShape.name || null,
          authorUsername: screenName,
          authorFollowers: userShape.followers,
          authorFollowing: userShape.following,
          authorDescription: userShape.description,
          authorVerified: userShape.isVerified || userShape.isBlueVerified,
          authorAvatar: userShape.avatar,
          authorBanner: userShape.banner,
          mediaUrls: mediaUrls.join(' ; '),
          mediaTypes: mediaTypes.join(' ; ')
        };

        existingSet.add(tweetId);
        posts.push(postRecord);
      } catch (err) {
        
      }
    }

    return posts;
  }

  function extractUsers(payload, existingSet = new Set()) {
    const users = [];
    const userContainers = searchField(payload, 'user_results');

    for (const container of userContainers) {
      try {
        const result = container?.result || container;
        if (!result) continue;

        const restId = result.rest_id || result.id;
        const shape = parseUserShape(result);
        const username = shape.screenName;
        if (!username) continue;

        const uniqueKey = restId || username.toLowerCase();
        if (existingSet.has(uniqueKey)) continue;

        const userRecord = {
          id: restId || username,
          username: username,
          name: shape.name || null,
          url: `https://x.com/${username}`,
          description: shape.description || null,
          location: shape.location || null,
          website: shape.website || null,
          joinDate: shape.createdAt || null,
          followers: shape.followers,
          following: shape.following,
          totalPosts: shape.posts,
          mediaCount: shape.media,
          likesCount: shape.likes,
          isVerified: shape.isVerified,
          isBlueVerified: shape.isBlueVerified,
          avatar: shape.avatar,
          banner: shape.banner
        };

        existingSet.add(uniqueKey);
        users.push(userRecord);
      } catch (e) {}
    }

    return users;
  }

  function extractTrends(payload, existingSet = new Set()) {
    const trends = [];
    const trendContainers = searchField(payload, 'trend_metadata');

    for (const container of trendContainers) {
      try {
        const name = container.name || container.trend_name;
        const rank = container.rank ?? null;
        if (!name) continue;

        if (existingSet.has(name)) continue;
        existingSet.add(name);

        const metadata = container.trend_metadata || {};
        const trendRecord = {
          name: name,
          rank: rank,
          url: `https://x.com/search?q=${encodeURIComponent(name)}&src=trend_click&vertical=trends`,
          domainContext: metadata.domain_context || null,
          metaDescription: metadata.meta_description || null
        };

        trends.push(trendRecord);
      } catch (e) {}
    }

    return trends;
  }

  function scrapeVisiblePostsDOM(existingSet = new Set()) {
    const posts = [];
    const articles = document.querySelectorAll('article[data-testid="tweet"]');

    articles.forEach(article => {
      try {
        
        const links = article.querySelectorAll('a[href*="/status/"]');
        let tweetUrl = null;
        let tweetId = null;
        let username = null;

        for (const link of links) {
          const match = link.href.match(/x\.com\/([^\/]+)\/status\/(\d+)/) ||
                        link.href.match(/twitter\.com\/([^\/]+)\/status\/(\d+)/);
          if (match) {
            username = match[1];
            tweetId = match[2];
            tweetUrl = link.href.split('?')[0];
            break;
          }
        }

        if (!tweetId || existingSet.has(tweetId)) return;

        const textEl = article.querySelector('[data-testid="tweetText"]');
        const text = textEl ? textEl.innerText : '';

        const authorEl = article.querySelector('[data-testid="User-Name"]');
        let authorName = '';
        if (authorEl) {
          const nameSpan = authorEl.querySelector('span');
          if (nameSpan) authorName = nameSpan.innerText;
        }

        const metrics = { replies: 0, retweets: 0, likes: 0, views: null };
        const buttons = article.querySelectorAll('button[aria-label]');
        buttons.forEach(btn => {
          const label = btn.getAttribute('aria-label') || '';
          if (label.includes('reply') || label.includes('Reply')) {
            const num = label.match(/(\d+[\d,]*)/);
            if (num) metrics.replies = parseInt(num[1].replace(/,/g, ''), 10);
          } else if (label.includes('repost') || label.includes('Repost') || label.includes('retweet')) {
            const num = label.match(/(\d+[\d,]*)/);
            if (num) metrics.retweets = parseInt(num[1].replace(/,/g, ''), 10);
          } else if (label.includes('like') || label.includes('Like')) {
            const num = label.match(/(\d+[\d,]*)/);
            if (num) metrics.likes = parseInt(num[1].replace(/,/g, ''), 10);
          }
        });

        const timeEl = article.querySelector('time');
        const createdAt = timeEl ? timeEl.getAttribute('datetime') : null;

        const imgEls = article.querySelectorAll('[data-testid="tweetPhoto"] img');
        const mediaUrls = [];
        imgEls.forEach(img => {
          if (img.src) mediaUrls.push(img.src);
        });

        existingSet.add(tweetId);
        posts.push({
          id: tweetId,
          type: 'Post',
          postUrl: tweetUrl || `https://x.com/${username}/status/${tweetId}`,
          text: text,
          createdAt: createdAt,
          language: null,
          likes: metrics.likes,
          retweets: metrics.retweets,
          replies: metrics.replies,
          quotes: 0,
          bookmarks: 0,
          views: metrics.views,
          authorName: authorName,
          authorUsername: username,
          authorFollowers: null,
          authorFollowing: null,
          authorDescription: null,
          authorVerified: Boolean(article.querySelector('[data-testid="icon-verified"]')),
          authorAvatar: article.querySelector('img[src*="profile_images"]')?.src || null,
          authorBanner: null,
          mediaUrls: mediaUrls.join(' ; '),
          mediaTypes: mediaUrls.length ? 'photo' : ''
        });
      } catch (err) {}
    });

    return posts;
  }

  return {
    extractPosts,
    extractUsers,
    extractTrends,
    scrapeVisiblePostsDOM
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = XParser;
}