import { Router, type IRouter } from "express";
import { GetNearbyNursesQueryParams, GetNearbyNursesResponse, UpdateNurseLocationBody, UpdateNurseLocationResponse, UpdateNurseStatusBody, UpdateNurseStatusResponse, GetNurseProfileResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const DEMO_NURSES = [
  {
    id: 1,
    name: "Siti Rahayu, S.Kep",
    strNumber: "STR-2024-001234",
    specialization: "Perawat Umum",
    isOnline: true,
    rating: 4.8,
    lat: -6.2000,
    lng: 106.8400,
    totalPatients: 142,
    yearsExperience: 5,
  },
  {
    id: 2,
    name: "Budi Santoso, S.Kep",
    strNumber: "STR-2024-002567",
    specialization: "Perawat ICU",
    isOnline: true,
    rating: 4.9,
    lat: -6.2100,
    lng: 106.8500,
    totalPatients: 98,
    yearsExperience: 8,
  },
  {
    id: 3,
    name: "Dewi Anggraini, S.Kep",
    strNumber: "STR-2024-003891",
    specialization: "Perawat Anak",
    isOnline: false,
    rating: 4.7,
    lat: -6.1950,
    lng: 106.8350,
    totalPatients: 215,
    yearsExperience: 6,
  },
  {
    id: 4,
    name: "Ahmad Fauzi, S.Kep",
    strNumber: "STR-2024-004123",
    specialization: "Perawat Geriatri",
    isOnline: true,
    rating: 4.6,
    lat: -6.2150,
    lng: 106.8600,
    totalPatients: 87,
    yearsExperience: 4,
  },
  {
    id: 5,
    name: "Rina Kusuma, S.Kep",
    strNumber: "STR-2024-005456",
    specialization: "Perawat Umum",
    isOnline: false,
    rating: 4.5,
    lat: -6.1900,
    lng: 106.8480,
    totalPatients: 63,
    yearsExperience: 3,
  },
];

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get("/nearby", (req, res) => {
  try {
    const params = GetNearbyNursesQueryParams.parse(req.query);
    const radiusKm = params.radius ?? 3;

    const nursesWithDistance = DEMO_NURSES.map(nurse => {
      const distanceKm = calcDistance(params.lat, params.lng, nurse.lat, nurse.lng);
      return { ...nurse, distanceKm: Math.round(distanceKm * 10) / 10 };
    }).filter(nurse => nurse.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const response = GetNearbyNursesResponse.parse(nursesWithDistance);
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Get nearby nurses error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Parameter tidak valid" });
  }
});

router.put("/me/location", (req, res) => {
  try {
    const body = UpdateNurseLocationBody.parse(req.body);
    req.log.info({ body }, "Nurse location updated");
    const response = UpdateNurseLocationResponse.parse({ success: true, message: "Lokasi berhasil diperbarui" });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Update location error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid" });
  }
});

router.put("/me/status", (req, res) => {
  try {
    const body = UpdateNurseStatusBody.parse(req.body);
    req.log.info({ body }, "Nurse status updated");
    const response = UpdateNurseStatusResponse.parse({ success: true, message: "Status berhasil diperbarui" });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Update status error");
    res.status(400).json({ error: "INVALID_INPUT", message: "Data tidak valid" });
  }
});

router.get("/me/profile", (req, res) => {
  const nurse = DEMO_NURSES[0];
  const response = GetNurseProfileResponse.parse({
    ...nurse,
    email: "perawat1@cureberry.id",
  });
  res.json(response);
});

export default router;
