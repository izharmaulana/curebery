import { Router } from "express";
import webpush from "web-push";
import https from "https";
import http from "http";
(http.globalAgent as any).family = 4;
(https.globalAgent as any).family = 4;
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

webpush.setVapidDetails(
  "mailto:admin@curebery.my.id",
  process.env.VAPID_PUBLIC!,
  process.env.VAPID_PRIVATE!
);

router.get("/vapid-public-key", (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC });
});

router.post("/subscribe", async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: "Invalid subscription" });
  const session = req.session as any;
  const userId = session?.userId ?? 0;
  const p256dh = subscription.keys?.p256dh ?? "";
  const auth = subscription.keys?.auth ?? "";
  await db.execute(sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (${userId}, ${subscription.endpoint}, ${p256dh}, ${auth})
    ON CONFLICT (endpoint) DO UPDATE SET user_id = ${userId}, p256dh = ${p256dh}, auth = ${auth}
  `);
  res.json({ ok: true });
});

router.post("/unsubscribe", async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`);
  }
  res.json({ ok: true });
});

router.post("/send", async (req, res) => {
  const { title, body, url, tag, userId } = req.body;
  const payload = JSON.stringify({ title, body, url, tag });
  let result: any;
  if (userId) {
    result = await db.execute(sql`SELECT * FROM push_subscriptions WHERE user_id = ${userId}`);
  } else {
    result = await db.execute(sql`SELECT * FROM push_subscriptions`);
  }
  const rows: any[] = Array.isArray(result) ? result : (result.rows ?? []);
  req.log.info({ rowCount: rows.length }, "push send: rows found");
  const results = await Promise.allSettled(
    rows.map((row: any) =>
      webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload
      )
    )
  );
  await Promise.all(
    results.map(async (r, i) => {
      if (r.status === "rejected") {
        const err = (r as any).reason;
        req.log.error({ raw: String(err), keys: JSON.stringify(Object.keys(err||{})), statusCode: err?.statusCode, code: err?.code, body: err?.body, endpoint: rows[i].endpoint?.slice(0,60) }, "push failed");
        if (err?.statusCode === 410) {
          await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${rows[i].endpoint}`);
        }
      }
    })
  );
  res.json({ sent: results.filter(r => r.status === "fulfilled").length });
});

export default router;