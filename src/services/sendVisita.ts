import {
  CASA_CERRADA,
  FUE_GROSERO,
  NO_RESPONDE,
  NO_SE_ENCONTRABA,
  NO_VA_A_DAR_PAGO,
  PIDE_REAGENDAR,
  SE_ESCONDE,
  SE_ESCUCHAN_RUIDOS,
  SOLO_MENORES,
  TIENE_PERO_NO_PAGA,
  VisitaType,
} from '../components/modules/sales/SaleDetails/SaleDetails';
import {openDatabase} from '../sqlite/connection';
import initializeApi from './api';

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
  sendToServer: boolean = true,
  diaVolverVisitar?: string,
): Promise<string> => {
  const startFunction = Date.now();
  const db = await openDatabase();
  console.log(
    `[sendVisita] Base de datos abierta en ${Date.now() - startFunction} ms`,
  );

  if (insertInLocalDB) {
    const startInsert = Date.now();
    const sql = `
        INSERT INTO visitas (ID, CLIENTE_ID, COBRADOR, COBRADOR_ID, FECHA, FORMA_COBRO_ID, LAT, LNG, NOTA, TIPO_VISITA, ZONA_CLIENTE_ID, IMPTE_DOCTO_CC_ID, GUARDADO_EN_MICROSIP)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      0,
    ];
    console.log(`[sendVisita] Iniciando inserción en DB local...`);
    await db.executeSql(sql, values);
    console.log(
      `[sendVisita] Inserción completada en ${Date.now() - startInsert} ms`,
    );

    const volverVisitar = [
      NO_SE_ENCONTRABA,
      CASA_CERRADA,
      SOLO_MENORES,
      SE_ESCONDE,
      NO_RESPONDE,
      SE_ESCUCHAN_RUIDOS,
      PIDE_REAGENDAR,
    ];

    const noPagado = [NO_VA_A_DAR_PAGO, TIENE_PERO_NO_PAGA, FUE_GROSERO];
    const isVolverVisitarEnFecha = [PIDE_REAGENDAR].includes(tipoVisita);
    let typeVisita = '';

    if (volverVisitar.includes(tipoVisita)) {
      typeVisita = 'VOLVER VISITAR';
    } else if (noPagado.includes(tipoVisita)) {
      typeVisita = 'NO PAGADO';
    }

    // Después de la inserción en DB local...
    const startUpdate = Date.now();
    if (isVolverVisitarEnFecha) {
      const sqlUpdate = `
        UPDATE ventas
        SET
          ESTADO_COBRANZA = ?,
          DIA_TEMPORAL_COBRANZA = ?
        WHERE DOCTO_CC_ID = ?
      `;
      console.log(`[sendVisita] Iniciando UPDATE (volverVisitar)...`);
      const startUpdateQuery = Date.now();
      await db.executeSql(sqlUpdate, [
        typeVisita,
        diaVolverVisitar,
        DOCTO_CC_ACR_ID,
      ]);
      console.log(
        `[sendVisita] UPDATE (volverVisitar) ejecutado en ${
          Date.now() - startUpdateQuery
        } ms`,
      );
    } else {
      const sqlUpdate = `
        UPDATE ventas
        SET
          ESTADO_COBRANZA = ?
        WHERE DOCTO_CC_ID = ?
      `;
      console.log(`[sendVisita] Iniciando UPDATE (no volverVisitar)...`);
      const startUpdateQuery = Date.now();
      await db.executeSql(sqlUpdate, [typeVisita, DOCTO_CC_ACR_ID]);
      console.log(
        `[sendVisita] UPDATE (no volverVisitar) ejecutado en ${
          Date.now() - startUpdateQuery
        } ms`,
      );
    }
    console.log(
      `[sendVisita] Total UPDATE en ventas completado en ${
        Date.now() - startUpdate
      } ms`,
    );
  }

  const api = await initializeApi();
  if (sendToServer) {
    const startApi = Date.now();
    console.log(
      `[sendVisita] Iniciando api.post para /visitas con timeout de 3000 ms...`,
    );
    await api.post('/visitas', visita, {
      timeout: 3000,
    });
    console.log(
      `[sendVisita] api.post completado en ${Date.now() - startApi} ms`,
    );

    const startDelete = Date.now();
    const sqlDelete = `
      UPDATE visitas
      SET
      GUARDADO_EN_MICROSIP = 1
      WHERE ID = ?
    `;
    console.log(
      `[sendVisita] Iniciando actualización local (borrado / marcado)...`,
    );
    await db.executeSql(sqlDelete, [visita.ID]);
    console.log(
      `[sendVisita] Actualización local completada en ${
        Date.now() - startDelete
      } ms`,
    );
  }

  const visitasRes = await db.executeSql(
    `SELECT COUNT(*) as count FROM visitas`,
  );
  const visitasCount = visitasRes[0].rows.item(0).count;
  console.log(`[sendVisita] Registros en visitas: ${visitasCount}`);

  const ventasRes = await db.executeSql(`SELECT COUNT(*) as count FROM ventas`);
  const ventasCount = ventasRes[0].rows.item(0).count;
  console.log(`[sendVisita] Registros en ventas: ${ventasCount}`);

  console.log(
    `[sendVisita] Función sendVisita completada en ${
      Date.now() - startFunction
    } ms`,
  );
  return 'Proceso terminado correctamente';
};

export default sendVisita;
