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
        `;
      const [result] = await db.executeSql(query);
      const pagos = result.rows.raw();
      resolve(pagos);
    } catch (error) {
      reject(error);
    }
  });
};
