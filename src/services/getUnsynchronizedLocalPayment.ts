import {Dayjs} from 'dayjs';
import {PagoServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';
import {CONDONACION_ID} from '../components/modules/sales/SaleDetails/SaleDetails';

export const getUnsynchronizedLocalPayment = async (
  getAllPagos: boolean,
  fechaCargaInicial: Dayjs,
): Promise<PagoServer[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();
      let query = ``;
      if (getAllPagos) {
        query = `
          SELECT *
          FROM pagos
          WHERE FECHA_HORA_PAGO >= ?
          AND FORMA_COBRO_ID IN (157, 158, 52569, ${CONDONACION_ID})
          ORDER BY FECHA_HORA_PAGO ASC;
        `;
      } else {
        query = `
            SELECT *
            FROM pagos
            WHERE GUARDADO_EN_MICROSIP = ?
            ORDER BY FECHA_HORA_PAGO ASC;
          `;
      }
      const [result] = await db.executeSql(query, [
        getAllPagos ? fechaCargaInicial.toISOString() : 0,
      ]);
      const pagos = result.rows.raw();
      resolve(pagos);
    } catch (error) {
      reject(error);
    }
  });
};
