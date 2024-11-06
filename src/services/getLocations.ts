import {openDatabase} from '../sqlite/connection';

export interface CoordsSale {
  LAT: number;
  LNG: number;
  DOCTO_CC_ACR_ID: number;
}

export interface CoordsSaleGroup {
  [DOCTO_CC_ACR_ID: number]: CoordsSale[];
}

const getLocations = async (): Promise<CoordsSaleGroup> => {
  const db = await openDatabase();
  const [coords] = await db.executeSql(`
        SELECT 
            LAT,
            LNG,
            DOCTO_CC_ACR_ID
        FROM
            pagos
        WHERE
            LAT IS NOT NULL
            AND LNG IS NOT NULL
            AND LAT != 0
            AND LNG != 0
            AND LAT != ''
            AND LNG != ''
    `);

  const locations = coords.rows.raw() as CoordsSale[];

  const locationsBySale = locations.reduce((acc, location) => {
    if (acc[location.DOCTO_CC_ACR_ID]) {
      acc[location.DOCTO_CC_ACR_ID].push(location);
    } else {
      acc[location.DOCTO_CC_ACR_ID] = [location];
    }
    return acc;
  }, {} as CoordsSaleGroup);

  return locationsBySale;
};

export default getLocations;
