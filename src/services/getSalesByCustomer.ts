import {openDatabase} from '../sqlite/connection';
import {SaleFull} from './getSaleLocal';

const getSalesByCustomer = async (idCustomer: number): Promise<SaleFull[]> => {
  const db = await openDatabase();
  const [salesResponse] = await db.executeSql(`
        SELECT
            v.DOCTO_CC_ACR_ID,
            v.DOCTO_CC_ID,
            v.FOLIO,
            v.CLIENTE_ID,
            v.APLICADO,
            v.COBRADOR_ID,
            v.CLIENTE,
            v.ZONA_CLIENTE_ID,
            v.LIMITE_CREDITO,
            v.NOTAS,
            v.ZONA_NOMBRE,
            v.IMPORTE_PAGO_PROMEDIO,
            v.TOTAL_IMPORTE,
            v.NUM_IMPORTES,
            v.FECHA,
            v.PARCIALIDAD,
            v.ENGANCHE,
            v.TIEMPO_A_CORTO_PLAZOMESES,
            v.MONTO_A_CORTO_PLAZO,
            v.VENDEDOR_1,
            v.VENDEDOR_2,
            v.VENDEDOR_3,
            v.PRECIO_TOTAL,
            v.IMPTE_REST,
            v.SALDO_REST,
            v.FECHA_ULT_PAGO,
            v.CALLE,
            v.CIUDAD,
            v.ESTADO,
            v.TELEFONO,
            v.NOMBRE_COBRADOR,
            v.ESTADO_COBRANZA,
            v.DIA_COBRANZA,
            v.DIA_TEMPORAL_COBRANZA,
            v.AVAL_O_RESPONSABLE,
            v.PRECIO_DE_CONTADO,
            v.FREC_PAGO,
            GROUP_CONCAT(p.ARTICULO, ', ') AS PRODUCTOS
        FROM ventas v
        LEFT JOIN productos p ON p.FOLIO = v.folio
        WHERE CLIENTE_ID = ${idCustomer}
        GROUP BY v.DOCTO_CC_ID;
    `);

  const sales: SaleFull[] = salesResponse.rows.raw();

  return sales;
};

export default getSalesByCustomer;
