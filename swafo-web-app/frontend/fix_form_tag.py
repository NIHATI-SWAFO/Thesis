import re

file_path = r"D:\Download\SWAFROTECH_APP\Thesis\swafo-web-app\frontend\src\features\freedom_wall\StudentFreedomWallDashboard.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the </form> tag
target_str = """              </div>
            </form>
          </div>"""

replacement_str = """              </div>
            </div>
          </div>"""

if target_str in content:
    content = content.replace(target_str, replacement_str)
    print("Fixed closing tag.")
else:
    print("Could not find the </form> target.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
