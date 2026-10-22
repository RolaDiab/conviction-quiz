(function () {
  "use strict";
  var Q = window.QUIZ;
  var STORE_KEY = "cc_quiz_v1";
  var app = document.getElementById("app");

  // ---------- Questions ----------
  // Interleave pillars: item 1 of every pillar, then item 2 of every pillar, etc.
  var QUESTIONS = [];
  for (var round = 0; round < 5; round++) {
    Q.PILLARS.forEach(function (pillar) {
      var raw = Q.ITEMS[pillar][round];
      var reverse = raw.indexOf("R:") === 0;
      QUESTIONS.push({ pillar: pillar, text: reverse ? raw.slice(2) : raw, reverse: reverse });
    });
  }
  var TOTAL_STEPS = QUESTIONS.length + Q.PROFILE.length;

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

  function summarize(points) {
    var total = points.reduce(function (a, b) { return a + b; }, 0);
    var overall = Math.round(total / 175 * 100);
    var pct = points.map(function (p) { return Math.round(p / 25 * 100); });
    var tier = Q.TIERS.filter(function (t) { return overall <= t.max; })[0].name;
    var order = Q.PILLARS.map(function (p, i) { return i; })
      .sort(function (a, b) { return points[a] - points[b] || a - b; });
    return { overall: overall, pct: pct, tier: tier, blocks: order.slice(0, 3) };
  }
  window.__quizInternals = { QUESTIONS: QUESTIONS, itemPoints: itemPoints, pillarPoints: pillarPoints, summarize: summarize };

  // ---------- State ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  var state = load() || { step: -1, answers: [], profile: {} };

  var params = new URLSearchParams(location.search);
  var utm = {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || ""
  };

  // ---------- Helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function paras(list) { return list.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""); }

  function encodeResult(name, points) {
    var json = JSON.stringify({ n: name, p: points });
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodeResult(code) {
    try {
      var b64 = code.replace(/-/g, "+").replace(/_/g, "/");
      var data = JSON.parse(decodeURIComponent(escape(atob(b64))));
      var ok = Array.isArray(data.p) && data.p.length === 7 &&
        data.p.every(function (x) { return Number.isInteger(x) && x >= 5 && x <= 25; });
      return ok ? { name: String(data.n || "").slice(0, 60), points: data.p } : null;
    } catch (e) { return null; }
  }
  function resultUrl(code) { return location.origin + location.pathname + "#r=" + code; }

  function scrollTop() { window.scrollTo(0, 0); }

  // ---------- Views ----------
  function renderLanding() {
    document.body.className = "is-landing";
    var resume = state.step >= 0 && state.step < TOTAL_STEPS;
    app.innerHTML =
      '<section class="hero"><div class="wrap hero-grid">' +
        '<div class="hero-copy">' +
          '<p class="eyebrow">Backed by Performance Science</p>' +
          '<h1>Find the hidden <span class="gold">brake</span> on your performance.</h1>' +
          '<p class="lead">35 questions. About 10 minutes. Get your Conviction Index™, a score on all 7 IMPACT pillars, and see which Performance Blocks™ are holding you back.</p>' +
          '<div class="cta-row"><button class="btn btn-gold" data-act="start">' + (resume ? "Continue My Assessment" : "Reveal My Performance Profile") + '</button>' +
          (resume ? '<button class="btn btn-ghost" data-act="restart">Start over</button>' : "") + '</div>' +
          '<p class="fine">Free. Instant results. No fluff.</p>' +
        '</div>' +
        '<div class="hero-photo"><img src="rola.jpg" alt="Rola Diab" width="560" height="695"></div>' +
      '</div></section>' +

      '<section class="band"><div class="wrap narrow">' +
        '<h2>Your Performance Profile will reveal:</h2>' +
        '<ul class="checks">' +
          '<li>Why success has felt inconsistent</li>' +
          '<li>Which of the seven pillars is affecting your Performance Operating System</li>' +
          '<li>What to strengthen to make success predictable</li>' +
        '</ul>' +
        '<p class="pillar-strip">Intention · Identity · Meaning · Practice · Alignment · Communication · Trust</p>' +
      '</div></section>' +

      '<section class="trust"><div class="wrap">' +
        '<p class="trust-label">Trusted by leaders at</p>' +
        '<p class="trust-names">KPMG · Bloomberg · Mindvalley · Principal Financial · Entrepreneurs\' Organization · UAE Government</p>' +
        '<p class="trust-label">Featured in and on stage at</p>' +
        '<p class="trust-names">Fast Company Middle East · Arabian Business · AIM Congress · Global Investors Forum</p>' +
      '</div></section>' +

      '<section class="band"><div class="wrap narrow about">' +
        '<h2>Hi, I\'m Rola.</h2>' +
        '<p>I\'ve spent my career studying what makes success predictable. The gap between where you are and where you want to be isn\'t strategy. It\'s conviction. I built The Conviction Code™ on that premise, blending neuroscience and behavioral psychology into a system I teach to executives at KPMG, Bloomberg, and government leaders, on stages including Mindvalley University.</p>' +
        '<p>Before that, I ran a $100M brand as its president, so I know what performance under pressure actually demands.</p>' +
      '</div></section>' +

      '<section class="quotes"><div class="wrap quote-grid">' +
        '<blockquote><p>"When I first started working with Rola I was hoping to work towards a promotion and move up in my career in the next 2-3 years. Rola helped remove some limitations and guided me using her strategies so that I accelerated that timeline to receiving multiple offers and a project from the Minister himself within 3.5 months!"</p><cite>Lujain Ghalib, Executive</cite></blockquote>' +
        '<blockquote><p>"During her coaching sessions, she really gets to know you and like a brain surgeon, takes out what is hurting you and installs new belief systems that change the game. I was promoted within 3 months, and had 3 raises within a 12-month period."</p><cite>Aaron Wilson, National Business Manager, Human Interest</cite></blockquote>' +
      '</div></section>' +

      '<section class="final"><div class="wrap narrow center">' +
        '<h2>Discover your Performance Profile.</h2>' +
        '<p>About 10 minutes. Free. Results the moment you finish.</p>' +
        '<button class="btn btn-gold" data-act="start">Reveal My Performance Profile</button>' +
      '</div></section>' +
      footer();
  }

  function footer() {
    return '<footer class="foot">Conviction Code™ by Rola Diab © 2026</footer>';
  }

  function progressBar() {
    var n = Math.min(state.step + 1, TOTAL_STEPS);
    var pct = Math.round(state.step / TOTAL_STEPS * 100);
    return '<div class="progress"><div class="progress-meta"><span>Question ' + n + ' of ' + TOTAL_STEPS + '</span><span>' + pct + '%</span></div>' +
      '<div class="bar"><div class="fill" style="width:' + pct + '%"></div></div></div>';
  }

  function renderQuestion() {
    document.body.className = "is-flow";
    var i = state.step;
    var html = '<section class="flow"><div class="wrap flow-wrap">' + progressBar();

    if (i < QUESTIONS.length) {
      var q = QUESTIONS[i];
      html += '<p class="instruction">Rate how true this has been for you in the last 30 days, not where you aspire to be.</p>' +
        '<h2 class="q">' + esc(q.text) + '</h2><div class="opts">' +
        Q.OPTIONS.map(function (o, k) {
          var sel = state.answers[i] === k ? " selected" : "";
          return '<button class="opt' + sel + '" data-act="answer" data-k="' + k + '">' + esc(o) + '</button>';
        }).join("") + '</div>';
    } else {
      var pq = Q.PROFILE[i - QUESTIONS.length];
      var val = state.profile[pq.key] || "";
      html += '<p class="instruction">A few quick questions about you.</p><h2 class="q">' + esc(pq.text) + '</h2>';
      if (pq.options) {
        html += '<div class="opts">' + pq.options.map(function (o) {
          var sel = val === o ? " selected" : "";
          return '<button class="opt' + sel + '" data-act="profile" data-v="' + esc(o) + '">' + esc(o) + '</button>';
        }).join("") + '</div>';
      } else {
        html += (pq.multiline
          ? '<textarea id="ptext" maxlength="1000" rows="4" placeholder="' + esc(pq.placeholder) + '">' + esc(val) + '</textarea>'
          : '<input id="ptext" type="text" maxlength="200" placeholder="' + esc(pq.placeholder) + '" value="' + esc(val) + '">') +
          '<div class="cta-row"><button class="btn btn-navy" data-act="profile-text">Next</button>' +
          (pq.optional ? '<button class="btn btn-link" data-act="profile-skip">Skip</button>' : "") + '</div>';
      }
    }
    html += (i > 0 ? '<button class="btn btn-link back" data-act="back">← Back</button>' : '<button class="btn btn-link back" data-act="home">← Back</button>') +
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
        '<p class="eyebrow dark">Complete</p>' +
        '<h2 class="q">Your Performance Profile is ready.</h2>' +
        '<p class="sub">Where should we send your results?</p>' +
        '<form id="gate" novalidate>' +
          '<label>First name<input name="first_name" autocomplete="given-name" maxlength="60" required value="' + esc(g.first_name || "") + '"></label>' +
          '<label>Email<input name="email" type="email" autocomplete="email" maxlength="255" required value="' + esc(g.email || "") + '"></label>' +
          '<label>Phone <span class="opt-label">(optional)</span><input name="phone" type="tel" autocomplete="tel" maxlength="40" value="' + esc(g.phone || "") + '"></label>' +
          '<label class="consent"><input name="consent" type="checkbox"' + (g.consent ? " checked" : "") + '> Send me my results and occasional insights from Rola. Unsubscribe anytime.</label>' +
          (error ? '<p class="err">' + esc(error) + '</p>' : "") +
          '<button class="btn btn-gold wide" type="submit">Show My Results</button>' +
        '</form>' +
        '<button class="btn btn-link back" data-act="back">← Back</button>' +
      '</div></section>';
  }

  function renderResult(name, points) {
    document.body.className = "is-result";
    var s = summarize(points);
    var code = encodeResult(name, points);
    var tierBlocks = Q.TIER_COPY[s.tier].map(function (b) {
      return (b.h ? "<h3>" + esc(b.h) + "</h3>" : "") + paras(b.p);
    }).join("");

    var blocks = s.blocks.map(function (idx, n) {
      var p = Q.PILLARS[idx];
      return '<div class="block"><span class="block-n">' + (n + 1) + '</span><div><h4>' + cap(p) + ' <span class="pct">' + s.pct[idx] + '%</span></h4><p>' + esc(Q.PILLAR_COPY[p].lo) + '</p></div></div>';
    }).join("");

    var pillars = Q.PILLARS.map(function (p, idx) {
      var c = Q.PILLAR_COPY[p];
      return '<article class="pillar"><div class="pillar-head"><h4>' + p.toUpperCase() + '</h4><span class="pct">' + s.pct[idx] + '%</span></div>' +
        '<div class="bar"><div class="fill" style="width:' + s.pct[idx] + '%"></div></div>' +
        '<p>' + esc(c.d) + '</p>' +
        '<p><strong>What high ' + p + ' looks like:</strong> ' + esc(c.hi) + '</p>' +
        '<p><strong>What low ' + p + ' looks like:</strong> ' + esc(c.lo) + '</p>' +
        '<p class="why"><strong>Why it matters:</strong> ' + esc(c.why) + '</p></article>';
    }).join("");

    app.innerHTML =
      '<section class="result-hero"><div class="wrap result-grid">' +
        '<div><p class="eyebrow">' + (name ? esc(name) + ", your" : "Your") + ' Performance Profile</p><h1>Your Conviction Index™</h1></div>' +
        '<div class="score-card"><div class="score">' + s.overall + '%</div><div class="bar"><div class="fill" style="width:' + s.overall + '%"></div></div><div class="tier">' + esc(s.tier) + '</div></div>' +
      '</div></section>' +
      '<section class="band"><div class="wrap narrow prose">' + tierBlocks + '</div></section>' +
      '<section class="band alt"><div class="wrap narrow"><h2>Your Top 3 Performance Blocks™</h2><p class="sub">Your three lowest pillars. Start with number one.</p>' + blocks + '</div></section>' +
      '<section class="band"><div class="wrap narrow"><h2>Your 7 IMPACT Pillars</h2><p class="sub">' + esc(Q.PILLARS_INTRO) + '</p>' + pillars + '</div></section>' +
      '<section class="band alt"><div class="wrap narrow prose"><h2>What High Conviction Actually Looks Like</h2>' + paras(Q.HIGH_CONVICTION) + '</div></section>' +
      '<section class="band"><div class="wrap narrow prose"><h2>The Science Behind the Code</h2>' + paras(Q.SCIENCE) + '</div></section>' +
      '<section class="final"><div class="wrap narrow center">' +
        '<h2>Ready to release the brake?</h2>' +
        '<p>In a Performance Diagnostic we find the Performance Blocks™ scattering your effort and map what to strengthen first.</p>' +
        '<a class="btn btn-gold" href="' + Q.BOOKING_URL + '" target="_blank" rel="noopener">Book Your Performance Diagnostic</a>' +
        '<div class="share"><button class="btn btn-ghost" data-act="copy" data-url="' + esc(resultUrl(code)) + '">Copy link to my results</button></div>' +
        '<p class="contact">Questions, or want to work together? <a href="mailto:rola@alorsolutions.com">rola@alorsolutions.com</a> · <a href="https://www.instagram.com/rolaspeaks/" target="_blank" rel="noopener">@rolaspeaks</a> · <a href="https://www.youtube.com/@Rolaspeaks" target="_blank" rel="noopener">YouTube</a></p>' +
      '</div></section>' + footer();
  }

  // ---------- Lead delivery ----------
  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (r) { setTimeout(r, ms); })]);
  }

  function sendLead(g, points, code) {
    var s = summarize(points);
    var jobs = [];
    jobs.push(fetch(Q.ADHARA_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response_data: { first_name: g.first_name, email: g.email, email_consent: ["yes"] }, is_complete: true }),
      keepalive: true
    }).catch(function () {}));

    if (Q.GHL_WEBHOOK_URL) {
      var payload = {
        first_name: g.first_name, email: g.email, phone: g.phone,
        overall_score: s.overall, tier: s.tier,
        top_block_1: cap(Q.PILLARS[s.blocks[0]]), top_block_2: cap(Q.PILLARS[s.blocks[1]]), top_block_3: cap(Q.PILLARS[s.blocks[2]]),
        role: state.profile.role || "", location: state.profile.location || "", industry: state.profile.industry || "",
        challenge: state.profile.challenge || "", source: state.profile.source || "",
        utm_source: utm.utm_source, utm_medium: utm.utm_medium, utm_campaign: utm.utm_campaign,
        result_url: resultUrl(code), tags: "quiz-completed"
      };
      Q.PILLARS.forEach(function (p, i) { payload[p] = s.pct[i]; });
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
      if (r) { renderResult(r.name, r.points); scrollTop(); return; }
    }
    if (state.step < 0) renderLanding();
    else if (state.step < TOTAL_STEPS) renderQuestion();
    else renderGate();
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

    if (act === "start") { if (location.hash) history.replaceState(null, "", location.pathname + location.search); go(Math.max(0, state.step)); }
    else if (act === "restart") { state = { step: 0, answers: [], profile: {} }; save(); route(); }
    else if (act === "home") { go(-1); }
    else if (act === "back") { go(state.step - 1); }
    else if (act === "answer" || act === "profile") {
      if (advancing) return;
      advancing = true;
      if (act === "answer") state.answers[state.step] = Number(el.getAttribute("data-k"));
      else state.profile[Q.PROFILE[state.step - QUESTIONS.length].key] = el.getAttribute("data-v");
      el.classList.add("selected");
      setTimeout(function () { advancing = false; go(state.step + 1); }, 220);
    }
    else if (act === "profile-text" || act === "profile-skip") {
      var pq = Q.PROFILE[state.step - QUESTIONS.length];
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

  app.addEventListener("submit", function (e) {
    if (e.target.id !== "gate") return;
    e.preventDefault();
    var f = e.target;
    var g = {
      first_name: f.first_name.value.trim().slice(0, 60),
      email: f.email.value.trim().toLowerCase().slice(0, 255),
      phone: f.phone.value.trim().slice(0, 40),
      consent: f.consent.checked
    };
    state.gate = g;
    save();
    if (!g.first_name) return renderGate("Please enter your first name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.email)) return renderGate("Please enter a valid email.");
    if (!g.consent) return renderGate("Please tick the box so we can send your results.");
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (state.answers[i] == null) return go(i);
    }

    var btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Calculating...";
    var points = pillarPoints(state.answers);
    var code = encodeResult(g.first_name, points);
    sendLead(g, points, code).then(function () {
      state = { step: -1, answers: [], profile: {} };
      save();
      location.hash = "r=" + code;
    });
  });

  window.addEventListener("hashchange", route);
  route();
})();
