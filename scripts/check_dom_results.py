import re

html = open('dashboard_dom.html', encoding='utf-8').read()

print('--- CHECK 1: Peak AQI ---')
if '7912' in html:
    print('WARNING: 7912 STILL FOUND IN DOM!')
else:
    print('VERIFIED: 7912 NOT in DOM!')

# Find the peak AQI text
peak_matches = re.findall(r'Peak (?:Recorded )?AQI[\s\S]{1,120}', html)
for p in peak_matches[:2]:
    print('Found peak text:', repr(p.replace('\n', ' ')))

print('\n--- CHECK 2: Negative Query Filters (ss2) ---')
if 'Enforced Negative Query' in html:
    print('WARNING: Enforced Negative Query STILL FOUND IN DOM!')
else:
    print('VERIFIED: Enforced Negative Query Exclusion Filters completely removed!')

print('\n--- CHECK 3: Emergency Alert & Scope (ss3) ---')
if 'Public Health Emergency' in html:
    print('WARNING: Public Health Emergency STILL FOUND IN DOM!')
else:
    print('VERIFIED: Public Health Emergency completely removed!')

if 'Scope: Punjab, Pakistan' in html:
    print('VERIFIED: Scope: Punjab, Pakistan is present in DOM!')
else:
    print('WARNING: Scope: Punjab, Pakistan not found in DOM!')

print('\n--- CHECK 4: Verified Posts text ---')
if 'Verified Posts' in html:
    print('WARNING: "Verified Posts" STILL FOUND IN DOM!')
else:
    print('VERIFIED: "Verified Posts" removed from DOM!')

m_clean = re.findall(r'Clean Dataset:[\s\S]{1,100}?Posts', html)
for m in m_clean:
    print('Clean dataset text:', repr(m.replace('\n', ' ')))
