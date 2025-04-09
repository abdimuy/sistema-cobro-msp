import {useEffect, useState} from 'react';
import {Coord, Coords, getCoords} from '../utils/dbscan/getCoords';

const useCalculateLocation = ({
  coords,
  currentPosition,
}: {
  coords: Coords;
  currentPosition: Coord;
}) => {
  const [res, setRes] = useState<{
    coordsByCluster: number[][][];
    distanceToCurrentPosition: number;
    outliers: number[];
    centroids: {LAT: number; LNG: number}[];
    centroid: Coord;
  }>({
    centroid: {lat: 0, lng: 0},
    coordsByCluster: [],
    distanceToCurrentPosition: 0,
    outliers: [],
    centroids: [],
  });

  useEffect(() => {
    const {
      centroid,
      coordsByCluster,
      distanceToCurrentPosition,
      outliers,
      centroids,
    } = getCoords(coords, currentPosition);
    setRes({
      centroid: {lat: centroid.LAT, lng: centroid.LNG},
      coordsByCluster,
      distanceToCurrentPosition,
      outliers,
      centroids: centroids || [],
    });
  }, [coords]);

  return res;
};

export default useCalculateLocation;
