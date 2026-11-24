const fs = require('fs');
const path = require('path');

const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
    }
    return out;
};

const prevSignificant = (s, i) => {
    let j = i - 1;
    while (j >= 0 && /\s/.test(s[j])) j -= 1;
    return j >= 0 ? s[j] : '';
};

const skipRegex = (s, i) => {
    i += 1;
    let inClass = false;
    while (i < s.length) {
        const c = s[i];
        if (c === '\\') { i += 2; continue; }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if (c === '/' && !inClass) return i + 1;
        else if (c === '\n') return i;
        i += 1;
    }
    return i;
};

const skipString = (s, i) => {
    const q = s[i];
    i += 1;
    while (i < s.length) {
        if (s[i] === '\\') { i += 2; continue; }
        if (s[i] === q) return i + 1;
        if (q === '`' && s[i] === '$' && s[i + 1] === '{') { i = skipParens(s, i + 1); continue; }
        i += 1;
    }
    return i;
};

const skipParens = (s, openIdx) => {
    let depth = 0;
    let i = openIdx;
    while (i < s.length) {
        const c = s[i];
        if (c === '"' || c === "'" || c === '`') { i = skipString(s, i); continue; }
        if (c === '/' && s[i + 1] === '/') { const nl = s.indexOf('\n', i); i = nl < 0 ? s.length : nl; continue; }
        if (c === '/' && s[i + 1] === '*') { const end = s.indexOf('*/', i); i = end < 0 ? s.length : end + 2; continue; }
        if (c === '/' && !/[\w)\]}]/.test(prevSignificant(s, i))) {
            // Could be a regex literal; a division after `)` etc. is not.
            const next = s[i + 1];
            if (next !== '=' && next !== ' ') { i = skipRegex(s, i); continue; }
        }
        if (c === '(') depth += 1;
        else if (c === ')') { depth -= 1; if (depth === 0) return i + 1; }
        i += 1;
    }
    return i;
};

const skipAngles = (s, openIdx) => {
    let depth = 0;
    let i = openIdx;
    while (i < s.length) {
        const c = s[i];
        if (c === '"' || c === "'") { i = skipString(s, i); continue; }
        if (c === '>' && s[i - 1] === '=') { i += 1; continue; }
        if (c === '<') depth += 1;
        else if (c === '>') { depth -= 1; if (depth === 0) return i + 1; }
        else if (c === '(') { i = skipParens(s, i); continue; }
        i += 1;
    }
    return i;
};

const nextNonWs = (s, i) => { while (i < s.length && /\s/.test(s[i])) i += 1; return i; };

const callEnd = (s, i) => {
    const close = skipParens(s, i);
    const after = nextNonWs(s, close);
    if (after < s.length && s[after] === '(') return skipParens(s, after);
    return close;
};

let wrapped = 0;
const skipped = [];
for (const file of walk('src')) {
    let text = fs.readFileSync(file, 'utf8');
    if (!/from 'zustand/.test(text)) continue;
    const re = /export const (\w+) = (create|createStore)\b/g;
    const inserts = [];
    let m;
    while ((m = re.exec(text))) {
        const name = m[1];
        let i = nextNonWs(text, m.index + m[0].length);
        if (text[i] === '<') { i = skipAngles(text, i); i = nextNonWs(text, i); }
        if (text[i] !== '(') continue;
        const end = callEnd(text, i);
        const balanced = (text.slice(i, end).match(/\(/g) ?? []).length === (text.slice(i, end).match(/\)/g) ?? []).length;
        if (!balanced) { skipped.push(`${file}: ${name} (unbalanced scan)`); continue; }
        const key = `folia.store.${path.relative('.', file).split(path.sep).join('/')}#${name}`;
        inserts.push({ start: m.index + 'export const '.length + name.length + 3, end, key });
    }
    if (inserts.length === 0) continue;
    inserts.sort((a, b) => b.start - a.start);
    for (const ins of inserts) {
        text = `${text.slice(0, ins.start)}sharedModuleState('${ins.key}', () => ${text.slice(ins.start, ins.end)})${text.slice(ins.end)}`;
    }
    const rel = path.relative(path.dirname(file), 'src/mods/runtime/sharedModuleState').split(path.sep).join('/');
    const importLine = `import { sharedModuleState } from '${rel.startsWith('.') ? rel : `./${rel}`}';\n`;
    if (!text.includes('mods/runtime/sharedModuleState')) text = text.replace(/^(import[^\n]*\n)/, `$1${importLine}`);
    fs.writeFileSync(file, text);
    wrapped += inserts.length;
}
console.log('wrapped', wrapped, 'skipped', skipped.length);
for (const s of skipped) console.log(' ', s);
