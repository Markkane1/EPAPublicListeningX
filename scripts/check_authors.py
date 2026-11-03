import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
from collections import Counter

# Let's inspect all authors
from test_pipeline_comprehensive import valid_posts

authors = Counter(p['authorUsername'] for p in valid_posts)
print(f"Total unique authors: {len(authors)}")
print("\nTop authors in cleaned dataset:")
for a, c in authors.most_common(20):
    print(f"  @{a}: {c} posts")
