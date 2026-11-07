import re

with open(r'C:\Users\user\.gemini\antigravity-ide\brain\e08d651b-c8a7-43ea-bfa1-ada676a1aabf\.system_generated\steps\1959\content.md', 'r', encoding='utf-8') as f:
    text = f.read()

urls = set(re.findall(r'https://greca994\.gr/wp-content/uploads/[^\s\"\'\<\>]+\.(?:jpg|png|webp)', text))
for u in sorted(urls):
    print(u)
