import re

files = [
    '/Users/dmitrijfomin/Desktop/blog/app/[locale]/demos/sushi-delivery/page.tsx',
]

for path in files:
    with open(path, 'r') as f:
        content = f.read()
    new_content = re.sub(r'text-muted(?!-foreground)(?=[ "\'\\])', 'text-muted-foreground', content)
    with open(path, 'w') as f:
        f.write(new_content)
    print(f'Fixed: {path}')
