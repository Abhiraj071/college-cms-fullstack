import sys
import re

file_path = 'src/components/Dashboard.js'
with open(file_path, 'r', encoding='latin-1') as f:
    content = f.read()

# Aggressive fix for the broken line
pattern = r'<div style="font-size: 0\.75rem; color: var\(--text-secondary\);">.*?</div>'
replacement = '<div style="font-size: 0.75rem; color: var(--text-secondary);">${exam.time || \'TBA\'} • ${exam.venue || \'Room TBA\'}</div>'

content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='latin-1') as f:
    f.write(content)
