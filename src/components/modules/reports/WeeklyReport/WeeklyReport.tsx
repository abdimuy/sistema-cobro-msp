import {View, Text, StyleSheet, Pressable, ScrollView} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {openDatabase} from '../../../../sqlite/connection';
import {
  CONDONACION_ID,
  PAGO_CON_TRANSFERENCIA_ID,
  PAGO_EN_EFECTIVO_ID,
  Payment,
} from '../../sales/SaleDetails/SaleDetails';
import {AuthContext} from '../../../../../App';
import dayjs from 'dayjs';
import {NEGRITAS_OFF, NEGRITAS_ON} from '../../../../contants/printerCommans';
import usePrinter from '../../../../hooks/usePrinter';
import {Picker} from '@react-native-picker/picker';
import {PagoServer} from '../../../../screens/home/Home';

export type LocalPayment = Omit<
  Payment,
  'FECHA_HORA_PAGO' | 'GUARDADO_EN_MICROSIP'
> & {
  FECHA_HORA_PAGO: string;
  GUARDADO_EN_MICROSIP: number;
};

const WeeklyReport = () => {
  const {userData} = useContext(AuthContext);
  const [pagos, setPagos] = useState<PagoServer[]>([]);

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
      const query = `
      SELECT *
      FROM pagos
      WHERE FECHA_HORA_PAGO >= ?
      AND FORMA_COBRO_ID IN (157, 158, 52569)
      ORDER BY FECHA_HORA_PAGO DESC;
    `;
      const [results] = await dbSqlite.executeSql(query, [
        userData.FECHA_CARGA_INICIAL.toDate().toISOString(),
      ]);

      const pagos: PagoServer[] = results.rows.raw() as PagoServer[];
      setPagos(pagos);
    } catch (error) {
      console.error('Error getting local payments', error);
    }
  };

  useEffect(() => {
    getListDevices();
    getLocalPayments();
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
    return `${dayjs(pago.FECHA_HORA_PAGO).format(
      'HH:mm',
    )} ${pago?.NOMBRE_CLIENTE?.slice(0, 19)} $ ${pago.IMPORTE}
`;
  })
  .join('')}
--------------------------------
CONDONACIONES
${pagos
  .filter(pago => pago.FORMA_COBRO_ID === CONDONACION_ID)
  .map(pago => {
    return `${dayjs(pago.FECHA_HORA_PAGO).format(
      'HH:mm',
    )} ${pago?.NOMBRE_CLIENTE?.slice(0, 19)} $ ${pago.IMPORTE}
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
      <Text style={styles.title}>Reporte Semanal</Text>

      <ScrollView style={styles.list}>
        {pagos.map(pago => (
          <View key={pago.DOCTO_CC_ID} style={styles.item}>
            <View style={{maxWidth: '90%'}}>
              <Text style={styles.itemSubtitle}>
                {dayjs(pago.FECHA_HORA_PAGO).format('DD/MM/YYYY - HH:mm A')}
              </Text>
              <Text style={styles.itemTitle}>{pago.NOMBRE_CLIENTE}</Text>
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
