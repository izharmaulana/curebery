import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNearbyNurses,
  loginPatient,
  loginNurse,
  updateNurseStatus,
  updateNurseLocation,
  LoginRequest
} from '@workspace/api-client-react';

export function useLogin(role: 'patient' | 'nurse') {
  const loginFn = role === 'patient' ? loginPatient : loginNurse;
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      return await loginFn(data);
    }
  });
}

export function useNearbyNurses(lat: number, lng: number, radius?: number) {
  return useQuery({
    queryKey: ['nurses', 'nearby', lat, lng, radius],
    queryFn: async () => {
      try {
        return await getNearbyNurses({ lat, lng, radius });
      } catch {
        return [];
      }
    },
    staleTime: 15000,
    refetchInterval: 20000,
  });
}

export function useUpdateNurseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { isOnline: boolean }) => {
      return await updateNurseStatus(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    }
  });
}

export function useUpdateNurseLocation() {
  return useMutation({
    mutationFn: async (data: { lat: number, lng: number }) => {
      return await updateNurseLocation(data);
    }
  });
}

export interface PatientConnectionHistory {
  id: number;
  nurseUserId: number;
  nurseName: string | null;
  nurseSpec: string | null;
  status: string;
  orderStatus: string;
  ratingGiven: number | null;
  reviewText: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function usePatientHistory() {
  return useQuery({
    queryKey: ['patient', 'history'],
    queryFn: async (): Promise<PatientConnectionHistory[]> => {
      const res = await fetch('/api/connections/patient-history', { credentials: 'include' });
      if (!res.ok) throw new Error('Gagal memuat riwayat');
      return res.json();
    },
    staleTime: 30000,
  });
}
