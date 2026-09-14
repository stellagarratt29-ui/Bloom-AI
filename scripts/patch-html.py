#!/usr/bin/env python3
"""Patches dist/index.html to inject Google Fonts (Inter) and base body style."""
import sys

content = open('dist/index.html').read()

inject = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link href="https://fonts.googleapis.com/css2?'
    'family=Inter:wght@300;400;500;600;700&'
    'display=swap" rel="stylesheet">\n'
    '<style>\n'
    '  html, body, * { font-family: "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }\n'
    '</style>\n'
)

if '<link rel="preconnect" href="https://fonts.googleapis.com">' in content:
    print("Fonts already injected, skipping.")
else:
    content = content.replace('<link rel="icon"', inject + '<link rel="icon"')
    open('dist/index.html', 'w').write(content)
    print("Fonts injected successfully (Inter).")
