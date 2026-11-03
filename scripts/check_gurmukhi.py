import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

json_path = r"C:\Users\Asif\.gemini\antigravity\brain\a6dc8537-a91f-4ace-9851-c149428ca25f\.user_uploaded\media_1793624655821_92bfc20c.json"
with open(json_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

for idx, p in enumerate(posts):
    text = p.get('text', '')
    if re.search(r'[\u0a00-\u0a7f]', text):
        author = p.get('authorUsername')
        print(f"Gurmukhi in post [{idx}] @{author}: {text[:90].replace(chr(10), ' ')}")
