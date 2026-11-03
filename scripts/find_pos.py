import os
import json

chunk_dir = r"C:\Users\Asif\.gemini\antigravity\brain\a6dc8537-a91f-4ace-9851-c149428ca25f\.system_generated\logs\chunks\transcript_full"
files = sorted([os.path.join(chunk_dir, f) for f in os.listdir(chunk_dir)])
content_bytes = b"".join(open(f, "rb").read() for f in files)
full_str = content_bytes.decode("utf-8", errors="ignore")

idx = full_str.find("2117228793140302029")
print("Position of post id in full_str:", idx)
if idx != -1:
    print("Surrounding text:", full_str[max(0, idx-100):idx+200])
