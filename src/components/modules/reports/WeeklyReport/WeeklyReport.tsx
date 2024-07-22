import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {
  CONDONACION_ID,
  PAGO_CON_TRANSFERENCIA_ID,
  PAGO_EN_EFECTIVO_ID,
  Payment,
  PaymentWithCliente,
} from '../../sales/SaleDetails/SaleDetails';
import {
  Timestamp,
  collection,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import {PAGOS_COLLECTION} from '../../../../constants/collections';
import {db} from '../../../../firebase/connection';
import {AuthContext} from '../../../../../App';
import dayjs from 'dayjs';
import useSales from '../../../../screens/sales/Sales/useSales';
import {NEGRITAS_OFF, NEGRITAS_ON} from '../../../../contants/printerCommans';
import usePrinter from '../../../../hooks/usePrinter';
import {Picker} from '@react-native-picker/picker';

const WeeklyReport = () => {
  const {userData} = useContext(AuthContext);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [pagosConCliente, setPagosConCliente] = useState<PaymentWithCliente[]>(
    [],
  );
  const {sales} = useSales(userData.ZONA_CLIENTE_ID);

  const {
    connectPrinter,
    devices,
    loading: printerLoading,
    print,
    savePrinter,
    selectedPrinter,
    getListDevices,
  } = usePrinter();

  useEffect(() => {
    getListDevices();
    const q = query(
      collection(db, PAGOS_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', userData.ZONA_CLIENTE_ID),
      where(
        'FECHA_HORA_PAGO',
        '>=',
        Timestamp.fromDate(userData.FECHA_CARGA_INICIAL.toDate()),
      ),
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      setPagos(snapshot.docs.map(doc => doc.data()) as Payment[]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const pagosConCliente = pagos.map(pago => {
      const sale = sales.find(s => s.DOCTO_CC_ID === pago.DOCTO_CC_ID);
      return {
        ...pago,
        CLIENTE: sale?.CLIENTE,
        ID: pago.ID,
      } as PaymentWithCliente;
    });
    setPagosConCliente(pagosConCliente);
  }, [pagos, sales]);

  const total = pagos.reduce((acc, pago) => {
    if (
      pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
      pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID
    ) {
      return acc + pago.IMPORTE;
    }
    return acc;
  }, 0);
  const numeroPagos = pagos.length;

  const ticketText = `REPORTE SEMANAL DE COBRANZA

FECHA: ${dayjs().format('DD/MM/YYYY')}
COBRADOR: ${userData.NOMBRE}

--------------------------------
PAGOS REALIZADOS
${pagosConCliente
  .filter(
    pago =>
      pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
      pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID,
  )
  .map(pago => {
    return `${dayjs(pago.FECHA_HORA_PAGO.toDate()).format(
      'HH:mm',
    )} ${pago?.CLIENTE?.slice(0, 20)} $ ${pago.IMPORTE}
`;
  })
  .join('')}
--------------------------------
CONDONACIONES
${pagosConCliente
  .filter(pago => pago.FORMA_COBRO_ID === CONDONACION_ID)
  .map(pago => {
    return `${dayjs(pago.FECHA_HORA_PAGO.toDate()).format(
      'HH:mm',
    )} ${pago?.CLIENTE?.slice(0, 20)} $ ${pago.IMPORTE}
`;
  })
  .join('')}
--------------------------------

Total: $ ${NEGRITAS_ON}${total}${NEGRITAS_OFF}
Total de pagos: ${
    pagosConCliente.filter(
      pago =>
        pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
        pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID,
    ).length
  }
`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reporte Semanal</Text>
      <ScrollView style={styles.list}>
        {pagosConCliente.map(pago => (
          <View key={pago.ID} style={styles.item}>
            <View style={{maxWidth: '90%'}}>
              <Text style={styles.itemSubtitle}>
                {dayjs(pago.FECHA_HORA_PAGO.toDate()).format(
                  'DD/MM/YYYY - HH:mm A',
                )}
              </Text>
              <Text style={styles.itemTitle}>{pago.CLIENTE}</Text>
            </View>
            <Text style={styles.itemAmount}>$ {pago.IMPORTE}</Text>
          </View>
        ))}
        <Text style={styles.total}>Total: $ {total}</Text>
      </ScrollView>
      <View style={styles.section}>
        <Text
          style={{
            color: 'black',
          }}>
          Selecciona una impresora:{' '}
        </Text>
        <Picker
          selectedValue={selectedPrinter}
          style={{color: 'black', borderColor: 'black', borderWidth: 1}}
          onValueChange={itemValue => savePrinter(itemValue)}>
          <Picker.Item
            label="Selecciona una impresora"
            value={null}
            key={`printer-item-null`}
          />
          {devices.map((item, index) => (
            <Picker.Item
              label={item.device_name}
              value={item}
              key={`printer-item-${item.inner_mac_address}`}
            />
          ))}
        </Picker>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => {
          return connectPrinter();
        }}>
        <Text style={styles.buttonText}>Conectar Impresora</Text>
      </Pressable>
      <Pressable
        style={[styles.button, {marginBottom: 20}]}
        onPress={() => {
          print(ticketText);
        }}>
        <Text style={styles.buttonText}>Imprimir</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
  },
  section: {
    display: 'flex',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    marginBottom: 20,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 20,
    marginBottom: 20,
    width: '100%',
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  itemTitle: {
    fontSize: 18,
    color: 'black',
  },
  itemSubtitle: {
    fontSize: 14,
    color: 'grey',
  },
  itemAmount: {
    fontSize: 18,
    color: 'black',
    width: 55,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: '90%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WeeklyReport;
