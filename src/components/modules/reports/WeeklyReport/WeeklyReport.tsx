import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import React, {useContext, useEffect, useRef, useState} from 'react';
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
import {Rect, Svg, Text as SVGText} from 'react-native-svg';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import useGetVisitas from '../../../../hooks/useGetVisitas';

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

  const {visitas, loading: loadingVisitas} = useGetVisitas();

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
      console.log(userData.FECHA_CARGA_INICIAL.toDate().toISOString());
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

  const viewShotRef = useRef<ViewShot>(null);
  const viewShotRefVisitas = useRef<ViewShot>(null);

  const heightTopMargin = 250;
  const heightLine = 30;

  const height = heightTopMargin + pagos.length * heightLine;

  const svgComponent = (
    <Svg height={height} width="800">
      <Rect x="0" y="0" width="800" height={height} fill="white" />
      <SVGText x="10" y="20" fontSize="20" fill="black" fontWeight={600}>
        Reporte semanal de pagos
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
      {pagos.map((pago, index) => {
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
            <SVGText x="10" y={position} fontSize="20" fill="black">
              {`${dayjs(pago.FECHA_HORA_PAGO).format(
                'DD/MM/YYYY HH:mm',
              )}  -  $${pago.IMPORTE}  -  ${pago.NOMBRE_CLIENTE}`}
            </SVGText>
          </>
        );
      })}
      <SVGText
        x="10"
        y="80"
        fontSize="20"
        fill="black"
        fontWeight={600}></SVGText>
    </Svg>
  );
  const svgComponentVisitas = (
    <Svg height={height} width="800">
      <Rect x="0" y="0" width="800" height={height} fill="white" />
      <SVGText x="10" y="20" fontSize="20" fill="black" fontWeight={600}>
        Reporte semanal de visitas
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
      {visitas.map((visita, index) => {
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
            <SVGText x="10" y={position} fontSize="20" fill="black">
              {`${dayjs(visita.FECHA).format('DD/MM/YYYY HH:mm')}  -  ${
                visita?.NOMBRE_CLIENTE
              }`}
            </SVGText>
          </>
        );
      })}
      <SVGText
        x="10"
        y="80"
        fontSize="20"
        fill="black"
        fontWeight={600}></SVGText>
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
      console.log('Imagen capturada:', imageUri);
      const imageUriVisitas = await viewShotRefVisitas.current.capture();

      // Compartir la imagen
      await Share.open({
        title: 'Compartir Imagen',
        message: 'Reporte semanal - ' + dayjs().format('DD/MM/YYYY'),
        urls: [`file://${imageUri}`, `file://${imageUriVisitas}`],
        type: 'application/octet-stream',
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
    marginTop: 10,
    marginBottom: 10,
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
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
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
