import sys
import re

file_path = 'src/components/Dashboard.js'
# Read with ignore to skip bad bytes
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Aggressive fix for the broken line
pattern = r'<div style="font-size: 0\.75rem; color: var\(--text-secondary\);">.*?</div>'
replacement = '<div style="font-size: 0.75rem; color: var(--text-secondary);">${exam.time || "TBA"} • ${exam.venue || "Room TBA"}</div>'

content = re.sub(pattern, replacement, content)

# Also fix the other broken one if it still exists
wrong1 = '<div style="font-weight: 700; font-size: 0.9rem;">\\</div>'
right1 = '<div style="font-weight: 700; font-size: 0.9rem;">${exam.subject}</div>'
content = content.replace(wrong1, right1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
