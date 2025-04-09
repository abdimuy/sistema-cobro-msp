import {useState, useEffect} from 'react';
import {SaleServer} from '../screens/home/Home';
import getSaleLocal, {SaleFull} from '../services/getSaleLocal';
import getSalesByCustomer from '../services/getSalesByCustomer';
import getPorcentajeParcialBySale, {
  PorcentajeParcialBySale,
} from '../services/getPorcentajeParcialBySale';

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
  const [otherSales, setOtherSales] = useState<SaleFull[]>([]);
  const [porcentajeParcialBySale, setPorcentajeParcialBySale] =
    useState<PorcentajeParcialBySale>({
      CLIENTE: '',
      DOCTO_CC_ID: 0,
      FECHA_ULT_PAGO: '',
      FREC_PAGO: '',
      NUM_IMPORTES: 0,
      NUM_PAGOS_ATRASADOS: 0,
      PARCIALIDAD: 0,
      PARCIALIDADES_TRANSCURRIDAS: 0,
      TOTAL_IMPORTE: 0,
    });

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

  const getPorcentajeParcial = () => {
    getPorcentajeParcialBySale(saleId)
      .then(res => {
        setPorcentajeParcialBySale(res);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const getOtherSalesByCustomer = (idCustomer: number, omitSaleId: number) => {
    getSalesByCustomer(idCustomer)
      .then(sales => {
        setOtherSales(
          sales.filter(sale => {
            return sale.DOCTO_CC_ID !== omitSaleId;
          }),
        );
      })
      .catch(err => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (saleId === 0 || !saleId) return;
    setLoading(true);
    getSale();
    getPorcentajeParcial();
  }, [saleId]);

  useEffect(() => {
    if (sale.CLIENTE_ID !== 0) {
      getOtherSalesByCustomer(sale.CLIENTE_ID, saleId);
    }
  }, [sale.CLIENTE_ID, saleId]);

  return {
    sale,
    loading,
    getSaleAgain: getSale,
    otherSales,
    porcentajeParcialBySale,
  };
};

export default useGetSale;
