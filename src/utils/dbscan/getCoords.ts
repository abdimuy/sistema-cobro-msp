import {DBSCAN} from 'density-clustering';

export type Coords = number[][];

export const getCoords = (
  coords: Coords,
  currentPosition: {lat: number; lng: number},
) => {
  const dbscan = new DBSCAN();
  const clusters = dbscan.run(coords, 0.001, 2);
  const outliers = dbscan.noise;

  const coordsByCluster = clusters.map(cluster =>
    cluster.map(index => coords[index]),
  );

  if (coordsByCluster.length === 0) {
    return {
      coordsByCluster,
      outliers,
      centroid: {LAT: 0, LNG: 0},
      distanceToCurrentPosition: 1000000,
    };
  }
  const centroid = getCentroid(coordsByCluster[0]);

  const distanceToCurrentPosition = calculateDistance(
    centroid.LAT,
    centroid.LNG,
    currentPosition.lat,
    currentPosition.lng,
  );

  return {coordsByCluster, outliers, centroid, distanceToCurrentPosition};
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const toRad = (x: number) => (x * Math.PI) / 180; // Convertir grados a radianes
  const R = 6371; // Radio de la Tierra en km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c * 1000; // Distancia en metros
  return distancia;
};

const calcularDistanciaEuclidiana = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  return Math.sqrt(dLat * dLat + dLon * dLon) * 111; // 1 grado ≈ 111 km en longitud y latitud
};

function getCentroid(coords: Coords) {
  if (coords.length === 0) {
    return {LAT: 0, LNG: 0};
  }
  const x = coords.reduce(
    (acc, coord) => {
      acc.LAT += coord[0];
      acc.LNG += coord[1];
      return acc;
    },
    {LAT: 0, LNG: 0},
  );

  return {
    LAT: x.LAT / coords.length,
    LNG: x.LNG / coords.length,
  };
}
