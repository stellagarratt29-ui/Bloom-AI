#!/usr/bin/env python3
"""Patches dist/index.html to inject Google Fonts and a global DM Sans body style."""
import sys

content = open('dist/index.html').read()

inject = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@'
    '0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;'
    '1,9..144,300;1,9..144,400;1,9..144,600'
    '&family=DM+Sans:ital,opsz,wght@'
    '0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;'
    '1,9..40,400'
    '&display=swap" rel="stylesheet">\n'
    '<style>\n'
    '  html, body, * { font-family: "DM Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }\n'
    '  [class*="Fraunces"], .fraunces { font-family: "Fraunces", Georgia, serif; }\n'
    '</style>\n'
)

if '<link rel="preconnect" href="https://fonts.googleapis.com">' in content:
    print("Fonts already injected, skipping.")
else:
    content = content.replace('<link rel="icon"', inject + '<link rel="icon"')
    open('dist/index.html', 'w').write(content)
    print("Fonts injected successfully.")
