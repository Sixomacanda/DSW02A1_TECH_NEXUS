#!/usr/bin/env python3
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent

conflict_marker = re.compile(r"^$", re.M)
end_re = re.compile(r"^ .*$(\n)?", re.M)

fixed_files = []

for p in root.rglob('*'):
    if not p.is_file():
        continue
    try:
        text = p.read_text(encoding='utf-8')
    except Exception:
        continue
    if '<<<<<<<' not in text:
        continue
    original = text
    changed = True
    while '<<<<<<<' in text and changed:
        changed = False
        m_start = start_re.search(text)
        if not m_start:
            break
        m_mid = mid_re.search(text, m_start.end())
        if not m_mid:
            break
        m_end = end_re.search(text, m_mid.end())
        if not m_end:
            break
        # extract theirs block (between mid and end)
        theirs = text[m_mid.end():m_end.start()]
        # replace whole conflict with theirs
        text = text[:m_start.start()] + theirs + text[m_end.end():]
        changed = True
    if text != original:
        # backup
        try:
            bkp = p.with_suffix(p.suffix + '.orig')
            if not bkp.exists():
                p.rename(bkp)
                bkp.write_text(original, encoding='utf-8')
                # write fixed content to original path
                bkp.replace(p)
            else:
                p.write_text(text, encoding='utf-8')
        except Exception:
            p.write_text(text, encoding='utf-8')
        fixed_files.append(str(p.relative_to(root)))

if fixed_files:
    print('Fixed files:')
    for f in fixed_files:
        print(f)
    sys.exit(0)
else:
    print('No conflict markers found.')
    sys.exit(0)
