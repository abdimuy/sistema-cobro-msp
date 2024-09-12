import {Producto} from '../components/modules/sales/SaleDetails/SaleDetails';
import {saleInitialState} from '../hooks/useGetSale';
import {PagoServer, SaleServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';

export interface SaleFull extends SaleServer {
  pagos: PagoServer[];
  PRODUCTOS: Producto[];
}

export interface SaleWithProductos extends SaleServer {
  PRODUCTOS: Producto[];
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
        DOCTO_CC_ACR_ID,
        DOCTO_CC_ID,
        FOLIO,
        CLIENTE_ID,
        APLICADO,
        COBRADOR_ID,
        CLIENTE,
        ZONA_CLIENTE_ID,
        LIMITE_CREDITO,
        NOTAS,
        ZONA_NOMBRE,
        IMPORTE_PAGO_PROMEDIO,
        TOTAL_IMPORTE,
        NUM_IMPORTES,
        FECHA,
        PARCIALIDAD,
        ENGANCHE,
        TIEMPO_A_CORTO_PLAZOMESES,
        MONTO_A_CORTO_PLAZO,
        VENDEDOR_1,
        VENDEDOR_2,
        VENDEDOR_3,
        PRECIO_TOTAL,
        IMPTE_REST,
        SALDO_REST,
        FECHA_ULT_PAGO,
        CALLE,
        CIUDAD,
        ESTADO,
        TELEFONO,
        NOMBRE_COBRADOR,
        ESTADO_COBRANZA,
        DIA_COBRANZA,
        DIA_TEMPORAL_COBRANZA
      FROM ventas WHERE DOCTO_CC_ID = ${DOCTO_CC_ID}
    `;
  const [result] = await db.executeSql(query);

  const queryPagos = `
        SELECT 
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
