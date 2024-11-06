import {Producto} from '../components/modules/sales/SaleDetails/SaleDetails';
import {PagoServer, SaleServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';
import getPagosAtrasados from './getPagosAtrasados';
import {SaleWithProductos} from './getSaleLocal';

const getSalesLocal = async (): Promise<SaleWithProductos[]> => {
  try {
    const db = await openDatabase();
    const [resultVentas] = await db.executeSql('SELECT * FROM ventas;');
    const [resultProductos] = await db.executeSql('SELECT * FROM productos;');
    const [resultPagos] = await db.executeSql('SELECT * FROM pagos');
    const productos: Producto[] = resultProductos.rows.raw();
    const sales: SaleServer[] = resultVentas.rows.raw();
    const pagos: PagoServer[] = resultPagos.rows.raw();
    const pagosAtrasados = await getPagosAtrasados();

    const salesProcessed = sales.map(sale => {
      const productosBySale = productos.filter(
        producto => producto.FOLIO === sale.FOLIO,
      );

      const pagosBySale = pagos.filter(
        pago => pago.DOCTO_CC_ACR_ID === sale.DOCTO_CC_ID,
      );

      const pagosAtrasadosBySale = pagosAtrasados.filter(
        pagoAtrasadoItem => pagoAtrasadoItem.DOCTO_CC_ID === sale.DOCTO_CC_ID,
      )[0];

      return {
        ...sale,
        PRODUCTOS: productosBySale,
        PAGOS: pagosBySale,
        PLAZOS_ATRASADOS: pagosAtrasadosBySale.NUM_PAGOS_ATRASADOS,
      };
    });

    return salesProcessed;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export default getSalesLocal;
