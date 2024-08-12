import React, {useContext, useEffect} from 'react';
import {Picker} from '@react-native-picker/picker';
import {
  StyleSheet,
  View,
  Text,
  Button,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import usePrinter from '../../../../hooks/usePrinter';
import {SalesStackParamList} from '../../../../routes/SalesRoutes';
import {RouteProp} from '@react-navigation/native';
import {useRoute} from '@react-navigation/core';
import useGetPago from '../../../../hooks/useGetPago';
import useGetSale from '../../../../hooks/useGetSale';
import dayjs from 'dayjs';
import {NEGRITAS_OFF, NEGRITAS_ON} from '../../../../contants/printerCommans';
import useGetProductosByFolio from '../../../../hooks/useGetProductosByFolio';
import {AuthContext} from '../../../../../App';
import {CONDONACION_ID} from '../../sales/SaleDetails/SaleDetails';
import useGetPagosBySale from '../../../../hooks/useGetPagosBySale';

type SaleDetailScreenRouteProp = RouteProp<SalesStackParamList, 'Payment'>;

export default function Payment() {
  const route = useRoute<SaleDetailScreenRouteProp>();
  const {userData} = useContext(AuthContext);
  const {paymentId, saleId} = route.params;
  const {pago, loading} = useGetPago(paymentId);
  const {sale, loading: saleLoading} = useGetSale(saleId);
  const {payments, loading: paymentsLoading} = useGetPagosBySale(
    sale.DOCTO_CC_ID,
  );
  const {loading: productosLoading, productos} = useGetProductosByFolio(
    sale.FOLIO,
  );

  // Ordenar pagos por fecha y solo los ultimos 5
  const paymentsOrder = payments
    .sort(
      (a, b) =>
        b.FECHA_HORA_PAGO.toDate().getTime() -
        a.FECHA_HORA_PAGO.toDate().getTime(),
    )
    .slice(0, 5);

  const {
    devices,
    selectedPrinter,
    print,
    savePrinter,
    connectPrinter,
    loading: printerLoading,
    getListDevices,
  } = usePrinter();

  useEffect(() => {
    getListDevices();
  }, []);

  const TICKET_TYPE =
    pago.FORMA_COBRO_ID === CONDONACION_ID ? 'CONDONACION' : 'PAGO';

  const ticketText = `
TICKET DE ${TICKET_TYPE}

FOLIO: ${sale.FOLIO}
CLIENTE: ${NEGRITAS_ON}${sale.CLIENTE}${NEGRITAS_OFF}
DIRECCION: ${sale.CALLE + ' ' + sale.CIUDAD + ', ' + sale.ESTADO}
TELEFONO: ${sale.TELEFONO}
FECHA VENTA: ${dayjs(sale.FECHA.toDate()).format('DD/MM/YYYY')}
TOTAL VENTA: $${sale.PRECIO_TOTAL.toFixed(2)}
ENGANCHE: $${sale.ENGANCHE.toFixed(2)}
PARCIALIDAD: $${sale.PARCIALIDAD.toFixed(2)}
VENDEDORES:
${sale.VENDEDOR_1 && '- ' + sale.VENDEDOR_1}
${sale.VENDEDOR_2 && '- ' + sale.VENDEDOR_2}
${sale.VENDEDOR_3 && '- ' + sale.VENDEDOR_3}

--------------------------------

HISTORIAL DE PAGOS
${paymentsOrder
  .map(
    pago =>
      `- ${
        pago.FORMA_COBRO_ID === CONDONACION_ID ? 'CONDONACION' : 'ABONO'
      }: $${pago.IMPORTE.toFixed(2)} - ${dayjs(
        pago.FECHA_HORA_PAGO.toDate(),
      ).format('DD/MM/YYYY')}`,
  )
  .join('\n')}

--------------------------------

PRODUCTOS

${productos
  .map(
    producto =>
      `- ${producto.ARTICULO}: $${producto.PRECIO_UNITARIO_IMPTO.toFixed(
        2,
      )} x ${producto.CANTIDAD}`,
  )
  .join('\n')}

--------------------------------

FECHA DE ${TICKET_TYPE}: ${dayjs(pago.FECHA_HORA_PAGO.toDate()).format(
    'DD/MM/YYYY HH:mm',
  )}
IMPORTE DE ${TICKET_TYPE}: $${pago.IMPORTE.toFixed(2)}
ATENDIO: ${pago.COBRADOR}
TELEFONO DEL COBRADOR: ${userData.TELEFONO}

--------------------------------

SALDO ANTERIOR: ${NEGRITAS_ON}$${sale.SALDO_REST + pago.IMPORTE}${NEGRITAS_OFF}
IMPORTE DE ${TICKET_TYPE}: ${NEGRITAS_ON}$${pago.IMPORTE}${NEGRITAS_OFF}
SALDO ACTUAL: ${NEGRITAS_ON}$${sale.SALDO_REST}${NEGRITAS_OFF}

--------------------------------

EXIJA SU COMPROBANTE DE PAGO
!!!GRACIAS POR SU PREFERENCIA!!!

TELEFONO: 238-3740684
WHATSAPP: 238-1105061
AGENTE: ${pago.COBRADOR}
`;

  const isLoading = loading || saleLoading || printerLoading;

  if (isLoading) {
    return <ActivityIndicator />;
  }
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Selecciona una impresora: </Text>
        <Picker
          style={{color: 'black'}}
          selectedValue={selectedPrinter}
          onValueChange={itemValue => savePrinter(itemValue)}>
          <Picker.Item label="Selecciona una impresora" value={null} />
          {devices.map((item, index) => (
            <Picker.Item
              label={item.device_name}
              value={item}
              key={`printer-item-${item.device_name}`}
            />
          ))}
        </Picker>
      </View>
      <Button
        disabled={loading || !selectedPrinter}
        title="CONECTAR IMPRESORA"
        onPress={connectPrinter}
      />
      <Button
        disabled={loading || !selectedPrinter}
        title="IMPRIMIR TICKET"
        onPress={() => {
          print(ticketText), console.log(ticketText);
        }}
      />
      <View style={styles.section}>
        <Text style={styles.title}>TICKET DE COBRANZA</Text>
        <Text style={styles.item}>
          <Text style={styles.label}>FOLIO: </Text>
          <Text style={styles.value}>{sale.FOLIO}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>CLIENTE: </Text>
          <Text style={styles.value}>{sale.CLIENTE}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>DIRECCION: </Text>
          <Text style={styles.value}>
            {sale.CALLE + ' ' + sale.CIUDAD + ', ' + sale.ESTADO}
          </Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>TELEFONO: </Text>
          <Text style={styles.value}>{sale.TELEFONO}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>FECHA VENTA: </Text>
          <Text style={styles.value}>
            {dayjs(sale.FECHA.toDate()).format('DD/MM/YYYY')}
          </Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>TOTAL VENTA: </Text>
          <Text style={styles.value}>${sale.PRECIO_TOTAL.toFixed(2)}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>ENGANCHE: </Text>
          <Text style={styles.value}>${sale.ENGANCHE.toFixed(2)}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>PARCIALIDAD: </Text>
          <Text style={styles.value}>${sale.PARCIALIDAD.toFixed(2)}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>VENDEDORES: </Text>
          <Text style={styles.value}>
            {sale.VENDEDOR_1 && '\n- ' + sale.VENDEDOR_1}
            {sale.VENDEDOR_2 && '\n- ' + sale.VENDEDOR_2}
            {sale.VENDEDOR_3 && '\n- ' + sale.VENDEDOR_3}
          </Text>
        </Text>

        <Text style={styles.divider} />
        <Text style={styles.label}>PRODUCTOS</Text>
        {productos.map(producto => (
          <Text style={styles.item} key={producto.ID}>
            <Text style={styles.label}>{producto.ARTICULO}: </Text>
            <Text style={styles.value}>
              ${producto.PRECIO_UNITARIO_IMPTO.toFixed(2)} x {producto.CANTIDAD}
            </Text>
          </Text>
        ))}
        <Text style={styles.divider} />

        <Text style={styles.item}>
          <Text style={styles.label}>FECHA PAGO: </Text>
          <Text style={styles.value}>
            {dayjs(pago.FECHA_HORA_PAGO.toDate()).format('DD/MM/YYYY HH:mm')}
          </Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>IMPORTE: </Text>
          <Text style={styles.value}>${pago.IMPORTE.toFixed(2)}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>ATENDIO: </Text>
          <Text style={styles.value}>{pago.COBRADOR}</Text>
        </Text>
        <Text style={styles.divider} />
        <Text style={styles.item}>
          <Text style={styles.label}>SALDO ANTERIOR: </Text>
          <Text style={styles.value}>${sale.SALDO_REST + pago.IMPORTE}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>IMPORTE PAGADO: </Text>
          <Text style={styles.value}>${pago.IMPORTE}</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>SALDO ACTUAL: </Text>
          <Text style={styles.value}>${sale.SALDO_REST}</Text>
        </Text>
        <Text style={styles.divider} />
        <Text style={styles.item}>
          <Text style={styles.label}>EXIJA SU COMPROBANTE DE PAGO</Text>
        </Text>
        <Text style={styles.item}>
          <Text style={styles.label}>!!!GRACIAS POR SU PREFERENCIA!!!</Text>
        </Text>
        <View style={{marginBottom: 30}}></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  value: {
    fontSize: 18,
    color: 'black',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'black',
    marginVertical: 20,
  },
});
