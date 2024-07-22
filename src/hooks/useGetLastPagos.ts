import {
  onSnapshot,
  collection,
  query,
  where,
  limit,
} from '@react-native-firebase/firestore';
import {useEffect, useState} from 'react';
import {db} from '../firebase/connection';
import {PAGOS_COLLECTION} from '../constants/collections';
import {Payment} from '../components/modules/sales/SaleDetails/SaleDetails';

const useGetLastPagos = (zonaClienteId: number) => {
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, PAGOS_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', zonaClienteId),
      limit(5),
    );
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const pagos: Payment[] = [];
      querySnapshot.forEach(doc => {
        pagos.push({...doc.data(), ID: doc.id} as Payment);
      });
      setPagos(pagos);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [zonaClienteId]);

  return {pagos, loading};
};

export default useGetLastPagos;
