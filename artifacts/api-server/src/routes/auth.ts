import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { LoginPatientBody, LoginNurseBody, LoginPatientResponse, LoginNurseResponse, GetCurrentUserResponse, LogoutResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEMO_USERS = [
  { id: 1, email: "pasien@cureberry.id", password: "password123", name: "Budi Pratama", role: "patient" as const },
  { id: 2, email: "pasien2@cureberry.id", password: "password123", name: "Ani Wulandari", role: "patient" as const },
  { id: 3, email: "perawat1@cureberry.id", password: "password123", name: "Siti Rahayu, S.Kep", role: "nurse" as const },
  { id: 4, email: "perawat2@cureberry.id", password: "password123", name: "Budi Santoso, S.Kep", role: "nurse" as const },
];

router.post("/login/patient", (req, res) => {
  try {
    const body = LoginPatientBody.parse(req.body);
    const user = DEMO_USERS.find(u => u.email === body.email && u.password === body.password && u.role === "patient");

    if (!user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Email atau password salah" });
      return;
    }

    if (!req.session) {
      res.status(500).json({ error: "SESSION_ERROR", message: "Session tidak tersedia" });
      return;
    }

    (req.session as any).userId = user.id;
    (req.session as any).role = user.role;

    const response = LoginPatientResponse.parse({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: `demo-token-${user.id}`,
    });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Login patient error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid" });
  }
});

router.post("/login/nurse", (req, res) => {
  try {
    const body = LoginNurseBody.parse(req.body);
    const user = DEMO_USERS.find(u => u.email === body.email && u.password === body.password && u.role === "nurse");

    if (!user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Email atau password salah" });
      return;
    }

    if (!req.session) {
      res.status(500).json({ error: "SESSION_ERROR", message: "Session tidak tersedia" });
      return;
    }

    (req.session as any).userId = user.id;
    (req.session as any).role = user.role;

    const response = LoginNurseResponse.parse({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: `demo-token-${user.id}`,
    });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Login nurse error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid" });
  }
});

router.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      const response = LogoutResponse.parse({ success: true, message: "Logout berhasil" });
      res.json(response);
    });
  } else {
    const response = LogoutResponse.parse({ success: true, message: "Logout berhasil" });
    res.json(response);
  }
});

router.get("/me", (req, res) => {
  const session = req.session as any;
  if (!session?.userId) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Belum login" });
    return;
  }

  const user = DEMO_USERS.find(u => u.id === session.userId);
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
