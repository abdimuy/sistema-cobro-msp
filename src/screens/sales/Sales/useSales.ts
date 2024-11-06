import React, {useEffect} from 'react';
import {openDatabase} from '../../../sqlite/connection';
import {SaleServer} from '../../home/Home';

const useSales = (zona_cliente_id: number) => {
  const [sales, setSales] = React.useState<SaleServer[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const getSales = async () => {
      const db = await openDatabase();
      const query = `
        SELECT 
          *
        FROM ventas WHERE ZONA_CLIENTE_ID = ${zona_cliente_id}
      `;
      const [results] = await db.executeSql(query);
      const sales = results.rows.raw();
      setSales(sales);
      setLoading(false);
    };
    getSales();
  }, [zona_cliente_id]);

  return {sales, loading};
};

export default useSales;
