import os
import json

chunk_dir = r"C:\Users\Asif\.gemini\antigravity\brain\a6dc8537-a91f-4ace-9851-c149428ca25f\.system_generated\logs\chunks\transcript_full"
files = sorted([os.path.join(chunk_dir, f) for f in os.listdir(chunk_dir)])
content_bytes = b"".join(open(f, "rb").read() for f in files)
full_str = content_bytes.decode("utf-8", errors="ignore")

first_line = full_str.split("\n", 1)[0]
line0_obj = json.loads(first_line)
raw_content = line0_obj["content"]
print("raw_content length:", len(raw_content))

idx_start = raw_content.find("[")
idx_end = raw_content.rfind("]")
json_str = raw_content[idx_start:idx_end+1]
posts = json.loads(json_str)
print("Extracted posts count:", len(posts))

with open("data/raw_scraped_posts.json", "w", encoding="utf-8") as f:
    json.dump(posts, f, indent=2, ensure_ascii=False)

print("Saved to data/raw_scraped_posts.json successfully!")
