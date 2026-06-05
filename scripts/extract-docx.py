import re
import sys
import zipfile

path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    xml = z.read("word/document.xml").decode("utf-8")
text = re.sub(r"</w:p>", "\n", xml)
text = re.sub(r"<[^>]+>", "", text)
text = text.replace("&apos;", "'").replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
lines = [l.strip() for l in text.split("\n") if l.strip()]
print("\n".join(lines[200:]))
