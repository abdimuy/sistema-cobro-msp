import {useContext, useEffect, useState} from 'react';
import {Payment} from '../components/modules/sales/SaleDetails/SaleDetails';
import dayjs from 'dayjs';
import {AuthContext} from '../../App';
import {openDatabase} from '../sqlite/connection';

const useGetPagosRuta = (zonaClienteId: number) => {
  const {userData} = useContext(AuthContext);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [pagosHoy, setPagosHoy] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHoy, setLoadingHoy] = useState(true);

  const getPagos = async () => {
    setLoading(true);
    const dbSqlite = await openDatabase();
    const query = `
      SELECT * FROM pagos
      WHERE FECHA_HORA_PAGO >= ?
      AND FORMA_COBRO_ID IN (157, 158, 52569)
    `;
    const res = await dbSqlite.executeSql(query, [
      dayjs(userData.FECHA_CARGA_INICIAL.toDate()).toISOString(),
    ]);
    const pagos: Payment[] = [];
    for (let i = 0; i < res[0].rows.length; i++) {
      const pago = res[0].rows.item(i);
      pagos.push(pago);
    }
    setPagos(pagos);
  };

  useEffect(() => {
    getPagos()
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, [zonaClienteId]);

  const getPagosHoy = async () => {
    setLoadingHoy(true);
    const dbSqlite = await openDatabase();
    const query = `
      SELECT * FROM pagos
      WHERE FECHA_HORA_PAGO BETWEEN ? AND ?
      AND FORMA_COBRO_ID IN (157, 158, 52569)
    `;
    const res = await dbSqlite.executeSql(query, [
      dayjs().startOf('day').toDate().toISOString(),
      dayjs().endOf('day').toDate().toISOString(),
    ]);
    const pagosHoy: Payment[] = [];
    for (let i = 0; i < res[0].rows.length; i++) {
      const pago = res[0].rows.item(i);
      pagosHoy.push(pago);
    }
    setPagosHoy(pagosHoy);
  };

  useEffect(() => {
    getPagosHoy()
      .catch(err => console.log(err))
      .finally(() => setLoadingHoy(false));
  }, [zonaClienteId]);

  return {pagos, loading: loading || loadingHoy, pagosHoy};
};

export default useGetPagosRuta;
