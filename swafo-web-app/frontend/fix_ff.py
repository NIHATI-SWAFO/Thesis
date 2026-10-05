import re

file_path = r"D:\Download\SWAFROTECH_APP\Thesis\swafo-web-app\frontend\src\components\common\AppealThreadModal.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Form Feed characters with backticks followed by 'f'
# Wait, the character is \x0c (form feed).
content = content.replace('\x0clex', '`flex')
content = content.replace('\x0cont', '`font')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
