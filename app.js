(function () {
  "use strict";
  var Q = window.QUIZ;
  // v2: new item set (2026-11). In-progress v1 answers don't map to v2 questions, so only contact details carry over.
  var STORE_KEY = "cc_quiz_v2", OLD_STORE_KEY = "cc_quiz_v1";
  var app = document.getElementById("app");

  // ---------- Questions ----------
  // Interleave pillars: item 1 of every pillar, then item 2 of every pillar, etc.
  var PER_PILLAR = Q.ITEMS[Q.PILLARS[0]].length;
  var QUESTIONS = [];
  for (var round = 0; round < PER_PILLAR; round++) {
    Q.PILLARS.forEach(function (pillar) {
      var raw = Q.ITEMS[pillar][round];
      var reverse = raw.indexOf("R:") === 0;
      QUESTIONS.push({ pillar: pillar, text: reverse ? raw.slice(2) : raw, reverse: reverse });
    });
  }
  var OUT_START = QUESTIONS.length;                  // first unscored outcome question
  var PROFILE_START = OUT_START + Q.OUTCOMES.length; // first optional profile question
  var TOTAL_STEPS = PROFILE_START + Q.PROFILE.length;
  // Question index of each pillar's reverse item, used to break ties (agreeing with a negative statement is
  // the signal least inflated by people who agree with everything).
  var REV_INDEX = Q.PILLARS.map(function (p) {
    for (var i = 0; i < QUESTIONS.length; i++) if (QUESTIONS[i].pillar === p && QUESTIONS[i].reverse) return i;
    return -1;
  });

  // ---------- Scoring ----------
  // optionIndex 0 = Strongly Agree. Normal items score 5..1, reverse items 1..5.
  function itemPoints(q, optionIndex) {
    var v = 5 - optionIndex;
    return q.reverse ? 6 - v : v;
  }

  function pillarPoints(answers) {
    var pts = {};
    Q.PILLARS.forEach(function (p) { pts[p] = 0; });
    QUESTIONS.forEach(function (q, i) { pts[q.pillar] += itemPoints(q, answers[i]); });
    return Q.PILLARS.map(function (p) { return pts[p]; });
  }
  // Points (1-5) on each pillar's reverse item.
  function reversePoints(answers) {
    return REV_INDEX.map(function (i) { return itemPoints(QUESTIONS[i], answers[i]); });
  }

  // Flags answer sets too uniform to read precisely: the same answer 21 times, or agreeing with both
  // the positive and the negative statement on 4+ pillars.
  function isUniform(answers) {
    if (answers.every(function (a) { return a === answers[0]; })) return true;
    var contradictions = 0;
    Q.PILLARS.forEach(function (p) {
      var agreeRev = false, agreeNormal = 0;
      QUESTIONS.forEach(function (q, i) {
        if (q.pillar !== p) return;
        if (answers[i] <= 1) { if (q.reverse) agreeRev = true; else agreeNormal++; }
      });
      if (agreeRev && agreeNormal === 2) contradictions++;
    });
    return contradictions >= 4;
  }

  // Percentages run 0 to 100: every answer at the low end = 0%, every answer at the high end = 100%.
  var P_MIN = PER_PILLAR, P_MAX = PER_PILLAR * 5;
  function toPct(points, min, max) { return Math.round((points - min) / (max - min) * 100); }

  // The pattern two pillars make together (see PATTERNS in content.js).
  function findPattern(pct) {
    var best = null, bestGap = 0;
    Q.PATTERNS.forEach(function (pt) {
      var hi = pct[Q.PILLARS.indexOf(pt.hi)], lo = pct[Q.PILLARS.indexOf(pt.lo)];
      var gap = hi - lo;
      if (gap >= 25 && lo <= 67 && gap > bestGap) { best = pt; bestGap = gap; }
    });
    // Braced: alignment and trust both at or under 50 and at least 20 below the other five on average.
    // It outranks any single pair, because it names both low pillars at once.
    var a = pct[Q.PILLARS.indexOf("alignment")], t = pct[Q.PILLARS.indexOf("trust")];
    var others = pct.filter(function (x, i) { return Q.PILLARS[i] !== "alignment" && Q.PILLARS[i] !== "trust"; });
    var braceGap = others.reduce(function (x, y) { return x + y; }, 0) / others.length - (a + t) / 2;
    if (a <= 50 && t <= 50 && braceGap >= 20) best = Q.PATTERN_BRACED;
    if (!best && Math.max.apply(null, pct) - Math.min.apply(null, pct) < 17) best = Q.PATTERN_EVEN;
    return best;
  }

  // rev (optional): reverse-item points per pillar. Older result links don't carry it.
  function summarize(points, rev) {
    var total = points.reduce(function (a, b) { return a + b; }, 0);
    var overall = toPct(total, P_MIN * 7, P_MAX * 7);
    var pct = points.map(function (p) { return toPct(p, P_MIN, P_MAX); });
    var tier = Q.TIERS.filter(function (t) { return overall <= t.max; })[0].name;
    var r = rev || [0, 0, 0, 0, 0, 0, 0];
    var idx = Q.PILLARS.map(function (p, i) { return i; });
    var order = idx.slice().sort(function (a, b) { return points[a] - points[b] || r[a] - r[b] || a - b; });
    var top = idx.slice().sort(function (a, b) { return points[b] - points[a] || r[b] - r[a] || a - b; });
    var same = function (a, b) { return points[a] === points[b] && r[a] === r[b]; };
    // tied[n]: block n can't honestly be ranked above or below a neighbour.
    var blocks = order.slice(0, 3);
    var tied = blocks.map(function (b, n) {
      return (n > 0 && same(b, order[n - 1])) || same(b, order[n + 1]);
    });
    // A strength must score above every block, so a tied pillar is never called both.
    var ceiling = Math.max.apply(null, blocks.map(function (b) { return points[b]; }));
    var strengths = top.filter(function (i) { return points[i] > ceiling; }).slice(0, 2);
    return { overall: overall, pct: pct, tier: tier, blocks: blocks, tied: tied, strengths: strengths, pattern: findPattern(pct) };
  }
  window.__quizInternals = { QUESTIONS: QUESTIONS, itemPoints: itemPoints, pillarPoints: pillarPoints, reversePoints: reversePoints,
    isUniform: isUniform, findPattern: findPattern, summarize: summarize, REV_INDEX: REV_INDEX };

  // ---------- State ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  // Carry contact details over from the v1 store so returning visitors skip the form; drop v1 answers.
  function loadOld() {
    try {
      var o = JSON.parse(localStorage.getItem(OLD_STORE_KEY));
      if (!o) return null;
      return { step: -1, answers: [], outcomes: [], profile: { role: o.profile && o.profile.role }, gate: o.gate, listed: o.listed, src: o.src, ref: o.ref };
    } catch (e) { return null; }
  }
  var state = load() || loadOld() || { step: -1, answers: [], outcomes: [], profile: {} };
  state.outcomes = state.outcomes || [];
  // Half of visitors see "Strongly Disagree" first, half "Strongly Agree" first, so answer order can't
  // tilt the scores in one direction. Fixed per visitor so the screens stay consistent.
  if (typeof state.flip !== "boolean") { state.flip = Math.random() < 0.5; save(); }

  var params = new URLSearchParams(location.search);
  var utm = {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || ""
  };

  // The website that sent them (Instagram, Google, etc.), kept from their first visit.
  // Catches some visitors who used the plain link with no utm tag. In-app browsers often hide it.
  try {
    var refHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    if (refHost && refHost !== location.hostname) { state.ref = refHost; save(); }
  } catch (e) {}
  function refName() {
    var h = state.ref || "";
    var known = [["instagram", "Instagram"], ["facebook", "Facebook"], ["linkedin", "LinkedIn"], ["lnkd.in", "LinkedIn"],
      ["tiktok", "TikTok"], ["youtube", "YouTube"], ["t.co", "X"], ["twitter", "X"], ["mail.google", "Gmail"], ["google.", "Google search"], ["bing.", "Bing search"]];
    for (var i = 0; i < known.length; i++) if (h.indexOf(known[i][0]) !== -1) return known[i][1];
    return h;
  }
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  // utm_source when the link had one, else the referring site, else "direct".
  function sourceLabel() { return utm.utm_source || (state.ref ? refName() + " (referrer)" : "direct"); }

  // ---------- Funnel counter (views, starts, finishes) ----------
  var sessionId;
  try { sessionId = sessionStorage.getItem("cc_sid"); if (!sessionId) { sessionId = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("cc_sid", sessionId); } } catch (e) { sessionId = Math.random().toString(36).slice(2, 12); }
  var tracked = {};
  function track(event) {
    if (tracked[event] || !Q.EVENTS_URL) return;
    tracked[event] = true;
    try {
      fetch(Q.EVENTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": Q.EMAIL_PUBLIC_KEY, "Authorization": "Bearer " + Q.EMAIL_PUBLIC_KEY, "Prefer": "return=minimal" },
        body: JSON.stringify({ event: event, source: sourceLabel().slice(0, 100), session_id: sessionId }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  // ---------- Helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function paras(list) { return list.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""); }

  function encodeResult(name, points, rev, uniform) {
    var data = { n: name, p: points };
    if (rev) data.r = rev;
    if (uniform) data.u = 1;
    var json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodeResult(code) {
    try {
      var b64 = code.replace(/-/g, "+").replace(/_/g, "/");
      var data = JSON.parse(decodeURIComponent(escape(atob(b64))));
      var ok = Array.isArray(data.p) && data.p.length === 7 &&
        data.p.every(function (x) { return Number.isInteger(x) && x >= P_MIN && x <= P_MAX; });
      var rev = Array.isArray(data.r) && data.r.length === 7 &&
        data.r.every(function (x) { return Number.isInteger(x) && x >= 1 && x <= 5; }) ? data.r : null;
      return ok ? { name: String(data.n || "").slice(0, 60), points: data.p, rev: rev, uniform: data.u === 1 } : null;
    } catch (e) { return null; }
  }
  // Always the site root, so links match what the results email accepts (https://quiz.convictioncode.com/#r=...).
  function resultUrl(code) { return location.origin + "/#r=" + code; }

  function scrollTop() { window.scrollTo(0, 0); }

  // ---------- Views ----------
  function renderLanding() {
    document.body.className = "is-landing";
    track("landing_view");
    var resume = state.step >= 0 && state.step < TOTAL_STEPS;
    app.innerHTML =
      '<section class="hero"><div class="wrap hero-grid">' +
        '<div class="hero-copy">' +
          '<p class="eyebrow">The Performance Blocks Assessment</p>' +
          '<h1>Are you ready to make <span class="gold">success inevitable</span>?</h1>' +
          '<p class="tagline">Success isn\'t luck. It\'s engineered across 7 pillars. In 4 minutes, find the one holding you back.</p>' +
          '<p class="lead">About 4 minutes. Free. Instant results.</p>' +
          '<div class="cta-row"><button class="btn btn-gold" data-act="start">' + (resume ? "Continue My Assessment" : "Answer the 21 Questions") + '</button>' +
          (resume ? '<button class="btn btn-ghost" data-act="restart">Start over</button>' : "") + '</div>' +
          '<p class="fine">Built on neuroscience and performance research.</p>' +
        '</div>' +
        '<div class="hero-photo stage"><img src="stage.jpg?v=1" alt="Rola Diab on stage presenting The Conviction Code" width="1000" height="667"></div>' +
      '</div></section>' +

      '<section class="band"><div class="wrap narrow">' +
        '<h2>Your strategy sets the direction. Your inner engine sets the pace.</h2>' +
        '<p>In 4 minutes, see how all 7 cylinders are firing:</p>' +
        '<ul class="checks">' +
          '<li>The cylinder that\'s misfiring and quietly draining your results, named</li>' +
          '<li>Your score on each one, the 7 pillars of performance</li>' +
          '<li>Where to focus first, so more effort means more results again</li>' +
          '<li>Your Signature Pattern, and a First 7 Days plan to start clearing your #1 block</li>' +
          '<li>Your next step to enjoy the wins, not just reach them</li>' +
        '</ul>' +
      '</div></section>' +

      '<section class="trust"><div class="wrap">' +
        '<p class="trust-label">Trusted by leaders at</p>' +
        '<p class="trust-names">KPMG · Bloomberg · Mindvalley · Principal Financial · Entrepreneurs\' Organization · UAE Government</p>' +
        '<p class="trust-label">Featured in and on stage at</p>' +
        '<p class="trust-names">Fast Company Middle East · Arabian Business · AIM Congress · Global Investors Forum</p>' +
      '</div></section>' +

      '<section class="band"><div class="wrap narrow about">' +
        '<h2>Hi, I\'m Rola.</h2>' +
        '<p>I\'ve spent my career studying what makes success inevitable. The gap between where you are and where you want to be isn\'t strategy. It\'s conviction. I built The Conviction Code™ on that premise, blending neuroscience and behavioral psychology into a system I teach to executives at KPMG, Bloomberg, and government leaders, on stages including Mindvalley University.</p>' +
        '<p>Before that, I ran a $100M brand as its president, so I know what performance under pressure actually demands.</p>' +
      '</div></section>' +

      '<section class="quotes"><div class="wrap quote-grid">' +
        '<blockquote><p>"When I first started working with Rola I was hoping to work towards a promotion and move up in my career in the next 2-3 years. Rola helped remove some limitations and guided me using her strategies so that I accelerated that timeline to receiving multiple offers and a project from the Minister himself within 3.5 months!"</p><cite>Lujain Ghalib, Executive</cite></blockquote>' +
        '<blockquote><p>"She really gets to know you and like a brain surgeon, takes out what is hurting you and installs new belief systems that change the game. I was promoted within 3 months, and had 3 raises within a 12-month period."</p><cite>Aaron Wilson, National Business Manager, Human Interest</cite></blockquote>' +
      '</div></section>' +

      '<section class="final"><div class="wrap narrow center">' +
        '<h2>You\'ve already proven you can win.</h2>' +
        '<p class="tagline">Now find out why it stopped feeling like winning.</p>' +
        '<p>21 questions. About 4 minutes. Free, with instant results.</p>' +
        '<button class="btn btn-gold" data-act="start">Answer the 21 Questions</button>' +
      '</div></section>' +
      footer();
  }

  function footer() {
    return '<footer class="foot">Conviction Code™ by Rola Diab © 2026 · <a href="https://roladiab.com/privacy" target="_blank" rel="noopener">Privacy</a></footer>';
  }

  function progressBar() {
    // Count only the 21 scored questions; the optional profile screens show as "Almost done" / "Last one".
    var Qn = QUESTIONS.length;
    var label = state.step < Qn ? "Question " + (state.step + 1) + " of " + Qn : state.step === TOTAL_STEPS - 1 ? "Last one" : "Almost done";
    // Outcome and profile screens fill the last stretch of the bar.
    var pct = state.step < Qn ? Math.round(state.step / Qn * 100) : Math.round(state.step / TOTAL_STEPS * 100);
    return '<div class="progress"><div class="progress-meta"><span>' + label + '</span><span>' + pct + '%</span></div>' +
      '<div class="bar"><div class="fill" style="width:' + pct + '%"></div></div></div>';
  }

  function renderQuestion() {
    document.body.className = "is-flow";
    var i = state.step;
    var html = '<section class="flow"><div class="wrap flow-wrap">' + progressBar();

    // Option buttons in this visitor's order. data-k is always the canonical index (0 = Strongly Agree).
    var scale = function (act, chosen) {
      var ks = Q.OPTIONS.map(function (o, k) { return k; });
      if (state.flip) ks.reverse();
      return '<div class="opts">' + ks.map(function (k) {
        var sel = chosen === k ? " selected" : "";
        return '<button class="opt' + sel + '" data-act="' + act + '" data-k="' + k + '">' + esc(Q.OPTIONS[k]) + '</button>';
      }).join("") + '</div>';
    };

    if (i < OUT_START) {
      var q = QUESTIONS[i];
      html += '<p class="instruction">Rate how true this has been for you in the last 30 days, not where you aspire to be.</p>' +
        '<h2 class="q">' + esc(q.text) + '</h2>' + scale("answer", state.answers[i]);
    } else if (i < PROFILE_START) {
      var oq = Q.OUTCOMES[i - OUT_START];
      html += '<p class="instruction">' + esc(Q.OUTCOMES_INTRO) + '</p>' +
        '<h2 class="q">' + esc(oq.text) + '</h2>' + scale("outcome", state.outcomes[i - OUT_START]);
    } else {
      var pq = Q.PROFILE[i - PROFILE_START];
      var val = state.profile[pq.key] || "";
      html += '<p class="instruction">Optional.</p><h2 class="q">' + esc(pq.text) + '</h2>';
      if (pq.options) {
        html += '<div class="opts">' + pq.options.map(function (o) {
          var sel = val === o ? " selected" : "";
          return '<button class="opt' + sel + '" data-act="profile" data-v="' + esc(o) + '">' + esc(o) + '</button>';
        }).join("") + '</div>' +
          '<div class="cta-row"><button class="btn btn-link" data-act="profile-skip">' + (i === TOTAL_STEPS - 1 ? "Skip and see my results" : "Skip") + '</button></div>';
      } else {
        html += (pq.multiline
          ? '<textarea id="ptext" maxlength="1000" rows="4" placeholder="' + esc(pq.placeholder) + '">' + esc(val) + '</textarea>'
          : '<input id="ptext" type="text" maxlength="200" placeholder="' + esc(pq.placeholder) + '" value="' + esc(val) + '">') +
          '<div class="cta-row"><button class="btn btn-navy" data-act="profile-text">Next</button>' +
          (pq.optional ? '<button class="btn btn-link" data-act="profile-skip">Skip</button>' : "") + '</div>';
      }
    }
    html += '<button class="btn btn-link back" data-act="back">← Back</button>' +
      '</div></section>';
    app.innerHTML = html;
    var t = document.getElementById("ptext");
    if (t) t.focus();
  }

  function renderGate(error) {
    document.body.className = "is-flow";
    var g = state.gate || {};
    app.innerHTML =
      '<section class="flow"><div class="wrap flow-wrap gate">' +
        '<p class="eyebrow dark">Your results are ready</p>' +
        '<h2 class="q">Where should we send your Performance Profile?</h2>' +
        '<ul class="checks unlock">' +
          '<li>Your Performance Score and tier</li>' +
          '<li>Your #1 Performance Block™, named</li>' +
          '<li>Your Signature Pattern across the 7 pillars</li>' +
          '<li>Your First 7 Days plan to start clearing it</li>' +
        '</ul>' +
        '<p class="sub">Your results open the moment you submit, and a copy goes to your inbox.</p>' +
        '<form id="gate" novalidate>' +
          '<label>First name<input name="first_name" autocomplete="given-name" maxlength="60" required value="' + esc(g.first_name || "") + '"></label>' +
          '<label>Last name<input name="last_name" autocomplete="family-name" maxlength="60" required value="' + esc(g.last_name || "") + '"></label>' +
          '<label>Email<input name="email" type="email" autocomplete="email" maxlength="255" required value="' + esc(g.email || "") + '"></label>' +
          '<label class="consent"><input name="consent" type="checkbox"' + (g.consent ? " checked" : "") + '> Send me my results and occasional insights from Rola. Unsubscribe anytime. <a href="https://roladiab.com/privacy" target="_blank" rel="noopener">Privacy policy</a>.</label>' +
          (error ? '<p class="err">' + esc(error) + '</p>' : "") +
          '<button class="btn btn-gold wide" type="submit">See My Results</button>' +
        '</form>' +
        '<button class="btn btn-link back" data-act="gate-back">← Back</button>' +
      '</div></section>';
  }

  // Seven-sided radar of the pillar scores. Pure SVG, so it prints and needs no library.
  function radarSvg(pct) {
    var cx = 230, cy = 168, R = 100, n = Q.PILLARS.length;
    var pt = function (i, r) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    var poly = function (rs) { return rs.map(function (r, i) { return pt(i, r).map(function (v) { return v.toFixed(1); }).join(","); }).join(" "); };
    var grid = [25, 50, 75, 100].map(function (g) {
      return '<polygon class="radar-grid" points="' + poly(Q.PILLARS.map(function () { return R * g / 100; })) + '"/>';
    }).join("");
    var axes = Q.PILLARS.map(function (p, i) {
      var e = pt(i, R);
      return '<line class="radar-axis" x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '"/>';
    }).join("");
    var vals = pct.map(function (v) { return R * Math.max(v, 3) / 100; });
    var dots = vals.map(function (r, i) { var d = pt(i, r); return '<circle class="radar-dot" cx="' + d[0].toFixed(1) + '" cy="' + d[1].toFixed(1) + '" r="4"/>'; }).join("");
    var labels = Q.PILLARS.map(function (p, i) {
      // Two lines (name, then score) so the longest name fits at phone width.
      var l = pt(i, R + 16), anchor = Math.abs(l[0] - cx) < 8 ? "middle" : l[0] < cx ? "end" : "start";
      var y = l[1] < cy - R + 10 ? l[1] - 18 : l[1] > cy + 40 ? l[1] + 8 : l[1] - 4;
      return '<text class="radar-label" x="' + l[0].toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + anchor + '">' + esc(cap(p)) +
        '<tspan class="radar-pct" x="' + l[0].toFixed(1) + '" dy="15">' + pct[i] + '%</tspan></text>';
    }).join("");
    var summary = Q.PILLARS.map(function (p, i) { return cap(p) + " " + pct[i] + "%"; }).join(", ");
    return '<svg class="radar" viewBox="0 0 460 330" role="img" aria-label="Your 7 pillar scores: ' + esc(summary) + '">' +
      grid + axes + '<polygon class="radar-shape" points="' + poly(vals) + '"/>' + dots + labels + '</svg>';
  }

  var justFinished = false;
  function renderResult(name, points, rev, uniform) {
    var fresh = justFinished;
    document.body.className = "is-result";
    var s = summarize(points, rev);
    var code = encodeResult(name, points, rev, uniform);
    var tierBlocks = Q.TIER_COPY[s.tier].map(function (b) {
      return (b.h ? "<h3>" + esc(b.h) + "</h3>" : "") + paras(b.p);
    }).join("");

    // A 90% pillar isn't a "block". When even the lowest pillar is strong, call them growth edges.
    var strong = s.pct[s.blocks[0]] >= 75;
    var blocksTitle = strong ? "Your Top 3 Growth Edges" : "Your Top 3 Performance Blocks™";
    var blocksSub = strong
      ? "Your three lowest pillars. Even here you're strong. This is where mastery deepens next."
      : "Your three lowest pillars. This is where your engine is misfiring. Start with number one.";
    if (s.tied[0]) blocksSub += " Your top block is tied, so treat the tied pillars as one place to start.";

    var blocks = s.blocks.map(function (idx, n) {
      var p = Q.PILLARS[idx], c = Q.PILLAR_COPY[p];
      // The #1 block gets the full picture: what the pillar is and the research behind it.
      var deep = n === 0 ? '<p class="deep">' + esc(c.d) + '</p><p class="why"><strong>The research:</strong> ' + esc(c.why) + '</p>' : "";
      return '<div class="block"><span class="block-n">' + (n + 1) + '</span><div>' +
        '<h4>' + cap(p) + ' <span class="pct">' + s.pct[idx] + '%</span>' + (s.tied[n] ? ' <span class="tag">Tied</span>' : "") + '</h4>' +
        '<p>' + esc(c.line) + '</p>' +
        '<p class="lo"><strong>' + (strong ? "Watch for:" : "How it shows up:") + '</strong> ' + esc(c.lo) + '</p>' + deep + '</div></div>';
    }).join("");

    // Strengths: the top two. The "hi" copy describes real strength, so it's only used from 60% up.
    var strengths = s.strengths.map(function (idx) {
      var p = Q.PILLARS[idx], c = Q.PILLAR_COPY[p];
      return '<div class="block strength"><div>' +
        '<h4>' + cap(p) + ' <span class="pct">' + s.pct[idx] + '%</span></h4>' +
        '<p>' + esc(s.pct[idx] >= 60 ? c.hi : c.line + " This is your strongest area right now. Build from here.") + '</p></div></div>';
    }).join("");

    var b1 = Q.PILLARS[s.blocks[0]];
    var plan = '<section class="band alt plan-band"><div class="wrap narrow"><p class="eyebrow dark">Your First 7 Days</p>' +
      '<h2>' + (strong ? "Deepen " : "Clear ") + esc(cap(b1)) + '</h2><p class="sub">' + esc(Q.PLAYBOOK_INTRO) + '</p>' +
      '<ol class="plan">' + Q.PLAYBOOK[b1].map(function (st) {
        return '<li><span class="plan-day">' + esc(st[0]) + '</span><p>' + esc(st[1]) + '</p></li>';
      }).join("") + '</ol></div></section>';

    var pattern = !s.pattern ? "" :
      '<section class="band alt"><div class="wrap narrow prose"><p class="eyebrow dark">Your Signature Pattern</p><h2>' + esc(s.pattern.name) + '</h2>' +
        '<p class="sub">' + esc(Q.PATTERNS_INTRO) + '</p>' + paras(s.pattern.p) + '</div></section>';

    var label = function (idx) {
      if (s.strengths.indexOf(idx) !== -1) return ' <span class="tag tag-hi">Strength</span>';
      if (s.blocks.indexOf(idx) !== -1 && !strong) return ' <span class="tag">Block</span>';
      return "";
    };
    var pillars = Q.PILLARS.map(function (p, idx) {
      return '<div class="pillar"><div class="pillar-head"><h4>' + cap(p) + label(idx) + '</h4><span class="pct">' + s.pct[idx] + '%</span></div>' +
        '<div class="bar"><div class="fill" style="width:' + s.pct[idx] + '%"></div></div></div>';
    }).join("");

    var applyUrl = "/apply/?r=" + code;
    var clearLink = Q.CLEAR_URL
      ? '<p class="self-paced">Prefer to start on your own? <a href="' + esc(Q.CLEAR_URL) + '" target="_blank" rel="noopener">Get the CLEAR Method</a> for ' + esc(Q.CLEAR_PRICE) + '.</p>'
      : "";
    var cta = function (headline) {
      return '<div class="cta-box"><h3>' + headline + '</h3>' +
        '<p>Apply for a private 45-minute strategy call with Rola. Together we find what\'s holding back your results and clear the path to your next level.</p>' +
        '<a class="btn btn-gold" href="' + applyUrl + '">Apply for a Strategy Call</a></div>';
    };

    // The self-paced sale. Only shows once CLEAR_URL is set (Whop product visible).
    var offer = !Q.CLEAR_URL ? "" :
      '<section class="band offer-band"><div class="wrap narrow"><div class="offer">' +
        '<p class="eyebrow dark">Start on your own, tonight</p>' +
        '<h2>The CLEAR Method™</h2>' +
        '<p class="offer-lead">Your results show where your engine is misfiring. If an old belief keeps pulling you back, start here. CLEAR clears a limiting belief stuck in your body, in as little as 10 minutes.</p>' +
        '<ul class="offer-list">' +
          '<li>Guided audio lessons, including the Clearing: a 10-minute session you can replay any time</li>' +
          '<li>The CLEAR workbook to write it all down</li>' +
          '<li>Yours to keep. Run it on any belief, any time.</li>' +
        '</ul>' +
        '<div class="offer-price"><s>' + esc(Q.CLEAR_REGULAR_PRICE) + '</s> <strong>' + esc(Q.CLEAR_PRICE) + '</strong> <span>founding price</span></div>' +
        '<a class="btn btn-gold" href="' + esc(Q.CLEAR_URL) + '" target="_blank" rel="noopener" data-act="clear">Get the CLEAR Method</a>' +
        '<p class="offer-note">Instant access through Whop. Coaching, not therapy.</p>' +
        ((Q.CLEAR_PROMOS || []).length ?
          '<details class="offer-promo"><summary>Have a code?</summary>' +
            '<form id="promo" novalidate><input name="code" maxlength="40" autocomplete="off" aria-label="Promo code" placeholder="Enter code">' +
            '<button class="btn btn-navy" type="submit">Apply</button></form>' +
            '<p class="promo-msg" aria-live="polite"></p></details>' : '') +
      '</div></div></section>';

    app.innerHTML =
      '<section class="result-hero"><div class="wrap result-grid">' +
        '<div><p class="eyebrow">' + (name ? esc(name) + "'s" : "Your") + ' Results</p><h1>Your Performance Score</h1>' +
        '<p class="hero-note">Scored across 7 pillars of performance.</p></div>' +
        '<div class="score-card"><div class="score">' + s.overall + '%</div><div class="bar"><div class="fill" style="width:' + s.overall + '%"></div></div><div class="tier">' + esc(s.tier) + '</div></div>' +
      '</div></section>' +
      '<section class="band"><div class="wrap narrow prose">' + (fresh ? '<p class="mail-note">A copy of your results is on its way to your inbox. Don\'t see it? Check your Promotions or Spam folder.</p>' : '') +
        (uniform ? '<p class="mail-note">' + esc(Q.UNIFORM_NOTE) + '</p>' : '') + tierBlocks + '</div></section>' +
      pattern +
      '<section class="band"><div class="wrap narrow"><h2>' + blocksTitle + '</h2><p class="sub">' + blocksSub + '</p>' + blocks +
        '</div></section>' + plan +
      '<section class="band"><div class="wrap narrow">' + cta(strong ? "Ready to go even further?" : "Ready to clear your " + cap(b1) + " block faster?") + '</div></section>' + offer +
      (s.strengths.length ? '<section class="band alt"><div class="wrap narrow"><h2>' + (s.strengths.length === 2 ? "Your Top 2 Strengths" : "Your Top Strength") + '</h2><p class="sub">Your highest ' + (s.strengths.length === 2 ? "pillars. These are" : "pillar. This is") + ' what got you here, and what you\'ll build the rest on.</p>' + strengths + '</div></section>' : '') +
      '<section class="band"><div class="wrap narrow"><h2>Your 7 Pillars</h2><p class="sub">' + esc(Q.PILLARS_INTRO) + '</p>' + radarSvg(s.pct) + pillars + '</div></section>' +
      '<section class="band alt"><div class="wrap narrow prose"><h2>What High Conviction Actually Looks Like</h2>' + paras(Q.HIGH_CONVICTION) +
        '<details class="science"><summary>The science behind inevitable success</summary>' + paras(Q.SCIENCE) + '</details></div></section>' +
      '<section class="final"><div class="wrap narrow center">' +
        '<h2>Your results won\'t change themselves.</h2>' +
        '<p>Apply for a private strategy call and leave with a clear first move.</p>' +
        '<a class="btn btn-gold" href="' + applyUrl + '">Apply for a Strategy Call</a>' + clearLink +
        '<div class="share"><button class="btn btn-ghost" data-act="print">Save my report as PDF</button>' +
          '<button class="btn btn-ghost" data-act="copy" data-url="' + esc(resultUrl(code)) + '">Copy link to my results</button></div>' +
        '<p class="contact">Follow Rola: <a href="https://www.instagram.com/rolaspeaks/" target="_blank" rel="noopener">Instagram @rolaspeaks</a> · <a href="https://www.youtube.com/@Rolaspeaks" target="_blank" rel="noopener">YouTube @Rolaspeaks</a></p>' +
      '</div></section>' + footer();
  }

  // ---------- Lead delivery ----------
  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (r) { setTimeout(r, ms); })]);
  }

  // Called when they submit the start form, so people who quit halfway are still on the list.
  function addToList(g) {
    if (!Q.ADHARA_FORM_URL) return;
    fetch(Q.ADHARA_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response_data: { first_name: g.first_name, last_name: g.last_name, email: g.email, email_consent: ["yes"] }, is_complete: true }),
      keepalive: true
    }).catch(function () {});
  }

  // Called when they finish: results email to them, lead alert to Rola.
  // Stores the full response (every answer, the outcome questions, answer order) so the assessment can be
  // checked and normed. The database re-scores the answers itself; the client's scores aren't trusted.
  function saveResponse(g, points, rev, uniform) {
    if (!Q.RESPONSES_URL) return Promise.resolve(); // retired: GHL holds the raw answers
    var s = summarize(points, rev);
    // Stored as agreement: 5 = Strongly Agree ... 1 = Strongly Disagree, before any reverse scoring.
    var agree = function (k) { return 5 - k; };
    var body = {
      quiz_version: Q.QUIZ_VERSION, first_name: g.first_name, email: g.email, consent: !!g.consent,
      answers: state.answers.slice(0, QUESTIONS.length).map(agree), outcomes: state.outcomes.slice(0, Q.OUTCOMES.length).map(agree),
      scale_order: state.flip ? "disagree_first" : "agree_first", uniform_flag: uniform, pattern: s.pattern ? s.pattern.key : null,
      role: state.profile.role || null, urgency: state.profile.urgency || null, source: sourceLabel().slice(0, 100),
      utm_source: utm.utm_source || null, utm_medium: utm.utm_medium || null, utm_campaign: utm.utm_campaign || null, session_id: sessionId
    };
    return withTimeout(fetch(Q.RESPONSES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": Q.EMAIL_PUBLIC_KEY, "Authorization": "Bearer " + Q.EMAIL_PUBLIC_KEY, "Prefer": "return=minimal" },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(function () {}), 4000);
  }

  function sendLead(g, points, rev, uniform, code) {
    var s = summarize(points, rev);
    var jobs = [];

    var items = function (idxs) { return idxs.map(function (i) { return { name: cap(Q.PILLARS[i]), pct: s.pct[i] }; }); };
    var emailData = {
      firstName: g.first_name, overall: s.overall, tier: s.tier,
      blocks: items(s.blocks), pillars: items(Q.PILLARS.map(function (p, i) { return i; })),
      strong: s.pct[s.blocks[0]] >= 75, resultUrl: resultUrl(code),
      pattern: s.pattern ? s.pattern.name : "", uniform: uniform
    };
    var sendEmail = function (templateName, recipientEmail, data) {
      return fetch(Q.EMAIL_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + Q.EMAIL_PUBLIC_KEY, "apikey": Q.EMAIL_PUBLIC_KEY },
        body: JSON.stringify({ templateName: templateName, recipientEmail: recipientEmail, templateData: data }),
        keepalive: true
      }).catch(function () {});
    };
    // With EMAILS_SENT_BY "ghl" the browser sends no email at all; the GHL workflow does it from the webhook.
    var browserEmails = Q.EMAILS_SENT_BY !== "ghl" && Q.EMAIL_FUNCTION_URL;
    if (browserEmails) jobs.push(sendEmail("quiz-results", g.email, emailData));
    if (browserEmails) jobs.push(sendEmail("quiz-lead-notification", null, Object.assign({}, emailData, {
      firstName: g.first_name + " " + g.last_name, email: g.email, role: (state.profile.role || "") + (state.profile.urgency ? " | Wants to change: " + state.profile.urgency : ""),
      utmSource: sourceLabel(), utmMedium: utm.utm_medium, utmCampaign: utm.utm_campaign
    })));

    if (Q.GHL_WEBHOOK_URL) {
      var payload = {
        first_name: g.first_name, last_name: g.last_name, email: g.email,
        overall_score: s.overall, tier: s.tier,
        top_block_1: cap(Q.PILLARS[s.blocks[0]]), top_block_2: cap(Q.PILLARS[s.blocks[1]]), top_block_3: cap(Q.PILLARS[s.blocks[2]]),
        role: state.profile.role || "", urgency: state.profile.urgency || "", referrer: state.ref || "",
        utm_source: utm.utm_source, utm_medium: utm.utm_medium, utm_campaign: utm.utm_campaign,
        pattern: s.pattern ? s.pattern.name : "",
        // Ready-made sentences for the GHL results email, so it needs no if/else logic.
        pattern_line: s.pattern
          ? "Your Signature Pattern is " + s.pattern.name + ". " + s.pattern.p[s.pattern.p.length - 1]
          : "Your results page shows how your 7 pillars work together, and where to start.",
        strength_line: s.strengths.length
          ? "Your strongest pillar is " + cap(Q.PILLARS[s.strengths[0]]) + " at " + s.pct[s.strengths[0]] + "%. That's what you build the rest on."
          : "Your pillars are close together, so strengthening one tends to lift the others.",
        day1_action: Q.PLAYBOOK[Q.PILLARS[s.blocks[0]]][0][1],
        apply_url: location.origin + "/apply/?r=" + code,
        // Raw data, so nothing is lost if the Lovable Cloud database is retired.
        quiz_version: Q.QUIZ_VERSION, scale_order: state.flip ? "disagree_first" : "agree_first",
        quiz_answers: state.answers.slice(0, QUESTIONS.length).map(function (k) { return 5 - k; }).join(","),
        quiz_outcomes: state.outcomes.slice(0, Q.OUTCOMES.length).map(function (k) { return 5 - k; }).join(","),
        emails_sent_by: Q.EMAILS_SENT_BY === "ghl" ? "ghl" : "lovable",
        top_block_tied: s.tied[0] ? "yes" : "no", answers_uniform: uniform ? "yes" : "no",
        outcome_capability: 5 - state.outcomes[0], outcome_enjoy: 5 - state.outcomes[1], outcome_satisfaction: 5 - state.outcomes[2],
        result_url: resultUrl(code), tags: "quiz-completed" + (state.profile.urgency ? ",urgency-" + slug(state.profile.urgency) : "") + ",source-" + slug(utm.utm_source || (state.ref ? refName() : "direct"))
      };
      Q.PILLARS.forEach(function (p, i) { payload[p] = s.pct[i]; });
      // Full breakdown for the contact's "Quiz Results" field, shown in Discovery Call invites.
      if (window.QUIZ_NOTES) payload.quiz_summary = window.QUIZ_NOTES.quiz(points, resultUrl(code), rev);
      jobs.push(fetch(Q.GHL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {}));
    }
    return withTimeout(Promise.all(jobs), 4000);
  }

  // ---------- Routing ----------
  function route() {
    var m = location.hash.match(/^#r=([A-Za-z0-9_-]+)/);
    if (m) {
      var r = decodeResult(m[1]);
      if (r) { renderResult(r.name, r.points, r.rev, r.uniform); scrollTop(); return; }
    }
    // Questions first, contact details last: the form unlocks the results instead of blocking the start.
    if (state.step < 0) renderLanding();
    else if (state.step < TOTAL_STEPS) renderQuestion();
    else if (firstMissing() >= 0) go(firstMissing());
    else if (!state.gate || !state.gate.done || !state.gate.last_name) renderGate();
    else finish();
    scrollTop();
  }

  function go(step) {
    state.step = step;
    save();
    route();
  }

  var advancing = false;
  app.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");

    if (act === "start") {
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
      state.src = sourceLabel();
      track("quiz_start");
      go(Math.max(0, Math.min(state.step, TOTAL_STEPS)));
    }
    else if (act === "restart") { state = { step: 0, answers: [], outcomes: [], profile: state.profile || {}, gate: state.gate, flip: state.flip, listed: state.listed, src: state.src, ref: state.ref }; save(); route(); }
    else if (act === "home") { go(-1); }
    else if (act === "gate-back") { go(TOTAL_STEPS - 1); }
    else if (act === "print") { track("report_print"); window.print(); }
    else if (act === "clear") { track("clear_click"); }
    else if (act === "back") {
      go(state.step - 1);
    }
    else if (act === "answer" || act === "outcome" || act === "profile") {
      if (advancing) return;
      advancing = true;
      if (act === "answer") state.answers[state.step] = Number(el.getAttribute("data-k"));
      else if (act === "outcome") state.outcomes[state.step - OUT_START] = Number(el.getAttribute("data-k"));
      else state.profile[Q.PROFILE[state.step - PROFILE_START].key] = el.getAttribute("data-v");
      el.classList.add("selected");
      setTimeout(function () { advancing = false; go(state.step + 1); }, 220);
    }
    else if (act === "profile-text" || act === "profile-skip") {
      var pq = Q.PROFILE[state.step - PROFILE_START];
      var v = act === "profile-skip" ? "" : document.getElementById("ptext").value.trim();
      state.profile[pq.key] = v;
      go(state.step + 1);
    }
    else if (act === "copy") {
      var url = el.getAttribute("data-url");
      var done = function () { el.textContent = "Link copied"; };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt("Copy this link:", url); });
      else prompt("Copy this link:", url);
    }
  });

  app.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "ptext" && e.target.tagName === "INPUT") {
      e.preventDefault();
      app.querySelector('[data-act="profile-text"]').click();
    }
  });

  // "Have a code?" on the CLEAR offer. Only changes the price shown; Whop applies the real discount.
  function applyPromo(f) {
    var code = f.code.value.trim().toUpperCase();
    var msg = app.querySelector(".promo-msg");
    if (!code || !window.crypto || !crypto.subtle) return;
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(code)).then(function (buf) {
      var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      var hit = (Q.CLEAR_PROMOS || []).filter(function (p) { return p.hash === hex; })[0];
      if (!hit) { msg.textContent = "That code isn't valid."; return; }
      app.querySelector(".offer-price").innerHTML = '<s>' + esc(Q.CLEAR_PRICE) + '</s> <strong>' + esc(hit.price) + '</strong> <span>' + esc(hit.label) + '</span>';
      msg.innerHTML = 'Code applied. Enter <strong>' + esc(code) + '</strong> again at checkout.';
      track("promo_applied");
    });
  }

  app.addEventListener("submit", function (e) {
    if (e.target.id === "promo") { e.preventDefault(); applyPromo(e.target); return; }
    if (e.target.id !== "gate") return;
    e.preventDefault();
    var f = e.target;
    var g = {
      first_name: f.first_name.value.trim().slice(0, 60),
      last_name: f.last_name.value.trim().slice(0, 60),
      email: f.email.value.trim().toLowerCase().slice(0, 255),
      consent: f.consent.checked
    };
    state.gate = g;
    state.profile = state.profile || {};
    save();
    if (!g.first_name) return renderGate("Please enter your first name.");
    if (!g.last_name) return renderGate("Please enter your last name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.email)) return renderGate("Please enter a valid email.");
    if (!g.consent) return renderGate("Please tick the box so we can send your results.");
    g.done = true;
    state.gate = g;
    if (state.listed !== g.email) { addToList(g); state.listed = g.email; }
    save();
    state.src = sourceLabel(); save();
    finish();
  });

  // After the last answer: score, send the emails, show results.
  var finishing = false;
  // First scored or outcome question without an answer, or -1.
  function firstMissing() {
    for (var i = 0; i < QUESTIONS.length; i++) if (state.answers[i] == null) return i;
    for (var j = 0; j < Q.OUTCOMES.length; j++) if (state.outcomes[j] == null) return OUT_START + j;
    return -1;
  }

  function finish() {
    var missing = firstMissing();
    if (missing >= 0) return go(missing);
    if (finishing) return;
    finishing = true;
    document.body.className = "is-flow";
    app.innerHTML = '<section class="flow"><div class="wrap flow-wrap center"><p class="eyebrow dark">Complete</p><h2 class="q">Calculating your results...</h2></div></section>';
    var g = state.gate;
    var points = pillarPoints(state.answers);
    var rev = reversePoints(state.answers);
    var uniform = isUniform(state.answers);
    var code = encodeResult(g.first_name, points, rev, uniform);
    track("quiz_complete");
    Promise.all([sendLead(g, points, rev, uniform, code), saveResponse(g, points, rev, uniform)]).then(function () {
      finishing = false;
      state = { step: -1, answers: [], outcomes: [], profile: { role: state.profile.role }, gate: { first_name: g.first_name, last_name: g.last_name, email: g.email, consent: g.consent }, listed: state.listed, src: state.src, ref: state.ref, flip: state.flip };
      save();
      justFinished = true;
      location.hash = "r=" + code;
    });
  }

  // The printed report includes the collapsed research section.
  window.addEventListener("beforeprint", function () {
    Array.prototype.forEach.call(document.querySelectorAll("details"), function (d) { d.open = true; });
  });
  window.addEventListener("hashchange", route);
  route();
})();
