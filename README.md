# Conviction Code Performance Profile

Self-hosted replacement for the ScoreApp assessment. Static site on GitHub Pages at https://quiz.convictioncode.com

- `content.js`: all questions and copy, plus the GHL webhook URL setting.
- `app.js`: flow, scoring, results, lead delivery (Adhara form `quiz-gate`, plus GHL inbound webhook when set).
- Results live in the URL (`#r=...`), so result links work with no database.
