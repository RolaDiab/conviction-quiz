(function () {
  "use strict";
  // Qualifying application for a Performance Diagnostic.
  // Every application is emailed to Rola. Only qualified applicants see the booking calendar.
  var Q = window.QUIZ;
  var root = document.getElementById("apply");
  var params = new URLSearchParams(location.search);
  var resultCode = (params.get("r") || "").replace(/[^A-Za-z0-9_-]/g, "");

  var REVENUE = ["Business owner: under $250K revenue", "Business owner: $250K to $1M", "Business owner: $1M to $5M", "Business owner: $5M+", "I work for a company (executive, manager or employee)"];
  var START = ["Right away", "In the next 30 days", "In 1 to 3 months", "I'm just exploring"];
  var INVEST = ["Yes, if it's the right fit", "I'd need to discuss it with someone first", "Not right now"];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Prefill from the quiz, if they just took it on this device.
  var prefill = {};
  try {
    var saved = JSON.parse(localStorage.getItem("cc_quiz_v1")) || {};
    prefill.first_name = (saved.gate && saved.gate.first_name) || "";
    prefill.email = (saved.gate && saved.gate.email) || "";
    prefill.role = (saved.profile && saved.profile.role) || "";
  } catch (e) {}

  function radios(name, options, value) {
    return '<div class="opts">' + options.map(function (o) {
      return '<label class="opt radio"><input type="radio" name="' + name + '" value="' + esc(o) + '"' + (o === value ? " checked" : "") + '> ' + esc(o) + '</label>';
    }).join("") + '</div>';
  }

  function renderForm(v, error) {
    v = v || {};
    root.innerHTML =
      '<section class="flow"><div class="wrap flow-wrap gate">' +
        '<p class="eyebrow dark">Performance Diagnostic</p>' +
        '<h2 class="q">Apply for your Performance Diagnostic</h2>' +
        '<p class="sub">A 45-minute call with Rola to pinpoint the block costing you the most and map what to strengthen first. A few questions first, so the time is spent on you.</p>' +
        '<form id="app-form" novalidate>' +
          '<label>First name<input name="first_name" autocomplete="given-name" maxlength="60" value="' + esc(v.first_name || prefill.first_name || "") + '"></label>' +
          '<label>Email<input name="email" type="email" autocomplete="email" maxlength="255" value="' + esc(v.email || prefill.email || "") + '"></label>' +
          '<label>Phone or WhatsApp<input name="phone" type="tel" autocomplete="tel" maxlength="40" value="' + esc(v.phone || "") + '"></label>' +
          '<label>Your role and company<input name="company" maxlength="150" placeholder="For example: CEO, Acme Group" value="' + esc(v.company || "") + '"></label>' +
          '<fieldset><legend>Which best describes you?</legend>' + radios("revenue", REVENUE, v.revenue) + '</fieldset>' +
          '<label>What do you want to be true 90 days from now?<textarea name="goal" rows="3" maxlength="1000">' + esc(v.goal || "") + '</textarea></label>' +
          '<label><span>What feels like the biggest thing in the way right now? <span class="opt-label">(optional)</span></span><textarea name="obstacle" rows="3" maxlength="1000">' + esc(v.obstacle || "") + '</textarea></label>' +
          '<fieldset><legend>When do you want to start?</legend>' + radios("start", START, v.start) + '</fieldset>' +
          '<fieldset><legend>Working with Rola is a premium investment in yourself. If it\'s the right fit, are you ready to invest now?</legend>' + radios("invest", INVEST, v.invest) + '</fieldset>' +
          (error ? '<p class="err">' + esc(error) + '</p>' : "") +
          '<button class="btn btn-gold wide" type="submit">Submit My Application</button>' +
        '</form>' +
        (resultCode ? '<a class="btn btn-link back" href="/#r=' + resultCode + '">← Back to my results</a>' : '<a class="btn btn-link back" href="/">← Take the assessment first</a>') +
      '</div></section>' +
      '<footer class="foot">Conviction Code™ by Rola Diab © 2026</footer>';
  }

  function sendApplication(v, qualified) {
    var resultLink = resultCode ? "https://quiz.convictioncode.com/#r=" + resultCode : "No quiz result linked";
    var message =
      "QUALIFIED: " + (qualified ? "YES, shown the booking calendar" : "NO, not shown the calendar") + "\n\n" +
      "Describes them: " + v.revenue + "\n" +
      "Wants to start: " + v.start + "\n" +
      "Ready to invest: " + v.invest + "\n\n" +
      "90-day goal:\n" + v.goal + "\n\n" +
      "Biggest thing in the way:\n" + (v.obstacle || "Not answered") + "\n\n" +
      "Quiz role: " + (prefill.role || "Not answered") + "\n" +
      "Quiz results: " + resultLink;
    return fetch(Q.EMAIL_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + Q.EMAIL_PUBLIC_KEY, "apikey": Q.EMAIL_PUBLIC_KEY },
      body: JSON.stringify({
        templateName: "application-submission",
        templateData: { name: v.first_name, email: v.email, phone: v.phone, role: v.company, message: message }
      }),
      keepalive: true
    }).catch(function () {});
  }

  function renderQualified(v) {
    root.innerHTML =
      '<section class="flow"><div class="wrap flow-wrap">' +
        '<p class="eyebrow dark">Application received</p>' +
        '<h2 class="q">You\'re a fit, ' + esc(v.first_name) + '. Pick a time below.</h2>' +
        '<p class="sub">Choose the slot that works for you. You\'ll get a confirmation by email.</p>' +
        '<div class="calendar"><iframe src="' + Q.BOOKING_URL + '" title="Book your Performance Diagnostic" loading="lazy"></iframe></div>' +
        '<p class="fine-dark">Calendar not loading? <a href="' + Q.BOOKING_URL + '" target="_blank" rel="noopener">Open it in a new tab</a>.</p>' +
      '</div></section>' +
      '<footer class="foot">Conviction Code™ by Rola Diab © 2026</footer>';
    window.scrollTo(0, 0);
  }

  function renderNotYet(v) {
    root.innerHTML =
      '<section class="flow"><div class="wrap flow-wrap">' +
        '<p class="eyebrow dark">Application received</p>' +
        '<h2 class="q">Thank you, ' + esc(v.first_name) + '.</h2>' +
        '<p class="sub">Based on your answers, a Performance Diagnostic isn\'t the right next step just yet. Rola reads every application, and you\'ll keep getting her insights by email.</p>' +
        '<p class="sub">In the meantime, follow along on <a href="https://www.instagram.com/rolaspeaks/" target="_blank" rel="noopener">Instagram</a> and <a href="https://www.youtube.com/@Rolaspeaks" target="_blank" rel="noopener">YouTube</a>.</p>' +
        (resultCode ? '<a class="btn btn-navy" href="/#r=' + resultCode + '">Back to my results</a>' : "") +
      '</div></section>' +
      '<footer class="foot">Conviction Code™ by Rola Diab © 2026</footer>';
    window.scrollTo(0, 0);
  }

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "app-form") return;
    e.preventDefault();
    var f = e.target;
    var pick = function (name) { var el = f.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ""; };
    var v = {
      first_name: f.first_name.value.trim().slice(0, 60),
      email: f.email.value.trim().toLowerCase().slice(0, 255),
      phone: f.phone.value.trim().slice(0, 40),
      company: f.company.value.trim().slice(0, 150),
      revenue: pick("revenue"),
      goal: f.goal.value.trim().slice(0, 1000),
      obstacle: f.obstacle.value.trim().slice(0, 1000),
      start: pick("start"),
      invest: pick("invest")
    };
    var err = !v.first_name ? "Please enter your first name." :
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) ? "Please enter a valid email." :
      v.phone.replace(/\D/g, "").length < 7 ? "Please enter a phone or WhatsApp number." :
      !v.company ? "Please share your role and company." :
      !v.revenue ? "Please choose what best describes you." :
      !v.goal ? "Please tell us what you want to be true in 90 days." :
      !v.start ? "Please choose when you want to start." :
      !v.invest ? "Please answer the investment question." : "";
    if (err) { renderForm(v, err); return; }

    var qualified = v.start !== START[3] && v.invest !== INVEST[2];
    var btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Submitting...";
    Promise.race([sendApplication(v, qualified), new Promise(function (r) { setTimeout(r, 4000); })]).then(function () {
      if (qualified) renderQualified(v); else renderNotYet(v);
    });
  });

  renderForm();
})();
