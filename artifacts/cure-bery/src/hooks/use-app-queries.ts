import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getNearbyNurses, 
  loginPatient, 
  loginNurse,
  updateNurseStatus,
  updateNurseLocation,
  LoginRequest
} from '@workspace/api-client-react';
import { DUMMY_NURSES } from '@/lib/dummy-data';

// Wrap Login to provide mock data fallback if API fails
export function useMockableLogin(role: 'patient' | 'nurse') {
  const loginFn = role === 'patient' ? loginPatient : loginNurse;
  
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      try {
        return await loginFn(data);
      } catch (error) {
        console.warn(`[Mock] API failed for ${role} login, simulating success...`);
        // Simulate network delay
        await new Promise(r => setTimeout(r, 800));
        
        if (role === 'patient' && data.email === 'pasien@cureberry.id' && data.password === 'password123') {
          return { 
            success: true, 
            token: 'mock-token-patient', 
            user: { id: 1, name: 'Bapak Budi (Pasien)', email: data.email, role: 'patient' as const } 
          };
        }
        if (role === 'nurse' && data.email === 'perawat1@cureberry.id' && data.password === 'password123') {
          return { 
            success: true, 
            token: 'mock-token-nurse', 
            user: { id: 1, name: 'Siti Rahayu, S.Kep', email: data.email, role: 'nurse' as const } 
          };
        }
        throw new Error('Email atau password salah');
      }
    }
  });
}

// Wrap GetNearbyNurses to provide mock data
export function useMockableNearbyNurses(lat: number, lng: number, radius?: number) {
  return useQuery({
    queryKey: ['nurses', 'nearby', lat, lng, radius],
    queryFn: async () => {
      try {
        return await getNearbyNurses({ lat, lng, radius });
      } catch (error) {
        console.warn("[Mock] API failed for getNearbyNurses, using dummy data...");
        return DUMMY_NURSES;
      }
    },
    staleTime: 30000,
  });
}

export function useMockableUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { isOnline: boolean }) => {
      try {
        return await updateNurseStatus(data);
      } catch (error) {
        console.warn("[Mock] API failed for updateNurseStatus, simulating success...");
        await new Promise(r => setTimeout(r, 500));
        return { success: true, message: 'Status updated' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    }
  });
}

export function useMockableUpdateLocation() {
  return useMutation({
    mutationFn: async (data: { lat: number, lng: number }) => {
      try {
        return await updateNurseLocation(data);
      } catch (error) {
        console.warn("[Mock] API failed for updateNurseLocation, simulating success...");
        await new Promise(r => setTimeout(r, 500));
        return { success: true, message: 'Location updated' };
      }
    }
  });
}
