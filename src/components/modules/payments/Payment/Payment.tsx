import React, {useContext, useEffect, useRef} from 'react';
import {Picker} from '@react-native-picker/picker';
import {
  StyleSheet,
  View,
  Text,
  Button,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import usePrinter from '../../../../hooks/usePrinter';
import {SalesStackParamList} from '../../../../routes/SalesRoutes';
import {RouteProp} from '@react-navigation/native';
import {useRoute} from '@react-navigation/core';
import useGetPago from '../../../../hooks/useGetPago';
import useGetSale from '../../../../hooks/useGetSale';
import dayjs from 'dayjs';
import {NEGRITAS_OFF, NEGRITAS_ON} from '../../../../contants/printerCommans';
import {AuthContext} from '../../../../../App';
import {CONDONACION_ID} from '../../sales/SaleDetails/SaleDetails';
import useGetPagosBySale from '../../../../hooks/useGetPagosBySale';
import useGetProductosByFolio from '../../../../hooks/useGetProductosByFolio';
import ViewShot from 'react-native-view-shot';
import TicketSVG from '../TicketSVG/TicketSVG';
import Share from 'react-native-share';

type SaleDetailScreenRouteProp = RouteProp<SalesStackParamList, 'Payment'>;

export default function Payment() {
  const route = useRoute<SaleDetailScreenRouteProp>();
  const {userData} = useContext(AuthContext);
  const {paymentId, saleId} = route.params;
  const {pago, loading} = useGetPago(paymentId);
  const {sale, loading: saleLoading} = useGetSale(saleId);
  const {payments, loading: paymentsLoading} = useGetPagosBySale(
    sale.DOCTO_CC_ACR_ID,
  );
  const {loading: productosLoading, productos} = useGetProductosByFolio(
    sale.FOLIO,
  );
  const viewShotRef = useRef<ViewShot>(null);

  const paymentsOrder = payments
    .sort(
      (a, b) =>
        new Date(b.FECHA_HORA_PAGO).getTime() -
        new Date(a.FECHA_HORA_PAGO).getTime(),
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

  const handleShareImage = async () => {
    try {
      if (!viewShotRef.current?.capture) {
        throw new Error('ViewShot ref is not initialized');
      }

      const imageUri = await viewShotRef.current.capture();

      await Share.open({
        title: 'Compartir comprobante',
        message: 'Comprobante de pago - ' + dayjs().format('DD/MM/YYYY'),
        url: `file://${imageUri}`,
        type: 'image/png',
      });

      Alert.alert('Éxito', 'Imagen compartida exitosamente.');
    } catch (error) {
      console.error('Error al generar o compartir la imagen:', error);
      Alert.alert('Error', 'No se pudo generar o compartir la imagen.');
    } finally {
    }
  };

  const TICKET_TYPE =
    pago.FORMA_COBRO_ID === CONDONACION_ID ? 'CONDONACION' : 'PAGO';

  const ticketText = `
TICKET DE ${TICKET_TYPE}

FOLIO: ${sale.FOLIO}
CLIENTE: ${NEGRITAS_ON}${sale.CLIENTE}${NEGRITAS_OFF}
DIRECCION: ${sale.CALLE + ' ' + sale.CIUDAD + ', ' + sale.ESTADO}
TELEFONO: ${sale.TELEFONO}
FECHA VENTA: ${dayjs(sale.FECHA).format('DD/MM/YYYY')}
PRECIO TOTAL $${sale.PRECIO_TOTAL.toFixed(2)}
PRECIO A ${sale.TIEMPO_A_CORTO_PLAZOMESES} MESES: $${sale.MONTO_A_CORTO_PLAZO}
PRECIO DE CONTADO: $${sale.PRECIO_DE_CONTADO}
ENGANCHE: $${sale.ENGANCHE.toFixed(2)}
PARCIALIDAD: $${sale.PARCIALIDAD.toFixed(2)}
VENDEDORES:
${sale.VENDEDOR_1 && '- ' + sale.VENDEDOR_1}
${sale.VENDEDOR_2 && '- ' + sale.VENDEDOR_2}
${sale.VENDEDOR_3 && '- ' + sale.VENDEDOR_3}

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

FECHA DE ${TICKET_TYPE}: ${dayjs(pago.FECHA_HORA_PAGO).format(
    'DD/MM/YYYY HH:mm',
  )}
SALDO ANTERIOR: ${NEGRITAS_ON}$${sale.SALDO_REST + pago.IMPORTE}${NEGRITAS_OFF}
IMPORTE DE ${TICKET_TYPE}: ${NEGRITAS_ON}$${pago.IMPORTE}${NEGRITAS_OFF}
SALDO ACTUAL: ${NEGRITAS_ON}$${sale.SALDO_REST}${NEGRITAS_OFF}

--------------------------------

HISTORIAL DE PAGOS
${paymentsOrder
  .map(
    pago =>
      `- ${
        pago.FORMA_COBRO_ID === CONDONACION_ID ? 'CONDONACION' : 'ABONO'
      }: $${pago.IMPORTE.toFixed(2)} - ${dayjs(pago.FECHA_HORA_PAGO).format(
        'DD/MM/YYYY',
      )}`,
  )
  .join('\n')}

--------------------------------

EXIJA SU COMPROBANTE DE PAGO
!!!GRACIAS POR SU PREFERENCIA!!!

TELEFONO: 238-3740684
WHATSAPP: 238-1105061
AGENTE: ${pago.COBRADOR}
TELEFONO DEL AGENTE: ${userData.TELEFONO}
`;

  const ticketTextString = `
TICKET DE ${TICKET_TYPE}

FOLIO: ${sale.FOLIO}
CLIENTE: ${sale.CLIENTE}
DIRECCION: ${sale.CALLE + ' ' + sale.CIUDAD + ', ' + sale.ESTADO}
TELEFONO: ${sale.TELEFONO}
FECHA VENTA: ${dayjs(sale.FECHA).format('DD/MM/YYYY')}
PRECIO TOTAL $${sale.PRECIO_TOTAL.toFixed(2)}
PRECIO A ${sale.TIEMPO_A_CORTO_PLAZOMESES} MESES: $${sale.MONTO_A_CORTO_PLAZO}
PRECIO DE CONTADO: $${sale.PRECIO_DE_CONTADO}
ENGANCHE: $${sale.ENGANCHE.toFixed(2)}
PARCIALIDAD: $${sale.PARCIALIDAD.toFixed(2)}
VENDEDORES:
${sale.VENDEDOR_1 && '- ' + sale.VENDEDOR_1}
${sale.VENDEDOR_2 && '- ' + sale.VENDEDOR_2}
${sale.VENDEDOR_3 && '- ' + sale.VENDEDOR_3}

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

FECHA DE ${TICKET_TYPE}: ${dayjs(pago.FECHA_HORA_PAGO).format(
    'DD/MM/YYYY HH:mm',
  )}
SALDO ANTERIOR: $${sale.SALDO_REST + pago.IMPORTE}
IMPORTE DE ${TICKET_TYPE}: $${pago.IMPORTE}
SALDO ACTUAL: $${sale.SALDO_REST}

--------------------------------

HISTORIAL DE PAGOS
${paymentsOrder
  .map(
    pago =>
      `- ${
        pago.FORMA_COBRO_ID === CONDONACION_ID ? 'CONDONACION' : 'ABONO'
      }: $${pago.IMPORTE.toFixed(2)} - ${dayjs(pago.FECHA_HORA_PAGO).format(
        'DD/MM/YYYY',
      )}`,
  )
  .join('\n')}

--------------------------------

EXIJA SU COMPROBANTE DE PAGO
!!!GRACIAS POR SU PREFERENCIA!!!

TELEFONO: 238-3740684
WHATSAPP: 238-1105061
AGENTE: ${pago.COBRADOR}
TELEFONO DEL AGENTE: ${userData.TELEFONO}
`;

  const isLoading =
    loading ||
    saleLoading ||
    printerLoading ||
    paymentsLoading ||
    productosLoading;

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
      <View style={{gap: 8, marginBottom: 20}}>
        <Button
          disabled={loading || !selectedPrinter}
          title="CONECTAR IMPRESORA"
          onPress={connectPrinter}
        />
        <Button
          disabled={loading || !selectedPrinter}
          title="IMPRIMIR TICKET"
          onPress={() => {
            print(ticketText);
          }}
        />

        <Button title="COMPARTIR COMPROBANTE" onPress={handleShareImage} />
      </View>

      <ViewShot ref={viewShotRef} options={{format: 'png', quality: 1}}>
        <TicketSVG ticketText={ticketTextString} width={1000} />
      </ViewShot>
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
