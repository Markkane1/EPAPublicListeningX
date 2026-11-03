import re

path = 'dashboard/src/views/DashboardView/index.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update aqiValues & peakAqi fallback
content = re.sub(
    r"\.filter\(\(v\) => typeof v === 'number' && v > 0\);",
    ".filter((v) => typeof v === 'number' && v > 0 && v <= 1000);",
    content
)
content = re.sub(
    r"const peakAqi = aqiValues\.length > 0 \? Math\.max\(\.\.\.aqiValues\) : \(totalClean === 0 \? 'N/A' : 606\);",
    "const peakAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : (totalClean === 0 ? 'N/A' : 700);",
    content
)

# 2. Update verified text in filter bar and cards
content = content.replace(
    "`Showing ${totalClean} of ${posts.length} verified posts`",
    "`Showing ${totalClean} of ${posts.length} posts`"
)
content = content.replace(
    "`All Time Scope (${posts.length} verified posts)`",
    "`All Time Scope (${posts.length} posts)`"
)
content = content.replace(
    'title="Verified Clean Posts"',
    'title="Clean Posts"'
)
content = content.replace(
    'Clean Dataset: <strong style={{ color: \'#1e293b\' }}>{totalClean} Verified Posts</strong>',
    'Clean Dataset: <strong style={{ color: \'#1e293b\' }}>{totalClean} Posts</strong>'
)
content = content.replace(
    'Posts verified for Pakistani Punjab',
    'Posts scoped for Pakistani Punjab'
)
content = content.replace(
    '>\n                Verified Valid\n              </Typography>',
    '>\n                Valid Posts\n              </Typography>'
)

# 3. Remove ss4: borderLeft: '5px solid #f5365c',
content = re.sub(
    r"\s*borderLeft:\s*'5px solid #f5365c',",
    "",
    content
)

# 4. Remove '🚨 Public Health Emergency ' and make scope Punjab, Pakistan
# Target the top badge box in ss3
old_badge_pattern = re.compile(
    r"<Box sx=\{\{ display: 'flex', alignItems: 'center', gap: 1\.5, mb: 1\.5, flexWrap: 'wrap' \}\}>\s*"
    r"<Box\s+sx=\{\{[\s\S]*?\}\}>\s*"
    r"🚨 Public Health Emergency • Punjab, Pakistan\s*"
    r"</Box>\s*"
    r"<Typography\s+sx=\{\{[\s\S]*?\}\}>\s*"
    r"Target Scope: Lahore, Gujranwala, Faisalabad, Multan, Attock\s*"
    r"</Typography>\s*"
    r"</Box>",
    re.MULTILINE
)

new_badge = """<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                  px: 1.4,
                  py: 0.45,
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.6,
                }}
              >
                <PlaceRoundedIcon sx={{ fontSize: '15px', color: '#5e72e4' }} />
                Scope: Punjab, Pakistan
              </Box>
            </Box>"""

if old_badge_pattern.search(content):
    content = old_badge_pattern.sub(new_badge, content)
    print("Replaced emergency badge with Scope: Punjab, Pakistan")
else:
    print("Warning: old_badge_pattern not matched directly, checking fallback...")

# 5. Remove ss2: Enforced Negative Query Exclusion Filters
old_filters_pattern = re.compile(
    r"\{\/\* Negative Query Filter Pills \*\/\}[\s\S]*?<Box>[\s\S]*?Enforced Negative Query Exclusion Filters:[\s\S]*?<\/Box>\s*<\/Box>",
    re.MULTILINE
)

if old_filters_pattern.search(content):
    content = old_filters_pattern.sub("", content)
    print("Removed ss2 Enforced Negative Query Exclusion Filters")
else:
    # Try alternate without comment
    alt_filters_pattern = re.compile(
        r"<Box>\s*<Typography[^>]*?>\s*Enforced Negative Query Exclusion Filters:[\s\S]*?<\/Box>\s*<\/Box>",
        re.MULTILINE
    )
    if alt_filters_pattern.search(content):
        content = alt_filters_pattern.sub("", content)
        print("Removed ss2 Enforced Negative Query Exclusion Filters (alt pattern)")
    else:
        print("Warning: filters pattern not matched")

# Adjust grid margin bottom
content = content.replace("mb: 2.5,\n            }}\n          >\n            <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#f8f9fa'", "mb: 0,\n            }}\n          >\n            <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#f8f9fa'")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to DashboardView/index.jsx")
