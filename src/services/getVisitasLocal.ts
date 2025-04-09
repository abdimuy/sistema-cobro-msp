import {openDatabase} from '../sqlite/connection';
import {VisitaLocal} from './sendVisita';

const getVisitasLocal = (initDate: string = ''): Promise<VisitaLocal[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();
      const sql =
        initDate !== ''
          ? `
                SELECT
                  visitas.ID,
                  visitas.CLIENTE_ID,
                  visitas.COBRADOR,
                  visitas.COBRADOR_ID,
                  visitas.FECHA,
                  visitas.FORMA_COBRO_ID,
                  visitas.LAT,
                  visitas.LNG,
                  visitas.NOTA,
                  visitas.TIPO_VISITA,
                  visitas.ZONA_CLIENTE_ID,
                  visitas.IMPTE_DOCTO_CC_ID,
                  visitas.GUARDADO_EN_MICROSIP,
                  agg.CLIENTE AS NOMBRE_CLIENTE
                FROM visitas
                JOIN (
                  SELECT
                    CLIENTE_ID,
                    MIN(CLIENTE) AS CLIENTE
                  FROM ventas
                  GROUP BY CLIENTE_ID
                ) AS agg ON agg.CLIENTE_ID = visitas.CLIENTE_ID
                WHERE visitas.FECHA >= '${initDate}';
            `
          : `
                SELECT
                  visitas.ID,
                  visitas.CLIENTE_ID,
                  visitas.COBRADOR,
                  visitas.COBRADOR_ID,
                  visitas.FECHA,
                  visitas.FORMA_COBRO_ID,
                  visitas.LAT,
                  visitas.LNG,
                  visitas.NOTA,
                  visitas.TIPO_VISITA,
                  visitas.ZONA_CLIENTE_ID,
                  visitas.IMPTE_DOCTO_CC_ID,
                  visitas.GUARDADO_EN_MICROSIP,
                  agg.CLIENTE AS NOMBRE_CLIENTE
                FROM visitas
                JOIN (
                  SELECT
                    CLIENTE_ID,
                    MIN(CLIENTE) AS CLIENTE
                  FROM ventas
                  GROUP BY CLIENTE_ID
                ) AS agg ON agg.CLIENTE_ID = visitas.CLIENTE_ID
            `;
      const [visitas] = await db.executeSql(sql);
      resolve(visitas.rows.raw());
    } catch (err) {
      reject(err);
    }
  });
};

export default getVisitasLocal;
