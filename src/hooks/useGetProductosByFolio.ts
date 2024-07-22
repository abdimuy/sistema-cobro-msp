import {useState, useEffect} from 'react';
import {db} from '../firebase/connection';
import {VENTAS_PRODUCTOS_COLLECTION} from '../constants/collections';
import {Producto} from '../components/modules/sales/SaleDetails/SaleDetails';
import {
  collection,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';

const useGetProductosByFolio = (folio: string) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const q = query(
    collection(db, VENTAS_PRODUCTOS_COLLECTION),

    where('FOLIO', '==', folio),
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(q, snapshot => {
      const productosTemp: Producto[] = [];
      snapshot.forEach(doc => {
        productosTemp.push({...doc.data(), ID: doc.id} as Producto);
      });
      setProductos(productosTemp);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [folio]);

  return {productos, loading};
};

export default useGetProductosByFolio;
