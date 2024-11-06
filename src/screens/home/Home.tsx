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
import {
  AuthContext,
  requestLocationPermission,
  RootDrawerParamList,
} from '../../../App';
import useGetPagosRuta from '../../hooks/useGetPagosRuta';
import {auth, db} from '../../firebase/connection';
import {openDatabase} from '../../sqlite/connection';
import api from '../../services/api';
import {getUnsynchronizedLocalPayment} from '../../services/getUnsynchronizedLocalPayment';
import dayjs, {Dayjs} from 'dayjs';
import {Producto} from '../../components/modules/sales/SaleDetails/SaleDetails';
import {doc, Timestamp, writeBatch} from '@react-native-firebase/firestore';
import {getUnsynchronizedLocalVisitas} from '../../services/getUnsynchronizedLocalVisitas';
import {VisitaLocal} from '../../services/sendVisita';
import getPorcentajeParcial from '../../services/getPorcentajeParcial';
import {AxiosError} from 'axios';
import getLocations from '../../services/getLocations';
import {getCoords} from '../../utils/dbscan/getCoords';
import Geolocation from '@react-native-community/geolocation';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  CheckIcon,
  CloseIcon,
  Icon,
  RemoveIcon,
  RepeatIcon,
} from '@gluestack-ui/themed';
import sendPagosNotSent from '../../services/sendPagosNotSent';

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
  ESTADO_COBRANZA:
    | 'PAGADO'
    | 'NO PAGADO'
    | 'PENDIENTE'
    | 'VISITADO'
    | 'VOLVER VISITAR';
  DIA_COBRANZA: string;
  DIA_TEMPORAL_COBRANZA: string;
  PRECIO_DE_CONTADO: number;
  AVAL_O_RESPONSABLE: string;
  FREC_PAGO: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
}

export interface SaleServerProcessed extends SaleServer {
  PLAZOS_ATRASADOS: number;
}

export interface PagoServer {
  ID: string;
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

type HomeScreenNavigationProp = DrawerNavigationProp<
  RootDrawerParamList,
  'Home'
>;

const Home = () => {
  const {
    userData,
    sales,
    salesLoading: loading,
  } = React.useContext(AuthContext);

  const [loadingCargaInicial, setLoadingCargaInicial] = useState(false);
  const [pagosNotSent, setPagosNotSent] = useState<PagoServer[]>([]);
  const [loadingPagosNotSent, setLoadingPagosNotSent] = useState<boolean>(true);
  const [visitasNotSent, setVisitasNotSent] = useState<VisitaLocal[]>([]);
  const [loadingVisitasNotSent, setLoadingVisitasNotSent] =
    useState<boolean>(true);
  const [porcentajeParcial, setPorcentajeParcial] = useState<number>(0);
  const [locations, setLocations] = useState<
    {
      DOCTO_CC_ID: number;
      LAT: number;
      LNG: number;
      DISTANCE_TO_CURRENT_POSITION: number;
    }[]
  >([]);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);
  const {
    loading: loadingPagos,
    pagos,
    pagosHoy,
  } = useGetPagosRuta(userData.ZONA_CLIENTE_ID);

  const navigation = useNavigation<HomeScreenNavigationProp>();

  const totalCobradoSemanal = pagos.reduce(
    (acc, pago) => acc + pago.IMPORTE,
    0,
  );
  const totalCobradoHoy = pagosHoy.reduce((acc, pago) => acc + pago.IMPORTE, 0);

  const porcentaje = (pagos.length / sales.length) * 100;

  const handlerCargaInicial = async () => {
    try {
      const pagosNotSent = await getUnsynchronizedLocalPayment(
        false,
        dayjs(userData.FECHA_CARGA_INICIAL.toDate().toISOString()),
      );
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
      await sendPagosNotSent(
        true,
        dayjs(userData.FECHA_CARGA_INICIAL.toDate()),
      );
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
      Alert.alert(
        'Error al inicializar semana',
        'Ha ocurrio un error al inicializar la semana',
      );
    }
  };

  const getLocalPaymentsNotSent = async (cargaInicialDate: Dayjs) => {
    return getUnsynchronizedLocalPayment(false, cargaInicialDate)
      .then(pagos => {
        setPagosNotSent(pagos);
      })
      .catch(err => {
        console.error('Error al obtener los pagos locales no enviados', err);
      })
      .finally(() => {
        setLoadingPagosNotSent(false);
      });
  };

