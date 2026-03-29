import { NursePublicProfile } from "@workspace/api-client-react";

export const DUMMY_NURSES: NursePublicProfile[] = [
  { 
    id: 1, 
    name: "Siti Rahayu, S.Kep", 
    strNumber: "STR-2024-001234", 
    specialization: "Perawat Umum", 
    isOnline: true, 
    rating: 4.8, 
    distanceKm: 0.8, 
    lat: -6.2000, 
    lng: 106.8400, 
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop" 
  },
  { 
    id: 2, 
    name: "Budi Santoso, S.Kep", 
    strNumber: "STR-2024-002567", 
    specialization: "Perawat ICU", 
    isOnline: true, 
    rating: 4.9, 
    distanceKm: 1.2, 
    lat: -6.2100, 
    lng: 106.8500, 
    avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop" 
  },
  { 
    id: 3, 
    name: "Dewi Anggraini, S.Kep", 
    strNumber: "STR-2024-003891", 
    specialization: "Perawat Anak", 
    isOnline: false, 
    rating: 4.7, 
    distanceKm: 1.8, 
    lat: -6.1950, 
    lng: 106.8350, 
    avatarUrl: "https://images.unsplash.com/photo-1594824436998-ddf106192bc9?w=150&h=150&fit=crop" 
  },
  { 
    id: 4, 
    name: "Ahmad Fauzi, S.Kep", 
    strNumber: "STR-2024-004123", 
    specialization: "Perawat Geriatri", 
    isOnline: true, 
    rating: 4.6, 
    distanceKm: 2.1, 
    lat: -6.2150, 
    lng: 106.8600, 
    avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&h=150&fit=crop" 
  },
  { 
    id: 5, 
    name: "Rina Kusuma, S.Kep", 
    strNumber: "STR-2024-005456", 
    specialization: "Perawat Umum", 
    isOnline: false, 
    rating: 4.5, 
    distanceKm: 2.8, 
    lat: -6.1900, 
    lng: 106.8480, 
    avatarUrl: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=150&h=150&fit=crop" 
  }
];

export const DEFAULT_PATIENT_LOCATION = { lat: -6.2088, lng: 106.8456 }; // Jakarta
