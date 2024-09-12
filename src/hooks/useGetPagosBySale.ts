import {useState, useEffect} from 'react';
import {PagoServer} from '../screens/home/Home';
import {openDatabase} from '../sqlite/connection';

export default function useGetPagosBySale(DOCTO_CC_ACR_ID: number) {
  const [payments, setPayments] = useState<PagoServer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getPayments = async () => {
    try {
      setLoading(true);
      const db = await openDatabase();
      const query = `
        SELECT *
        FROM pagos
        WHERE DOCTO_CC_ACR_ID = ${DOCTO_CC_ACR_ID};
      `;
      const [result] = await db.executeSql(query);
      const payments: PagoServer[] = result.rows.raw();
      setPayments(payments);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPayments();
  }, [DOCTO_CC_ACR_ID]);

  return {payments, loading};
}
