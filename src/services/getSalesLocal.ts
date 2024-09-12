import {Producto} from '../components/modules/sales/SaleDetails/SaleDetails';
import {SaleServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';
import {SaleWithProductos} from './getSaleLocal';

const getSalesLocal = async (): Promise<SaleWithProductos[]> => {
  try {
    const db = await openDatabase();
    const [resultVentas] = await db.executeSql('SELECT * FROM ventas;');
    const [resultProductos] = await db.executeSql('SELECT * FROM productos;');
    const productos: Producto[] = resultProductos.rows.raw();
    const sales: SaleServer[] = resultVentas.rows.raw();
    const salesWithProducts = sales.map(sale => {
      const productosBySale = productos.filter(
        producto => producto.FOLIO === sale.FOLIO,
      );
      return {
        ...sale,
        PRODUCTOS: productosBySale,
      };
    });

    return salesWithProducts;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export default getSalesLocal;
