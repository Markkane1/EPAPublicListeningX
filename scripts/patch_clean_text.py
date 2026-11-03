import re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

# 1. SettingsView
update_file('dashboard/src/views/SettingsView/index.jsx', [
    ('Stored Verified Posts:', 'Stored Posts:')
])

# 2. AnalyticsView
update_file('dashboard/src/views/AnalyticsView/index.jsx', [
    ('Verified Post Volume by City / Region', 'Post Volume by City / Region')
])

# 3. FilterBar
update_file('dashboard/src/components/FilterBar/index.jsx', [
    ('<span>Showing <strong>{totalResults}</strong> of {totalAvailable} verified posts</span>',
     '<span>Showing <strong>{totalResults}</strong> of {totalAvailable} posts</span>')
])

# 4. PostsView
update_file('dashboard/src/views/PostsView/index.jsx', [
    ('Explore verified post previews, author attribution', 'Explore post previews, author attribution')
])

# 5. DirectSearchCard & SearchView
update_file('dashboard/src/components/DirectSearchCard/index.jsx', [
    ('matching verified posts.', 'matching posts.')
])
update_file('dashboard/src/views/SearchView/index.jsx', [
    ('matching verified posts.', 'matching posts.')
])

# 6. AuditView
update_file('dashboard/src/views/AuditView/index.jsx', [
    ('Verified Kept (${keptCount})', 'Kept Posts (${keptCount})')
])

print("All user-facing 'verified post' text cleaned up!")
