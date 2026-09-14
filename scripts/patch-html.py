#!/usr/bin/env python3
"""Patches dist/index.html to inject Google Fonts (Plus Jakarta Sans) and base body style."""
import sys

content = open('dist/index.html').read()

inject = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link href="https://fonts.googleapis.com/css2?'
    'family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&'
    'display=swap" rel="stylesheet">\n'
    '<style>\n'
    '  html, body, * { font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }\n'
    '</style>\n'
)

if '<link rel="preconnect" href="https://fonts.googleapis.com">' in content:
    print("Fonts already injected, skipping.")
else:
    content = content.replace('<link rel="icon"', inject + '<link rel="icon"')
    open('dist/index.html', 'w').write(content)
    print("Fonts injected successfully (Plus Jakarta Sans).")
