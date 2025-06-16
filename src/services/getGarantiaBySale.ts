import {openDatabase} from '../sqlite/connection';
import {GarantiaRecord} from './garantiaService';

export async function getGarantiaBySale(
  saleId: number,
): Promise<GarantiaRecord | null> {
  const db = await openDatabase();
  const [rows] = await db.executeSql(
    `SELECT * FROM garantias WHERE DOCTO_CC_ID = ? LIMIT 1;`,
    [saleId],
  );

  if (rows.rows.length > 0) {
    return rows.rows.raw()[0] as GarantiaRecord;
  }

  return null;
}
