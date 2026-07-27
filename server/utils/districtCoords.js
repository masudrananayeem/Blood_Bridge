// Approximate centre coordinates (lat, lng) for the 64 districts of Bangladesh.
// Used as a lightweight stand-in for real geocoding so we can rank donors /
// requests by "how close" they are to each other without needing an external
// maps/geocoding API key. Precision is district-level, not exact-address —
// good enough for "nearby" sorting and the emergency nearest-5-donors flow.
const districtCoords = {
  Bagerhat: [22.6602, 89.7895],
  Bandarban: [22.1953, 92.2184],
  Barguna: [22.0953, 90.1121],
  Barishal: [22.701, 90.3535],
  Bhola: [22.6859, 90.6485],
  Bogura: [24.8465, 89.377],
  Brahmanbaria: [23.9571, 91.1119],
  Chandpur: [23.2333, 90.6713],
  Chattogram: [22.3569, 91.7832],
  Chuadanga: [23.64, 88.8412],
  "Cox's Bazar": [21.4272, 92.0058],
  Cumilla: [23.4607, 91.1809],
  Dhaka: [23.8103, 90.4125],
  Dinajpur: [25.6279, 88.6332],
  Faridpur: [23.6071, 89.8429],
  Feni: [23.0159, 91.3976],
  Gaibandha: [25.3288, 89.5285],
  Gazipur: [23.9999, 90.4203],
  Gopalganj: [23.0050, 89.8266],
  Habiganj: [24.3745, 91.4155],
  Jamalpur: [24.9375, 89.9372],
  Jashore: [23.1667, 89.2167],
  Jhalokati: [22.6406, 90.1987],
  Jhenaidah: [23.5448, 89.1539],
  Joypurhat: [25.0968, 89.0227],
  Khagrachhari: [23.1193, 91.9847],
  Khulna: [22.8456, 89.5403],
  Kishoreganj: [24.4449, 90.7766],
  Kurigram: [25.8054, 89.6295],
  Kushtia: [23.901, 89.1204],
  Lakshmipur: [22.9433, 90.8281],
  Lalmonirhat: [25.9923, 89.2847],
  Madaripur: [23.1641, 90.1897],
  Magura: [23.4873, 89.4198],
  Manikganj: [23.8644, 90.0047],
  Meherpur: [23.7622, 88.6318],
  Moulvibazar: [24.4829, 91.7774],
  Munshiganj: [23.5422, 90.5305],
  Mymensingh: [24.7471, 90.4203],
  Naogaon: [24.7936, 88.9318],
  Narail: [23.1725, 89.5127],
  Narayanganj: [23.6238, 90.5], 
  Narsingdi: [23.9226, 90.7151],
  Natore: [24.4206, 88.9553],
  Nawabganj: [24.5965, 88.2775],
  Netrokona: [24.8829, 90.7276],
  Nilphamari: [25.9317, 88.856],
  Noakhali: [22.8696, 91.0995],
  Pabna: [23.9985, 89.2372],
  Panchagarh: [26.3411, 88.5541],
  Patuakhali: [22.3596, 90.3296],
  Pirojpur: [22.5841, 89.9720],
  Rajbari: [23.7574, 89.6444],
  Rajshahi: [24.3745, 88.6042],
  Rangamati: [22.7324, 92.2985],
  Rangpur: [25.7439, 89.2752],
  Satkhira: [22.7185, 89.0705],
  Shariatpur: [23.2423, 90.4348],
  Sherpur: [25.0204, 90.0155],
  Sirajganj: [24.4533, 89.7006],
  Sunamganj: [25.0658, 91.3950],
  Sylhet: [24.8949, 91.8687],
  Tangail: [24.2513, 89.9167],
  Thakurgaon: [26.0336, 88.4616],
};

export const getDistrictCoords = (district) => districtCoords[district] || null;

const toRad = (deg) => (deg * Math.PI) / 180;

// Haversine distance between two [lat, lng] points, in kilometres.
export const haversineKm = ([lat1, lng1], [lat2, lng2]) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Distance (km) between two district names' centre points, or null if either
// district is unknown / missing (e.g. custom text a user typed).
export const distanceBetweenDistricts = (districtA, districtB) => {
  if (!districtA || !districtB) return null;
  if (districtA === districtB) return 0;
  const a = getDistrictCoords(districtA);
  const b = getDistrictCoords(districtB);
  if (!a || !b) return null;
  return Math.round(haversineKm(a, b) * 10) / 10;
};

export default districtCoords;
