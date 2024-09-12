import dayjs from 'dayjs';
import {openDatabase} from '../sqlite/connection';
import {PaymentDto} from '../components/modules/sales/SaleDetails/SaleDetails';
import api from './api';

const sendPago = async (
  data: PaymentDto,
  insertInLocalDB: boolean = true,
): Promise<string> => {
  const dbSqlite = await openDatabase();

  if (insertInLocalDB) {
    await dbSqlite.executeSql(
      `
      INSERT INTO pagos
      (
        CLIENTE_ID,
        NOMBRE_CLIENTE,
        COBRADOR,
        COBRADOR_ID,
        DOCTO_CC_ID,
        DOCTO_CC_ACR_ID,
        FECHA_HORA_PAGO,
        FORMA_COBRO_ID,
        ZONA_CLIENTE_ID,
        IMPORTE,
        LAT,
        LNG,
        GUARDADO_EN_MICROSIP
      ) VALUES (
        ${data.CLIENTE_ID},
        '${data.NOMBRE_CLIENTE}',
        '${data.COBRADOR}',
        ${data.COBRADOR_ID},
        ${data.DOCTO_CC_ID},
        ${data.DOCTO_CC_ACR_ID},
        '${dayjs(data.FECHA_HORA_PAGO).toISOString()}',
        ${data.FORMA_COBRO_ID},
        ${data.ZONA_CLIENTE_ID},
        ${data.IMPORTE},
        ${data.LAT},
        ${data.LNG},
        ${data.GUARDADO_EN_MICROSIP}
      )
      `,
    );

    const query = `
      UPDATE ventas
      SET
        SALDO_REST = SALDO_REST - ${data.IMPORTE},
        ESTADO_COBRANZA = 'PAGADO'
      WHERE DOCTO_CC_ID = ${data.DOCTO_CC_ACR_ID}
    `;

    await dbSqlite.executeSql(query);
  }

  await api.post<{err: ''; body: string}>(
    'ventas/add-pago',
    {pago: data},
    {timeout: 7000},
  );

  const queryUpdateGuardado = `
            UPDATE pagos
            SET GUARDADO_EN_MICROSIP = 1
            WHERE DOCTO_CC_ID = ${data.DOCTO_CC_ID}
            `;
  await dbSqlite.executeSql(queryUpdateGuardado);
  return 'Pago guardado correctamente';
};

export default sendPago;
