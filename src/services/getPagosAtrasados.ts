import {openDatabase} from '../sqlite/connection';

export interface PagosAtrasados {
  FECHA_ULT_PAGO: string;
  DOCTO_CC_ID: number;
  PARCIALIDADES_TRANSCURRIDAS: number;
  NUM_IMPORTES: number;
  NUM_PAGOS_ATRASADOS: number;
}

export default async (): Promise<PagosAtrasados[]> => {
  const db = await openDatabase();
  const query = `
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
            ELSE ((ventas.PARCIALIDADES_TRANSCURRIDAS * ventas.PARCIALIDAD - (ventas.PRECIO_TOTAL - ventas.SALDO_REST - ventas.ENGANCHE)) / ventas.PARCIALIDAD)
      END AS NUM_PAGOS_ATRASADOS,
      ventas.PARCIALIDAD
      FROM (
        SELECT
        ventas.DOCTO_CC_ID,
        ventas.CLIENTE,
        ventas.ENGANCHE,
        COALESCE(MAX(pagos.FECHA_HORA_PAGO), date('now')) AS FECHA_ULT_PAGO,
        COALESCE(COUNT(pagos.FECHA_HORA_PAGO), 0) AS NUM_IMPORTES,
        COALESCE(SUM(pagos.IMPORTE), 0) AS TOTAL_IMPORTE,
        ventas.FREC_PAGO,
        ventas.SALDO_REST,
        ventas.PRECIO_TOTAL,
        ventas.PARCIALIDAD,
        -- Calcular la diferencia de días en una subconsulta
        (JULIANDAY(CASE WHEN ventas.SALDO_REST = 0 THEN MAX(pagos.FECHA_HORA_PAGO) ELSE date('now') END) - 
        JULIANDAY(ventas.FECHA)) / CASE 
        WHEN ventas.FREC_PAGO = 'SEMANAL' THEN 7
        WHEN ventas.FREC_PAGO = 'QUINCENAL' THEN 15
        WHEN ventas.FREC_PAGO = 'MENSUAL' THEN 30
        ELSE 0
        END AS PARCIALIDADES_TRANSCURRIDAS
        FROM ventas
        LEFT JOIN pagos ON ventas.DOCTO_CC_ID = pagos.DOCTO_CC_ACR_ID
        GROUP BY ventas.DOCTO_CC_ID, ventas.FREC_PAGO
    ) AS ventas
    `;
  const [result] = await db.executeSql(query);
  const pagosAtrasados = result.rows.raw();
  return pagosAtrasados.map((v: any) => ({
    DOCTO_CC_ID: v.DOCTO_CC_ID,
    FECHA_ULT_PAGO: v.FECHA_ULT_PAGO,
    NUM_IMPORTES: v.NUM_IMPORTES,
    PARCIALIDADES_TRANSCURRIDAS: v.PARCIALIDADES_TRANSCURRIDAS,
    NUM_PAGOS_ATRASADOS: v.NUM_PAGOS_ATRASADOS,
  }));
};
