import {PagoServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';

export default async function getPagoLocal(pagoId: number) {
  const db = await openDatabase();
  const query = `
        SELECT *
        FROM pagos
        WHERE DOCTO_CC_ID = ${pagoId}
    `;
  const [response] = await db.executeSql(query);
  const pago: PagoServer = response.rows.raw()[0];
  console.log('pago query', pago);
  return pago;
}