  const getLocalVisitasNotSent = async () => {
    return getUnsynchronizedLocalVisitas()
      .then(visitas => {
        setVisitasNotSent(visitas);
      })
      .catch(err => {
        console.error('Error al obtener las visitas locales no enviadas', err);
      })
      .finally(() => {
        setLoadingVisitasNotSent(false);
      });
  };

  const handleSendPagosNotSent = async () => {
    try {
      setLoadingCargaInicial(true);
      await sendPagosNotSent(
        false,
        dayjs(userData.FECHA_CARGA_INICIAL.toDate()),
      );
    } catch (err) {
      Alert.alert(
        'Ocurrio al enviar los pagos pendiente',
        'Ha ocurrido un error al enviar loos pagos pendientes',
      );
    } finally {
      setLoadingCargaInicial(false);
    }
  };

  const handleSendAllPagos = async () => {
    try {
      setLoadingCargaInicial(true);
      await sendPagosNotSent(
        true,
        dayjs(userData.FECHA_CARGA_INICIAL.toDate()),
      );
    } catch (err) {
      Alert.alert(
        'Ocurrio al reenviar',
        'Ha ocurrido un error al reenviar todos lo pagos',
      );
    } finally {
      setLoadingCargaInicial(false);
    }
  };

  const getPorcentajeParcialLocal = () => {
    getPorcentajeParcial(dayjs(userData.FECHA_CARGA_INICIAL.toDate()))
      .then(result => {
        setPorcentajeParcial(result);
      })
      .catch(err => {
        console.error('Error al obtener el porcentaje parcial', err);
      });
  };

  const getSalesLocations = () => {
    setLoadingLocations(true);
    requestLocationPermission().then(res => {
      if (res) {
        Geolocation.getCurrentPosition(
          position => {
            getLocations()
              .then(locations => {
                let locationsArray = [];
                for (let location of Object.keys(locations)) {
                  const coords = locations[Number(location)];
                  const coordsSale = coords.map(coord => [
                    coord.LAT,
                    coord.LNG,
                  ]);
                  const clusters = getCoords(coordsSale, {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  });

                  const newLocation = {
                    DOCTO_CC_ID: Number(location),
                    LAT: clusters.centroid.LAT,
                    LNG: clusters.centroid.LNG,
                    DISTANCE_TO_CURRENT_POSITION:
                      clusters.distanceToCurrentPosition,
                  };

                  locationsArray.push(newLocation);
                }
                setLocations(locationsArray);
              })
              .catch(err => {
                console.error('Error al obtener las ubicaciones', err);
              })
              .finally(() => {
                setLoadingLocations(false);
              });
          },
          error => {
            console.error(error);
          },
          {enableHighAccuracy: true, timeout: 20000, maximumAge: 0},
        );
      } else {
        Alert.alert(
          'Permiso de ubicación denegado',
          'Para obtener las ubicaciones de los clientes cercanos, debes permitir el acceso a la ubicación',
          [
            {
              text: 'Aceptar',
            },
          ],
          {cancelable: false},
        );
      }
    });
  };

  useEffect(() => {
    if (userData.ID !== '') {
      getLocalVisitasNotSent();
      getLocalPaymentsNotSent(
        dayjs(userData.FECHA_CARGA_INICIAL.toDate().toISOString()),
      );
      getPorcentajeParcialLocal();
    }
  }, [userData.FECHA_CARGA_INICIAL]);

  useEffect(() => {
    let listener: NodeJS.Timeout;
    if (userData.ID !== '') {
      getSalesLocations();
      listener = setInterval(() => {
        getSalesLocations();
      }, 10000);
    }
    return () => {
      if (listener) {
        clearTimeout(listener);
      }
    };
  }, [userData.FECHA_CARGA_INICIAL]);

