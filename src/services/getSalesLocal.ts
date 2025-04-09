import dayjs from 'dayjs';
import {Producto} from '../components/modules/sales/SaleDetails/SaleDetails';
import {PagoServer, SaleServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';
import getPagosAtrasados, {PagosAtrasados} from './getPagosAtrasados';
import {SaleWithProductos} from './getSaleLocal';

const getSalesLocal = async (
  pagosAtrasados: boolean = true,
): Promise<SaleWithProductos[]> => {
  try {
    const db = await openDatabase();
    const [resultVentas] = await db.executeSql('SELECT * FROM ventas;');
    const [resultProductos] = await db.executeSql('SELECT * FROM productos;');
    const [resultPagos] = await db.executeSql('SELECT * FROM pagos');
    const productos: Producto[] = resultProductos.rows.raw();
    const sales: SaleServer[] = resultVentas.rows.raw();
    const pagos: PagoServer[] = resultPagos.rows.raw();
    let pagosAtrasadosList: PagosAtrasados[] = [];

    if (pagosAtrasados) {
      pagosAtrasadosList = await getPagosAtrasados();
    }

    const salesProcessed = sales.map(sale => {
      const productosBySale = productos.filter(
        producto => producto.FOLIO === sale.FOLIO,
      );

      const pagosBySale = pagos
        .filter(pago => pago.DOCTO_CC_ACR_ID === sale.DOCTO_CC_ID)
        .sort((a, b) =>
          dayjs(b.FECHA_HORA_PAGO).diff(dayjs(a.FECHA_HORA_PAGO)),
        );

      let pagosAtrasadosBySale: PagosAtrasados = {
        DOCTO_CC_ID: 0,
        FECHA_ULT_PAGO: '',
        NUM_IMPORTES: 0,
        NUM_PAGOS_ATRASADOS: 0,
        PARCIALIDADES_TRANSCURRIDAS: 0,
      };
      if (pagosAtrasados) {
        pagosAtrasadosBySale = pagosAtrasadosList.filter(
          pagoAtrasadoItem => pagoAtrasadoItem.DOCTO_CC_ID === sale.DOCTO_CC_ID,
        )[0];
      }

      return {
        ...sale,
        PRODUCTOS: productosBySale,
        PAGOS: pagosBySale,
        PLAZOS_ATRASADOS: pagosAtrasados
          ? pagosAtrasadosBySale.NUM_PAGOS_ATRASADOS
          : 0,
      };
    });

    return salesProcessed;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export default getSalesLocal;
