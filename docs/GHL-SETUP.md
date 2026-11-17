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
| `quiz_first_move_line` | Multi line | `first_move_line` (used in sequence email 4) |
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

## 3. Applications workflow ("Coaching Applications", already built)

Set up in `docs/discovery-call-notes.md` (webhook `GHL_APPLY_WEBHOOK_URL`, fields Application
Answers and Quiz Results). One step to add before Lovable is retired: an **Internal Notification**
to Rola with `{{contact.application_answers}}`, because today the email to Rola still comes from Lovable.

## 4. Switch over (in this order)

1. Do steps 1 to 3 and publish both workflows.
2. Take the quiz yourself. Check the contact has every field filled. (Lovable still sends the emails.)
3. In `content.js`: set `EMAILS_SENT_BY: "ghl"`.
4. Take the quiz and submit an application with your own email. You should get exactly one results
   email and one lead alert from GHL, and one application alert. If anything is missing, set
   `EMAILS_SENT_BY` back to `"lovable"`.
5. After a week with no problems: set `EVENTS_URL` and `RESPONSES_URL` to `""` in `content.js`.
   Lovable Cloud is then unused by the quiz and can be shut down.

Note: the funnel counter (landing views, starts, completions) lives in Lovable Cloud. When it's
retired, GHL still counts completions (contacts tagged `quiz-completed`), but not page views or starts.
Add a simple privacy-friendly analytics tool to the quiz page if you want those numbers.

## 5. Follow-up sequence checklist (do these now, they matter today)

The 6 quiz emails (days 1, 3, 5, 8, 11, 15) live in the quiz workflow. Check each item in GHL:

- [ ] **Stop the sequence when someone applies or books.** Add a Goal (or an If/Else before each
      email) so contacts tagged `applied` or with a booked Discovery Call leave the sequence.
      Otherwise someone who booked on day 2 still gets "apply for your Discovery Call" on days 8 and 15.
- [ ] **Unsubscribe link.** The 6 email HTML files contain none. Turn on GHL's automatic unsubscribe
      footer for these emails (Settings > Email Services, or the email's footer setting), then send
      yourself a test and confirm the link is there. This is a legal requirement.
- [ ] **"Reply DEEPER" (day 11).** Add a trigger: Customer Replied, reply contains "deeper" → internal
      notification to Rola + tag `replied-deeper`, so no warm lead waits. Or decide Rola watches the inbox.
- [ ] **"My weekly emails" (day 15).** Confirm a weekly email exists and that quiz contacts are on it.
      Contacts are also added to the Adhara "quiz-gate" list: decide which system sends the weekly
      email, so people aren't emailed twice and an unsubscribe in one also stops the other.
- [ ] **Re-paste all 6 emails** from `email/quiz-sequence/` (the call is now called a Discovery Call
      everywhere, and emails 1 and 4 use `quiz_pattern_line` and `quiz_first_move_line`).
      Create those two fields first (table above) or those two lines stay blank.
- [ ] **Send yourself the whole sequence** (GHL "test" on each email) and check the merge fields fill in.
