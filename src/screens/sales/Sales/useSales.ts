import React, {useEffect} from 'react';
import {db} from '../../../firebase/connection';
import {
  collection,
  query,
  where,
  onSnapshot,
} from '@react-native-firebase/firestore';
import {VENTAS_COLLECTION} from '../../../constants/collections';
import {Sale} from './sales.types';

const useSales = (zona_cliente_id: number) => {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const q = query(
      collection(db, VENTAS_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', zona_cliente_id),
    );
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const ventas: Sale[] = [];
      querySnapshot.forEach(doc => {
        ventas.push({...doc.data(), ID: doc.id} as Sale);
      });
      setSales(ventas);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [zona_cliente_id]);

  return {sales, loading};
};

export default useSales;
