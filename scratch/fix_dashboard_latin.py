import sys

file_path = 'src/components/Dashboard.js'
with open(file_path, 'r', encoding='latin-1') as f:
    content = f.read()

# Fix the broken parts
wrong1 = '<div style="font-weight: 700; font-size: 0.9rem;">\\</div>'
right1 = '<div style="font-weight: 700; font-size: 0.9rem;">${exam.subject}</div>'

wrong2 = '<div style="font-size: 0.75rem; color: var(--text-secondary);">\\   \\</div>'
right2 = '<div style="font-size: 0.75rem; color: var(--text-secondary);">${exam.time || \'TBA\'} • ${exam.venue || \'Room TBA\'}</div>'

# The PowerShell command also added double backticks in some places potentially
# but it looks like it used single backticks in the output I saw.
# Wait, I saw `` in my command string, let's check for those too.
content = content.replace('``', '`')
content = content.replace(wrong1, right1)
content = content.replace(wrong2, right2)

with open(file_path, 'w', encoding='latin-1') as f:
    f.write(content)
