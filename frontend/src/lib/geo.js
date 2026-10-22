// Ubicación del dispositivo (M1, base para P6). La posición solo vive en la memoria de la pestaña: nunca
// se envía al backend ni se guarda en el navegador. La distancia se calcula aquí (haversine).

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

// Distancia en km entre dos puntos { lat, lng } sobre una esfera (error < 0,5 % a escala de ciudad)
export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// "a 350 m" por debajo de 1 km; "a 1,8 km" hasta 10 km; "a 12 km" desde ahí
export function formatDistance(km) {
  if (km < 1) return `a ${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  const digits = km < 10 ? 1 : 0;
  return `a ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: digits }).format(km)} km`;
}

// Los navegadores solo dan la ubicación en contexto seguro (https o localhost)
export function canUseGeolocation({ isSecureContext, geolocation }) {
  return Boolean(isSecureContext && geolocation);
}

export const GEO_MESSAGES = {
  denied: 'No diste permiso para usar tu ubicación. Puedes activarlo en los ajustes del navegador; mientras tanto, todo funciona igual.',
  unavailable: 'No pudimos saber dónde estás. Revisa que la ubicación del celular esté encendida e inténtalo de nuevo.',
  timeout: 'Tu ubicación se demoró demasiado. Inténtalo de nuevo.',
};

// GeolocationPositionError: 1 permiso denegado, 2 no disponible, 3 tiempo agotado
export function geoErrorStatus(error) {
  if (error?.code === 1) return 'denied';
  if (error?.code === 3) return 'timeout';
  return 'unavailable';
}

const POSITION_OPTIONS = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 };

// Pide la posición una sola vez y devuelve el siguiente estado del hook. Solo se llama al tocar el botón.
export function locate(geolocation) {
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ status: 'granted', position: { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }, error: null }),
      (err) => {
        const status = geoErrorStatus(err);
        resolve({ status, position: null, error: GEO_MESSAGES[status] });
      },
      POSITION_OPTIONS,
    );
  });
}
