import { Router, type IRouter } from "express";
import { db, usersTable, nursesTable, connectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const { nurseProfileId } = req.body;
    if (!nurseProfileId) {
      res.status(400).json({ error: "INVALID_INPUT", message: "nurseProfileId diperlukan" });
      return;
    }

    const patient = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
    if (patient.length === 0 || patient[0].role !== "patient") {
      res.status(403).json({ error: "FORBIDDEN", message: "Hanya pasien yang bisa menghubungi perawat" });
      return;
    }

    const nurseRows = await db
      .select({ userId: nursesTable.userId, name: usersTable.name, specialization: nursesTable.specialization, isOnline: nursesTable.isOnline })
      .from(nursesTable)
      .innerJoin(usersTable, eq(nursesTable.userId, usersTable.id))
      .where(eq(nursesTable.id, nurseProfileId))
      .limit(1);

    if (nurseRows.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Perawat tidak ditemukan" });
      return;
    }

    if (!nurseRows[0].isOnline) {
      res.status(400).json({ error: "NURSE_OFFLINE", message: "Perawat sedang tidak online" });
      return;
    }

    const existing = await db
      .select()
      .from(connectionsTable)
      .where(and(
        eq(connectionsTable.patientUserId, session.userId),
        eq(connectionsTable.nurseUserId, nurseRows[0].userId),
        eq(connectionsTable.status, "pending")
      ))
      .limit(1);

    if (existing.length > 0) {
      res.json({ connectionId: existing[0].id });
      return;
    }

    const [connection] = await db.insert(connectionsTable).values({
      patientUserId: session.userId,
      nurseUserId: nurseRows[0].userId,
      nurseProfileId: nurseProfileId,
      status: "pending",
      patientName: patient[0].name,
      nurseName: nurseRows[0].name,
      nurseSpec: nurseRows[0].specialization,
    }).returning({ id: connectionsTable.id });

    req.log.info({ patientId: session.userId, nurseProfileId }, "Connection request created");
    res.status(201).json({ connectionId: connection.id });
  } catch (err) {
    req.log.error({ err }, "Create connection error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

router.get("/incoming", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    res.setHeader("Cache-Control", "no-store");

    const rows = await db
      .select()
      .from(connectionsTable)
      .where(and(
        eq(connectionsTable.nurseUserId, session.userId),
        eq(connectionsTable.status, "pending")
      ))
      .orderBy(connectionsTable.createdAt);

    res.json(rows.map(r => ({
      id: r.id,
      patientName: r.patientName,
      nurseSpec: r.nurseSpec,
      createdAt: r.createdAt,
    })));
  } catch (err) {
    req.log.error({ err }, "Get incoming connections error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "INVALID_INPUT", message: "ID tidak valid" });
      return;
    }

    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Koneksi tidak ditemukan" });
      return;
    }

    const conn = rows[0];
    if (conn.patientUserId !== session.userId && conn.nurseUserId !== session.userId) {
      res.status(403).json({ error: "FORBIDDEN", message: "Tidak berhak mengakses" });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.json({ id: conn.id, status: conn.status, patientName: conn.patientName, nurseName: conn.nurseName, nurseSpec: conn.nurseSpec });
  } catch (err) {
    req.log.error({ err }, "Get connection error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

router.put("/:id/accept", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const id = parseInt(req.params.id);
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Koneksi tidak ditemukan" });
      return;
    }

    if (rows[0].nurseUserId !== session.userId) {
      res.status(403).json({ error: "FORBIDDEN", message: "Hanya perawat yang bisa menerima" });
      return;
    }

    await db.update(connectionsTable)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(connectionsTable.id, id));

    req.log.info({ connectionId: id }, "Connection accepted");
    res.json({ success: true, connectionId: id });
  } catch (err) {
    req.log.error({ err }, "Accept connection error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

router.put("/:id/cancel", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const id = parseInt(req.params.id);
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Koneksi tidak ditemukan" });
      return;
    }

    if (rows[0].patientUserId !== session.userId) {
      res.status(403).json({ error: "FORBIDDEN", message: "Hanya pasien yang bisa membatalkan" });
      return;
    }

    if (rows[0].status !== "pending") {
      res.status(400).json({ error: "INVALID_STATE", message: "Hanya permintaan pending yang bisa dibatalkan" });
      return;
    }

    await db.update(connectionsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(connectionsTable.id, id));

    req.log.info({ connectionId: id }, "Connection cancelled by patient");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Cancel connection error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

router.put("/:id/reject", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const id = parseInt(req.params.id);
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Koneksi tidak ditemukan" });
      return;
    }

    if (rows[0].nurseUserId !== session.userId) {
      res.status(403).json({ error: "FORBIDDEN", message: "Hanya perawat yang bisa menolak" });
      return;
    }

    await db.update(connectionsTable)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(connectionsTable.id, id));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Reject connection error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Terjadi kesalahan" });
  }
});

