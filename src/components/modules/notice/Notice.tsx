import React, {useContext, useEffect, useState} from 'react';
import {Picker} from '@react-native-picker/picker';
import {
  StyleSheet,
  View,
  Text,
  Button,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import usePrinter from '../../../hooks/usePrinter';
import {SalesStackParamList} from '../../../routes/SalesRoutes';
import {RouteProp} from '@react-navigation/native';
import {useRoute} from '@react-navigation/core';
import useGetSale from '../../../hooks/useGetSale';
import dayjs from 'dayjs';
import {AuthContext} from '../../../../App';

type SaleDetailScreenRouteProp = RouteProp<SalesStackParamList, 'Payment'>;

export default function Notice() {
  const route = useRoute<SaleDetailScreenRouteProp>();
  const {userData} = useContext(AuthContext);
  const {saleId} = route.params;
  const {
    sale,
    loading: saleLoading,
    porcentajeParcialBySale,
  } = useGetSale(saleId);
  const [typeTicket, setTypeTicket] = useState<number>(1);

  const tickets = [
    {
      label: 'Ticket de visita',
      content: `
SU AGENTE DE COBRANZA DE MUEBLES SAN PABLO PASÓ A VISITARLO EN SU
DOMICILIO PARA SU PAGO CORRESPONDIENTE DE ESTA SEMANA, PERO NO FUE
POSIBLE ENCONTRARLO, LE INFORMO QUE PASARÉ NUEVAMENTE A VISITARLO
MÁS TARDE. EN CASO DE NO ENCONTRARSE LE PEDIMOS DE FAVOR NOS PUEDA
APOYAR DEJANDO SU PAGO CORRESPONDIENTE CON LA PERSONA QUE SE
ENCUENTRE EN SU DOMICILIO O LLÁMAME PARA COORDINARNOS EN EL HORARIO
QUE LO PUEDA VISITAR.
      `,
    },
    {
      label: 'Ticket de cliente moroso',
      content: `
EN REITERADAS OCASIONES HEMOS TRATADO DE ACERCARNOS A USTED PARA SOLUCIONAR SU ADEUDO PENDIENTE, SIN EMBARGO, NO HEMOS TENIDO UNA RESPUESTA FAVORABLE.

CON LA INTENCIÓN DE EVITARLE CONTINUAR CON EL PROCESO DE COBRO POR OTRA VÍA, ASÍ COMO GASTOS INNECESARIOS, LO INVITAMOS A QUE JUNTOS ENCONTREMOS LA ALTERNATIVA QUE MÁS SE ACOMODE PARA SOLUCIONAR EN DEFINITIVA ESTA SITUACIÓN.   

SU FECHA DE VENCIMIENTO DE SU CREDITO ES EL DIA: ${dayjs(sale.FECHA)
        .add(1, 'year')
        .format('DD/MM/YYYY')}

--------------------------------

TOTAL DE COMPRA: $${sale.PRECIO_TOTAL}

SALDO ACTUAL: $${sale.SALDO_REST}

PAGOS VENCIDOS: ${porcentajeParcialBySale.NUM_PAGOS_ATRASADOS.toFixed(0)}

SUGERIDO PARA REGULARIZARSE: $${
        Math.trunc(porcentajeParcialBySale.NUM_PAGOS_ATRASADOS) *
        porcentajeParcialBySale.PARCIALIDAD
      }
  `,
    },
    {
      label: 'Ticket no va a dar pago',
      content: `
RECUERDE QUE LA PUNTUALIDAD EN SUS PAGOS ES LA BASE PARA MANTENER UN BUEN HISTORIAL DE CRÉDITO.
  
SU COMPROMISO FUE DAR ABONOS EN FORMA SEMANAL DE MANERA CONSTANTE, SE LE EXHORTA A REGULARIZARSE CON SUS PAGOS DE $200.00 PARA EVITAR ALGÚN TIPO DE PENALIZACIÓN.

SU FECHA DE VENCIMIENTO DE SU CREDITO ES EL DIA: ${dayjs(sale.FECHA)
        .add(1, 'year')
        .format('DD/MM/YYYY')}

--------------------------------

TOTAL DE COMPRA: $${sale.PRECIO_TOTAL}

SALDO ACTUAL: $${sale.SALDO_REST}

PAGOS VENCIDOS: ${porcentajeParcialBySale.NUM_PAGOS_ATRASADOS.toFixed(0)}

SUGERIDO PARA REGULARIZARSE: $${
        Math.trunc(porcentajeParcialBySale.NUM_PAGOS_ATRASADOS) *
        porcentajeParcialBySale.PARCIALIDAD
      }
`,
    },
  ];

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

  const ticketText = `
MUEBLES SAN PABLO

TICKET DE VISITA DE COBRANZA

--------------------------------

${dayjs().format('DD/MM/YYYY HH:mm')}

ESTIMADO CLIENTE:
${sale.CLIENTE}

--------------------------------

${tickets[typeTicket - 1].content}

--------------------------------

ATENTAMENTE
${userData.NOMBRE}
GESTOR DE COBRANZA


TEL: ${userData.TELEFONO}

--------------------------------
`;

  const isLoading = saleLoading || printerLoading;

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Selecciona una impresora: </Text>
        <View
          style={{
            borderWidth: 1,
            borderColor: 'gray',
            borderRadius: 10,
            marginBottom: 10,
          }}>
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
      </View>
      <Button
        disabled={!selectedPrinter}
        title="CONECTAR IMPRESORA"
        onPress={connectPrinter}
      />
      <Button
        disabled={!selectedPrinter}
        title="IMPRIMIR TICKET"
        onPress={() => {
          print(ticketText);
        }}
      />
      <View
        style={{
          borderWidth: 1,
          borderColor: 'gray',
          borderRadius: 10,
          marginVertical: 10,
        }}>
        <Picker
          selectedValue={typeTicket}
          onValueChange={value => {
            setTypeTicket(value);
          }}>
          {tickets.map((item, i) => (
            <Picker.Item
              label={item.label}
              value={i + 1}
              key={`printer-item-${item.label}`}
            />
          ))}
        </Picker>
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>MUEBLES SAN PABLO</Text>

        <Text style={styles.title}>TICKET DE VISITA DE COBRANZA</Text>

        <Text style={styles.item}>
          <Text style={styles.label}>{tickets[typeTicket - 1].content}</Text>
        </Text>
        <Text style={styles.item}>
          {/* <Text style={styles.label}>!!!GRACIAS POR SU PREFERENCIA!!!</Text> */}
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
