import {PagoServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';

export default async function getPagoLocal(pagoId: string) {
  const db = await openDatabase();
  const query = `
        SELECT *
        FROM pagos
        WHERE ID = '${pagoId}'
    `;
  const [response] = await db.executeSql(query);
  const pago: PagoServer = response.rows.raw()[0];
  return pago;
}
