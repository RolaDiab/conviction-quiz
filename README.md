# The Performance Blocks Assessment

Self-hosted replacement for the ScoreApp assessment. Static site on GitHub Pages at https://quiz.convictioncode.com

- `content.js`: all questions and copy, plus the GHL webhook URL setting.
- `app.js`: flow, scoring, results, lead delivery (Adhara form `quiz-gate`, plus GHL inbound webhook when set).
- Results live in the URL (`#r=...`), so result links work with no database.

## Scoring and analysis (v2, 2026-11)

- 21 scored items, 3 per pillar. Every pillar has exactly one reverse-worded item (questions 3, 6, 8, 11, 14, 16, 19). The `quiz_responses` trigger in the Conviction Code database scores the same positions, so change both together (the test checks the positions).
- Half of visitors see the answer scale in the opposite order (`scale_order`), so answer order can't tilt scores.
- Ties between low pillars break on the reverse item. Anything still tied is labelled "Tied" on the results page.
- Answer sets that are too uniform (straight-lining, or agreeing with both the positive and the negative statement on 4+ pillars) get a note asking for a retake.
- Signature patterns (`PATTERNS` in `content.js`) read two pillars together. A strength must score above every block.
- 3 unscored outcome questions follow the 21. Every completed assessment is stored in `quiz_responses` (raw answers, outcomes, answer order) so reliability, norms and tier cut-offs can be set from real data.
- Contact details are asked for after the questions, to unlock the results (start rate was 13% with the form first).
- Results include a 7-pillar radar chart, a First 7 Days plan for the #1 block (`PLAYBOOK`), and a print-ready PDF report.
- Run `node tests/scoring.test.js` before shipping.

## Backend: Lovable Cloud today, GoHighLevel next

`EMAILS_SENT_BY` in `content.js` decides who sends the results email and lead alert. The GHL webhook already
carries every score, the pattern, ready-made email sentences and the raw answers. Setup and switch-over steps:
`docs/GHL-SETUP.md`. GHL results email template: `email/quiz-results-ghl.html`.
