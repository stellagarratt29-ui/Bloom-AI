#!/usr/bin/env python3
"""Patches dist/index.html to inject Google Fonts (Outfit + DM Sans) and base body style."""
import sys

content = open('dist/index.html').read()

inject = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link href="https://fonts.googleapis.com/css2?'
    'family=Outfit:wght@300;400;500;600;700;800&'
    'family=DM+Sans:ital,opsz,wght@'
    '0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;'
    '1,9..40,400'
    '&display=swap" rel="stylesheet">\n'
    '<style>\n'
    '  html, body, * { font-family: "DM Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }\n'
    '  h1, h2, h3, .outfit, [class*="title"], [class*="Title"], [class*="header"], [class*="Header"] {\n'
    '    font-family: "Outfit", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;\n'
    '  }\n'
    '</style>\n'
)

if '<link rel="preconnect" href="https://fonts.googleapis.com">' in content:
    print("Fonts already injected, skipping.")
else:
    content = content.replace('<link rel="icon"', inject + '<link rel="icon"')
    open('dist/index.html', 'w').write(content)
    print("Fonts injected successfully (Outfit + DM Sans).")
