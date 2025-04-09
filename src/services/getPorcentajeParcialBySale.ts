import {openDatabase} from '../sqlite/connection';

export interface PorcentajeParcialBySale {
  DOCTO_CC_ID: number;
  CLIENTE: string;
  FECHA_ULT_PAGO: string;
  NUM_IMPORTES: number;
  TOTAL_IMPORTE: number;
  FREC_PAGO: string;
  PARCIALIDADES_TRANSCURRIDAS: number;
  NUM_PAGOS_ATRASADOS: number;
  PARCIALIDAD: number;
}

const getPorcentajeParcialBySale = async (
  saleId: number,
): Promise<PorcentajeParcialBySale> => {
  const db = await openDatabase();
  const [rows] = await db.executeSql(`
      SELECT
        ventas.DOCTO_CC_ID,
        ventas.CLIENTE,
        ventas.FECHA_ULT_PAGO,
        ventas.NUM_IMPORTES,
        ventas.TOTAL_IMPORTE,
        ventas.FREC_PAGO,
        ventas.PARCIALIDADES_TRANSCURRIDAS,
        CASE 
        WHEN ((ventas.PARCIALIDADES_TRANSCURRIDAS * ventas.PARCIALIDAD - (ventas.PRECIO_TOTAL - ventas.SALDO_REST)) / ventas.PARCIALIDAD) > (ventas.SALDO_REST / ventas.PARCIALIDAD)
        THEN (ventas.SALDO_REST / ventas.PARCIALIDAD)
              ELSE ((ventas.PARCIALIDADES_TRANSCURRIDAS * ventas.PARCIALIDAD - (ventas.PRECIO_TOTAL - ventas.SALDO_REST- ventas.ENGANCHE)) / ventas.PARCIALIDAD)
        END AS NUM_PAGOS_ATRASADOS,
        ventas.PARCIALIDAD
      FROM (
        SELECT
        ventas.DOCTO_CC_ID,
        ventas.CLIENTE,
        COALESCE(MAX(pagos.FECHA_HORA_PAGO), date('now')) AS FECHA_ULT_PAGO,
        COALESCE(COUNT(pagos.FECHA_HORA_PAGO), 0) AS NUM_IMPORTES,
        COALESCE(SUM(pagos.IMPORTE), 0) AS TOTAL_IMPORTE,
        ventas.FREC_PAGO,
        ventas.SALDO_REST,
        ventas.PRECIO_TOTAL,
        ventas.PARCIALIDAD,
        ventas.ENGANCHE,
        (JULIANDAY(CASE WHEN ventas.SALDO_REST = 0 THEN MAX(pagos.FECHA_HORA_PAGO) ELSE date('now') END) - 
        JULIANDAY(ventas.FECHA)) / CASE 
        WHEN ventas.FREC_PAGO = 'SEMANAL' THEN 7
        WHEN ventas.FREC_PAGO = 'QUINCENAL' THEN 15
        WHEN ventas.FREC_PAGO = 'MENSUAL' THEN 30
        ELSE 0
        END AS PARCIALIDADES_TRANSCURRIDAS
        FROM ventas
        LEFT JOIN pagos ON ventas.DOCTO_CC_ID = pagos.DOCTO_CC_ACR_ID
        WHERE ventas.DOCTO_CC_ID = '${saleId}'
        GROUP BY ventas.DOCTO_CC_ID, ventas.FREC_PAGO
      ) AS ventas
        `);

  return rows.rows.raw()[0];
};

export default getPorcentajeParcialBySale;
