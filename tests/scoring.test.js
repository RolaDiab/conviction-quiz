// Run: node tests/scoring.test.js   (checks scoring, tiers, copy rules)
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..');
const ctx = { document: { getElementById: () => ({ addEventListener() {}, set innerHTML(v) {} }), body: {} },
  localStorage: { getItem: () => null, setItem() {} }, location: { search: '', hash: '', pathname: '/', origin: 'x' },
  URLSearchParams, history: {}, addEventListener() {}, scrollTo() {}, setTimeout };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + '/content.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(dir + '/notes.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(dir + '/app.js', 'utf8'), ctx);
const { QUESTIONS, pillarPoints, summarize } = ctx.__quizInternals; const P = ctx.QUIZ.PILLARS;
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
ok(QUESTIONS.length === 21, '21 questions');
ok(QUESTIONS.every((q, i) => q.pillar === P[i % 7]), 'interleaved by pillar');
const rev = QUESTIONS.filter(q => q.reverse).map(q => q.pillar);
ok(rev.length === 6 && !rev.includes('trust'), '6 reverse items: ' + rev);
ok(QUESTIONS.filter(q => q.reverse).every(q => /unclear|doubting|empty|falls apart|replay|avoid/.test(q.text)), 'reverse items read negative');
const best = QUESTIONS.map(q => q.reverse ? 4 : 0), worst = QUESTIONS.map(q => q.reverse ? 0 : 4), mid = QUESTIONS.map(() => 2);
let s = summarize(pillarPoints(best)); ok(s.overall === 100 && s.pct.every(x => x === 100) && s.tier === 'The High Performer', 'best = 100%');
s = summarize(pillarPoints(worst)); ok(s.overall === 0 && s.tier === 'The Survivor', 'worst = 0%');
s = summarize(pillarPoints(mid)); ok(s.overall === 50 && s.tier === 'The Builder', 'all neutral = 50% Builder');
s = summarize(pillarPoints(QUESTIONS.map(() => 0))); ok(s.overall < 79, 'yes-to-everything is not High Performer (' + s.overall + '%)');
const t = o => ctx.QUIZ.TIERS.filter(x => o <= x.max)[0].name;
ok(t(35) === 'The Survivor' && t(36) === 'The Builder' && t(56) === 'The Builder' && t(57) === 'The Achiever' && t(78) === 'The Achiever' && t(79) === 'The High Performer', 'tier boundaries');
ok(JSON.stringify(summarize([9, 9, 9, 9, 9, 9, 9]).blocks) === '[0,1,2]', 'ties break by pillar order');
const seen = new Set(); for (let tot = 21; tot <= 105; tot++) seen.add(t(Math.round((tot - 21) / 84 * 100))); ok(seen.size === 4, 'all 4 tiers reachable');
ok(Object.keys(ctx.QUIZ.TIER_COPY).length === 4, 'copy for every tier');
ok(P.every(p => ctx.QUIZ.PILLAR_COPY[p].line && ctx.QUIZ.PILLAR_COPY[p].lo), 'every pillar has a line and a symptom');
const copy = ['content.js', 'app.js', 'apply/apply.js', 'notes.js'].map(f => fs.readFileSync(dir + '/' + f, 'utf8')).join('\n');
ok(!/—/.test(copy), 'no em dashes');
ok(!/(^|[.!?"] +)And [a-z]/m.test(copy), 'no sentences starting with And');
ok(!/italic/.test(fs.readFileSync(dir + '/styles.css', 'utf8')), 'no italics');
ok(!/Conviction Index|IMPACT|Performance Operating System/.test(copy) && !/train your brain|inevitable/i.test(copy), 'no retired terms');
// Call notes for GHL (Discovery Call invites).
const N = ctx.QUIZ_NOTES;
const samples = [[12, 12, 12, 9, 10, 13, 12], [3, 3, 3, 3, 3, 3, 3], [15, 15, 15, 15, 15, 15, 15], [7, 14, 9, 11, 5, 13, 10]];
ok(samples.every(p => JSON.stringify(N.summarize(p)) === JSON.stringify(summarize(p))), 'notes scoring matches the quiz');
ok(JSON.stringify(N.decode('eyJuIjoiWXZvbm5lIiwicCI6WzEyLDEyLDEyLDksMTAsMTMsMTJdfQ')) === JSON.stringify({ name: 'Yvonne', points: [12, 12, 12, 9, 10, 13, 12] }), 'notes decode a results link');
ok(N.decode('bad!') === null && N.decode('') === null, 'notes reject a broken results code');
const qn = N.quiz([12, 12, 12, 9, 10, 13, 12], 'https://quiz.convictioncode.com/#r=x');
ok(/70% \(The Achiever\)/.test(qn) && /1\. Practice: 50%/.test(qn) && /2\. Alignment: 58%/.test(qn) && /Communication: 83% \(strongest\)/.test(qn) && /How it shows up: You start strong/.test(qn), 'quiz notes: score, blocks, pillars, symptoms');
ok(/Growth Edges/.test(N.quiz([15, 15, 15, 15, 15, 15, 15])) && /Watch for:/.test(N.quiz([15, 15, 15, 15, 15, 15, 15])), 'quiz notes: strong scorers get growth edges');
const an = N.application({ company: 'Owner', role: 'Founder or CEO', start: 'Right away', income: '$1M to $5M', invest: 'Yes', energy: 'Open', challenges: ['a', '', 'b'], goal: 'g' });
ok(/Income or revenue: \$1M to \$5M/.test(an) && /1\. a\n2\. b/.test(an) && !/QUALIFIED/i.test(an), 'application notes: answers only, no internal flags');
process.exit(fails ? 1 : 0);
