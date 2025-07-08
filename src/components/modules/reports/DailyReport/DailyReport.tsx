import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  PAGO_CON_TRANSFERENCIA_ID,
  PAGO_EN_EFECTIVO_ID,
} from '../../sales/SaleDetails/SaleDetails';
import dayjs from 'dayjs';
import {AuthContext} from '../../../../../App';
import usePrinter from '../../../../hooks/usePrinter';
import {Picker} from '@react-native-picker/picker';
import {NEGRITAS_OFF, NEGRITAS_ON} from '../../../../contants/printerCommans';
import DateTimePicker from '@react-native-community/datetimepicker';
import {openDatabase} from '../../../../sqlite/connection';
import {PagoServer} from '../../../../screens/home/Home';
import {Rect, Svg, Text as SVGText} from 'react-native-svg';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import useGetVisitas from '../../../../hooks/useGetVisitas';

const DailyReport = () => {
  const {userData} = useContext(AuthContext);
  const [pagos, setPagos] = useState<PagoServer[]>([]);
  const [date, setDate] = useState<Date>(dayjs().toDate());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [orderBy, setOrderBy] = useState<'NOMBRE' | 'FECHA'>('NOMBRE');

  const totalCobradoConEfectivo = pagos
    .filter(pago => pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID)
    .reduce((acc, pago) => acc + pago.IMPORTE, 0);
  const totalCobradoConTransferencia = pagos
    .filter(pago => pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID)
    .reduce((acc, pago) => acc + pago.IMPORTE, 0);
  const totalPagosEfectivo = pagos.filter(
    pago => pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID,
  ).length;
  const totalPagosTransferencia = pagos.filter(
    pago => pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID,
  ).length;

  const {
    connectPrinter,
    devices,
    loading: printerLoading,
    print,
    savePrinter,
    selectedPrinter,
    getListDevices,
  } = usePrinter();

  const {visitas, loading: loadingVisitas} = useGetVisitas(
    dayjs(date).startOf('day').toISOString(),
  );

  const getPagosDiarios = async () => {
    const dateQ = dayjs(date).startOf('day');
    const startOfDay = dateQ.toISOString();
    const endOfDay = dateQ.endOf('day').toISOString();

    const query = `
      SELECT *
      FROM pagos
      WHERE FECHA_HORA_PAGO BETWEEN '${startOfDay}' AND '${endOfDay}'
      AND FORMA_COBRO_ID IN (157, 158, 52569)
      ORDER BY FECHA_HORA_PAGO DESC;
    `;

    const db = await openDatabase();
    const [result] = await db.executeSql(query);
    const pagos = result.rows.raw();

    setPagos(pagos);
    return pagos;
  };

  useEffect(() => {
    getListDevices();
    getPagosDiarios()
      .then(res =>
        res.map(pago => {
          return console.log({
            CLIENTE: pago.NOMBRE_CLIENTE,
            FECHA: dayjs(pago.FECHA_HORA_PAGO).toISOString(),
          });
        }),
      )
      .catch(err => console.log(err));
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
  .sort((a, b) => {
    if (orderBy === 'NOMBRE') {
      return a.NOMBRE_CLIENTE.localeCompare(b.NOMBRE_CLIENTE);
    }
    return dayjs(a.FECHA_HORA_PAGO).diff(dayjs(b.FECHA_HORA_PAGO));
  })
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

Total: $ ${NEGRITAS_ON}${total}${NEGRITAS_OFF}
Total de pagos: ${
    pagos.filter(
      pago =>
        pago.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID ||
        pago.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID,
    ).length
  }

Total en efectivo: $ ${NEGRITAS_ON}${totalCobradoConEfectivo}${NEGRITAS_OFF} (${totalPagosEfectivo} pagos)
Total en transferencia: $ ${NEGRITAS_ON}${totalCobradoConTransferencia}${NEGRITAS_OFF} (${totalPagosTransferencia} pagos)
  `;

  const changeOrderBy = () => {
    if (orderBy === 'NOMBRE') {
      setOrderBy('FECHA');
    } else {
      setOrderBy('NOMBRE');
    }
  };

  const viewShotRef = useRef<ViewShot>(null);
  const viewShotRefVisitas = useRef<ViewShot>(null);

  const heightTopMargin = 310;
  const heightLine = 30;

  const height = heightTopMargin + pagos.length * heightLine;
  const heightVisitas = heightTopMargin + visitas.length * heightLine;

  const svgComponent = (
    <Svg height={height} width="800">
      <Rect x="0" y="0" width="800" height={height} fill="white" />
      <SVGText x="10" y="20" fontSize="20" fill="black" fontWeight={600}>
        Reporte diario de pagos
      </SVGText>
      <SVGText x="10" y="50" fontSize="20" fill="black" fontWeight={600}>
        Fecha: {dayjs().format('DD/MM/YYYY')}
      </SVGText>
      <SVGText x="10" y="80" fontSize="20" fill="black" fontWeight={600}>
        Cobrador: {userData.NOMBRE}
      </SVGText>
      <SVGText x="10" y="140" fontSize="20" fill="black" fontWeight={600}>
        Total de cuentas: {pagos.length}
      </SVGText>
      <SVGText x="10" y="170" fontSize="20" fill="black" fontWeight={600}>
        Total cobrado: ${total}
      </SVGText>
      <SVGText x="10" y="200" fontSize="20" fill="black" fontWeight={600}>
        Total en efectivo: ${totalCobradoConEfectivo} ({totalPagosEfectivo}{' '}
        pagos)
      </SVGText>
      <SVGText x="10" y="230" fontSize="20" fill="black" fontWeight={600}>
        Total en transferencia: ${totalCobradoConTransferencia} (
        {totalPagosTransferencia} pagos)
      </SVGText>
      {pagos
        .sort((a, b) => {
          if (orderBy === 'NOMBRE') {
            return a.NOMBRE_CLIENTE.localeCompare(b.NOMBRE_CLIENTE);
          }
          return dayjs(a.FECHA_HORA_PAGO).diff(dayjs(b.FECHA_HORA_PAGO));
        })
        .map((pago, index) => {
          const position = heightTopMargin + heightLine * index;

          return (
            <>
              {index % 2 === 0 && (
                <Rect
                  x="0"
                  y={position - 22}
                  width="800"
                  height={heightLine}
                  fill="#d3d3d3"
                />
              )}
              <SVGText
                x="10"
                y={heightTopMargin + heightLine * index}
                fontSize="20"
                fill="black">
                {`${dayjs(pago.FECHA_HORA_PAGO).format(
                  'DD/MM/YYYY HH:mm',
                )}  -  $${pago.IMPORTE}  -  ${pago.NOMBRE_CLIENTE}`}
              </SVGText>
            </>
          );
        })}
    </Svg>
  );

  const svgComponentVisitas = (
    <Svg height={heightVisitas} width="800">
      <Rect x="0" y="0" width="800" height={heightVisitas} fill="white" />
      <SVGText x="10" y="20" fontSize="20" fill="black" fontWeight={600}>
        Reporte diario de visitas
      </SVGText>
      <SVGText x="10" y="50" fontSize="20" fill="black" fontWeight={600}>
        Fecha: {dayjs().format('DD/MM/YYYY')}
      </SVGText>
      <SVGText x="10" y="80" fontSize="20" fill="black" fontWeight={600}>
        Cobrador: {userData.NOMBRE}
      </SVGText>
      <SVGText x="10" y="140" fontSize="20" fill="black" fontWeight={600}>
        Total de visitas: {visitas.length}
      </SVGText>
      {visitas
        .sort((a, b) => {
          if (orderBy === 'NOMBRE') {
            return a.NOMBRE_CLIENTE.localeCompare(b.NOMBRE_CLIENTE);
          }
          return dayjs(a.FECHA).diff(dayjs(b.FECHA));
        })
        .map((pago, index) => {
          const position = heightTopMargin + heightLine * index;

          return (
            <>
              {index % 2 === 0 && (
                <Rect
                  x="0"
                  y={position - 22}
                  width="800"
                  height={heightLine}
                  fill="#d3d3d3"
                />
              )}
              <SVGText
                x="10"
                y={heightTopMargin + heightLine * index}
                fontSize="20"
                fill="black">
                {`${dayjs(pago.FECHA).format('DD/MM/YYYY HH:mm')}  -  ${
                  pago.NOMBRE_CLIENTE
                }`}
              </SVGText>
            </>
          );
        })}
    </Svg>
  );

  const handleShareImage = async () => {
    try {
      // Capturar la imagen
      if (
        !viewShotRef.current?.capture ||
        !viewShotRefVisitas.current?.capture
      ) {
        throw new Error('ViewShot ref is not initialized');
      }

      const imageUri = await viewShotRef.current.capture();
      const imageUriVisita = await viewShotRefVisitas.current.capture();

      // Compartir la imagen
      await Share.open({
        title: 'Compartir Imagen',
        message: 'Reporte diario - ' + dayjs().format('DD/MM/YYYY'),
        urls: [`file://${imageUri}`, `file://${imageUriVisita}`],
        type: 'image/png',
      });

      Alert.alert('Éxito', 'Imagen compartida exitosamente.');
    } catch (error) {
      console.error('Error al generar o compartir la imagen:', error);
      Alert.alert('Error', 'No se pudo generar o compartir la imagen.');
    } finally {
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reporte Diario</Text>
      <Pressable
        style={[styles.button]}
        onPress={() => {
          setShowDatePicker(true);
        }}>
        <Text style={[styles.buttonText]}>
          {dayjs(date).format('DD/MM/YYYY')}
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.button,
          {
            marginBottom: 20,
          },
        ]}
        onPress={() => {
          changeOrderBy();
        }}>
        <Text style={[styles.buttonText]}>
          {orderBy === 'NOMBRE' ? 'Ordenar por Nombre' : 'Ordenar por Fecha'}
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
        {pagos
          .sort((a, b) => {
            if (orderBy === 'NOMBRE') {
              return a.NOMBRE_CLIENTE.localeCompare(b.NOMBRE_CLIENTE);
            }
            return dayjs(a.FECHA_HORA_PAGO).diff(dayjs(b.FECHA_HORA_PAGO));
          })
          .map(pago => (
            <View key={pago.DOCTO_CC_ID} style={styles.item}>
              <View style={{maxWidth: '90%'}}>
                <Text style={styles.itemSubtitle}>
                  {dayjs(pago.FECHA_HORA_PAGO).format('hh:mm A')}
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
        <View
          style={{
            borderWidth: 1,
            borderColor: 'gray',
            borderRadius: 10,
            height: 50,
          }}>
          <Picker
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
      </View>
      <Pressable
        style={styles.button}
        onPress={() => {
          return connectPrinter();
        }}>
        <Text style={styles.buttonText}>Conectar Impresora</Text>
      </Pressable>
      <Pressable
        style={[styles.button]}
        onPress={() => {
          print(ticketText);
        }}>
        <Text style={styles.buttonText}>Imprimir</Text>
      </Pressable>
      <Pressable
        style={[styles.button, {marginBottom: 20}]}
        onPress={() => {
          handleShareImage();
        }}>
        <Text style={styles.buttonText}>Reporte en imagen</Text>
      </Pressable>
      <ViewShot
        ref={viewShotRef}
        options={{format: 'png', quality: 1}}
        style={{position: 'absolute', top: -9999, left: -9999}} // Oculta el ViewShot
      >
        {svgComponent}
      </ViewShot>
      <ViewShot
        ref={viewShotRefVisitas}
        options={{format: 'png', quality: 1}}
        style={{position: 'absolute', top: -9999, left: -9999}} // Oculta el ViewShot
      >
        {svgComponentVisitas}
      </ViewShot>
    </View>
  );
};

export const styles = StyleSheet.create({
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
    marginTop: 10,
    marginBottom: 5,
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 6,
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    paddingHorizontal: 20,
    marginBottom: 10,
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
    padding: 8,
    borderRadius: 10,
    marginTop: 8,
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
