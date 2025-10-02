const fs = require('fs');
const vm = require('vm');
const path = require('path');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getLineNumberMap(text) {
  const map = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') map.push(i + 1);
  }
  return map;
}

function posToLineCol(text, pos) {
  let line = 1, col = 1;
  for (let i = 0; i < pos; i++) {
    if (text[i] === '\n') { line++; col = 1; } else { col++; }
  }
  return { line, col };
}

function extractScripts(html) {
  const scripts = [];
  const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const fullMatch = match[0];
    const code = match[1] || '';
    const tagEnd = fullMatch.indexOf('>');
    const codeStartInMatch = tagEnd >= 0 ? tagEnd + 1 : 0;
    const codeStartPos = match.index + codeStartInMatch;
    const before = html.slice(0, codeStartPos);
    const startLine = before.split('\n').length; // 1-based line where code starts
    scripts.push({ code, startLine });
  }
  return scripts;
}

function printContext(html, line, context = 3) {
  const lines = html.split('\n');
  const start = Math.max(1, line - context);
  const end = Math.min(lines.length, line + context);
  const out = [];
  for (let i = start; i <= end; i++) {
    const marker = i === line ? '>>' : '  ';
    out.push(`${marker} ${i}: ${lines[i-1]}`);
  }
  return out.join('\n');
}

function checkBrackets(code) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const openers = new Set(['(', '[', '{']);
  let inSingle = false, inDouble = false, inBacktick = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const prev = code[i-1];
    if (ch === '\\' && prev === '\\') continue; // escaped backslash
    if (!inDouble && !inBacktick && ch === "'" && prev !== '\\') inSingle = !inSingle;
    else if (!inSingle && !inBacktick && ch === '"' && prev !== '\\') inDouble = !inDouble;
    else if (!inSingle && !inDouble && ch === '`' && prev !== '\\') inBacktick = !inBacktick;
    if (inSingle || inDouble || inBacktick) continue;
    if (openers.has(ch)) stack.push({ ch, i });
    else if (ch in pairs) {
      if (stack.length === 0 || stack[stack.length - 1].ch !== pairs[ch]) {
        return { ok: false, index: i, expected: pairs[ch], got: ch };
      }
      stack.pop();
    }
  }
  if (stack.length > 0) return { ok: false, index: stack[stack.length - 1].i, expected: null, got: stack[stack.length - 1].ch };
  return { ok: true };
}

(function main() {
  const adminPath = path.resolve('public', 'admin.html');
  const html = readFile(adminPath);
  const scripts = extractScripts(html);
  if (scripts.length === 0) {
    console.log('No <script> blocks found.');
    return;
  }
  console.log(`Found ${scripts.length} <script> blocks. Checking each...`);
  scripts.forEach((s, idx) => {
    console.log(`Script #${idx + 1} starts at original line ${s.startLine}`);
  });

  let hadError = false;
  scripts.forEach((s, idx) => {
    const { code, startLine } = s;

    // Quick bracket check
    const br = checkBrackets(code);
    if (!br.ok) {
      hadError = true;
      const errLine = startLine + code.slice(0, br.index).split('\n').length - 1;
      const got = br.got;
      const expected = br.expected || 'matching closer';
      console.log(`Bracket mismatch in script #${idx + 1} near original line ${errLine} (saw '${got}', expected '${expected}')`);
      console.log(printContext(html, errLine));
    }

    try {
      // Compile with original line offset for accurate error line
      new vm.Script(code, { filename: 'admin.html', lineOffset: startLine - 1 });
    } catch (e) {
      hadError = true;
      console.log(`Syntax error in script #${idx + 1}: ${e.message}`);
      // Try to extract line number from stack
      const m = /admin.html:(\d+):(\d+)/.exec(e.stack || '');
      if (m) {
        const line = parseInt(m[1], 10);
        console.log('Context around line', line, ':');
        console.log(printContext(html, line));
      }
    }
  });

  if (!hadError) {
    console.log('No syntax or bracket errors detected in inline scripts.');
  }
})();
