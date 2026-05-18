import sys

file_path = 'src/components/Dashboard.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken parts
wrong1 = '<div style="font-weight: 700; font-size: 0.9rem;">\\</div>'
right1 = '<div style="font-weight: 700; font-size: 0.9rem;">${exam.subject}</div>'

wrong2 = '<div style="font-size: 0.75rem; color: var(--text-secondary);">\\   \\</div>'
right2 = '<div style="font-size: 0.75rem; color: var(--text-secondary);">${exam.time || \'TBA\'} • ${exam.venue || \'Room TBA\'}</div>'

content = content.replace(wrong1, right1)
content = content.replace(wrong2, right2)

# Also fix the double backticks if any
content = content.replace('``', '`')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
