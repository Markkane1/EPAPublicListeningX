import re

with open('pipeline.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if 'def enrich_post(p: dict) -> dict:' in line:
        new_lines.append(line)
        i += 1
        # copy docstring and text extraction
        while i < len(lines) and 'aqi_val = None' not in lines[i]:
            new_lines.append(lines[i])
            i += 1
        
        # We are at aqi_val = None
        new_enrich_block = """    # 1. AQI extraction (stripping @mentions and URLs to avoid false matches on handles/links)
    cleaned_for_aqi = re.sub(r'@[A-Za-z0-9_]+', ' ', text)
    cleaned_for_aqi = re.sub(r'https?://\\S+', ' ', cleaned_for_aqi)
    cleaned_lower = cleaned_for_aqi.lower()
    
    aqi_val = None
    matches = []
    # e.g. "AQI 530", "AQI reached 619", "AQI of 500", "AQI: 606"
    for m in re.finditer(r'\\baqi\\b\\s*(?:of|is|reached|crossed|at|around|hit|hitting)?\\s*[:=-]?\\s*\\b([0-9]{2,3})\\b', cleaned_lower):
        try:
            val = int(m.group(1))
            if 15 <= val <= 999:
                matches.append(val)
        except ValueError:
            pass
    # e.g. "530 AQI", "600+ AQI", "700+ AQI"
    for m2 in re.finditer(r'\\b([0-9]{2,3})\\s*(?:\\+)?\\s*\\baqi\\b', cleaned_lower):
        try:
            val = int(m2.group(1))
            if 15 <= val <= 999:
                matches.append(val)
        except ValueError:
            pass
    if matches:
        aqi_val = max(matches)
"""
        new_lines.append(new_enrich_block)
        
        # Skip until "if aqi_val:"
        while i < len(lines) and not lines[i].strip().startswith('if aqi_val:'):
            i += 1
        continue
    new_lines.append(line)
    i += 1

with open('pipeline.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Updated pipeline.py enrich_post successfully!')
