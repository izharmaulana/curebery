import { Router } from "express";
import webpush from "web-push";

const router = Router();

webpush.setVapidDetails(
  "mailto:admin@curebery.my.id",
  process.env.VAPID_PUBLIC!,
  process.env.VAPID_PRIVATE!
);

const subscriptions: Map<string, webpush.PushSubscription> = new Map();

router.get("/vapid-public-key", (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC });
});

router.post("/subscribe", (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: "Invalid subscription" });
  subscriptions.set(subscription.endpoint, subscription);
  res.json({ ok: true });
});

router.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) subscriptions.delete(endpoint);
  res.json({ ok: true });
});

router.post("/send", async (req, res) => {
  const { title, body, url, tag } = req.body;
  const payload = JSON.stringify({ title, body, url, tag });
  const results = await Promise.allSettled(
    Array.from(subscriptions.values()).map(sub =>
      webpush.sendNotification(sub, payload)
    )
  );
  res.json({ sent: results.filter(r => r.status === "fulfilled").length });
});

export { subscriptions };
export default router;