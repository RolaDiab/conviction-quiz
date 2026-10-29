(function () {
  "use strict";
  var Q = window.QUIZ;
  var STORE_KEY = "cc_quiz_v1";
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

  // Percentages run 0 to 100: every answer at the low end = 0%, every answer at the high end = 100%.
  var P_MIN = PER_PILLAR, P_MAX = PER_PILLAR * 5;
  function toPct(points, min, max) { return Math.round((points - min) / (max - min) * 100); }

  function summarize(points) {
    var total = points.reduce(function (a, b) { return a + b; }, 0);
    var overall = toPct(total, P_MIN * 7, P_MAX * 7);
    var pct = points.map(function (p) { return toPct(p, P_MIN, P_MAX); });
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

  // ---------- Funnel counter (views, starts, finishes) ----------
  var sessionId;
  try { sessionId = sessionStorage.getItem("cc_sid"); if (!sessionId) { sessionId = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("cc_sid", sessionId); } } catch (e) { sessionId = Math.random().toString(36).slice(2, 12); }
  var tracked = {};
  function track(event) {
    if (tracked[event]) return;
    tracked[event] = true;
    try {
      fetch(Q.EVENTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": Q.EMAIL_PUBLIC_KEY, "Authorization": "Bearer " + Q.EMAIL_PUBLIC_KEY, "Prefer": "return=minimal" },
        body: JSON.stringify({ event: event, source: (utm.utm_source || "direct").slice(0, 100), session_id: sessionId }),
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

  function encodeResult(name, points) {
    var json = JSON.stringify({ n: name, p: points });
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodeResult(code) {
    try {
      var b64 = code.replace(/-/g, "+").replace(/_/g, "/");
      var data = JSON.parse(decodeURIComponent(escape(atob(b64))));
      var ok = Array.isArray(data.p) && data.p.length === 7 &&
        data.p.every(function (x) { return Number.isInteger(x) && x >= P_MIN && x <= P_MAX; });
      return ok ? { name: String(data.n || "").slice(0, 60), points: data.p } : null;
    } catch (e) { return null; }
  }
  function resultUrl(code) { return location.origin + location.pathname + "#r=" + code; }

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
          '<h1>You\'ve had <span class="gold">real success</span>. Then why do you feel stuck?</h1>' +
          '<p class="tagline">Answer 21 questions to find out why, and where to focus first.</p>' +
          '<p class="lead">About 4 minutes. Free. Instant results.</p>' +
          '<div class="cta-row"><button class="btn btn-gold" data-act="start">' + (resume ? "Continue My Assessment" : "Answer the 21 Questions") + '</button>' +
          (resume ? '<button class="btn btn-ghost" data-act="restart">Start over</button>' : "") + '</div>' +
          '<p class="fine">Built on the science behind predictable success.</p>' +
        '</div>' +
        '<div class="hero-photo"><img src="rola.jpg?v=3" alt="Rola Diab" width="564" height="630"></div>' +
      '</div></section>' +

      '<section class="band"><div class="wrap narrow">' +
        '<h2>Find the leak before you add more fuel.</h2>' +
        '<p>In 4 minutes, you\'ll walk away with:</p>' +
        '<ul class="checks">' +
          '<li>The hidden block quietly draining your results, named</li>' +
          '<li>Your score across the 7 pillars of performance</li>' +
          '<li>Where to focus first, so more effort means more results again</li>' +
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
        '<p>I\'ve spent my career studying what makes success predictable. The gap between where you are and where you want to be isn\'t strategy. It\'s conviction. I built The Conviction Code™ on that premise, blending neuroscience and behavioral psychology into a system I teach to executives at KPMG, Bloomberg, and government leaders, on stages including Mindvalley University.</p>' +
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
    return '<footer class="foot">Conviction Code™ by Rola Diab © 2026 · <a href="https://convictioncode.com/privacy" target="_blank" rel="noopener">Privacy</a></footer>';
  }

  function progressBar() {
    // Count only the 21 scored questions; the optional profile screens show as "Almost done" / "Last one".
    var Qn = QUESTIONS.length;
    var label = state.step < Qn ? "Question " + (state.step + 1) + " of " + Qn : state.step === TOTAL_STEPS - 1 ? "Last one" : "Almost done";
    var pct = state.step < Qn ? Math.round(state.step / Qn * 100) : Math.round(state.step / TOTAL_STEPS * 100);
    return '<div class="progress"><div class="progress-meta"><span>' + label + '</span><span>' + pct + '%</span></div>' +
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
        '<p class="eyebrow dark">Before you begin</p>' +
        '<h2 class="q">Where should we send your results?</h2>' +
        '<p class="sub">21 questions. About 4 minutes. Your results appear the moment you finish.</p>' +
        '<form id="gate" novalidate>' +
          '<label>First name<input name="first_name" autocomplete="given-name" maxlength="60" required value="' + esc(g.first_name || "") + '"></label>' +
          '<label>Email<input name="email" type="email" autocomplete="email" maxlength="255" required value="' + esc(g.email || "") + '"></label>' +
          '<label class="consent"><input name="consent" type="checkbox"' + (g.consent ? " checked" : "") + '> Send me my results and occasional insights from Rola. Unsubscribe anytime. <a href="https://convictioncode.com/privacy" target="_blank" rel="noopener">Privacy policy</a>.</label>' +
          (error ? '<p class="err">' + esc(error) + '</p>' : "") +
          '<button class="btn btn-gold wide" type="submit">Start the Assessment</button>' +
        '</form>' +
        '<button class="btn btn-link back" data-act="home">← Back</button>' +
      '</div></section>';
  }

  var justFinished = false;
  function renderResult(name, points) {
    var fresh = justFinished;
    document.body.className = "is-result";
    var s = summarize(points);
    var code = encodeResult(name, points);
    var tierBlocks = Q.TIER_COPY[s.tier].map(function (b) {
      return (b.h ? "<h3>" + esc(b.h) + "</h3>" : "") + paras(b.p);
    }).join("");

    // A 90% pillar isn't a "block". When even the lowest pillar is strong, call them growth edges.
    var strong = s.pct[s.blocks[0]] >= 75;
    var blocksTitle = strong ? "Your Top 3 Growth Edges" : "Your Top 3 Performance Blocks™";
    var blocksSub = strong
      ? "Your three lowest pillars. Even here you're strong. This is where mastery deepens next."
      : "Your three lowest pillars. This is where effort is leaking. Start with number one.";

    var blocks = s.blocks.map(function (idx, n) {
      var p = Q.PILLARS[idx], c = Q.PILLAR_COPY[p];
      return '<div class="block"><span class="block-n">' + (n + 1) + '</span><div>' +
        '<h4>' + cap(p) + ' <span class="pct">' + s.pct[idx] + '%</span></h4>' +
        '<p>' + esc(c.line) + '</p>' +
        '<p class="lo"><strong>' + (strong ? "Watch for:" : "How it shows up:") + '</strong> ' + esc(c.lo) + '</p></div></div>';
    }).join("");

    var pillars = Q.PILLARS.map(function (p, idx) {
      return '<div class="pillar"><div class="pillar-head"><h4>' + cap(p) + '</h4><span class="pct">' + s.pct[idx] + '%</span></div>' +
        '<div class="bar"><div class="fill" style="width:' + s.pct[idx] + '%"></div></div></div>';
    }).join("");

    var applyUrl = "/apply/?r=" + code;
    var clearLink = Q.CLEAR_URL
      ? '<p class="self-paced">Prefer to start on your own? <a href="' + esc(Q.CLEAR_URL) + '" target="_blank" rel="noopener">Get the CLEAR Method</a> for ' + esc(Q.CLEAR_PRICE) + '.</p>'
      : "";
    var cta = function (headline) {
      return '<div class="cta-box"><h3>' + headline + '</h3>' +
        '<p>Apply for a 45-minute Performance Diagnostic with Rola. Together we pinpoint the block costing you the most and map what to strengthen first.</p>' +
        '<a class="btn btn-gold" href="' + applyUrl + '">Apply for a Performance Diagnostic</a></div>';
    };

    // The self-paced sale. Only shows once CLEAR_URL is set (Whop product visible).
    var offer = !Q.CLEAR_URL ? "" :
      '<section class="band offer-band"><div class="wrap narrow"><div class="offer">' +
        '<p class="eyebrow dark">Start on your own, tonight</p>' +
        '<h2>The CLEAR Method™</h2>' +
        '<p class="offer-lead">Your results show where effort is leaking. If an old belief keeps pulling you back, start here. CLEAR clears a limiting belief stuck in your body, in as little as 10 minutes.</p>' +
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
      '<section class="band"><div class="wrap narrow prose">' + (fresh ? '<p class="mail-note">A copy of your results is on its way to your inbox. Don\'t see it? Check your Promotions or Spam folder.</p>' : '') + tierBlocks + '</div></section>' +
      '<section class="band alt"><div class="wrap narrow"><h2>' + blocksTitle + '</h2><p class="sub">' + blocksSub + '</p>' + blocks +
        cta(s.overall >= 100 ? "Ready to go even further?" : "Ready to get your missing " + (100 - s.overall) + "% back?") + '</div></section>' + offer +
      '<section class="band"><div class="wrap narrow"><h2>Your 7 Pillars</h2><p class="sub">' + esc(Q.PILLARS_INTRO) + '</p>' + pillars + '</div></section>' +
      '<section class="band alt"><div class="wrap narrow prose"><h2>What High Conviction Actually Looks Like</h2>' + paras(Q.HIGH_CONVICTION) +
        '<details class="science"><summary>The science behind predictable success</summary>' + paras(Q.SCIENCE) + '</details></div></section>' +
      '<section class="final"><div class="wrap narrow center">' +
        '<h2>Your results won\'t change themselves.</h2>' +
        '<p>Apply for a Performance Diagnostic and leave with a clear first move.</p>' +
        '<a class="btn btn-gold" href="' + applyUrl + '">Apply for a Performance Diagnostic</a>' + clearLink +
        '<div class="share"><button class="btn btn-ghost" data-act="copy" data-url="' + esc(resultUrl(code)) + '">Copy link to my results</button></div>' +
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
      body: JSON.stringify({ response_data: { first_name: g.first_name, email: g.email, email_consent: ["yes"] }, is_complete: true }),
      keepalive: true
    }).catch(function () {});
  }

  // Called when they finish: results email to them, lead alert to Rola.
  function sendLead(g, points, code) {
    var s = summarize(points);
    var jobs = [];

    var items = function (idxs) { return idxs.map(function (i) { return { name: cap(Q.PILLARS[i]), pct: s.pct[i] }; }); };
    var emailData = {
      firstName: g.first_name, overall: s.overall, tier: s.tier,
      blocks: items(s.blocks), pillars: items(Q.PILLARS.map(function (p, i) { return i; })),
      strong: s.pct[s.blocks[0]] >= 75, resultUrl: resultUrl(code)
    };
    var sendEmail = function (templateName, recipientEmail, data) {
      return fetch(Q.EMAIL_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + Q.EMAIL_PUBLIC_KEY, "apikey": Q.EMAIL_PUBLIC_KEY },
        body: JSON.stringify({ templateName: templateName, recipientEmail: recipientEmail, templateData: data }),
        keepalive: true
      }).catch(function () {});
    };
    jobs.push(sendEmail("quiz-results", g.email, emailData));
    jobs.push(sendEmail("quiz-lead-notification", null, Object.assign({}, emailData, {
      email: g.email, role: (state.profile.role || "") + (state.profile.urgency ? " | Wants to change: " + state.profile.urgency : ""),
      utmSource: utm.utm_source, utmMedium: utm.utm_medium, utmCampaign: utm.utm_campaign
    })));

    if (Q.GHL_WEBHOOK_URL) {
      var payload = {
        first_name: g.first_name, email: g.email,
        overall_score: s.overall, tier: s.tier,
        top_block_1: cap(Q.PILLARS[s.blocks[0]]), top_block_2: cap(Q.PILLARS[s.blocks[1]]), top_block_3: cap(Q.PILLARS[s.blocks[2]]),
        role: state.profile.role || "", urgency: state.profile.urgency || "",
        utm_source: utm.utm_source, utm_medium: utm.utm_medium, utm_campaign: utm.utm_campaign,
        result_url: resultUrl(code), tags: "quiz-completed" + (state.profile.urgency ? ",urgency-" + state.profile.urgency.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "")
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
    else if (!state.gate || !state.gate.done) renderGate();
    else if (state.step < TOTAL_STEPS) renderQuestion();
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

    if (act === "start") { if (location.hash) history.replaceState(null, "", location.pathname + location.search); go(Math.max(0, state.step)); }
    else if (act === "restart") { state = { step: 0, answers: [], profile: state.profile || {}, gate: state.gate }; save(); route(); }
    else if (act === "home") { go(-1); }
    else if (act === "clear") { track("clear_click"); }
    else if (act === "back") {
      if (state.step === 0) { state.gate.done = false; go(0); }
      else go(state.step - 1);
    }
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
      email: f.email.value.trim().toLowerCase().slice(0, 255),
      consent: f.consent.checked
    };
    state.gate = g;
    state.profile = state.profile || {};
    save();
    if (!g.first_name) return renderGate("Please enter your first name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.email)) return renderGate("Please enter a valid email.");
    if (!g.consent) return renderGate("Please tick the box so we can send your results.");
    g.done = true;
    if (state.listed !== g.email) { addToList(g); state.listed = g.email; save(); }
    state.src = utm.utm_source || "direct"; save();
    track("quiz_start");
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (state.answers[i] == null) return go(i);
    }
    go(TOTAL_STEPS);
  });

  // After the last answer: score, send the emails, show results.
  var finishing = false;
  function finish() {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (state.answers[i] == null) return go(i);
    }
    if (finishing) return;
    finishing = true;
    document.body.className = "is-flow";
    app.innerHTML = '<section class="flow"><div class="wrap flow-wrap center"><p class="eyebrow dark">Complete</p><h2 class="q">Calculating your results...</h2></div></section>';
    var g = state.gate;
    var points = pillarPoints(state.answers);
    var code = encodeResult(g.first_name, points);
    track("quiz_complete");
    sendLead(g, points, code).then(function () {
      finishing = false;
      state = { step: -1, answers: [], profile: { role: state.profile.role }, gate: { first_name: g.first_name, email: g.email, consent: g.consent }, listed: state.listed, src: state.src };
      save();
      justFinished = true;
      location.hash = "r=" + code;
    });
  }

  window.addEventListener("hashchange", route);
  route();
})();
