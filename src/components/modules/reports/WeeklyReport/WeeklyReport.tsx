import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {openDatabase} from '../../../../sqlite/connection';
import {
  CONDONACION_ID,
  PAGO_CON_TRANSFERENCIA_ID,
  PAGO_EN_EFECTIVO_ID,
  Payment,
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
import {NEGRITAS_OFF, NEGRITAS_ON} from '../../../../contants/printerCommans';
import usePrinter from '../../../../hooks/usePrinter';
import {Picker} from '@react-native-picker/picker';
import {useIsFocused} from '@react-navigation/native';

type LocalPayment = Omit<Payment, 'FECHA_HORA_PAGO'> & {
  FECHA_HORA_PAGO: string;
};

const WeeklyReport = () => {
  const {userData} = useContext(AuthContext);
  const [pagos, setPagos] = useState<Payment[]>([]);
  const [localPagos, setLocalPagos] = useState<LocalPayment[]>([]);
  const [reportType, setReportType] = useState<'local' | 'db'>('db');

  const {
    connectPrinter,
    devices,
    loading: printerLoading,
    print,
    savePrinter,
    selectedPrinter,
    getListDevices,
  } = usePrinter();

  const getLocalPayments = async () => {
    try {
      const dbSqlite = await openDatabase();
      const [results] = await dbSqlite.executeSql(
        `SELECT * FROM PAGOS WHERE ZONA_CLIENTE_ID = ? AND FECHA_HORA_PAGO >= ?`,
        [
          userData.ZONA_CLIENTE_ID,
          userData.FECHA_CARGA_INICIAL.toDate().toISOString(),
        ],
      );

      const pagos: LocalPayment[] = results.rows.raw() as LocalPayment[];
      setLocalPagos(pagos);
    } catch (error) {
      console.error('Error getting local payments', error);
    }
  };

  const deleteLocalPayments = async () => {
    try {
      console.log('Deleting local payments');
      const dbSqlite = await openDatabase();
      await dbSqlite.executeSql(`DELETE FROM PAGOS`);
      console.log('Local payments deleted');
    } catch (error) {
      console.error('Error deleting local payments', error);
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      getListDevices();
      getLocalPayments();
    }
  }, [isFocused]);

  useEffect(() => {
    getListDevices();
    getLocalPayments();
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

  const total = pagos.reduce((acc, pago) => {
    if (
      pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
      pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID
    ) {
      return acc + pago.IMPORTE;
    }
    return acc;
  }, 0);

  const totalLocal = localPagos.reduce((acc, pago) => {
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
CONDONACIONES
${pagos
  .filter(pago => pago.FORMA_COBRO_ID === CONDONACION_ID)
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

  const ticketTextLocal = `REPORTE SEMANAL DE COBRANZA (LOCAL)
  
FECHA: ${dayjs().format('DD/MM/YYYY')}
COBRADOR: ${userData.NOMBRE}

--------------------------------
PAGOS REALIZADOS
${localPagos
  .filter(
    pago =>
      pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
      pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID,
  )
  .map(pago => {
    return `${dayjs(pago.FECHA_HORA_PAGO).format(
      'HH:mm',
    )} ${pago?.NOMBRE_CLIENTE?.slice(0, 20)} $ ${pago.IMPORTE}
`;
  })
  .join('')}
--------------------------------
CONDONACIONES
${localPagos
  .filter(pago => pago.FORMA_COBRO_ID === CONDONACION_ID)
  .map(pago => {
    return `${dayjs(pago.FECHA_HORA_PAGO).format(
      'HH:mm',
    )} ${pago?.NOMBRE_CLIENTE?.slice(0, 20)} $ ${pago.IMPORTE}
`;
  })
  .join('')}
--------------------------------

Total: $ ${NEGRITAS_ON}${localPagos.reduce((acc, pago) => {
    if (
      pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
      pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID
    ) {
      return acc + pago.IMPORTE;
    }
    return acc;
  }, 0)}${NEGRITAS_OFF}
Total de pagos: ${
    localPagos.filter(
      pago =>
        pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
        pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID,
    ).length
  }
`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Reporte Semanal {reportType === 'local' && 'Local'}
      </Text>
      {
        <Pressable
          style={[
            styles.button,
            {
              marginBottom: 20,
            },
          ]}
          onPress={() => {
            setReportType(reportType === 'db' ? 'local' : 'db');
          }}>
          <Text style={styles.buttonText}>
            {reportType === 'db'
              ? 'Ver Reporte Local'
              : 'Ver Reporte en la Nube'}
          </Text>
        </Pressable>
      }
      <ScrollView style={styles.list}>
        {reportType === 'db'
          ? pagos.map(pago => (
              <View key={pago.ID} style={styles.item}>
                <View style={{maxWidth: '90%'}}>
                  <Text style={styles.itemSubtitle}>
                    {dayjs(pago.FECHA_HORA_PAGO.toDate()).format(
                      'DD/MM/YYYY - HH:mm A',
                    )}
                  </Text>
                  <Text style={styles.itemTitle}>{pago.NOMBRE_CLIENTE}</Text>
                </View>
                <Text style={styles.itemAmount}>$ {pago.IMPORTE}</Text>
              </View>
            ))
          : localPagos.map(pago => (
              <View key={pago.ID + 'local'} style={styles.item}>
                <View style={{maxWidth: '90%'}}>
                  <Text style={styles.itemSubtitle}>
                    {dayjs(pago.FECHA_HORA_PAGO).format('DD/MM/YYYY - HH:mm A')}
                  </Text>
                  <Text style={styles.itemTitle}>{pago.NOMBRE_CLIENTE}</Text>
                </View>
                <Text style={styles.itemAmount}>$ {pago.IMPORTE}</Text>
              </View>
            ))}
        <Text style={styles.total}>
          Total: $ {reportType === 'db' ? total : totalLocal}
        </Text>
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
          if (reportType === 'db') {
            print(ticketText);
          } else {
            print(ticketTextLocal);
          }
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
