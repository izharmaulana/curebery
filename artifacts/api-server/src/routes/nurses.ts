import { Router, type IRouter } from "express";
import { db, usersTable, nursesTable } from "@workspace/db";
import { GetNearbyNursesQueryParams, GetNearbyNursesResponse, UpdateNurseLocationBody, UpdateNurseLocationResponse, UpdateNurseStatusBody, UpdateNurseStatusResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get("/nearby", async (req, res) => {
  try {
    const params = GetNearbyNursesQueryParams.parse(req.query);
    const radiusKm = params.radius ?? 10;

  const rows = await db
    .select({
      id: nursesTable.id,
      userId: nursesTable.userId,
      name: usersTable.name,
      strNumber: nursesTable.strNumber,
      specialization: nursesTable.specialization,
      isOnline: nursesTable.isOnline,
      rating: nursesTable.rating,
      lat: nursesTable.lat,
      lng: nursesTable.lng,
      avatarUrl: nursesTable.avatarUrl,
      totalPatients: nursesTable.totalPatients,
      yearsExperience: nursesTable.yearsExperience,
    })
    .from(nursesTable)
    .innerJoin(usersTable, eq(nursesTable.userId, usersTable.id))
    .where(eq(nursesTable.isOnline, true));

    const nursesWithDistance = rows
      .map(nurse => {
        if (nurse.lat == null || nurse.lng == null) return null;

        return {
          ...nurse,
          avatarUrl: nurse.avatarUrl ?? undefined,
          distanceKm: Math.round(
            calcDistance(params.lat, params.lng, nurse.lat, nurse.lng) * 10
          ) / 10,
        };
      })
      .filter(nurse => nurse !== null)

    const response = GetNearbyNursesResponse.parse(nursesWithDistance);
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Get nearby nurses error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Parameter tidak valid" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const rows = await db
      .select({
        id: nursesTable.id,
        strNumber: nursesTable.strNumber,
        specialization: nursesTable.specialization,
        isOnline: nursesTable.isOnline,
        rating: nursesTable.rating,
        totalPatients: nursesTable.totalPatients,
        yearsExperience: nursesTable.yearsExperience,
        phone: nursesTable.phone,
        address: nursesTable.address,
        bio: nursesTable.bio,
        services: nursesTable.services,
        avatarUrl: nursesTable.avatarUrl,
        name: usersTable.name,
      })
      .from(nursesTable)
      .innerJoin(usersTable, eq(nursesTable.userId, usersTable.id))
      .where(eq(nursesTable.userId, session.userId))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Profil perawat tidak ditemukan" });
      return;
    }

    const nurse = rows[0];
    res.json({
      ...nurse,
      services: nurse.services ? JSON.parse(nurse.services) : [],
    });
  } catch (err) {
    req.log.error({ err }, "Get nurse profile error");
    res.status(500).json({ error: "SERVER_ERROR", message: "Gagal memuat profil" });
  }
});

router.put("/me/profile", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const { name, phone, address, specialization, bio, services, avatarUrl } = req.body;

    const nurses = await db.select().from(nursesTable).where(eq(nursesTable.userId, session.userId)).limit(1);
    if (nurses.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Profil perawat tidak ditemukan" });
      return;
    }

    await db.update(nursesTable)
      .set({
        specialization: specialization || nurses[0].specialization,
        phone: phone || null,
        address: address || null,
        bio: bio || null,
        services: services ? JSON.stringify(services) : null,
        avatarUrl: avatarUrl || nurses[0].avatarUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(nursesTable.userId, session.userId));

    if (name) {
      await db.update(usersTable)
        .set({ name })
        .where(eq(usersTable.id, session.userId));
    }

    req.log.info({ userId: session.userId }, "Nurse profile updated");
    res.json({ success: true, message: "Profil berhasil disimpan" });
  } catch (err) {
    req.log.error({ err }, "Update nurse profile error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Gagal menyimpan profil" });
  }
});

router.put("/me/location", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const body = UpdateNurseLocationBody.parse(req.body);

    const nurses = await db.select().from(nursesTable).where(eq(nursesTable.userId, session.userId)).limit(1);
    if (nurses.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Profil perawat tidak ditemukan" });
      return;
    }

    await db.update(nursesTable)
      .set({ lat: body.lat, lng: body.lng, updatedAt: new Date() })
      .where(eq(nursesTable.userId, session.userId));

    req.log.info({ userId: session.userId, lat: body.lat, lng: body.lng }, "Nurse location updated");
    const response = UpdateNurseLocationResponse.parse({ success: true, message: "Lokasi berhasil diperbarui" });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Update location error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid" });
  }
});

router.put("/me/status", async (req, res) => {
  try {
    const session = req.session as any;
    if (!session?.userId) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
      return;
    }

    const body = UpdateNurseStatusBody.parse(req.body);

    const nurses = await db.select().from(nursesTable).where(eq(nursesTable.userId, session.userId)).limit(1);
    if (nurses.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Profil perawat tidak ditemukan" });
      return;
    }

    await db.update(nursesTable)
      .set({ isOnline: body.isOnline, updatedAt: new Date() })
      .where(eq(nursesTable.userId, session.userId));

    req.log.info({ userId: session.userId, isOnline: body.isOnline }, "Nurse status updated");
    const response = UpdateNurseStatusResponse.parse({ success: true, message: "Status berhasil diperbarui" });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Update status error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid" });
  }
});

export default router;
