import {useState, useEffect} from 'react';
import {SaleServer} from '../screens/home/Home';
import getSaleLocal, {SaleFull} from '../services/getSaleLocal';

export const saleInitialState: SaleServer = {
  APLICADO: '',
  CALLE: '',
  CIUDAD: '',
  CLIENTE: '',
  CLIENTE_ID: 0,
  DOCTO_CC_ACR_ID: 0,
  DOCTO_CC_ID: 0,
  ENGANCHE: 0,
  ESTADO: '',
  ESTADO_COBRANZA: 'PENDIENTE',
  FECHA: '',
  FECHA_ULT_PAGO: '',
  FOLIO: '',
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
  COBRADOR_ID: 0,
  AVAL_O_RESPONSABLE: '',
  PRECIO_DE_CONTADO: 0,
  FREC_PAGO: 'SEMANAL',
};

const saleFullInitialState: SaleFull = {
  ...saleInitialState,
  pagos: [],
  PRODUCTOS: [],
};

const useGetSale = (saleId: number) => {
  const [sale, setSale] = useState<SaleFull>(saleFullInitialState);
  const [loading, setLoading] = useState(true);

  const getSale = () => {
    setLoading(true);
    getSaleLocal(saleId)
      .then(sale => {
        setSale(sale);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (saleId === 0 || !saleId) return;
    setLoading(true);
    getSale();
  }, [saleId]);

  return {sale, loading, getSaleAgain: getSale};
};

export default useGetSale;
