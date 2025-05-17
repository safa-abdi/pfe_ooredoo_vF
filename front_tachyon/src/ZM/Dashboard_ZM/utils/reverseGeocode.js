export async function reverseGeocode(lat, lng) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await response.json();
    return data.address?.state || data.address?.county || null;
  }
  