import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import homeStyles from './home.styles';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {BACKGROUND_COLOR_PRIMARY, PRIMARY_COLOR} from '../../contants/colors';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar/FocusAwareStatusBar';
import {AuthContext} from '../../../App';
import useGetPagosRuta from '../../hooks/useGetPagosRuta';
import {auth, db} from '../../firebase/connection';
import {openDatabase} from '../../sqlite/connection';
import api from '../../services/api';
import {getUnsynchronizedLocalPayment} from '../../services/getUnsynchronizedLocalPayment';
import dayjs from 'dayjs';
import sendPago from '../../services/sendPago';
import {
  PaymentDto,
  Producto,
} from '../../components/modules/sales/SaleDetails/SaleDetails';
import {doc, Timestamp, writeBatch} from '@react-native-firebase/firestore';
import {AxiosError} from 'axios';

export interface SaleServer {
  DOCTO_CC_ACR_ID: number;
  DOCTO_CC_ID: number;
  FOLIO: string;
  CLIENTE_ID: number;
  APLICADO: string;
  COBRADOR_ID: number;
  CLIENTE: string;
  ZONA_CLIENTE_ID: number;
  LIMITE_CREDITO: number;
  NOTAS: string;
  ZONA_NOMBRE: string;
  IMPORTE_PAGO_PROMEDIO: number | null;
  TOTAL_IMPORTE: number;
  NUM_IMPORTES: number;
  FECHA: string; // ISO 8601 Date string
  PARCIALIDAD: number;
  ENGANCHE: number;
  TIEMPO_A_CORTO_PLAZOMESES: number;
  MONTO_A_CORTO_PLAZO: number;
  VENDEDOR_1: string;
  VENDEDOR_2: string;
  VENDEDOR_3: string;
  PRECIO_TOTAL: number;
  IMPTE_REST: number;
  SALDO_REST: number;
  FECHA_ULT_PAGO: string | null; // ISO 8601 Date string
  CALLE: string;
  CIUDAD: string;
  ESTADO: string;
  TELEFONO: string;
  NOMBRE_COBRADOR: string;
  ESTADO_COBRANZA: 'PAGADO' | 'NO PAGADO' | 'PENDIENTE';
  DIA_COBRANZA: string;
  DIA_TEMPORAL_COBRANZA: string;
}

export interface PagoServer {
  CLIENTE_ID: number;
  COBRADOR: string;
  COBRADOR_ID: number;
  DOCTO_CC_ACR_ID: number;
  DOCTO_CC_ID: number;
  FECHA_HORA_PAGO: string; // ISO 8601 Date string
  FORMA_COBRO_ID: number;
  GUARDADO_EN_MICROSIP: boolean;
  IMPORTE: number;
  LAT: string; // Assuming LAT is a string, possibly empty
  LNG: string; // Assuming LNG is a string, possibly empty
  ZONA_CLIENTE_ID: number;
  NOMBRE_CLIENTE: string;
}

