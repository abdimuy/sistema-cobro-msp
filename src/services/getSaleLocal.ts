import {Producto} from '../components/modules/sales/SaleDetails/SaleDetails';
import {saleInitialState} from '../hooks/useGetSale';
import {
  PagoServer,
  SaleServer,
  SaleServerProcessed,
} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';

export interface SaleFull extends SaleServer {
  pagos: PagoServer[];
  PRODUCTOS: Producto[];
}

export interface SaleWithProductos extends SaleServerProcessed {
  PRODUCTOS: Producto[];
  PAGOS: PagoServer[];
}

export const saleFullInitialState: SaleFull = {
  ...saleInitialState,
  pagos: [],
  PRODUCTOS: [],
};

const getSaleLocal = async (DOCTO_CC_ID: number): Promise<SaleFull> => {
  const db = await openDatabase();
  const query = `
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
      WHERE DOCTO_CC_ID = ${DOCTO_CC_ID}
      GROUP BY v.DOCTO_CC_ID;
    `;
  const [result] = await db.executeSql(query);

  const queryPagos = `
        SELECT 
            ID,
            CLIENTE_ID,
            NOMBRE_CLIENTE, 
            COBRADOR, 
            COBRADOR_ID,
            DOCTO_CC_ID,
            DOCTO_CC_ACR_ID,
            FECHA_HORA_PAGO, 
            FORMA_COBRO_ID,
            ZONA_CLIENTE_ID,
            IMPORTE, 
            LAT, 
            LNG, 
            GUARDADO_EN_MICROSIP
        FROM pagos WHERE DOCTO_CC_ACR_ID = ${DOCTO_CC_ID};
        `;

  const [resultPagos] = await db.executeSql(queryPagos);
  const pagos: PagoServer[] = resultPagos.rows.raw();
  const sale = result.rows.item(0);
  return {...sale, pagos};
};

export default getSaleLocal;
