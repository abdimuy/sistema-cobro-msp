import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import React, {useEffect} from 'react';
import {
  Timestamp,
  collection,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import {PAGOS_COLLECTION} from '../../../../constants/collections';
import {Payment, PaymentWithCliente} from '../../sales/SaleDetails/SaleDetails';
import {db} from '../../../../firebase/connection';
import dayjs from 'dayjs';
import {AuthContext} from '../../../../../App';
import usePrinter from '../../../../hooks/usePrinter';
import {Picker} from '@react-native-picker/picker';
import useSales from '../../../../screens/sales/Sales/useSales';
import {NEGRITAS_OFF, NEGRITAS_ON} from '../../../../contants/printerCommans';

const DailyReport = () => {
  const {userData} = React.useContext(AuthContext);
  const [pagos, setPagos] = React.useState<Payment[]>([]);
  const [pagosConCliente, setPagosConCliente] = React.useState<
    PaymentWithCliente[]
  >([]);
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
    const date = dayjs(userData.FECHA_CARGA_INICIAL.toDate()).isAfter(
      dayjs().startOf('day'),
    )
      ? Timestamp.fromDate(userData.FECHA_CARGA_INICIAL.toDate())
      : Timestamp.fromDate(dayjs().startOf('day').toDate());

    const q = query(
      collection(db, PAGOS_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', userData.ZONA_CLIENTE_ID),
      where('FECHA_HORA_PAGO', '>=', date),
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      setPagos(
        snapshot.docs.map(doc => ({...doc.data(), ID: doc.id})) as Payment[],
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const pagosConCliente = pagos.map(pago => {
      const sale = sales.find(s => s.DOCTO_CC_ID === pago.DOCTO_CC_ID);
      return {...pago, CLIENTE: sale?.CLIENTE} as PaymentWithCliente;
    });
    setPagosConCliente(pagosConCliente);
  }, [pagos, sales]);

  const total = pagos.reduce((acc, pago) => acc + pago.IMPORTE, 0);

  const ticketText = `REPORTE DIARIO DE COBRANZA

FECHA: ${dayjs().format('DD/MM/YYYY')}
COBRADOR: ${userData.NOMBRE}

--------------------------------

${pagosConCliente
  .map(pago => {
    return `${dayjs(pago.FECHA_HORA_PAGO.toDate()).format(
      'HH:mm',
    )} ${pago?.CLIENTE?.slice(0, 20)} $ ${pago.IMPORTE}
`;
  })
  .join('')}
--------------------------------

Total: $ ${NEGRITAS_ON}${total}${NEGRITAS_OFF}
Total de pagos: ${pagos.length}
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reporte Diario</Text>
      <ScrollView style={styles.list}>
        {pagosConCliente.map(pago => (
          <View key={pago.ID} style={styles.item}>
            <View style={{maxWidth: '90%'}}>
              <Text style={styles.itemSubtitle}>
                {dayjs(pago.FECHA_HORA_PAGO.toDate()).format('hh:mm A')}
              </Text>
              <Text style={styles.itemTitle}>{pago.CLIENTE}</Text>
            </View>
            <Text style={styles.itemAmount}>$ {pago.IMPORTE}</Text>
          </View>
        ))}
        <Text style={styles.total}>Total: $ {total}</Text>
      </ScrollView>
      <View style={styles.section}>
        <Text style={styles.total}>Selecciona una impresora: </Text>
        <Picker
          style={{color: 'black'}}
          selectedValue={selectedPrinter}
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
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    textAlign: 'center',
  },
  list: {
    display: 'flex',
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
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
    marginBottom: 10,
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

export default DailyReport;
