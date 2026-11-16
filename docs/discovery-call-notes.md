# Discovery Call invites: title + quiz and application notes

Goal: every booking on the Discovery Call calendar (LeadConnector widget `T5FW8VnbAbvoi3C1zAuA`)
arrives titled `Discovery Call: <First name> x Rola`, with the guest's full quiz breakdown and
application answers in the invite notes. The guest sees the same invite, so the notes hold only
the quiz results and the guest's own answers.

## How it works

1. Quiz finished: the quiz webhook (`GHL_WEBHOOK_URL`) now also sends `quiz_summary`, the full
   breakdown as text (score, profile, top 3 blocks with "how it shows up", all 7 pillars, link).
2. Application submitted on quiz.convictioncode.com/apply: the apply webhook
   (`GHL_APPLY_WEBHOOK_URL`) sends `application_summary`, plus `quiz_summary` when they came from
   their results page, plus tags `applied` and `apply-qualified` or `apply-not-yet`.
3. GHL saves both on the contact. The calendar puts the contact fields in the invite.
4. They book: GHL creates the event in Outlook with the new title and notes, for Rola and the guest.

Text is built in `notes.js`. The apply webhook stays off until `GHL_APPLY_WEBHOOK_URL` is set.

## Setup in GHL (one time)

### 1. Two contact fields
Settings > Custom Fields > Add Field, type Multi Line, object Contact:
- `Quiz Results`
- `Application Answers`

Note each field's merge key (shown on the field, e.g. `{{contact.quiz_results}}`).

### 2. Quiz workflow: save the breakdown
Automation > Workflows > "Quiz Leads from quiz.convictioncode.com" > the Create/Update Contact step:
map `quiz_summary` to `Quiz Results`. (Take the quiz once so the new key shows in the sample data.)

### 3. New workflow: "Coaching Applications"
- Trigger: Inbound Webhook. Copy its URL and paste it into `GHL_APPLY_WEBHOOK_URL` in `content.js`.
- Send one test application, then "Fetch sample requests" in the trigger.
- Action Create/Update Contact: first name, last name, email, phone, company name,
  `application_summary` to `Application Answers`, `quiz_summary` to `Quiz Results`.
- Action Add Tag: `applied`, plus `apply-qualified` or `apply-not-yet` (from `tags`).
- Keep it separate from the quiz workflow: that one tags `quiz-completed` and starts the quiz emails.

### 4. The calendar
Calendars > Calendar Settings > edit the Discovery Call calendar > meeting details:
- Meeting invite title: `Discovery Call: {{contact.first_name}} x Rola`
- Meeting description (calendar event notes): the two merge keys from step 1, for example

```
Quiz results and application for your Discovery Call with Rola Diab.

{{contact.quiz_results}}

{{contact.application_answers}}
```

If the description field does not accept contact fields in your GHL version, use a workflow
instead: trigger Appointment Status (Booked) on this calendar, action Update Appointment notes
with the same two fields.

### 5. Check, then retire the Claude task
Book a test call and check the Outlook event title and notes. Once it works, turn off the Claude
scheduled task "Discovery Call names + quiz notes" so the two don't both edit invites.

## Also to do
The businessmanifesting.com application (`business-manifesting/coaching/apply/apply.js`) only
emails Rola. Send it to the same apply webhook so those applicants get notes too.
