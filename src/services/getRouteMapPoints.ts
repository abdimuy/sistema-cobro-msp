import {Dayjs} from 'dayjs';
import {openDatabase} from '../sqlite/connection';

export interface RouteMapPoint {
  LAT: number;
  LNG: number;
  CLIENTE: string;
  CALLE: string;
  SALDO_REST: string;
  FECHA_HORA_PAGO: string;
  DOCTO_CC_ID: string;
}

const getRouteMapPoints = async (dateInit: Dayjs, dateEnd: Dayjs) => {
  const db = await openDatabase();
  const query = `
          SELECT
              pagos.DOCTO_CC_ID,
              pagos.LAT,
              pagos.LNG,
              ventas.CLIENTE,
              ventas.CALLE,
              ventas.ESTADO,
              ventas.SALDO_REST,
              pagos.FECHA_HORA_PAGO
          FROM pagos
          INNER JOIN ventas ON ventas.DOCTO_CC_ID = pagos.DOCTO_CC_ACR_ID
          WHERE pagos.FECHA_HORA_PAGO >= ? AND pagos.FECHA_HORA_PAGO <= ?
            AND pagos.LAT != 0 AND pagos.LNG != 0
          ORDER BY FECHA_HORA_PAGO ASC
      `;

  const [result] = await db.executeSql(query, [
    dateInit.toISOString(),
    dateEnd.toISOString(),
  ]);
  console.log({result});

  const points = result.rows.raw() as RouteMapPoint[];

  return points;
};

export default getRouteMapPoints;
