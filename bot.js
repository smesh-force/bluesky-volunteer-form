require('dotenv').config();
const { BskyAgent } = require('@atproto/api');
const express = require("express");

const agent = new BskyAgent({
  service: 'https://bsky.social',
});

// ===== CONFIG =====
const FORM_LINK = 'https://smesh-force.github.io/bluesky-volunteer-form/';
const KEYWORDS = ['volunteer', 'help', 'support', 'donate', 'join', 'love', 'nice'];
const CHECK_INTERVAL = 2 * 60 * 1000; // 🔁 every 2 minutes (faster testing)

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
  console.log("🔍 Checking mentions...");

  const notifications = await agent.listNotifications();

  console.log(`📩 Found ${notifications.data.notifications.length} notifications`);

  for (const note of notifications.data.notifications) {
    if (note.reason !== 'mention') continue;
    if (replied.has(note.uri)) continue;

    const text = note.record?.text?.toLowerCase() || '';
    console.log("📝 Text:", text);

    const matched = KEYWORDS.some(word => text.includes(word));
    if (!matched) continue;

    const replyText = REPLIES[Math.floor(Math.random() * REPLIES.length)];

    try {
      await agent.post({
        text: replyText,
        reply: {
          root: { uri: note.uri, cid: note.cid },
          parent: { uri: note.uri, cid: note.cid },
        },
      });

      replied.add(note.uri);
      console.log(`✅ Replied to: ${note.uri}`);

    } catch (err) {
      console.error("❌ Reply failed:", err.message);
    }
  }
}

// ===== MAIN LOOP =====
async function runBot() {
  if (!process.env.BSKY_IDENTIFIER || !process.env.BSKY_PASSWORD) {
    throw new Error("Missing Bluesky credentials in Railway variables");
  }

  await agent.login({
    identifier: process.env.BSKY_IDENTIFIER,
    password: process.env.BSKY_PASSWORD,
  });

  console.log("🚀 Bot running...");

  while (true) {
    try {
      await checkMentions();
    } catch (error) {
      console.error("⚠️ Error:", error.message);
    }

    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

// ===== START BOT =====
runBot();

// ===== EXPRESS SERVER (for Railway) =====
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});