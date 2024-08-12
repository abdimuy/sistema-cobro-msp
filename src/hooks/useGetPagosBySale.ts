import {
  collection,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import {Payment} from '../components/modules/sales/SaleDetails/SaleDetails';
import {db} from '../firebase/connection';
import {useState, useEffect} from 'react';

export default function useGetPagosBySale(DOCTO_CC_ID: number) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const getPayments = () => {
    setLoading(true);
    const q = query(
      collection(db, 'pagos'),
      where('DOCTO_CC_ID', '==', DOCTO_CC_ID),
    );
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const pagosList: Payment[] = [];
      querySnapshot.forEach(doc => {
        pagosList.push({...doc.data(), ID: doc.id} as Payment);
      });
      setPayments(pagosList);
    });
    setLoading(false);
    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = getPayments();
    return () => unsubscribe();
  }, [DOCTO_CC_ID]);

  return {payments, loading};
}
