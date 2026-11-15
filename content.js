// All assessment copy and question data. Edit text here; app.js handles the flow.

window.QUIZ = {
  // GHL workflow "Quiz Leads from quiz.convictioncode.com": creates/updates the contact, tags quiz-completed.
  GHL_WEBHOOK_URL: "https://services.leadconnectorhq.com/hooks/lEqWwjtkibEh35SiVbMP/webhook-trigger/968f8efd-b7b4-4b7d-839c-fac1c3ae215d",
  // Adhara "quiz-gate" form. Its auto-reply ("Send confirmation email") must stay OFF in Adhara,
  // because the quiz sends its own results email. Turned off 2026-10-27.
  ADHARA_FORM_URL: "https://api.adharaweb.com/api/v1/public/forms/rola/quiz-gate",
  // Results email + new-lead alert, sent through the convictioncode.com email system
  // (Lovable Cloud, sender notify.alorsolutions.com). The key below is the public browser key.
  EMAIL_FUNCTION_URL: "https://zyonpiskcpoiwhkgxdjp.supabase.co/functions/v1/send-transactional-email",
  EVENTS_URL: "https://zyonpiskcpoiwhkgxdjp.supabase.co/rest/v1/quiz_events",
  // Every completed assessment (raw answers + outcomes). Insert-only for the public key; a database trigger re-scores it.
  RESPONSES_URL: "https://zyonpiskcpoiwhkgxdjp.supabase.co/rest/v1/quiz_responses",
  EMAIL_PUBLIC_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b25waXNrY3BvaXdoa2d4ZGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTM0MDgsImV4cCI6MjA4NDIyOTQwOH0.2AdGgTflahS0Y_jO66BmH4b8n5PwDp-0wtQPtFPh_BI",
  BOOKING_URL: "https://api.leadconnectorhq.com/widget/booking/T5FW8VnbAbvoi3C1zAuA",
  // Self-paced CLEAR Method on Whop. Leave empty while the Whop product is hidden; the results
  // page shows the CLEAR link only when this is set. Live URL: https://whop.com/rola-diab-218e/clear-method-rola-diab
  CLEAR_URL: "",
  CLEAR_PRICE: "$297",
  CLEAR_REGULAR_PRICE: "$497",
  // Event codes for the "Have a code?" field. Stored as SHA-256 of the uppercase code so the code
  // isn't readable in the page source (hash it with: printf %s "CODE" | shasum -a 256).
  // Each code must also exist as a promo code on the Whop product; Whop applies the real discount.
  CLEAR_PROMOS: [
    { hash: "9fb70adf37e9f58d36d15819497b71cc03573a2e23c914f65d80e3c26c91bf22", label: "Womanifest price", price: "$207.90" } // Womanifest event, 30% off
  ],

  PILLARS: ["intention", "identity", "meaning", "practice", "alignment", "communication", "trust"],

  // Three items per pillar. "R:" marks a reverse-scored item. Every pillar has exactly one, placed so
  // reverse items are spread through the quiz (questions 3, 6, 8, 11, 14, 16, 19) instead of bunched at the end.
  // The database trigger on quiz_responses scores the same positions; change both together.
  QUIZ_VERSION: "2026-11-v2",
  ITEMS: {
    intention: [
      "I have a clear sense of what success means to me.",
      "R:I sometimes feel unclear about what I'm really working toward.",
      "When I make an important decision, I know it's aligned with my bigger goal."
    ],
    identity: [
      "I have a clear vision of the person I want to become.",
      "My daily actions are consistent with that future version of myself.",
      "R:When I get a big win, part of me feels like it doesn't fit who I really am."
    ],
    meaning: [
      "R:Lately, my work feels empty or pointless.",
      "I can articulate exactly why my work matters beyond the paycheck or the title.",
      "Even during difficult seasons, I can reconnect with my purpose."
    ],
    practice: [
      "My daily habits support the future I'm working to create.",
      "R:My follow-through falls apart when motivation dips.",
      "My consistency runs on systems, not on whether I feel motivated."
    ],
    alignment: [
      "When I walk into a high pressure conversation, my body feels calm and not braced for impact.",
      "I can disagree with someone in authority without my heart rate spiking or my chest tightening.",
      "R:After a difficult meeting, I replay it for hours and have trouble moving on."
    ],
    communication: [
      "R:In important conversations, I say the right words but I don't sound like I mean them.",
      "My words, tone, and body language send the same message.",
      "When I say something that matters, people take it the way I meant it."
    ],
    trust: [
      "When a decision needs to be made, I make it without needing three more opinions first.",
      "R:After I make an important decision, I keep second-guessing it.",
      "I trust myself to make important decisions."
    ]
  },

  // Not scored. Outcome questions so the pillars can be checked against real results once responses build up.
  OUTCOMES_INTRO: "Three quick ones about your results. These aren't scored. They keep the assessment accurate.",
  OUTCOMES: [
    { key: "capability", text: "My results over the past year reflect what I'm truly capable of." },
    { key: "enjoy", text: "When I reach a goal, I actually feel the win." },
    { key: "satisfaction", text: "Overall, I'm satisfied with my life right now." }
  ],

  OPTIONS: ["Strongly Agree", "Agree", "Neither Agree nor Disagree", "Disagree", "Strongly Disagree"],

  PROFILE: [
    { key: "role", text: "What best describes you?", options: ["Founder / CEO", "Executive / C-Suite", "Consultant or Coach", "Employee at a company", "Other"] },
    { key: "urgency", text: "How soon do you want to change this?", options: ["Right now", "In the next 30 days", "In the next 3 months", "I'm just curious"] }
  ],

  TIERS: [
    { max: 35, name: "The Survivor" },
    { max: 56, name: "The Builder" },
    { max: 78, name: "The Achiever" },
    { max: 100, name: "The High Performer" }
  ],

  TIER_COPY: {
    "The Survivor": [
      { p: [
        "You're in the Survivor range. Right now you're operating in Survivor Mode.",
        "The system driving your performance isn't yet producing the outcomes you're capable of. Instead of inevitable success, you're likely running on effort, resilience, and determination to push through.",
        "You may get brief bursts of momentum, then find yourself second-guessing decisions or feeling like you're constantly starting over.",
        "This is not a reflection of your intelligence, ambition, or potential. It's a reflection of the internal system currently driving your decisions."
      ] },
      { h: "Why This Happens", p: [
        "The way you think, interpret experiences, and respond to uncertainty shapes the decisions you make every day. Those decisions become habits. Those habits become performance, and performance becomes results.",
        "That's why two people with the same talent and opportunities can produce very different outcomes. The difference is often the system they're running."
      ] },
      { h: "Your Greatest Opportunity", p: [
        "These patterns are not permanent. They're measurable, and they're trainable.",
        "Most people spend years trying to change their habits or circumstances without ever seeing the system producing them. You just looked beneath the surface. That awareness is where inevitable success begins.",
        "Strengthen the system one pillar at a time and something shifts. You think more clearly. You decide with more conviction. Your results stop feeling random."
      ] }
    ],
    "The Builder": [
      { p: [
        "You're in the Builder range, with a confidence-built profile. You've done the work. The capability is real, the wins are real, the discipline holding it together is real, but the strategies that got you here are starting to plateau.",
        "Confidence is what gets you into the room. Conviction is what holds you in it. The gap between them is the wall every high performer eventually hits.",
        "Your pillar scores below show a mix of strong and underdeveloped areas. The weak ones aren't ruining you. They're capping you. That's why more effort has stopped converting into more progress.",
        "The 7 pillars below (Intention, Identity, Meaning, Practice, Alignment, Communication, Trust) are where the reinforcement goes. Read each score. Your highs are what got you here. Your lows are what's keeping you stuck."
      ] }
    ],
    "The Achiever": [
      { p: [
        "You're in the Achiever range, with a conviction-seeking profile. You're producing. You're delivering. People look at your life and see success, and they're not wrong.",
        "But you know, even if you can't articulate it, that the internal experience hasn't caught up to the external one. The wins are real. The interior signal that should match them is faint, intermittent, or absent entirely.",
        "You don't have a system failure. You have a tuning problem. Most of your pillars are strong, but one or two specific ones are off-frequency, quietly draining the energy and certainty that should be flowing through everything else.",
        "Read your 7 pillar scores below. The pattern shows where the signal is solid and where it's weak.",
        "You're not far. You're tuning the last few degrees."
      ] }
    ],
    "The High Performer": [
      { p: [
        "You're in the High Performer range, with a conviction-driven profile. You're not chasing the result anymore. You're operating from the belief that already produced it. The internal architecture is sound. The external is keeping pace because the inside set the tempo first. This is what conviction looks like when it's installed and running.",
        "This doesn't mean there's no room for growth. At this level, the game changes. It's no longer about fixing what's broken. It's about deepening mastery, expanding capacity, and often helping others build what you've built. Your growth edge is in optimization and leadership: raising your ceiling, not repairing your floor.",
        "Read your 7 pillar scores below. The pattern shows where mastery already lives and the one or two places to deepen next.",
        "From here, the next move is to install repeatable systems and processes to support your ongoing development as you expand."
      ] }
    ]
  },

  PILLARS_INTRO: "Your overall score is one number. Underneath it, seven pillars shape it. Notice which are strong and which are holding you back.",

  // Signature patterns: what two pillars mean together. A pattern shows when its high pillar beats its low
  // pillar by at least 25 points; the biggest gap wins. "braced" and "even" are special cases (see app.js).
  PATTERNS_INTRO: "Single scores tell you where. Combinations tell you why. This is the pattern your pillars make together.",
  PATTERNS: [
    { key: "clear-starter", hi: "intention", lo: "practice", name: "The Clear Starter", p: [
      "You know exactly where you're going. The gap is between knowing and doing.",
      "Your direction is strong, but your systems aren't carrying it. So every week starts with a clear plan and ends with the same plan, still waiting.",
      "Your first move isn't more clarity. It's one system that runs even on the days you don't feel like it."
    ] },
    { key: "running-on-empty", hi: "practice", lo: "meaning", name: "Running on Empty", p: [
      "Your systems are strong. You show up, you ship, you keep going. The fuel underneath it is running low.",
      "Discipline without meaning works for a while. Then the wins start to feel flat, and the effort starts to feel heavy. This is the pattern that comes before burnout.",
      "Your first move is to reconnect the work to a reason that's yours, not the next milestone."
    ] },
    { key: "busy-not-directed", hi: "practice", lo: "intention", name: "Busy, Not Directed", p: [
      "You are consistent. The question is whether you're consistent in the right direction.",
      "Strong habits pointed at a goal you haven't fully chosen produce a lot of motion and very little progress. You can be the hardest-working person in the room and still feel stuck.",
      "Your first move is to name what success actually means to you, then let your systems point there."
    ] },
    { key: "clear-but-hesitant", hi: "intention", lo: "trust", name: "Clear but Hesitant", p: [
      "You know what you want. You stall at the moment of choosing.",
      "This is the leader who has the plan, then asks three more people, then waits for one more sign. The clarity is real. The trust to act on it hasn't caught up.",
      "Your first move is to decide faster on the small calls, so you build evidence that your judgment holds."
    ] },
    { key: "mind-ahead-of-body", hi: "identity", lo: "alignment", name: "Mind Ahead of Body", p: [
      "You can see the person you're becoming. Your body hasn't been told yet.",
      "Your mind says yes to the bigger room, the bigger number, the harder conversation. Your nervous system braces anyway. When those two disagree, the body usually wins.",
      "Your first move is to regulate before you perform, so the future version of you can actually show up."
    ] },
    { key: "strong-inside-quiet-outside", hi: "identity", lo: "communication", name: "Strong Inside, Quiet Outside", p: [
      "You know who you are. It isn't fully landing in how you show up.",
      "Your words, your tone, and your presence aren't sending the same message yet. People feel the mismatch before they hear the content, so you get less credit than your capability deserves.",
      "Your first move is to match your delivery to your conviction in one conversation that matters this week."
    ] },
    { key: "bold-without-a-map", hi: "trust", lo: "intention", name: "Bold Without a Map", p: [
      "You move. You decide. You don't wait for permission. The direction is less clear than the speed.",
      "Fast decisions toward a fuzzy target create a lot of restarts. You're not afraid to act. You're acting without a clear filter for what's worth acting on.",
      "Your first move is to define the one outcome every decision this quarter has to serve."
    ] },
    { key: "purpose-without-a-system", hi: "meaning", lo: "practice", name: "Purpose Without a System", p: [
      "Your reason is strong. Your routine isn't built to carry it.",
      "You care deeply about the work, so the low weeks hurt more. Meaning gives you the fuel. Without a system, that fuel burns in bursts instead of carrying you steadily.",
      "Your first move is to turn what matters most into one daily practice that doesn't depend on how you feel."
    ] }
  ],
  PATTERN_BRACED: { key: "braced-decider", name: "The Braced Decider", p: [
    "Your two lowest areas sit together: your body under pressure, and your trust in your own decisions.",
    "This is a threat response, not a skill gap. When the stakes rise, your system reads danger, so you brace, you replay, and you second-guess. Capable people with this pattern often look calm and feel the opposite.",
    "Your first move is to work with your nervous system first. Decisions get easier once the body stops bracing."
  ] },
  PATTERN_EVEN: { key: "one-system", name: "One System", p: [
    "Your pillars are close together. No single area is dragging the rest down.",
    "That means your score moves as one system. When you strengthen one pillar, the others tend to rise with it. Start with your lowest score below and watch what happens to the rest.",
    "Your first move is to raise the floor, not chase a single weakness."
  ] },

  // "Your First 7 Days" plan, shown for the #1 block. Each step is small enough to do this week.
  PLAYBOOK_INTRO: "Small, specific, and built to fit a full calendar. Start with your #1 block. One week is enough to feel the shift.",
  PLAYBOOK: {
    intention: [
      ["Day 1", "Write one sentence: \"Success for me this year means ___.\" Then name the value underneath it, the reason it matters to you and not to anyone else."],
      ["Days 2 to 6", "Before each important decision, ask one question: does this move me toward that sentence? When the answer is no, decide what you'll say no to."],
      ["Day 7", "Look back at the week. Where did you feel torn? That's usually a value you haven't named yet. Name it, and add it to your sentence."]
    ],
    identity: [
      ["Day 1", "Write who you're becoming in the present tense: \"I am a leader who ___.\" Keep it to one line you'd be willing to say out loud."],
      ["Days 2 to 6", "Each morning, pick one action that person would take today, and take it before noon. Small counts. Every action is evidence for the new identity."],
      ["Day 7", "List every win from the week, including the ones you shrugged off. Read the list out loud. Notice which ones felt like they didn't belong to you."]
    ],
    meaning: [
      ["Day 1", "Finish this sentence three times: \"My work matters because ___.\" Keep going until the answer has nothing to do with money, praise, or a title."],
      ["Days 2 to 6", "At the end of each day, write one line about a moment your work moved something forward or helped someone. This is how you refill the engine."],
      ["Day 7", "Read your five lines. Pick the one that moved you most, and tell the person it was about."]
    ],
    practice: [
      ["Day 1", "Pick the one habit that would change the most if it ran on autopilot. Attach it to something you already do every day: \"After I ___, I will ___.\""],
      ["Days 2 to 6", "Run it at a size you can't fail at. Two minutes counts. This week the goal is consistency, not intensity."],
      ["Day 7", "Check the streak, not the results. Name the one thing that made it easier, and keep it."]
    ],
    alignment: [
      ["Day 1", "Before your next high-pressure conversation, take three slow breaths with an exhale twice as long as the inhale. Notice where your body was bracing."],
      ["Days 2 to 6", "Do the same before every meeting that matters. Afterwards, write one line: what your body did, and what you did next."],
      ["Day 7", "Pick the conversation you replayed most this week. Ask what your body was protecting you from. That answer is where the belief lives."]
    ],
    communication: [
      ["Day 1", "Before your next important conversation, write the one sentence you most need them to hear. Say it out loud, standing, until it sounds like you mean it."],
      ["Days 2 to 6", "In one conversation a day, lead with that kind of sentence, then stop talking. Let the pause carry it."],
      ["Day 7", "Ask one person you trust: \"When I said ___, how did it land?\" Compare their answer with what you meant."]
    ],
    trust: [
      ["Day 1", "Write down one decision you've been delaying. Give it a deadline in the next 72 hours, and decide now what information would actually change your mind."],
      ["Days 2 to 6", "Make every small decision in under two minutes, without asking anyone. You're building evidence that your judgment holds."],
      ["Day 7", "Review the week's decisions. Count how many you'd change. It's usually far fewer than the fear predicted."]
    ]
  },

  UNIFORM_NOTE: "Your answers were very uniform, so your pillar scores are less precise than they could be. For a sharper read, retake it and go with your first honest reaction to each statement.",

  PILLAR_COPY: {
    intention: {
      line: "The clarity behind your direction, and the values underneath it.",
      d: "The clarity behind your direction, and the values underneath it. When your underlying values align with your stated goals, decisions feel clean. When they don't, even if the goal looks right on paper, every choice creates internal friction.",
      hi: "You know exactly what you're building and why it matters to you. Priorities filter themselves through your bigger goal.",
      lo: "You feel torn in decision-making. Often the conflict isn't between goal and effort. It's between the goal you chose and a value you haven't consciously named.",
      why: "Research from Acceptance and Commitment Therapy and Gollwitzer's implementation intention studies shows direction anchored in identified values improves follow-through compared with goals set on external metrics alone."
    },
    identity: {
      line: "The gap between who you're being and who you're becoming.",
      d: "The gap between who you're being and who you're becoming. Identity precedes action. You don't consistently do things that don't match how you see yourself. Every high performer eventually hits a moment where their old identity can't hold their new capacity.",
      hi: "You act like the version of you already exists. You don't wait for permission or external validation.",
      lo: "You self-sabotage wins because they don't fit the story you're still telling yourself. You accept standards lower than what you deserve.",
      why: "Research on identity-based habits (Fogg, Dweck) shows lasting behavioral change happens when you shift the underlying identity, not just the behavior."
    },
    meaning: {
      line: "The engine of intrinsic motivation that keeps you going when no reward is coming.",
      d: "Meaning is the engine of intrinsic motivation. It's what keeps you moving when no one is watching, no reward is coming, and the work gets hard. When the reason behind your work is bigger than the moment you're in, effort stops feeling like a cost. Without it, you can hit every external goal and still run out of fuel.",
      hi: "Your reason is bigger than any single result. Hard days still feel worth it, so you keep going without needing outside rewards to push you.",
      lo: "You're running on external fuel: money, praise, the next milestone. When those fade, so does your drive. Wins feel flat, and setbacks feel bigger than they are.",
      why: "Self-Determination Theory (Deci and Ryan) links intrinsic motivation to greater persistence, performance and wellbeing than motivation driven by external rewards. Teresa Amabile's research on daily work found that making progress on work that feels meaningful is one of the strongest drivers of motivation."
    },
    practice: {
      line: "The systems and habits that carry you when motivation dips.",
      d: "Discipline is architecture, not effort. Practice is the invisible operating system underneath your performance. It's the systems and habits that carry you when motivation dips (which it will).",
      hi: "Your consistency runs on systems, not moods. Your worst week still ships.",
      lo: "You start strong and fade. Motivation is your primary strategy. When energy dips, follow-through evaporates.",
      why: "Research on habit formation (Wendy Wood) found that about 43% of daily behavior is habitual. That means your systems, not your effort, determine most outcomes."
    },
    alignment: {
      line: "The connection between what your mind decides and what your body allows.",
      d: "Alignment is your mind-body connection. Internal limiting beliefs don't just sit in your head. They sit in your body. Sometimes your mind says yes, but your body says no. Your body will always win.",
      hi: "Your body is calm under pressure. You walk into high-stakes rooms and stay present. There's no gap between what you say and what you feel.",
      lo: "Your body signals discomfort before your mind catches up. You brace for meetings you should own. You override the \"no\" and pay for it in energy, sleep, or health.",
      why: "Somatic research (van der Kolk, polyvagal theory) suggests limiting beliefs live in the nervous system, not just cognition. You can't think your way past a body that's braced. You have to regulate the state first."
    },
    communication: {
      line: "The match between your words, your body, and your energy.",
      d: "Communication isn't just what you say to yourself. It's the alignment between your words, your body, and your energy. Internal self-talk and external presence. When your body and energy don't match your stated intention, people feel it before they hear it.",
      hi: "Your self-talk supports the person you're becoming. Your body language, tone, and energy match your words. You show up whole.",
      lo: "You say one thing, your body signals another. Your self-talk erodes what your words are trying to build. You leave conversations feeling like you didn't fully land.",
      why: "Research on nonverbal communication (Ekman and others) shows that when body, tone, and words don't align, listeners lean on the nonverbal signal. Misalignment is felt even when you're saying the right thing."
    },
    trust: {
      line: "Your capacity to override fear and move forward anyway.",
      d: "Trust is your capacity to override the initial fear response and move forward anyway. Every consequential decision hits a threshold where fear fires. Doubt, hesitation, the \"what if I'm wrong.\" Trust is the internal architecture, the plan, that lets you move through it, not around it.",
      hi: "You commit before certainty arrives. You have a plan for how you'll act when fear shows up. Because it will. You've built the muscle of moving forward when your system says stop.",
      lo: "You freeze at decision points. You poll five people before making a call you already knew. You wait for one more sign that never comes.",
      why: "Neuroscience of decision-making (Damasio, LeDoux) shows the fear response is faster than rational thought. You can't out-think fear. Trust is a trained override, not a personality trait."
    }
  },

  HIGH_CONVICTION: [
    "Conviction isn't a personality trait. It's a state, and it's trainable.",
    "People operating with high conviction share something specific. Once they've decided on a direction, they don't relitigate it in every high-stakes moment. They move.",
    "They walk into rooms with the presence of someone who's already made peace with the outcome. They make decisions the way most people make coffee. Automatic. Grounded. Not because they're certain, but because they've built the internal architecture to act before certainty arrives.",
    "They don't wait to feel ready. They've stopped needing permission from the version of themselves that used to hesitate.",
    "The gap between them and where you are right now isn't talent. It's the pattern you just saw above."
  ],

  SCIENCE: [
    "This assessment is rooted in research from neuroscience, behavioral psychology, and performance science.",
    "Peter Gollwitzer's research on implementation intentions shows that direction anchored in clear plans substantially improves follow-through. Bessel van der Kolk's somatic research suggests that limiting beliefs live in the body, not just the mind. Antonio Damasio's neuroscience of decision-making shows that the fear response fires faster than rational thought. Conviction is a trained override, not a personality trait.",
    "In an fMRI study published in the Journal of Business Venturing, investors watched startup pitches with identical content. When the founder delivered with high passion, investor interest rose 26% and neural engagement rose 39%. Same words. Different delivery. Different result.",
    "The 7 pillars bring these findings together into one system you can train. Together, they make success inevitable."
  ]
};
