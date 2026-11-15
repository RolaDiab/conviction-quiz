// Run: node tests/scoring.test.js   (checks scoring, tiers, copy rules)
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..');
const ctx = { document: { getElementById: () => ({ addEventListener() {}, set innerHTML(v) {} }), body: {} },
  localStorage: { getItem: () => null, setItem() {} }, location: { search: '', hash: '', pathname: '/', origin: 'x' },
  URLSearchParams, history: {}, addEventListener() {}, scrollTo() {}, setTimeout };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dir + '/content.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(dir + '/app.js', 'utf8'), ctx);
const { QUESTIONS, pillarPoints, reversePoints, isUniform, findPattern, summarize, REV_INDEX } = ctx.__quizInternals; const P = ctx.QUIZ.PILLARS;
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
ok(QUESTIONS.length === 21, '21 questions');
ok(QUESTIONS.every((q, i) => q.pillar === P[i % 7]), 'interleaved by pillar');
const rev = QUESTIONS.filter(q => q.reverse).map(q => q.pillar);
ok(rev.length === 7 && P.every(p => rev.includes(p)), 'exactly one reverse item per pillar');
// Must match the reverse positions hard-coded in the quiz_responses database trigger.
ok(JSON.stringify(REV_INDEX.slice().sort((a, b) => a - b)) === '[2,5,7,10,13,15,18]', 'reverse items at questions 3,6,8,11,14,16,19 (matches DB trigger)');
ok(QUESTIONS.filter(q => q.reverse).every(q => /unclear|doesn't fit|empty|falls apart|replay|don't sound|second-guessing/.test(q.text)), 'reverse items read negative');
ok(!QUESTIONS[0].reverse, 'first question is not reverse-worded');
const best = QUESTIONS.map(q => q.reverse ? 4 : 0), worst = QUESTIONS.map(q => q.reverse ? 0 : 4), mid = QUESTIONS.map(() => 2);
let s = summarize(pillarPoints(best)); ok(s.overall === 100 && s.pct.every(x => x === 100) && s.tier === 'The High Performer', 'best = 100%');
s = summarize(pillarPoints(worst)); ok(s.overall === 0 && s.tier === 'The Survivor', 'worst = 0%');
s = summarize(pillarPoints(mid)); ok(s.overall === 50 && s.tier === 'The Builder', 'all neutral = 50% Builder');
const yes = QUESTIONS.map(() => 0);
s = summarize(pillarPoints(yes), reversePoints(yes)); ok(s.overall < 79, 'yes-to-everything is not High Performer (' + s.overall + '%)');
ok(new Set(s.pct).size === 1, 'yes-to-everything favours no pillar (no pillar without a reverse item)');
ok(s.tied[0] && s.tied[1] && s.tied[2], 'yes-to-everything shows its blocks as tied');
ok(isUniform(yes) && isUniform(QUESTIONS.map(() => 2)), 'straight-lining is flagged');
ok(!isUniform(best) && !isUniform(worst.map((x, i) => i % 2 ? x : 1)), 'normal answer sets are not flagged');
// Tie-break: two pillars with equal points, the one agreeing more with its negative statement ranks first.
const pts = [10, 12, 12, 12, 12, 12, 10], r1 = [3, 3, 3, 3, 3, 3, 2];
s = summarize(pts, r1); ok(s.blocks[0] === 6 && !s.tied[0], 'tie broken by the reverse item, not pillar order');
s = summarize(pts); ok(s.tied[0] && s.tied[1], 'old links without reverse data show the tie');
ok(JSON.stringify(summarize([15, 15, 15, 9, 9, 9, 9]).strengths) === '[0,1]', 'strengths are the top two');
s = summarize([15, 12, 12, 3, 12, 12, 12]); ok(JSON.stringify(s.strengths) === '[0]' && !s.strengths.some(i => s.blocks.includes(i)), 'a tied pillar is never both a block and a strength');
ok(summarize([9, 9, 9, 9, 9, 9, 9]).strengths.length === 0, 'all equal: no strengths claimed');
const pct = o => P.map(p => o[p] === undefined ? 75 : o[p]);
ok(findPattern(pct({ intention: 92, practice: 42 })).key === 'clear-starter', 'pattern: clear starter');
ok(findPattern(pct({ practice: 92, meaning: 33 })).key === 'running-on-empty', 'pattern: running on empty');
ok(findPattern(pct({ alignment: 33, trust: 42 })).key === 'braced-decider', 'pattern: braced decider');
ok(findPattern(P.map(() => 58)).key === 'one-system', 'pattern: even profile');
ok(findPattern(pct({ intention: 100, practice: 75 })) === null, 'no pattern when the low pillar is still strong');
ok(ctx.QUIZ.PATTERNS.every(x => P.includes(x.hi) && P.includes(x.lo) && x.p.length), 'patterns name real pillars');
ok(ctx.QUIZ.OUTCOMES.length === 3, '3 outcome questions');
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
// "inevitable" is back in use by choice (commit 81de5ae, "Quiz copy: inevitable, not predictable").
ok(!/Conviction Index|IMPACT|Performance Operating System/.test(copy) && !/train your brain/i.test(copy), 'no retired terms');
process.exit(fails ? 1 : 0);
