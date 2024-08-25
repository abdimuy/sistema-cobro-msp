import {useState, useEffect} from 'react';
import {db} from '../firebase/connection';
import {VENTAS_COLLECTION} from '../constants/collections';
import {Sale} from '../screens/sales/Sales/sales.types';
import {Timestamp, doc, onSnapshot} from '@react-native-firebase/firestore';

const saleInitialState: Sale = {
  APLICADO: '',
  CALLE: '',
  CIUDAD: '',
  CLIENTE: '',
  CLIENTE_ID: 0,
  DOCTO_CC_ACR_ID: 0,
  DOCTO_CC_ID: 0,
  ENGANCHE: 0,
  ESTADO: '',
  ESTADO_COBRANZA: '',
  FECHA: Timestamp.now(),
  FECHA_ULT_PAGO: Timestamp.now(),
  FOLIO: '',
  ID: '',
  IMPORTE_PAGO_PROMEDIO: 0,
  IMPTE_REST: 0,
  LIMITE_CREDITO: 0,
  NOMBRE_COBRADOR: '',
  NOTAS: '',
  NUM_IMPORTES: 0,
  PARCIALIDAD: 0,
  PRECIO_TOTAL: 0,
  SALDO_REST: 0,
  TELEFONO: '',
  TIEMPO_A_CORTO_PLAZOMESES: 0,
  TOTAL_IMPORTE: 0,
  VENDEDOR_1: '',
  VENDEDOR_2: '',
  VENDEDOR_3: '',
  ZONA_CLIENTE_ID: 0,
  ZONA_NOMBRE: '',
  MONTO_A_CORTO_PLAZO: 0,
  DIA_COBRANZA: '',
  DIA_TEMPORAL_COBRANZA: '',
};

const useGetSale = (saleId: string) => {
  const [sale, setSale] = useState<Sale>(saleInitialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, VENTAS_COLLECTION, saleId),
      snapshot => {
        setSale({...snapshot.data(), ID: snapshot.id} as Sale);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [saleId]);

  return {sale, loading};
};

export default useGetSale;
