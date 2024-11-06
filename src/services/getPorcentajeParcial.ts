import {Dayjs} from 'dayjs';
import {openDatabase} from '../sqlite/connection';

const getPorcentajeParcial = async (fechaInit: Dayjs): Promise<number> => {
  const db = await openDatabase();
  const [rows] = await db.executeSql(`
    SELECT
      ventas.CLIENTE,
      CASE
        WHEN SUM(pagos.IMPORTE) / ventas.PARCIALIDAD > 1
        THEN (
          CASE WHEN ventas.NUM_PAGOS_ATRASADOS >=  SUM(pagos.IMPORTE) / ventas.PARCIALIDAD
          THEN  SUM(pagos.IMPORTE) / ventas.PARCIALIDAD
          ELSE 1
          END
        )
        ELSE SUM(pagos.IMPORTE) / ventas.PARCIALIDAD
      END AS PORCENTAJE
    FROM pagos
    INNER JOIN 
    (
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
            ELSE ((ventas.PARCIALIDADES_TRANSCURRIDAS * ventas.PARCIALIDAD - (ventas.PRECIO_TOTAL - ventas.SALDO_REST)) / ventas.PARCIALIDAD)
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
      ) AS ventas ON pagos.DOCTO_CC_ACR_ID = ventas.DOCTO_CC_ID
      WHERE pagos.FECHA_HORA_PAGO >= '${fechaInit.toISOString()}'
       GROUP BY pagos.DOCTO_CC_ACR_ID
        `);

  return rows.rows.raw().reduce((acc: number, row: any) => {
    return row.PORCENTAJE + acc;
  }, 0);
};

export default getPorcentajeParcial;
