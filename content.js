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

  // Three items per pillar, in pillar order. "R:" marks a reverse-scored item.
  ITEMS: {
    intention: [
      "I have a clear sense of what success means to me.",
      "When I make an important decision, I know it's aligned with my bigger goal.",
      "R:I sometimes feel unclear about what I'm really working toward."
    ],
    identity: [
      "I have a clear vision of the person I want to become.",
      "My daily actions are consistent with that future version of myself.",
      "R:When I fall short, I start doubting whether I can succeed."
    ],
    meaning: [
      "I can articulate exactly why my work matters beyond the paycheck or the title.",
      "Even during difficult seasons, I can reconnect with my purpose.",
      "R:Lately, my work feels empty or pointless."
    ],
    practice: [
      "My daily habits support the future I'm working to create.",
      "My consistency runs on systems, not on whether I feel motivated.",
      "R:My follow-through falls apart when motivation dips."
    ],
    alignment: [
      "When I walk into a high pressure conversation, my body feels calm and not braced for impact.",
      "I can disagree with someone in authority without my heart rate spiking or my chest tightening.",
      "R:After a difficult meeting, I replay it for hours and have trouble moving on."
    ],
    communication: [
      "The way I speak to myself supports the person I'm becoming.",
      "My words, tone, and body language send the same message.",
      "R:I avoid hard conversations to keep the peace."
    ],
    trust: [
      "When a decision needs to be made, I make it without needing three more opinions first.",
      "I trust myself to make important decisions.",
      "Even when I feel fear or uncertainty, I keep moving forward."
    ]
  },

  OPTIONS: ["Strongly Agree", "Agree", "Neither Agree nor Disagree", "Disagree", "Strongly Disagree"],

  PROFILE: [
    { key: "role", text: "What best describes you?", options: ["Founder / CEO", "Executive / C-Suite", "Consultant or Coach", "Employee at a company", "Other"] }
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
        "Your score shows you're currently operating in Survivor Mode.",
        "The system driving your performance isn't yet producing the outcomes you're capable of. Instead of predictable success, you're likely running on effort, resilience, and determination to push through.",
        "You may get brief bursts of momentum, then find yourself second-guessing decisions or feeling like you're constantly starting over.",
        "This is not a reflection of your intelligence, ambition, or potential. It's a reflection of the internal system currently driving your decisions."
      ] },
      { h: "Why This Happens", p: [
        "The way you think, interpret experiences, and respond to uncertainty shapes the decisions you make every day. Those decisions become habits. Those habits become performance, and performance becomes results.",
        "That's why two people with the same talent and opportunities can produce very different outcomes. The difference is often the system they're running."
      ] },
      { h: "Your Greatest Opportunity", p: [
        "These patterns are not permanent. They're measurable, and they're trainable.",
        "Most people spend years trying to change their habits or circumstances without ever seeing the system producing them. You just looked beneath the surface. That awareness is where predictable success begins.",
        "Strengthen the system one pillar at a time and something shifts. You think more clearly. You decide with more conviction. Your results stop feeling random."
      ] }
    ],
    "The Builder": [
      { p: [
        "Your results reveal a Confidence Builder pattern. You've done the work. The capability is real, the wins are real, the discipline holding it together is real, but the strategies that got you here are starting to plateau.",
        "Confidence is what gets you into the room. Conviction is what holds you in it. The gap between them is the wall every high performer eventually hits.",
        "Your pillar scores below show a mix of strong and underdeveloped areas. The weak ones aren't ruining you. They're capping you. That's why more effort has stopped converting into more progress.",
        "The 7 pillars below (Intention, Identity, Meaning, Practice, Alignment, Communication, Trust) are where the reinforcement goes. Read each score. Your highs are what got you here. Your lows are what's keeping you stuck."
      ] }
    ],
    "The Achiever": [
      { p: [
        "Your results reveal a Conviction-Seeking pattern. You're producing. You're delivering. People look at your life and see success, and they're not wrong.",
        "But you know, even if you can't articulate it, that the internal experience hasn't caught up to the external one. The wins are real. The interior signal that should match them is faint, intermittent, or absent entirely.",
        "You don't have a system failure. You have a tuning problem. Most of your pillars are strong, but one or two specific ones are off-frequency, quietly draining the energy and certainty that should be flowing through everything else.",
        "Read your 7 pillar scores below. The pattern shows where the signal is solid and where it's weak.",
        "You're not far. You're tuning the last few degrees."
      ] }
    ],
    "The High Performer": [
      { p: [
        "Your results reveal a Conviction-Driven pattern. You're not chasing the result anymore. You're operating from the belief that already produced it. The internal architecture is sound. The external is keeping pace because the inside set the tempo first. This is what conviction looks like when it's installed and running.",
        "This doesn't mean there's no room for growth. At this level, the game changes. It's no longer about fixing what's broken. It's about deepening mastery, expanding capacity, and often helping others build what you've built. Your growth edge is in optimization and leadership: raising your ceiling, not repairing your floor.",
        "Read your 7 pillar scores below. The pattern shows where mastery already lives and the one or two places to deepen next.",
        "From here, the next move is to install repeatable systems and processes to support your ongoing development as you expand."
      ] }
    ]
  },

  PILLARS_INTRO: "Your overall score is one number. Underneath it, seven pillars shape it. Notice which are strong and which are holding you back.",

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
    "The 7 pillars bring these findings together into one system you can train. Together, they make performance predictable."
  ]
};
