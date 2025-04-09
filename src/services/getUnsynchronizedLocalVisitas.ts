import {openDatabase} from '../sqlite/connection';
import {VisitaLocal} from './sendVisita';

export const getUnsynchronizedLocalVisitas = async (): Promise<
  VisitaLocal[]
> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();
      const query = `
        SELECT *
        FROM visitas
        WHERE GUARDADO_EN_MICROSIP = ?
      `;
      const [result] = await db.executeSql(query, [0]);
      const pagos = result.rows.raw();
      resolve(pagos);
    } catch (error) {
      reject(error);
    }
  });
};
