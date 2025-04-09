import {Alert, ToastAndroid} from 'react-native';
import {getUnsynchronizedLocalPayment} from './getUnsynchronizedLocalPayment';
import {Dayjs} from 'dayjs';
import {getUnsynchronizedLocalVisitas} from './getUnsynchronizedLocalVisitas';
import {
  PaymentDto,
  VisitaType,
} from '../components/modules/sales/SaleDetails/SaleDetails';
import sendPago from './sendPago';
import sendVisita from './sendVisita';

const sendPagosNotSent = async (
  sendAllPagos: boolean = false,
  cargaInicialDate: Dayjs,
  showAlerts: boolean = true,
) => {
  ToastAndroid.show('Enviando pagos pendientes', ToastAndroid.SHORT);
  const pagosNotSent = await getUnsynchronizedLocalPayment(
    sendAllPagos,
    cargaInicialDate,
  );
  const visitasNotSent = await getUnsynchronizedLocalVisitas();

  if (!sendAllPagos) {
    if (pagosNotSent.length === 0 && visitasNotSent.length === 0) {
      if (showAlerts) {
        Alert.alert('No hay pagos por enviar');
      }
      return;
    }
  }
  let numPagosSent = 0;
  for (let pagoNotSend of pagosNotSent) {
    const pagoToSend: PaymentDto = {
      ID: pagoNotSend.ID,
      CLIENTE_ID: pagoNotSend.CLIENTE_ID,
      NOMBRE_CLIENTE: pagoNotSend.NOMBRE_CLIENTE,
      COBRADOR: pagoNotSend.COBRADOR,
      COBRADOR_ID: pagoNotSend.COBRADOR_ID,
      DOCTO_CC_ID: pagoNotSend.DOCTO_CC_ID,
      DOCTO_CC_ACR_ID: pagoNotSend.DOCTO_CC_ACR_ID,
      FECHA_HORA_PAGO: pagoNotSend.FECHA_HORA_PAGO,
      FORMA_COBRO_ID: pagoNotSend.FORMA_COBRO_ID,
      ZONA_CLIENTE_ID: pagoNotSend.ZONA_CLIENTE_ID,
      IMPORTE: pagoNotSend.IMPORTE,
      LAT: Number(pagoNotSend.LAT),
      LNG: Number(pagoNotSend.LNG),
      GUARDADO_EN_MICROSIP: pagoNotSend.GUARDADO_EN_MICROSIP,
    };
    try {
      await sendPago(pagoToSend, false);

      numPagosSent++;
    } catch (error) {
      console.error('Error al enviar el pago', error);
    }
  }
  await getUnsynchronizedLocalPayment(false, cargaInicialDate);

  let numVisitasSent = 0;
  for (let visitaNotSend of visitasNotSent) {
    try {
      await sendVisita(
        visitaNotSend,
        false,
        visitaNotSend.TIPO_VISITA as VisitaType,
        0,
        true,
      );
      numVisitasSent++;
    } catch (error) {
      console.error('Error al enviar la visita', error);
    }
  }
  await getUnsynchronizedLocalPayment(false, cargaInicialDate);

  const numPagosNotSent = pagosNotSent.length - numPagosSent;

  if (showAlerts) {
    Alert.alert(
      'Pagos enviados',
      `Se enviaron ${numPagosSent} pagos${
        numPagosNotSent > 0 ? ` y quedan ${numPagosNotSent} por enviar` : ''
      }.
  Se enviaron ${numVisitasSent} visitas.`,
      [
        {
          text: 'Aceptar',
        },
      ],
      {cancelable: false},
    );
  }
};

export default sendPagosNotSent;
