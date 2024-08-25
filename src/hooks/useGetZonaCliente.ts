import {
  onSnapshot,
  collection,
  query,
  where,
} from '@react-native-firebase/firestore';
import {useEffect, useState} from 'react';
import {db} from '../firebase/connection';
import {ZONAS_CLIENTE_COLLECTION} from '../constants/collections';

export interface ZONA_CLIENTE {
  ID: string;
  ZONA_CLIENTE_ID: number;
  ZONA_CLIENTE: string;
}

const useGetZonaCliente = (zonaClienteId: number) => {
  const [zonaCliente, setZonaCliente] = useState<ZONA_CLIENTE>({
    ID: '',
    ZONA_CLIENTE_ID: 0,
    ZONA_CLIENTE: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, ZONAS_CLIENTE_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', zonaClienteId),
    );
    const unsubscribe = onSnapshot(q, querySnapshot => {
      if (!querySnapshot) return;
      querySnapshot.docs.forEach(doc => {
        setZonaCliente({...doc.data(), ID: doc.id} as ZONA_CLIENTE);
      });
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [zonaClienteId]);

  return {zonaCliente, loading};
};

export default useGetZonaCliente;
