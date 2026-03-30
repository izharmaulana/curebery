import { Router, type IRouter } from "express";
import { db, usersTable, nursesTable } from "@workspace/db";
import { LoginPatientBody, LoginNurseBody, LoginPatientResponse, LoginNurseResponse, GetCurrentUserResponse, LogoutResponse, RegisterNurseBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

const hashPassword = (password: string) =>
  crypto.createHash("sha256").update(password + "curebery_salt_v1").digest("hex");

const DEFAULT_LAT = -6.2088;
const DEFAULT_LNG = 106.8456;

router.post("/register/patient", async (req, res) => {
  try {
    const { name, email, password, phone, birthDate, gender } = req.body;

    if (!name || !email || !password || !phone || !birthDate || !gender) {
      res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak lengkap, pastikan semua field wajib terisi" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "EMAIL_EXISTS", message: "Email sudah terdaftar, silakan gunakan email lain" });
      return;
    }

    const [newUser] = await db.insert(usersTable).values({
      email,
      passwordHash: hashPassword(password),
      name,
      role: "patient",
    }).returning();

    (req.session as any).userId = newUser.id;
    (req.session as any).role = newUser.role;

    req.log.info({ userId: newUser.id, email }, "Patient registered");

    res.status(201).json({
      success: true,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      token: `token-${newUser.id}`,
    });
  } catch (err) {
    req.log.error({ err }, "Register patient error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid, periksa kembali semua field" });
  }
});

router.post("/register/nurse", async (req, res) => {
  try {
    const body = RegisterNurseBody.parse(req.body);

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, body.email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "EMAIL_EXISTS", message: "Email sudah terdaftar, silakan gunakan email lain" });
      return;
    }

    const [newUser] = await db.insert(usersTable).values({
      email: body.email,
      passwordHash: hashPassword(body.password),
      name: body.name,
      role: "nurse",
    }).returning();

    await db.insert(nursesTable).values({
      userId: newUser.id,
      strNumber: body.strNumber,
      specialization: body.specialization,
      isOnline: false,
      rating: 0,
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      totalPatients: 0,
      yearsExperience: body.yearsExperience ?? 0,
    });

    (req.session as any).userId = newUser.id;
    (req.session as any).role = newUser.role;

    req.log.info({ userId: newUser.id, email: body.email }, "Nurse registered");

    res.status(201).json({
      success: true,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      token: `token-${newUser.id}`,
    });
  } catch (err) {
    req.log.error({ err }, "Register nurse error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid, periksa kembali semua field" });
  }
});

router.post("/login/patient", async (req, res) => {
  try {
    const body = LoginPatientBody.parse(req.body);

    const users = await db.select().from(usersTable)
      .where(eq(usersTable.email, body.email))
      .limit(1);

    const user = users[0];
    if (!user || user.role !== "patient" || user.passwordHash !== hashPassword(body.password)) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Email atau password salah" });
      return;
    }

    (req.session as any).userId = user.id;
    (req.session as any).role = user.role;

    const response = LoginPatientResponse.parse({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: `token-${user.id}`,
    });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Login patient error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid" });
  }
});

router.post("/login/nurse", async (req, res) => {
  try {
    const body = LoginNurseBody.parse(req.body);

    const users = await db.select().from(usersTable)
      .where(eq(usersTable.email, body.email))
      .limit(1);

    const user = users[0];
    if (!user || user.role !== "nurse" || user.passwordHash !== hashPassword(body.password)) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Email atau password salah" });
      return;
    }

    (req.session as any).userId = user.id;
    (req.session as any).role = user.role;

    const response = LoginNurseResponse.parse({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: `token-${user.id}`,
    });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Login nurse error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid" });
  }
});

router.post("/logout", async (req, res) => {
  const session = req.session as any;
  if (session?.userId && session?.role === "nurse") {
    try {
      await db.update(nursesTable)
        .set({ isOnline: false, updatedAt: new Date() })
        .where(eq(nursesTable.userId, session.userId));
    } catch (err) {
      req.log.error({ err }, "Failed to set nurse offline on logout");
    }
  }
  if (req.session) {
    req.session.destroy(() => {
      const response = LogoutResponse.parse({ success: true, message: "Logout berhasil" });
      res.json(response);
    });
  } else {
    res.json({ success: true, message: "Logout berhasil" });
  }
});

router.get("/me", async (req, res) => {
  const session = req.session as any;
  if (!session?.userId) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "User tidak ditemukan" });
    return;
  }

  const response = GetCurrentUserResponse.parse({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  res.json(response);
});

export default router;
