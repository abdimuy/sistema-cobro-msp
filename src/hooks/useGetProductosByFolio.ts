import {useState, useEffect} from 'react';
import {Producto} from '../components/modules/sales/SaleDetails/SaleDetails';
import {openDatabase} from '../sqlite/connection';

const useGetProductosByFolio = (folio: string) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const getProducts = async () => {
    setLoading(true);
    const dbSqlite = await openDatabase();
    const query = `
      SELECT * FROM productos
      WHERE FOLIO = '${folio}'
    `;

    const [result] = await dbSqlite.executeSql(query);
    const productos: Producto[] = result.rows.raw();
    setProductos(productos);
    setLoading(false);
  };

  useEffect(() => {
    getProducts().catch(err => {
      console.log(err);
      setLoading(false);
    });
  }, [folio]);

  return {productos, loading};
};

export default useGetProductosByFolio;
