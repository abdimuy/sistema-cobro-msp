import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {
  Timestamp,
  collection,
  onSnapshot,
  query,
  where,
} from '@react-native-firebase/firestore';
import {PAGOS_COLLECTION} from '../../../../constants/collections';
import {
  PAGO_CON_TRANSFERENCIA_ID,
  PAGO_EN_EFECTIVO_ID,
  Payment,
} from '../../sales/SaleDetails/SaleDetails';
import {db} from '../../../../firebase/connection';
import dayjs from 'dayjs';
import {AuthContext} from '../../../../../App';
import usePrinter from '../../../../hooks/usePrinter';
import {Picker} from '@react-native-picker/picker';
import useSales from '../../../../screens/sales/Sales/useSales';
import {NEGRITAS_OFF, NEGRITAS_ON} from '../../../../contants/printerCommans';
import DateTimePicker from '@react-native-community/datetimepicker';

const DailyReport = () => {
  const {userData} = useContext(AuthContext);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const {sales} = useSales(userData.ZONA_CLIENTE_ID);
  const [date, setDate] = useState<Date>(dayjs().toDate());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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
    const dateQ = dayjs(date).startOf('day');

    const q = query(
      collection(db, PAGOS_COLLECTION),
      where('ZONA_CLIENTE_ID', '==', userData.ZONA_CLIENTE_ID),
      where('FECHA_HORA_PAGO', '>=', Timestamp.fromDate(dateQ.toDate())),
      where(
        'FECHA_HORA_PAGO',
        '<=',
        Timestamp.fromDate(dayjs(date).endOf('day').toDate()),
      ),
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      setPagos(
        snapshot.docs.map(doc => ({...doc.data(), ID: doc.id})) as Payment[],
      );
    });

    return () => {
      unsubscribe();
    };
  }, [date]);

  const total = pagos.reduce((acc, pago) => {
    if (
      pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
      pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID
    ) {
      return acc + pago.IMPORTE;
    }
    return acc;
  }, 0);

  const ticketText = `REPORTE DIARIO DE COBRANZA

FECHA: ${dayjs().format('DD/MM/YYYY')}
COBRADOR: ${userData.NOMBRE}

--------------------------------

${pagos
  .filter(
    pago =>
      pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
      pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID,
  )
  .map(pago => {
    return `${dayjs(pago.FECHA_HORA_PAGO.toDate()).format(
      'HH:mm',
    )} ${pago?.NOMBRE_CLIENTE?.slice(0, 20)} $ ${pago.IMPORTE}
`;
  })
  .join('')}
--------------------------------

Total: $ ${NEGRITAS_ON}${total}${NEGRITAS_OFF}
Total de pagos: ${
    pagos.filter(
      pago =>
        pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
        pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID,
    ).length
  }
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reporte Diario</Text>
      <Pressable
        style={[
          styles.button,
          {
            marginBottom: 20,
          },
        ]}
        onPress={() => {
          setShowDatePicker(true);
        }}>
        <Text style={[styles.buttonText]}>
          {dayjs(date).format('DD/MM/YYYY')}
        </Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            setDate(selectedDate || new Date());
          }}
        />
      )}
      <ScrollView style={styles.list}>
        {pagos.map(pago => (
          <View key={pago.ID} style={styles.item}>
            <View style={{maxWidth: '90%'}}>
              <Text style={styles.itemSubtitle}>
                {dayjs(pago.FECHA_HORA_PAGO.toDate()).format('hh:mm A')}
              </Text>
              <Text style={styles.itemTitle}>{pago.NOMBRE_CLIENTE}</Text>
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
    marginBottom: 5,
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