  const getDataFromServer = async () => {
    try {
      const pagosNotSent = await getUnsynchronizedLocalPayment(
        false,
        dayjs(userData.FECHA_CARGA_INICIAL.toDate().toISOString()),
      );
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
      await sendPagosNotSent(
        true,
        dayjs(userData.FECHA_CARGA_INICIAL.toDate()),
        false,
      );
      const url =
        '/ventas/getAllVentasByZona/' +
        userData.ZONA_CLIENTE_ID +
        `?dateInit=${dayjs(userData.FECHA_CARGA_INICIAL.toDate()).format(
          'YYYY-MM-DD',
        )}`;
      console.log(url);
      const serverData = await api.get<{
        body: {
          ventas: SaleServer[];
          pagos: PagoServer[];
          productos: Producto[];
        };
      }>(url);
      console.log(serverData.data.body.ventas[0]);
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
          DIA_TEMPORAL_COBRANZA,
          PRECIO_DE_CONTADO,
          AVAL_O_RESPONSABLE,
          FREC_PAGO
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
            )}', -- Escapado de comillas simples
            ${v.PRECIO_DE_CONTADO},
            '${v.AVAL_O_RESPONSABLE.replace(
              /'/g,
              "''",
            )}', -- Escapado de comillas simples
            '${v.FREC_PAGO.replace(/'/g, "''")}' -- Escapado de comillas simples
          )`,
          )
          .join(',\n')};
      `;

      await dbSqlite.executeSql(query);

      const pagos = serverData.data.body.pagos;

      // Tengo que encontrar los pagos que tiene un mismo id
      const pagosIdsRepetidos = pagos
        .map(p => p.ID)
        .filter((value, index, self) => self.indexOf(value) !== index);

      console.log(pagos.filter(p => p.ID === pagosIdsRepetidos[0]));

      console.log('Pagos repetidos', pagosIdsRepetidos);

      const queryPagos = `
        INSERT INTO pagos (
          ID,
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
            '${p.ID}', -- Escapado de comillas simples
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
      if (error instanceof AxiosError) {
        console.error('Error response', error.toJSON());
      }
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
          </View>
          <View style={homeStyles.detailsRow}>
            <View style={homeStyles.detailsRowCardPrimary}>
              <Text style={homeStyles.detailsRowCardSubtitle}>
                Porcentaje (Cuentas)
              </Text>
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
          <View style={[homeStyles.detailsRow, {marginTop: 18}]}>
            <View style={[homeStyles.detailsRowCardSecondary, {gap: 0}]}>
              <Text style={homeStyles.detailsRowCardSubtitle}>
                Porcentaje (Cobro)
              </Text>
              <AnimatedCircularProgress
                size={100}
                width={8}
                fill={porcentaje}
                rotation={180}
                tintColor={BACKGROUND_COLOR_PRIMARY}
                duration={2000}>
                {() => (
                  <Text style={homeStyles.detailsProgress}>
                    {((porcentajeParcial / sales.length) * 100).toFixed(1)}%
                  </Text>
                )}
              </AnimatedCircularProgress>
            </View>
          </View>
        </View>

        <View
          style={[
            homeStyles.details,
            {
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 0},
              shadowOpacity: 0,
              shadowRadius: 0,
              elevation: 0,
              padding: 0,
              gap: 0,
            },
          ]}>
          <View style={homeStyles.row}>
            <Text
              style={[
                homeStyles.detailsTitleSecondary,
                {marginTop: 10, marginBottom: 10},
              ]}>
              CLIENTES CERCANOS
            </Text>
            <Pressable
              style={{
                padding: 10,
                paddingHorizontal: 20,
                backgroundColor: loadingLocations ? 'gray' : PRIMARY_COLOR,
                borderRadius: 5,
              }}
              disabled={loadingLocations}
              onPress={() => {
                getSalesLocations();
              }}>
              <Text
                style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 17,
                }}>
                {loadingLocations ? 'Cargando...' : 'Actualizar'}
              </Text>
            </Pressable>
          </View>
          <View style={homeStyles.detailsColumn}>
            {locations
              .sort(
                (a, b) =>
                  a.DISTANCE_TO_CURRENT_POSITION -
                  b.DISTANCE_TO_CURRENT_POSITION,
              )
              .slice(0, 15)
              .map((location, index) => {
                const sale = sales.find(
                  sale => sale.DOCTO_CC_ID === location.DOCTO_CC_ID,
                );
                return (
                  <Pressable
                    style={homeStyles.saleContainer}
                    onPress={() => {
                      navigation.navigate('Sales', {
                        screen: 'SaleDetails',
                        params: {saleId: location.DOCTO_CC_ID},
                      });
                    }}
                    key={location.DOCTO_CC_ID}>
                    <View key={index} style={[homeStyles.row, {gap: 0}]}>
                      <View style={[homeStyles.col, {width: '70%'}]}>
                        <Text
                          numberOfLines={1}
                          style={[
                            homeStyles.text,
                            {fontWeight: '600', fontSize: 17},
                          ]}>
                          {sale?.CLIENTE.slice(0, 30) || ''}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={homeStyles.detailsSubtitle}>
                          {(
                            sale?.CALLE +
                            ' ' +
                            sale?.CIUDAD +
                            ' ' +
                            sale?.ESTADO
                          ).slice(0, 30)}
                        </Text>
                        <Text numberOfLines={1}>
                          <Text style={homeStyles.detailsSubtitle}>
                            Saldo:{' '}
                            <Text
                              style={{
                                fontWeight: '600',
                                color: 'black',
                                fontSize: 17,
                              }}>
                              ${sale?.SALDO_REST.toFixed(2)}
                            </Text>
                          </Text>
                        </Text>
                      </View>
                      <View
                        style={[
                          homeStyles.col,
                          {width: '30%', alignItems: 'flex-end'},
                        ]}>
                        <Text
                          style={[
                            homeStyles.detailsTitleSecondary,
                            {
                              textAlign: 'right',
                              fontWeight: '600',
                            },
                          ]}>
                          {location.DISTANCE_TO_CURRENT_POSITION.toFixed(2)} m
                        </Text>
                        <View
                          style={[
                            homeStyles.iconContainer,
                            {
                              backgroundColor:
                                sale?.ESTADO_COBRANZA === 'PAGADO'
                                  ? 'lightgreen'
                                  : sale?.ESTADO_COBRANZA === 'PENDIENTE'
                                  ? 'lightgray'
                                  : sale?.ESTADO_COBRANZA === 'NO PAGADO'
                                  ? 'red'
                                  : sale?.ESTADO_COBRANZA === 'VISITADO'
                                  ? 'lightcoral'
                                  : sale?.ESTADO_COBRANZA === 'VOLVER VISITAR'
                                  ? 'orange'
                                  : 'lightgray',
                            },
                          ]}>
                          {sale?.ESTADO_COBRANZA === 'PAGADO' && (
                            <Icon as={CheckIcon} color="green" />
                          )}
                          {sale?.ESTADO_COBRANZA === 'PENDIENTE' && (
                            <Icon as={RemoveIcon} color="gray" />
                          )}
                          {sale?.ESTADO_COBRANZA === 'NO PAGADO' && (
                            <Icon as={CloseIcon} color="white" />
                          )}
                          {sale?.ESTADO_COBRANZA === 'VISITADO' && (
                            <Icon as={CheckIcon} color="green" />
                          )}
                          {sale?.ESTADO_COBRANZA === 'VOLVER VISITAR' && (
                            <Icon as={RepeatIcon} color="white" />
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
          </View>
        </View>

        <View style={homeStyles.details}>
          <Text style={homeStyles.detailsTitleSecondary}>
            VISITAS SIN ENVIAR
          </Text>
          <View style={homeStyles.detailsColumn}>
            {visitasNotSent.length === 0 && (
              <Text style={homeStyles.text}>NO HAY VISITAS SIN ENVIAR</Text>
            )}
            {visitasNotSent.length > 0 && (
              <Text style={homeStyles.detailsTitleSecondary}>
                {visitasNotSent.length} visitas sin enviar
              </Text>
            )}
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
        onPress={() => handleSendPagosNotSent()}>
        <Text style={homeStyles.closeSesionText}>Enviar pagos pendientes</Text>
      </Pressable>

      <Pressable
        style={homeStyles.closeSesion}
        onPress={() => handleSendAllPagos()}>
        <Text style={homeStyles.closeSesionText}>Reenviar todos los pagos</Text>
      </Pressable>

      <Pressable
        style={homeStyles.closeSesion}
        onPress={handleCargaInicialButton}>
        <Text style={homeStyles.closeSesionText}>
          Inicializar semana de cobro
        </Text>
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
