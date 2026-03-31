import { Router, type IRouter } from "express";
import { db, messagesTable, connectionsTable } from "@workspace/db";
import { eq, and, gt, or } from "drizzle-orm";

const router: IRouter = Router();

router.get("/:connectionId", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      res.status(400).json({ error: "INVALID_INPUT", message: "connectionId tidak valid" });
      return;
    }

    const conn = await db.select().from(connectionsTable).where(eq(connectionsTable.id, connectionId)).limit(1);
    if (conn.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Koneksi tidak ditemukan" });
      return;
    }

    if (conn[0].patientUserId !== session.userId && conn[0].nurseUserId !== session.userId) {
      res.status(403).json({ error: "FORBIDDEN", message: "Tidak berhak mengakses" });
      return;
    }

    const sinceId = req.query.sinceId ? parseInt(req.query.sinceId as string) : 0;

    const rows = await db
      .select()
      .from(messagesTable)
      .where(
        sinceId > 0
          ? and(eq(messagesTable.connectionId, connectionId), gt(messagesTable.id, sinceId))
          : eq(messagesTable.connectionId, connectionId)
      )
      .orderBy(messagesTable.createdAt);

    res.json(rows.map(m => ({
      id: m.id,
      senderUserId: m.senderUserId,
      senderRole: m.senderRole,
      text: m.text,
      createdAt: m.createdAt,
    })));
  } catch (err) {
    req.log.error({ err }, "Get messages error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

router.post("/:connectionId", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      res.status(400).json({ error: "INVALID_INPUT", message: "connectionId tidak valid" });
      return;
    }

    const { text } = req.body;
    if (!text?.trim()) {
      res.status(400).json({ error: "INVALID_INPUT", message: "Pesan tidak boleh kosong" });
      return;
    }

    const conn = await db.select().from(connectionsTable).where(eq(connectionsTable.id, connectionId)).limit(1);
    if (conn.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Koneksi tidak ditemukan" });
      return;
    }

    const isPatient = conn[0].patientUserId === session.userId;
    const isNurse = conn[0].nurseUserId === session.userId;
    if (!isPatient && !isNurse) {
      res.status(403).json({ error: "FORBIDDEN", message: "Tidak berhak mengakses" });
      return;
    }

    const senderRole = isNurse ? "nurse" : "patient";

    const [msg] = await db.insert(messagesTable).values({
      connectionId,
      senderUserId: session.userId,
      senderRole,
      text: text.trim(),
    }).returning();

    res.status(201).json({
      id: msg.id,
      senderUserId: msg.senderUserId,
      senderRole: msg.senderRole,
      text: msg.text,
      createdAt: msg.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Send message error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

export default router;
