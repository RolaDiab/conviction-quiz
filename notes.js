// Plain-text call notes sent to GHL, so every Discovery Call booking shows the guest's quiz
// breakdown and application in the calendar invite. The guest sees the invite too, so these
// notes only hold the quiz results and the guest's own answers: no internal flags.
// Loaded after content.js on the quiz page and the apply page.
(function () {
  "use strict";
  var Q = window.QUIZ;
  var PER_PILLAR = Q.ITEMS[Q.PILLARS[0]].length;
  var P_MIN = PER_PILLAR, P_MAX = PER_PILLAR * 5;

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function pct(points, min, max) { return Math.round((points - min) / (max - min) * 100); }

  // Same scoring as app.js summarize(). tests/scoring.test.js checks the two agree.
  function summarize(points) {
    var total = points.reduce(function (a, b) { return a + b; }, 0);
    var overall = pct(total, P_MIN * 7, P_MAX * 7);
    var pcts = points.map(function (p) { return pct(p, P_MIN, P_MAX); });
    var tier = Q.TIERS.filter(function (t) { return overall <= t.max; })[0].name;
    var order = Q.PILLARS.map(function (p, i) { return i; })
      .sort(function (a, b) { return points[a] - points[b] || a - b; });
    return { overall: overall, pct: pcts, tier: tier, blocks: order.slice(0, 3) };
  }

  // Result codes are the #r=... part of a results link.
  function decode(code) {
    try {
      var b64 = String(code || "").replace(/-/g, "+").replace(/_/g, "/");
      var data = JSON.parse(decodeURIComponent(escape(atob(b64))));
      var ok = Array.isArray(data.p) && data.p.length === 7 &&
        data.p.every(function (x) { return Number.isInteger(x) && x >= P_MIN && x <= P_MAX; });
      return ok ? { name: String(data.n || "").slice(0, 60), points: data.p } : null;
    } catch (e) { return null; }
  }

  function quiz(points, resultUrl) {
    var s = summarize(points);
    var strong = s.pct[s.blocks[0]] >= 75;
    var top = s.pct.indexOf(Math.max.apply(null, s.pct));
    var lines = [
      "PERFORMANCE BLOCKS ASSESSMENT: QUIZ RESULTS",
      "",
      "Overall Performance Score: " + s.overall + "% (" + s.tier + ")",
      Q.TIER_COPY[s.tier][0].p[0],
      "",
      strong ? "Top 3 Growth Edges" : "Top 3 Performance Blocks"
    ];
    s.blocks.forEach(function (idx, n) {
      var c = Q.PILLAR_COPY[Q.PILLARS[idx]];
      lines.push("", (n + 1) + ". " + cap(Q.PILLARS[idx]) + ": " + s.pct[idx] + "%", c.line,
        (strong ? "Watch for: " : "How it shows up: ") + c.lo);
    });
    lines.push("", "All 7 Pillars");
    Q.PILLARS.forEach(function (p, i) {
      lines.push(cap(p) + ": " + s.pct[i] + "%" + (i === top ? " (strongest)" : ""));
    });
    if (resultUrl) lines.push("", "Full results: " + resultUrl);
    return lines.join("\n");
  }

  // v: the apply form answers. role is the "which best describes your role" answer.
  function application(v) {
    var challenges = (v.challenges || []).filter(Boolean);
    var lines = ["COACHING APPLICATION", ""];
    if (v.type) lines.push("Interested in: " + v.type);
    if (v.company) lines.push("Role and company: " + v.company);
    lines.push(
      "Role: " + v.role,
      "Wants to start: " + v.start,
      "Income or revenue: " + v.income,
      "Ready to invest: " + v.invest,
      "Open to energy clearing: " + v.energy,
      "",
      "Top challenges:"
    );
    challenges.forEach(function (c, i) { lines.push((i + 1) + ". " + c); });
    lines.push("", "90-day goal:", v.goal);
    return lines.join("\n");
  }

  window.QUIZ_NOTES = { summarize: summarize, decode: decode, quiz: quiz, application: application };
})();
