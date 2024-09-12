import {PagoServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';

export const getUnsynchronizedLocalPayment = async (): Promise<
  PagoServer[]
> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();
      const query = `
          SELECT *
          FROM pagos
          WHERE GUARDADO_EN_MICROSIP = 0
          ORDER BY FECHA_HORA_PAGO ASC;
        `;
      const [result] = await db.executeSql(query);
      const pagos = result.rows.raw();
      resolve(pagos);
    } catch (error) {
      reject(error);
    }
  });
};