router.put("/:id/order", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const session = req.session as any;
    if (!session?.userId) { res.status(401).json({ error: "UNAUTHORIZED" }); return; }
    const id = parseInt(req.params.id);
    const { lat, lng } = req.body;
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) { res.status(404).json({ error: "NOT_FOUND" }); return; }
    if (rows[0].patientUserId !== session.userId) { res.status(403).json({ error: "FORBIDDEN" }); return; }
    if (rows[0].status !== "accepted") { res.status(400).json({ error: "NOT_ACCEPTED" }); return; }
    await db.update(connectionsTable)
      .set({ orderStatus: "ordered", patientLat: lat ?? null, patientLng: lng ?? null, updatedAt: new Date() })
      .where(eq(connectionsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Place order error");
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

router.put("/:id/accept-order", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) { res.status(401).json({ error: "UNAUTHORIZED" }); return; }
    const id = parseInt(req.params.id);
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) { res.status(404).json({ error: "NOT_FOUND" }); return; }
    if (rows[0].nurseUserId !== session.userId) { res.status(403).json({ error: "FORBIDDEN" }); return; }
    await db.update(connectionsTable)
      .set({ orderStatus: "order_accepted", updatedAt: new Date() })
      .where(eq(connectionsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Accept order error");
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

router.put("/:id/reject-order", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) { res.status(401).json({ error: "UNAUTHORIZED" }); return; }
    const id = parseInt(req.params.id);
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) { res.status(404).json({ error: "NOT_FOUND" }); return; }
    if (rows[0].nurseUserId !== session.userId) { res.status(403).json({ error: "FORBIDDEN" }); return; }
    await db.update(connectionsTable)
      .set({ orderStatus: "order_rejected", updatedAt: new Date() })
      .where(eq(connectionsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Reject order error");
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

router.get("/:id/order-status", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const session = req.session as any;
    if (!session?.userId) { res.status(401).json({ error: "UNAUTHORIZED" }); return; }
    const id = parseInt(req.params.id);
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) { res.status(404).json({ error: "NOT_FOUND" }); return; }
    const conn = rows[0];
    if (conn.patientUserId !== session.userId && conn.nurseUserId !== session.userId) {
      res.status(403).json({ error: "FORBIDDEN" }); return;
    }
    res.json({
      orderStatus: conn.orderStatus,
      patientName: conn.patientName,
      nurseSpec: conn.nurseSpec,
      patientLat: conn.patientLat,
      patientLng: conn.patientLng,
    });
  } catch (err) {
    req.log.error({ err }, "Get order status error");
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

router.get("/:id/patient-location", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const session = req.session as any;
    if (!session?.userId) { res.status(401).json({ error: "UNAUTHORIZED" }); return; }
    const id = parseInt(req.params.id);
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) { res.status(404).json({ error: "NOT_FOUND" }); return; }
    const conn = rows[0];
    if (conn.patientUserId !== session.userId && conn.nurseUserId !== session.userId) {
      res.status(403).json({ error: "FORBIDDEN" }); return;
    }
    if (conn.patientLat == null || conn.patientLng == null) {
      res.status(404).json({ error: "NO_LOCATION" }); return;
    }
    res.json({ lat: conn.patientLat, lng: conn.patientLng });
  } catch (err) {
    req.log.error({ err }, "Get patient location error");
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

router.get("/:id/nurse-location", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    const id = parseInt(req.params.id);
    const rows = await db.select().from(connectionsTable).where(eq(connectionsTable.id, id)).limit(1);
    if (rows.length === 0) { res.status(404).json({ error: "NOT_FOUND" }); return; }
    const conn = rows[0];
    if (conn.patientUserId !== session.userId && conn.nurseUserId !== session.userId) {
      res.status(403).json({ error: "FORBIDDEN" }); return;
    }
    const nurseRows = await db
      .select({ lat: nursesTable.lat, lng: nursesTable.lng })
      .from(nursesTable)
      .where(eq(nursesTable.userId, conn.nurseUserId))
      .limit(1);
    if (nurseRows.length === 0 || nurseRows[0].lat == null || nurseRows[0].lng == null) {
      res.status(404).json({ error: "NO_LOCATION" }); return;
    }
    res.json({ lat: nurseRows[0].lat, lng: nurseRows[0].lng });
  } catch (err) {
    req.log.error({ err }, "Get nurse location error");
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

export default router;
