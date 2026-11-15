# Moving the quiz backend to GoHighLevel

Today the results email, Rola's lead alert, application emails, the funnel counter and stored
responses run on Lovable Cloud. This moves the emails and the data to GHL. The quiz is built so
the switch is two settings in `content.js`, and nothing goes out twice or gets dropped in between.

## 1. Create contact custom fields (Settings → Custom Fields → Contact)

Use these exact field keys. The results email and the sequence use them as `{{contact.<key>}}`.

| Field key | Type | Webhook value to map |
|---|---|---|
| `quiz_score` | Number | `overall_score` |
| `quiz_tier` | Single line | `tier` |
| `primary_performance_block` | Single line (already exists) | `top_block_1` |
| `quiz_block_2` | Single line | `top_block_2` |
| `quiz_block_3` | Single line | `top_block_3` |
| `quiz_pattern` | Single line | `pattern` |
| `quiz_pattern_line` | Multi line | `pattern_line` |
| `quiz_strength_line` | Multi line | `strength_line` |
| `quiz_day1_action` | Multi line | `day1_action` |
| `quiz_result_url` | Single line | `result_url` |
| `quiz_apply_url` | Single line | `apply_url` |
| `quiz_intention` ... `quiz_trust` (7 fields) | Number | `intention`, `identity`, `meaning`, `practice`, `alignment`, `communication`, `trust` |
| `quiz_answers` | Single line | `quiz_answers` (21 answers, 5 = Strongly Agree, before reverse scoring) |
| `quiz_outcomes` | Single line | `quiz_outcomes` (3 unscored outcome answers, same scale) |
| `quiz_scale_order` | Single line | `scale_order` |
| `quiz_version` | Single line | `quiz_version` |
| `quiz_answers_uniform` | Single line | `answers_uniform` |

`quiz_answers` replaces the Lovable `quiz_responses` table: export contacts with these fields to a
spreadsheet for analysis (reliability, norms, tier cut-offs) once ~300 responses are in.

## 2. Update the quiz workflow ("Quiz Leads from quiz.convictioncode.com")

1. Trigger: the existing Inbound Webhook.
2. Create/Update Contact: map every field in the table above, plus name, email, role, urgency, UTMs.
3. Add tags from the `tags` value (already sent: `quiz-completed`, `urgency-…`, `source-…`).
4. **If/Else: `emails_sent_by` is `ghl`** (this lets you build and test without double emails):
   - Yes → **Send Email** to the contact: paste `email/quiz-results-ghl.html` (HTML/code editor).
     Subject: `{{contact.first_name}}, your Performance Score is {{contact.quiz_score}}%`.
     From: Rola Diab, reply-to rola@alorsolutions.com.
   - Yes → **Internal Notification** (email to Rola): name, email, role, urgency, score, tier,
     #1 block, pattern, source, `{{contact.quiz_result_url}}`.
   - No → nothing (Lovable is still sending both).
5. Continue into the existing 6-email follow-up sequence, unchanged.

## 3. Create an applications workflow

1. New workflow, trigger: **Inbound Webhook**. Copy its URL.
2. Create/Update Contact (first/last name, email, phone). Add tags from `tags`
   (`application-submitted`, plus `application-qualified` or `application-not-yet`).
3. Internal Notification to Rola. Use the webhook value `summary` as the body (it holds every answer,
   the qualification result and the quiz result link).

## 4. Switch over (in this order)

1. Do steps 1 to 3 and publish both workflows.
2. Take the quiz yourself. Check the contact has every field filled. (Lovable still sends the emails.)
3. In `content.js`: set `GHL_APPLY_WEBHOOK_URL` to the step 3 URL and `EMAILS_SENT_BY: "ghl"`.
4. Take the quiz and submit an application with your own email. You should get exactly one results
   email and one lead alert from GHL, and one application alert. If anything is missing, set
   `EMAILS_SENT_BY` back to `"lovable"`.
5. After a week with no problems: set `EVENTS_URL` and `RESPONSES_URL` to `""` in `content.js`.
   Lovable Cloud is then unused by the quiz and can be shut down.

Note: the funnel counter (landing views, starts, completions) lives in Lovable Cloud. When it's
retired, GHL still counts completions (contacts tagged `quiz-completed`), but not page views or starts.
Add a simple privacy-friendly analytics tool to the quiz page if you want those numbers.
