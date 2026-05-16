const { Router } = require("express");
const axios = require("axios");
const fs = require("fs");
const https = require("https");
const { db } = require("@workspace/db");
const { sql } = require("drizzle-orm");

const router = Router();
const sa = JSON.parse(fs.readFileSync("/home/curebery/curebery/firebase-service-account.json", "utf8"));

const axiosIPv4 = axios.create({
  httpsAgent: new https.Agent({ family: 4 })
});

async function getFCMToken() {
  const jwt = require("jsonwebtoken");
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: sa.client_email, sub: sa.client_email, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600, scope: "https://www.googleapis.com/auth/firebase.messaging" };
  const token = jwt.sign(payload, sa.private_key, { algorithm: "RS256" });
  const res = await axiosIPv4.post("https://oauth2.googleapis.com/token", { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: token }, { headers: { "Content-Type": "application/json" } });
  return res.data.access_token;
}
router.get("/vapid-public-key", (req, res) => { res.json({ key: process.env.VAPID_PUBLIC }); });

router.post("/subscribe", async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: "Invalid token" });
  const session = req.session;
  const userId = session?.userId ?? 0;
  await db.execute(sql`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (${userId}, ${fcmToken}, '', '') ON CONFLICT (endpoint) DO UPDATE SET user_id = ${userId}`);
  res.json({ ok: true });
});

router.post("/unsubscribe", async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`);
  res.json({ ok: true });
});
router.post("/send", async (req, res) => {
  const { title, body, url, tag, userId } = req.body;
  let result;
  if (userId) {
    result = await db.execute(sql`SELECT * FROM push_subscriptions WHERE user_id = ${userId}`);
  } else {
    result = await db.execute(sql`SELECT * FROM push_subscriptions`);
  }
  const rows = Array.isArray(result) ? result : (result.rows ?? []);
  req.log.info({ rowCount: rows.length }, "push send: rows found");
  try {
    const accessToken = await getFCMToken();
    const results = await Promise.allSettled(
      rows.map((row) => axiosIPv4.post(
        `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
        { message: { token: row.endpoint, notification: { title, body }, webpush: { fcmOptions: { link: url || "/" } } } },
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
      ))
    );
    const sent = results.filter(r => r.status === "fulfilled").length;
    req.log.info({ sent }, "push sent");
    res.json({ sent });
  } catch(e) {
    req.log.error({ err: String(e) }, "push send error");
    res.json({ sent: 0 });
  }
});

export default router;
