import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNearbyNurses,
  loginPatient,
  loginNurse,
  updateNurseStatus,
  updateNurseLocation,
  LoginRequest
} from '@workspace/api-client-react';

export function useMockableLogin(role: 'patient' | 'nurse') {
  const loginFn = role === 'patient' ? loginPatient : loginNurse;

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      return await loginFn(data);
    }
  });
}

export function useMockableNearbyNurses(lat: number, lng: number, radius?: number) {
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

export function useMockableUpdateStatus() {
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

export function useMockableUpdateLocation() {
  return useMutation({
    mutationFn: async (data: { lat: number, lng: number }) => {
      return await updateNurseLocation(data);
    }
  });
}