const Home = () => {
  const {
    userData,
    sales,
    salesLoading: loading,
  } = React.useContext(AuthContext);

  const [loadingCargaInicial, setLoadingCargaInicial] = useState(false);
  const [pagosNotSent, setPagosNotSent] = useState<PagoServer[]>([]);
  const [loadingPagosNotSent, setLoadingPagosNotSent] = useState<boolean>(true);
  const {
    loading: loadingPagos,
    pagos,
    pagosHoy,
  } = useGetPagosRuta(userData.ZONA_CLIENTE_ID);

  const totalCobradoSemanal = pagos.reduce(
    (acc, pago) => acc + pago.IMPORTE,
    0,
  );
  const totalCobradoHoy = pagosHoy.reduce((acc, pago) => acc + pago.IMPORTE, 0);

  const porcentaje = (pagos.length / sales.length) * 100;

  const handlerCargaInicial = async () => {
    try {
      const pagosNotSent = await getUnsynchronizedLocalPayment();
      if (pagosNotSent.length > 0) {
        Alert.alert(
          'No se puede realizar la carga inicial',
          'Aún hay pagos sin enviar, envíalos antes de realizar la carga inicial',
          [
            {
              text: 'Aceptar',
            },
          ],
          {cancelable: false},
        );
        return;
      }
      setLoadingCargaInicial(true);
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userData.ID), {
        FECHA_CARGA_INICIAL: Timestamp.now(),
      });
      batch
        .commit()
        .then(() => {
          console.log('Carga inicial exitosa');
          setLoadingCargaInicial(false);
          ToastAndroid.show('Carga inicial exitosa', ToastAndroid.SHORT);
        })
        .catch(error => {
          console.error('Error al realizar la carga inicial', error);
          setLoadingCargaInicial(false);
        });
    } catch (error) {
      console.error('Error al realizar la carga inicial', error);
      setLoadingCargaInicial(false);
    }
  };

  const getLocalPaymentsNotSent = async () => {
    return getUnsynchronizedLocalPayment()
      .then(pagos => {
        console.log('Pagos no enviados', pagos.length);
        setPagosNotSent(pagos);
      })
      .catch(err => {
        console.error('Error al obtener los pagos locales no enviados', err);
      })
      .finally(() => {
        setLoadingPagosNotSent(false);
      });
  };

  useEffect(() => {
    getLocalPaymentsNotSent();
    return () => {
      console.log('Home unmounted');
    };
  }, []);

  const getDataFromServer = async () => {
    try {
      const pagosNotSent = await getUnsynchronizedLocalPayment();
      if (pagosNotSent.length > 0) {
        Alert.alert(
          'No se puede actualizar los datos',
          'Aún hay pagos sin enviar, envíalos antes de actualizar los datos',
          [
            {
              text: 'Aceptar',
            },
          ],
          {cancelable: false},
        );
        return;
      }
      setLoadingCargaInicial(true);
      const serverData = await api.get<{
        body: {
          ventas: SaleServer[];
          pagos: PagoServer[];
          productos: Producto[];
        };
      }>('/ventas/getAllVentasByZona/' + userData.ZONA_CLIENTE_ID);
      const dbSqlite = await openDatabase();
      await dbSqlite.executeSql(`
        DELETE FROM ventas;
      `);
      await dbSqlite.executeSql(`
        DELETE FROM pagos;
      `);
      await dbSqlite.executeSql(`
        DELETE FROM productos;
      `);

      const ventas = serverData.data.body.ventas;

      const query = `
        INSERT INTO ventas (
          DOCTO_CC_ACR_ID,
          DOCTO_CC_ID,
          FOLIO,
          CLIENTE_ID,
          APLICADO,
          COBRADOR_ID,
          CLIENTE,
          ZONA_CLIENTE_ID,
          LIMITE_CREDITO,
          NOTAS,
          ZONA_NOMBRE,
          IMPORTE_PAGO_PROMEDIO,
          TOTAL_IMPORTE,
          NUM_IMPORTES,
          FECHA,
          PARCIALIDAD,
          ENGANCHE,
          TIEMPO_A_CORTO_PLAZOMESES,
          MONTO_A_CORTO_PLAZO,
          VENDEDOR_1,
          VENDEDOR_2,
          VENDEDOR_3,
          PRECIO_TOTAL,
          IMPTE_REST,
          SALDO_REST,
          FECHA_ULT_PAGO,
          CALLE,
          CIUDAD,
          ESTADO,
          TELEFONO,
          NOMBRE_COBRADOR,
          DIA_COBRANZA,
          ESTADO_COBRANZA,
          DIA_TEMPORAL_COBRANZA
        ) VALUES ${ventas
          .map(
            v => `(
            ${v.DOCTO_CC_ACR_ID},
            ${v.DOCTO_CC_ID},
            '${v.FOLIO.replace(/'/g, "''")}', -- Escapado de comillas simples
            ${v.CLIENTE_ID},
            '${v.APLICADO.replace(/'/g, "''")}', -- Escapado de comillas simples
            ${v.COBRADOR_ID},
            '${v.CLIENTE.replace(/'/g, "''")}', -- Escapado de comillas simples
            ${v.ZONA_CLIENTE_ID},
            ${v.LIMITE_CREDITO},
            '${JSON.stringify(v.NOTAS).replace(/\\u[0-9A-fa-f]{4}/g, "''")}',
            '${v.ZONA_NOMBRE.replace(
              /'/g,
              "''",
            )}', -- Escapado de comillas simples
            ${
              v.IMPORTE_PAGO_PROMEDIO === null
                ? 'NULL'
                : v.IMPORTE_PAGO_PROMEDIO
            },
            ${v.TOTAL_IMPORTE},
            ${v.NUM_IMPORTES},
            '${
              v.FECHA
            }', -- Asegúrate de que la fecha esté en el formato correcto
            ${v.PARCIALIDAD},
            ${v.ENGANCHE},
            ${v.TIEMPO_A_CORTO_PLAZOMESES},
            ${v.MONTO_A_CORTO_PLAZO},
            '${v.VENDEDOR_1.replace(
              /'/g,
              "''",
            )}', -- Escapado de comillas simples
            '${v.VENDEDOR_2.replace(
              /'/g,
              "''",
            )}', -- Escapado de comillas simples
            '${v.VENDEDOR_3.replace(
              /'/g,
              "''",
            )}', -- Escapado de comillas simples
            ${v.PRECIO_TOTAL},
            ${v.IMPTE_REST},
            ${v.SALDO_REST},
            ${
              v.FECHA_ULT_PAGO === null ? 'NULL' : `'${v.FECHA_ULT_PAGO}'`
            }, -- Escapado y NULL
            '${JSON.stringify(v.CALLE).replace(
              /\\u[0-9A-fa-f]{4}/g,
              "''",
            )}', -- Escapado de comillas simples
            '${v.CIUDAD.replace(/'/g, "''")}', -- Escapado de comillas simples
            '${v.ESTADO.replace(/'/g, "''")}', -- Escapado de comillas simples
            '${v.TELEFONO.replace(/'/g, "''")}', -- Escapado de comillas simples
            '${v.NOMBRE_COBRADOR.replace(
              /'/g,
              "''",
            )}', -- Escapado de comillas simples
            '${v.DIA_COBRANZA.replace(
              /'/g,
              "''",
            )}', -- Escapado de comillas simples
            '${v.ESTADO_COBRANZA.replace(
              /'/g,
              "''",
            )}', -- Escapado de comillas simples
            '${v.DIA_TEMPORAL_COBRANZA.replace(
              /'/g,
              "''",
            )}' -- Escapado de comillas simples
          )`,
          )
          .join(',\n')};
      `;

      await dbSqlite.executeSql(query);

      const pagos = serverData.data.body.pagos;

      const queryPagos = `
        INSERT INTO pagos (
          CLIENTE_ID,
          COBRADOR,
          COBRADOR_ID,
          DOCTO_CC_ACR_ID,
          DOCTO_CC_ID,
          FECHA_HORA_PAGO,
          FORMA_COBRO_ID,
          GUARDADO_EN_MICROSIP,
          IMPORTE,
          LAT,
          LNG,
          ZONA_CLIENTE_ID,
          NOMBRE_CLIENTE
        ) VALUES ${pagos
          .map(
            p => `(
            ${p.CLIENTE_ID},
            '${p.COBRADOR.replace(/'/g, "''")}', -- Escapado de comillas simples
            ${p.COBRADOR_ID},
            ${p.DOCTO_CC_ACR_ID},
            ${p.DOCTO_CC_ID},
            '${
              p.FECHA_HORA_PAGO
            }', -- Asegúrate de que la fecha esté en el formato correcto
            ${p.FORMA_COBRO_ID},
            ${p.GUARDADO_EN_MICROSIP ? 1 : 0},
            ${p.IMPORTE},
            '${p.LAT.replace(/'/g, "''")}', -- Escapado de comillas simples
            '${p.LNG.replace(/'/g, "''")}', -- Escapado de comillas simples
            ${p.ZONA_CLIENTE_ID},
            '${p.NOMBRE_CLIENTE.replace(
              /'/g,
              "''",
            )}' -- Escapado de comillas simples
          )`,
          )
          .join(',\n')};
      `;

      await dbSqlite.executeSql(queryPagos);

      const productos = serverData.data.body.productos;

      const queryProductos = `
        INSERT INTO productos (
          ARTICULO,
          ARTICULO_ID,
          CANTIDAD,
          DOCTO_PV_DET_ID,
          DOCTO_PV_ID,
          FOLIO,
          POSICION,
          PRECIO_TOTAL_NETO,
          PRECIO_UNITARIO_IMPTO
        ) VALUES ${productos
          .map(
            p => `(
            '${p.ARTICULO.replace(/'/g, "''")}', -- Escapado de comillas simples
            ${p.ARTICULO_ID},
            ${p.CANTIDAD},
            ${p.DOCTO_PV_DET_ID},
            ${p.DOCTO_PV_ID},
            '${p.FOLIO.replace(/'/g, "''")}', -- Escapado de comillas simples
            ${p.POSICION},
            ${p.PRECIO_TOTAL_NETO},
            ${p.PRECIO_UNITARIO_IMPTO}
          )`,
          )
          .join(',\n')};
      `;

      await dbSqlite.executeSql(queryProductos);

      Alert.alert('Datos obtenidos del servidor correctamente');

      setLoadingCargaInicial(false);
    } catch (error) {
      setLoadingCargaInicial(false);
      Alert.alert('Error al obtener los datos del servidor');
      console.error(error);
    }
  };

  const closeSession = () => {
    return auth().signOut();
  };

  const handleCargaInicialButton = () => {
    Alert.alert(
      '¿Estás seguro de realizar la carga inicial?',
      'Solo debes realizar la carga inicial una vez por semana, NO debes realizar la carga inicial diariamente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Aceptar',
          onPress: handlerCargaInicial,
        },
      ],
      {cancelable: false},
    );
  };

  const handleSendPagosNotSent = async () => {
    ToastAndroid.show('Enviando pagos no enviados', ToastAndroid.SHORT);

    if (pagosNotSent.length === 0) {
      Alert.alert('No hay pagos por enviar');
      return;
    }
    let numPagosSent = 0;
    for (let pagoNotSend of pagosNotSent) {
      const pagoToSend: PaymentDto = {
        CLIENTE_ID: pagoNotSend.CLIENTE_ID,
        NOMBRE_CLIENTE: pagoNotSend.NOMBRE_CLIENTE,
        COBRADOR: pagoNotSend.COBRADOR,
        COBRADOR_ID: pagoNotSend.COBRADOR_ID,
        DOCTO_CC_ID: pagoNotSend.DOCTO_CC_ID,
        DOCTO_CC_ACR_ID: pagoNotSend.DOCTO_CC_ACR_ID,
        FECHA_HORA_PAGO: pagoNotSend.FECHA_HORA_PAGO,
        FORMA_COBRO_ID: pagoNotSend.FORMA_COBRO_ID,
        ZONA_CLIENTE_ID: pagoNotSend.ZONA_CLIENTE_ID,
        IMPORTE: pagoNotSend.IMPORTE,
        LAT: Number(pagoNotSend.LAT),
        LNG: Number(pagoNotSend.LNG),
        GUARDADO_EN_MICROSIP: pagoNotSend.GUARDADO_EN_MICROSIP,
      };
      try {
        await sendPago(pagoToSend, false);

        numPagosSent++;
      } catch (error) {
        console.error('Error al enviar el pago', error);
      }
      getLocalPaymentsNotSent().catch(err => {
        console.error('Error al obtener los pagos locales no enviados', err);
      });
      const numPagosNotSent = pagosNotSent.length - numPagosSent;
      Alert.alert(
        'Pagos enviados',
        `Se enviaron ${numPagosSent} pagos${
          numPagosNotSent > 0 ? ` y quedan ${numPagosNotSent} por enviar` : ''
        }`,
        [
          {
            text: 'Aceptar',
          },
        ],
        {cancelable: false},
      );
    }
  };

  const handleLogoutButton = () => {
    Alert.alert(
      '¿Estás seguro de cerrar sesión?',
      'Si cierras sesión, deberás tener conexión a internet para volver a iniciar sesión.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Aceptar',
          onPress: closeSession,
        },
      ],
      {cancelable: false},
    );
  };

  if (loading || loadingPagos || loadingCargaInicial || loadingPagosNotSent) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <ScrollView style={homeStyles.container}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor="#003CBF"
        animated
      />
      <View style={homeStyles.stats}>
        <Text style={homeStyles.statsSubtitle}>Hola,</Text>
        <Text style={homeStyles.statsTitle}>{userData.NOMBRE}</Text>
      </View>

      <View style={homeStyles.detailsContainer}>
        <View style={homeStyles.details}>
          <View style={homeStyles.detailsColumn}>
            <View style={homeStyles.detailsColumnItem}>
              <View style={homeStyles.detailsColumnLabels}>
                <Text style={homeStyles.detailsSubtitle}>
                  Total cobrado (Hoy)
                </Text>
                <Text style={homeStyles.detailsSubtitle}>Pagos (Hoy)</Text>
              </View>

              <View style={homeStyles.detailsColumnLabels}>
                <Text style={homeStyles.detailsTitle}>
                  ${totalCobradoHoy || 0}
                </Text>
                <Text style={homeStyles.detailsTitle}>{pagosHoy.length}</Text>
              </View>
            </View>
            <View style={homeStyles.detailsColumnItem}>
              <View style={homeStyles.detailsColumnLabels}>
                <Text style={homeStyles.detailsSubtitle}>
                  Total cobrado (semanal)
                </Text>
                <Text style={homeStyles.detailsSubtitle}>Pagos (semanal)</Text>
              </View>

              <View style={homeStyles.detailsColumnLabels}>
                <Text style={homeStyles.detailsTitle}>
                  ${totalCobradoSemanal || 0}
                </Text>
                <Text style={homeStyles.detailsTitle}>{pagos.length}</Text>
              </View>
            </View>
            {/* <View style={homeStyles.detailsColumnItem}>
              <Text style={homeStyles.detailsSubtitle}>
                Nuevas cuentas esta semana
              </Text>
              <Text style={homeStyles.detailsTitle}>8</Text>
            </View> */}
          </View>
          <View style={homeStyles.detailsRow}>
            <View style={homeStyles.detailsRowCardPrimary}>
              <Text style={homeStyles.detailsRowCardSubtitle}>Porcentaje</Text>
              <AnimatedCircularProgress
                size={80}
                width={8}
                fill={porcentaje}
                rotation={180}
                tintColor={BACKGROUND_COLOR_PRIMARY}
                duration={2000}>
                {() => (
                  <Text style={homeStyles.detailsProgress}>
                    {porcentaje.toFixed(0)}%
                  </Text>
                )}
              </AnimatedCircularProgress>
            </View>
            <View style={homeStyles.detailsRowCardSecondary}>
              <Text style={homeStyles.detailsRowCardSubtitle}>
                Cntas. cobradas
              </Text>
              <Text style={homeStyles.detailsRowCardTitle}>
                {pagos.length || 0}
                <Text style={homeStyles.detailsRowCardText}>
                  /{sales.length}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={homeStyles.details}>
          <Text style={homeStyles.detailsTitleSecondary}>PAGOS SIN ENVIAR</Text>
          <View style={homeStyles.detailsColumn}>
            {pagosNotSent.length === 0 && (
              <Text style={homeStyles.text}>NO HAY PAGOS SIN ENVIAR</Text>
            )}
            {pagosNotSent.map((pago, index) => (
              <View key={index} style={homeStyles.row}>
                <Text style={homeStyles.text}>
                  {pago.NOMBRE_CLIENTE}
                  {'\n'}
                  <Text style={homeStyles.detailsSubtitle}>
                    {dayjs(pago.FECHA_HORA_PAGO).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </Text>
                <Text style={homeStyles.detailsTitleSecondary}>
                  ${pago.IMPORTE}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Pressable
        style={homeStyles.closeSesion}
        onPress={handleSendPagosNotSent}>
        <Text style={homeStyles.closeSesionText}>Enviar pagos no enviados</Text>
      </Pressable>

      <Pressable
        style={homeStyles.closeSesion}
        onPress={handleCargaInicialButton}>
        <Text style={homeStyles.closeSesionText}>Carga inicial</Text>
      </Pressable>

      <Pressable style={homeStyles.closeSesion} onPress={getDataFromServer}>
        <Text style={homeStyles.closeSesionText}>Actualizar datos</Text>
      </Pressable>

      <Pressable style={homeStyles.closeSesion} onPress={handleLogoutButton}>
        <Text style={homeStyles.closeSesionText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
};

export default Home;
