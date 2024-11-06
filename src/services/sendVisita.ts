import {VisitaType} from '../components/modules/sales/SaleDetails/SaleDetails';
import {openDatabase} from '../sqlite/connection';
import api from './api';

export interface VisitaLocal {
  ID: string;
  CLIENTE_ID: number;
  COBRADOR: string;
  COBRADOR_ID: number;
  FECHA: string;
  FORMA_COBRO_ID: number;
  LAT: number;
  LNG: number;
  NOTA?: string;
  TIPO_VISITA: string;
  ZONA_CLIENTE_ID: number;
  IMPTE_DOCTO_CC_ID: number | null;
}

const sendVisita = async (
  visita: VisitaLocal,
  insertInLocalDB: boolean = true,
  tipoVisita: VisitaType,
  DOCTO_CC_ACR_ID?: number,
): Promise<string> => {
  const db = await openDatabase();

  if (insertInLocalDB) {
    const sql = `
        INSERT INTO visitas (ID, CLIENTE_ID, COBRADOR, COBRADOR_ID, FECHA, FORMA_COBRO_ID, LAT, LNG, NOTA, TIPO_VISITA, ZONA_CLIENTE_ID, IMPTE_DOCTO_CC_ID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      visita.ID,
      visita.CLIENTE_ID,
      visita.COBRADOR,
      visita.COBRADOR_ID,
      visita.FECHA,
      visita.FORMA_COBRO_ID,
      visita.LAT,
      visita.LNG,
      visita.NOTA,
      visita.TIPO_VISITA,
      visita.ZONA_CLIENTE_ID,
      visita.IMPTE_DOCTO_CC_ID,
    ];
    await db.executeSql(sql, values);

    let typeVisita = '';

    if (tipoVisita === 'No se encontraba') {
      typeVisita = 'VOLVER VISITAR';
    } else if (tipoVisita === 'No va a dar pago') {
      typeVisita = 'NO PAGADO';
    } else if (tipoVisita === 'Se esconde y no sale') {
      typeVisita = 'VOLVER VISITAR';
    }

    const sqlUpdate = `
      UPDATE ventas
      SET
        ESTADO_COBRANZA = ?
      WHERE DOCTO_CC_ID = ?
    `;
    await db.executeSql(sqlUpdate, [typeVisita, DOCTO_CC_ACR_ID]);
  }

  await api.post('/visitas', visita, {
    timeout: 3000,
  });

  const sqlDelete = `DELETE FROM visitas WHERE ID = ?`;
  await db.executeSql(sqlDelete, [visita.ID]);

  return 'Visita enviada correctamente';
};

export default sendVisita;
