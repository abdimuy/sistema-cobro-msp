import {
  onSnapshot,
  collection,
  query,
  where,
  limit,
  orderBy,
  Timestamp,
} from '@react-native-firebase/firestore';
import {useContext, useEffect, useState} from 'react';
import {db} from '../firebase/connection';
import {PAGOS_COLLECTION} from '../constants/collections';
import {Payment} from '../components/modules/sales/SaleDetails/SaleDetails';
import dayjs from 'dayjs';
import {AuthContext} from '../../App';

const useGetPagosRuta = (zonaClienteId: number) => {
  const {userData} = useContext(AuthContext);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [pagosHoy, setPagosHoy] = useState<Payment[]>([]);
  const [lastPagos, setLastPagos] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qDate = Timestamp.fromDate(userData.FECHA_CARGA_INICIAL.toDate());
    const q = query(
      collection(db, PAGOS_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', zonaClienteId),
      where('FECHA_HORA_PAGO', '>=', qDate),
      where('FORMA_COBRO_ID', 'in', [157, 158, 52569]),
    );
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const pagos: Payment[] = [];
      if (!querySnapshot) return;
      querySnapshot.docs.forEach(doc => {
        pagos.push({...doc.data(), ID: doc.id} as Payment);
      });
      setPagos(pagos);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [zonaClienteId]);

  useEffect(() => {
    const qDate =
      dayjs().startOf('day').toDate() > userData.FECHA_CARGA_INICIAL.toDate()
        ? Timestamp.fromDate(dayjs().startOf('day').toDate())
        : Timestamp.fromDate(userData.FECHA_CARGA_INICIAL.toDate());

    const q = query(
      collection(db, PAGOS_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', zonaClienteId),
      where('FECHA_HORA_PAGO', '>=', qDate),
      where('FORMA_COBRO_ID', 'in', [157, 158, 52569]),
    );

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const pagos: Payment[] = [];
      if (!querySnapshot) return;
      querySnapshot.docs.forEach(doc => {
        pagos.push({...doc.data(), ID: doc.id} as Payment);
      });
      setPagosHoy(pagos);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [zonaClienteId]);

  useEffect(() => {
    const q = query(
      collection(db, PAGOS_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', zonaClienteId),
      limit(5),
    );

    const unsubscribe = onSnapshot(q, querySnapshot => {
      const pagos: Payment[] = [];
      if (!querySnapshot) return;
      querySnapshot.docs.forEach(doc => {
        pagos.push({...doc.data(), ID: doc.id} as Payment);
      });
      setLastPagos(pagos);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [zonaClienteId]);

  //obtener los clientes de cada pago por su id pero solo quiero una consulta sencilla no con realtime
  // useEffect(() => {
  //   if (lastPagos.length === 0) {
  //     return;
  //   }
  //   const ids = lastPagos.map(pago => pago.CLIENTE_ID);
  //   console.log(ids);

  //   const q = query(collection(db, 'ventas'), where('CLIENTE_ID', 'in', ids));

  //   const unsubscribe = onSnapshot(q, querySnapshot => {
  //     const pagos: PaymentWithCliente[] = [];
  //     console.log(querySnapshot.docs.length);
  //     querySnapshot.forEach(doc => {
  //       const pago = lastPagos.find(
  //         pago => pago.CLIENTE_ID === doc.data().CLIENTE_ID,
  //       );
  //       pagos.push({...pago, CLIENTE: doc.data().NOMBRE} as PaymentWithCliente);
  //     });
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [lastPagos]);

  return {pagos, loading, pagosHoy, lastPagos};
};

export default useGetPagosRuta;
