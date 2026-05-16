import { Router } from "express";
const admin = require("firebase-admin");
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
const fs = require("fs");

const router = Router();

if (!admin.apps.length) {
  const sa = JSON.parse(fs.readFileSync("/home/curebery/curebery/firebase-service-account.json", "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

router.get("/vapid-public-key", (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC });
});
router.post("/subscribe", async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: "Invalid token" });
  const session = req.session as any;
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
  let result: any;
  if (userId) {
    result = await db.execute(sql`SELECT * FROM push_subscriptions WHERE user_id = ${userId}`);
  } else {
    result = await db.execute(sql`SELECT * FROM push_subscriptions`);
  }
  const rows: any[] = Array.isArray(result) ? result : (result.rows ?? []);
  req.log.info({ rowCount: rows.length }, "push send: rows found");
  const results = await Promise.allSettled(
    rows.map((row: any) => admin.messaging().send({
      token: row.endpoint,
      notification: { title, body },
      webpush: { notification: { title, body, icon: "/favicon.svg", badge: "/favicon.svg", tag }, fcmOptions: { link: url || "/" } },
    }))
  );
  await Promise.all(results.map(async (r, i) => {
    if (r.status === "rejected") {
      req.log.error({ reason: String((r as any).reason) }, "push failed");
      await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${rows[i].endpoint}`);
    }
  }));
  res.json({ sent: results.filter(r => r.status === "fulfilled").length });
});

export default router;
