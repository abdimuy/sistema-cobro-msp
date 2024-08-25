import {useState, useEffect} from 'react';
import {db} from '../firebase/connection';
import {PAGOS_COLLECTION} from '../constants/collections';
import {Payment} from '../components/modules/sales/SaleDetails/SaleDetails';
import {Timestamp, doc, onSnapshot} from '@react-native-firebase/firestore';

const useGetPago = (pagoId: string) => {
  const [pago, setPago] = useState<Payment>({
    ID: '',
    COBRADOR_ID: 0,
    IMPORTE: 0,
    CLIENTE_ID: 0,
    COBRADOR: '',
    DOCTO_CC_ID: 0,
    FECHA_HORA_PAGO: Timestamp.now(),
    LAT: 0,
    LNG: 0,
    DOCTO_CC_ACR_ID: 0,
    FORMA_COBRO_ID: 0,
    ZONA_CLIENTE_ID: 0,
    GUARDADO_EN_MICROSIP: false,
    NOMBRE_CLIENTE: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, PAGOS_COLLECTION, pagoId),
      snapshot => {
        setPago({...snapshot.data(), ID: snapshot.id} as Payment);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [pagoId]);

  return {pago, loading};
};

export default useGetPago;
