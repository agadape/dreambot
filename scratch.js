const fs = require('fs');
const data = fs.readFileSync('C:\\Users\\Advan\\.gemini\\antigravity-cli\\brain\\3bbc7279-1094-4c87-a9fc-f126428c54fc\\.system_generated\\steps\\76\\content.md', 'utf8');

// The markdown file from read_url_content actually contains the HTML.
// Inside the HTML there is `self.__next_f.push([1,"..."])` which contains strings that might be readable text.
const textChunks = data.match(/\\"([^\\"]+)\\"/g);
if (textChunks) {
  const filtered = new Set();
  for (const chunk of textChunks) {
    const s = chunk.replace(/\\"/g, '');
    if (s.length > 20 && !s.includes('className') && !s.includes('children') && !s.includes('href')) {
      filtered.add(s);
    }
  }
  console.log(Array.from(filtered).join('\n').substring(0, 4000));
}
