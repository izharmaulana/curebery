import { useState, useEffect, useRef } from "react";

interface GeoLocation {
  lat: number;
  lng: number;
}

interface GeolocationState {
  location: GeoLocation | null;
  loading: boolean;
  error: string | null;
  isGpsActive: boolean;
}

const FALLBACK = { lat: -6.2088, lng: 106.8456 }; // Jakarta

export function useGeolocation(fallback: GeoLocation = FALLBACK): GeolocationState & { location: GeoLocation } {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: true,
    error: null,
    isGpsActive: false,
  });

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ location: null, loading: false, error: "GPS tidak didukung browser ini", isGpsActive: false });
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        loading: false,
        error: null,
        isGpsActive: true,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      let msg = "Akses lokasi ditolak";
      if (err.code === err.TIMEOUT) msg = "GPS timeout";
      if (err.code === err.POSITION_UNAVAILABLE) msg = "Lokasi tidak tersedia";
      setState({ location: null, loading: false, error: msg, isGpsActive: false });
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    location: state.location ?? fallback,
  };
}
