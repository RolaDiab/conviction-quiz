// All assessment copy and question data. Edit text here; app.js handles the flow.

window.QUIZ = {
  // Paste the GHL inbound webhook URL here once the workflow exists. Empty = skip.
  GHL_WEBHOOK_URL: "",
  ADHARA_FORM_URL: "https://api.adharaweb.com/api/v1/public/forms/rola/quiz-gate",
  BOOKING_URL: "https://api.leadconnectorhq.com/widget/booking/T5FW8VnbAbvoi3C1zAuA",

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
    { key: "role", text: "Last one. What best describes you?", options: ["Founder / CEO", "Executive / C-Suite", "Consultant or Coach", "Employee at a company", "Other"] }
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
        "Your Conviction Index™ indicates you're currently operating in Survivor Mode.",
        "Your Performance Operating System isn't yet producing the outcomes you're capable of. Instead of predictable success, you're likely running on effort, resilience, and determination to push through.",
        "You may get brief bursts of momentum, then find yourself second-guessing decisions or feeling like you're constantly starting over.",
        "This is not a reflection of your intelligence, ambition, or potential. It's a reflection of the internal system currently driving your decisions."
      ] },
      { h: "Why This Happens", p: [
        "The way you think, interpret experiences, and respond to uncertainty shapes the decisions you make every day. Those decisions become habits. Those habits become performance. And performance becomes results.",
        "That's why two people with the same talent and opportunities can produce very different outcomes. The difference is often the system they're running."
      ] },
      { h: "Your Greatest Opportunity", p: [
        "These patterns are not permanent. They're measurable, and they're trainable.",
        "Most people spend years trying to change their habits or circumstances without ever seeing the system producing them. You just looked beneath the surface. That awareness is where predictable success begins.",
        "Strengthen the system one pillar at a time and something shifts. You think more clearly. You decide with more conviction. And your results stop feeling random."
      ] }
    ],
    "The Builder": [
      { p: [
        "Your Performance Profile reveals a Confidence Builder pattern. You've done the work. The capability is real, the wins are real, the discipline holding it together is real, but the strategies that got you here are starting to plateau.",
        "Confidence is what gets you into the room. Conviction is what holds you in it. The gap between them is the wall every high performer eventually hits.",
        "Your IMPACT Pillar scores below show a mix of strong and underdeveloped areas. The weak ones aren't ruining you. They're capping you. That's why more effort has stopped converting into more progress.",
        "The 7 IMPACT Pillars below (Intention, Identity, Meaning, Practice, Alignment, Communication, Trust) are where the reinforcement goes. Read each score. Your highs are what got you here. Your lows are what's keeping you stuck."
      ] }
    ],
    "The Achiever": [
      { p: [
        "Your Performance Profile reveals a Conviction-Seeking pattern. You're producing. You're delivering. People look at your life and see success, and they're not wrong.",
        "But you know, even if you can't articulate it, that the internal experience hasn't caught up to the external one. The wins are real. The interior signal that should match them is faint, intermittent, or absent entirely.",
        "You don't have a system failure. You have a tuning problem. Most of your IMPACT Pillars are strong, but one or two specific ones are off-frequency, quietly draining the energy and certainty that should be flowing through everything else.",
        "Read your 7 IMPACT Pillar scores below. The pattern shows where the signal is solid and where it's weak.",
        "You're not far. You're tuning the last few degrees."
      ] }
    ],
    "The High Performer": [
      { p: [
        "Your Performance Profile reveals a Conviction-Driven pattern. You're not chasing the result anymore. You're operating from the belief that already produced it. The internal architecture is sound. The external is keeping pace because the inside set the tempo first. This is what conviction looks like when it's installed and running.",
        "This doesn't mean there's no room for growth. At this level, the game changes. It's no longer about fixing what's broken. It's about deepening mastery, expanding capacity, and often helping others build what you've built. Your growth edge is in optimization and leadership: raising your ceiling, not repairing your floor.",
        "Read your 7 IMPACT Pillar scores below. The pattern shows where mastery already lives and the one or two places to deepen next.",
        "From here, the next move is to install repeatable systems and processes to support your ongoing development as you expand."
      ] }
    ]
  },

  PILLARS_INTRO: "Your Conviction Index™ is one number. Underneath it, seven pillars shape it. Read each one. Notice which resonate most and which feel out of tune. That's your diagnostic snapshot.",

  PILLAR_COPY: {
    intention: {
      d: "The clarity behind your direction, and the values underneath it. When your underlying values align with your stated goals, decisions feel clean. When they don't, even if the goal looks right on paper, every choice creates internal friction.",
      hi: "You know exactly what you're building and why it matters to you. Priorities filter themselves through your bigger goal.",
      lo: "You feel torn in decision-making. Often the conflict isn't between goal and effort. It's between the goal you chose and a value you haven't consciously named.",
      why: "Research from Acceptance and Commitment Therapy and Gollwitzer's implementation intention studies shows direction anchored in identified values improves follow-through compared with goals set on external metrics alone."
    },
    identity: {
      d: "The gap between who you're being and who you're becoming. Identity precedes action. You don't consistently do things that don't match how you see yourself. Every high performer eventually hits a moment where their old identity can't hold their new capacity.",
      hi: "You act like the version of you already exists. You don't wait for permission or external validation.",
      lo: "You self-sabotage wins because they don't fit the story you're still telling yourself. You accept standards lower than what you deserve.",
      why: "Research on identity-based habits (Fogg, Dweck) shows lasting behavioral change happens when you shift the underlying identity, not just the behavior."
    },
    meaning: {
      d: "The difference between being successful and being fulfilled. Meaning is the internal experience of your work mattering to you, not to the market. Without Meaning, you can hit every external goal and still feel empty.",
      hi: "Your work feels like it's yours. Hard days feel purposeful. You can articulate why you're doing this at a level beyond the paycheck or title.",
      lo: "Achievements feel hollow. You hit milestones and feel oddly flat.",
      why: "Positive psychology research (Seligman, Frankl) links Meaning to long-term wellbeing and burnout resistance. Success without Meaning tends to collapse into exhaustion."
    },
    practice: {
      d: "Discipline is architecture, not effort. Practice is the invisible operating system underneath your performance. It's the systems and habits that carry you when motivation dips (which it will).",
      hi: "Your consistency runs on systems, not moods. Your worst week still ships.",
      lo: "You start strong and fade. Motivation is your primary strategy. When energy dips, follow-through evaporates.",
      why: "Research on habit formation (Wendy Wood) found that about 43% of daily behavior is habitual. That means your systems, not your effort, determine most outcomes."
    },
    alignment: {
      d: "Alignment is your mind-body connection. Internal limiting beliefs don't just sit in your head. They sit in your body. Sometimes your mind says yes, but your body says no. And your body will always win.",
      hi: "Your body is calm under pressure. You walk into high-stakes rooms and stay present. There's no gap between what you say and what you feel.",
      lo: "Your body signals discomfort before your mind catches up. You brace for meetings you should own. You override the \"no\" and pay for it in energy, sleep, or health.",
      why: "Somatic research (van der Kolk, polyvagal theory) suggests limiting beliefs live in the nervous system, not just cognition. You can't think your way past a body that's braced. You have to regulate the state first."
    },
    communication: {
      d: "Communication isn't just what you say to yourself. It's the alignment between your words, your body, and your energy. Internal self-talk and external presence. When your body and energy don't match your stated intention, people feel it before they hear it.",
      hi: "Your self-talk supports the person you're becoming. Your body language, tone, and energy match your words. You show up whole.",
      lo: "You say one thing, your body signals another. Your self-talk erodes what your words are trying to build. You leave conversations feeling like you didn't fully land.",
      why: "Research on nonverbal communication (Ekman and others) shows that when body, tone, and words don't align, listeners lean on the nonverbal signal. Misalignment is felt even when you're saying the right thing."
    },
    trust: {
      d: "Trust is your capacity to override the initial fear response and move forward anyway. Every consequential decision hits a threshold where fear fires. Doubt, hesitation, the \"what if I'm wrong.\" Trust is the internal architecture, the plan, that lets you move through it, not around it.",
      hi: "You commit before certainty arrives. You have a plan for how you'll act when fear shows up. Because it will. You've built the muscle of moving forward when your system says stop.",
      lo: "You freeze at decision points. You poll five people before making a call you already knew. You wait for one more sign that never comes.",
      why: "Neuroscience of decision-making (Damasio, LeDoux) shows the fear response is faster than rational thought. You can't out-think fear. Trust is a trained override, not a personality trait."
    }
  },

  HIGH_CONVICTION: [
    "The Conviction Code isn't a personality trait. It's a state. And it's trainable.",
    "People operating with high conviction share something specific. Once they've decided on a direction, they don't relitigate it in every high-stakes moment. They move.",
    "They walk into rooms with the presence of someone who's already made peace with the outcome. They make decisions the way most people make coffee. Automatic. Grounded. Not because they're certain, but because they've built the internal architecture to act before certainty arrives.",
    "They don't wait to feel ready. They've stopped needing permission from the version of themselves that used to hesitate.",
    "The gap between them and where you are right now isn't talent. It's the pattern you just saw above."
  ],

  SCIENCE: [
    "This assessment is rooted in research from neuroscience, behavioral psychology, and performance science.",
    "Peter Gollwitzer's research on implementation intentions shows that direction anchored in clear plans substantially improves follow-through. Bessel van der Kolk's somatic research suggests that limiting beliefs live in the body, not just the mind. Antonio Damasio's neuroscience of decision-making shows that the fear response fires faster than rational thought. Conviction is a trained override, not a personality trait.",
    "fMRI research shows that when a speaker delivers with high internal conviction, audience brain activity synchronizes 26% more strongly. Conviction isn't just felt. It's measured.",
    "The IMPACT Model integrates these findings into a single trainable system. Each of the 7 pillars maps to a specific research base. Together, they make performance predictable."
  ]
};
