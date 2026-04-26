require('dotenv').config();
await agent.login({
  identifier: process.env.BLUESKY_IDENTIFIER,
  password: process.env.BLUESKY_PASSWORD,
});
const { BskyAgent } = require('@atproto/api');

const agent = new BskyAgent({
  service: 'https://bsky.social',
});

// ===== CONFIG =====
const FORM_LINK = 'https://smesh-force.github.io/bluesky-volunteer-form/';
const KEYWORDS = ['volunteer', 'help', 'support', 'donate', 'join','love','nice '];
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

// ===== RANDOMIZED REPLIES =====
const REPLIES = [
  `Interested? Fill this form 👉 ${FORM_LINK}`,
  `We’d love your support 🙌 Apply here: ${FORM_LINK}`,
  `Join us today 🚀 Sign up: ${FORM_LINK}`
];

// ===== MEMORY =====
const replied = new Set();

// ===== FUNCTIONS =====
async function checkMentions() {
  const notifications = await agent.listNotifications();

  for (const note of notifications.data.notifications) {

    if (note.reason !== 'mention') continue;
    if (replied.has(note.uri)) continue;

    const text = note.record?.text?.toLowerCase() || '';

    const matched = KEYWORDS.some(word => text.includes(word));
    if (!matched) continue;

    // 🎯 Pick random reply
    const replyText = REPLIES[Math.floor(Math.random() * REPLIES.length)];

    try {
      await agent.post({
        text: replyText,
        reply: {
          root: note.uri,
          parent: note.uri,
        },
      });

      replied.add(note.uri);
      console.log(`✅ Replied to: ${note.uri}`);

    } catch (err) {
      console.error("Reply failed:", err.message);
    }
  }
}

// ===== MAIN LOOP =====
async function runBot() {

  // 🔐 Safety check
  if (!process.env.BSKY_PASSWORD) {
    throw new Error("Missing BSKY_PASSWORD environment variable");
  }

  await agent.login({
    identifier: 'Deltarisingfdn.bsky.social',
    password: process.env.BSKY_PASSWORD,
  });

  console.log("🚀 Bot running...");

  while (true) {
    try {
      await checkMentions();
    } catch (error) {
      console.error("Error:", error.message);
    }

    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

runBot();