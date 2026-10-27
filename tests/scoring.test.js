// Run: node tests/scoring.test.js   (checks scoring, tiers, copy rules)
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..');
const ctx = { document: { getElementById: () => ({ addEventListener() {}, set innerHTML(v) {} }), body: {} },
  localStorage: { getItem: () => null, setItem() {} }, location: { search: '', hash: '', pathname: '/', origin: 'x' },
  URLSearchParams, history: {}, addEventListener() {}, scrollTo() {}, setTimeout };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + '/content.js', 'utf8'), ctx);
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
const copy = ['content.js', 'app.js', 'apply/apply.js'].map(f => fs.readFileSync(dir + '/' + f, 'utf8')).join('\n');
ok(!/—/.test(copy), 'no em dashes');
ok(!/(^|[.!?"] +)And [a-z]/m.test(copy), 'no sentences starting with And');
ok(!/italic/.test(fs.readFileSync(dir + '/styles.css', 'utf8')), 'no italics');
ok(!/Conviction Index|IMPACT|Performance Operating System/.test(copy) && !/train your brain|inevitable/i.test(copy), 'no retired terms');
process.exit(fails ? 1 : 0);
