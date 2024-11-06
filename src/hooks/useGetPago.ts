import {useState, useEffect} from 'react';
import {PagoServer} from '../screens/home/Home';
import getPagoLocal from '../services/getPagoLocal';

const pagoInitialState: PagoServer = {
  ID: '',
  CLIENTE_ID: 0,
  COBRADOR: '',
  COBRADOR_ID: 0,
  DOCTO_CC_ACR_ID: 0,
  DOCTO_CC_ID: 0,
  FECHA_HORA_PAGO: '',
  FORMA_COBRO_ID: 0,
  GUARDADO_EN_MICROSIP: false,
  IMPORTE: 0,
  LAT: '',
  LNG: '',
  NOMBRE_CLIENTE: '',
  ZONA_CLIENTE_ID: 0,
};

const useGetPago = (pagoId: string) => {
  const [loading, setLoading] = useState(true);
  const [pago, setPago] = useState<PagoServer>(pagoInitialState);

  const getPago = async () => {
    try {
      setLoading(true);
      const pago = await getPagoLocal(pagoId);
      setPago(pago);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPago();
  }, [pagoId]);

  return {pago, loading};
};

export default useGetPago;
