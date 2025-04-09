import {
  View,
  Text,
  Linking,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  Image,
  PermissionsAndroid,
  ScrollView,
  ActivityIndicator,
  Alert,
  ImageBackground,
  ToastAndroid,
  FlatList,
} from 'react-native';
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import saleDetailsStyles from './saleDetails.style';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon6 from 'react-native-vector-icons/FontAwesome6';
import {PRIMARY_COLOR} from '../../../../contants/colors';
import MapView, {Marker} from 'react-native-maps';
import dayjs from 'dayjs';
import RNPickerSelect from 'react-native-picker-select';
import {AuthContext} from '../../../../../App';
import useGetSale from '../../../../hooks/useGetSale';
import {SalesStackParamList} from '../../../../routes/SalesRoutes';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import useGetProductosByFolio from '../../../../hooks/useGetProductosByFolio';
import {PagoServer} from '../../../../screens/home/Home';
import sendPago from '../../../../services/sendPago';
import sendVisita, {VisitaLocal} from '../../../../services/sendVisita';
import uuid from 'react-native-uuid';
import 'dayjs/locale/es'; // Cargar el idioma español
import Card from '../../../common/Card/Card';
import relativeTime from 'dayjs/plugin/relativeTime';
import useCalculateLocation from '../../../../hooks/useCalculateLocation';
import getAccuratePosition, {
  checkGPSEnabled,
} from '../../../../utils/geolocation/getAccuratePosition';

dayjs.extend(relativeTime);
dayjs.locale('es');

export interface Producto {
  ARTICULO: string;
  ARTICULO_ID: number;
  CANTIDAD: number;
  DOCTO_PV_DET_ID: number;
  DOCTO_PV_ID: number;
  FOLIO: string;
  POSICION: number;
  PRECIO_TOTAL_NETO: number;
  PRECIO_UNITARIO_IMPTO: number;
}

type SaleDetailScreenRouteProp = RouteProp<SalesStackParamList, 'SaleDetails'>;
type SaleDetailsNavigationProp = StackNavigationProp<
  SalesStackParamList,
  'SaleDetails'
>;

const NO_SE_ENCONTRABA = 'No se encontraba';
const NO_VA_A_DAR_PAGO = 'No va a dar pago';
const SE_ESCONDE_Y_NO_SALE = 'Se esconde y no sale';

export type VisitaType =
  | typeof NO_SE_ENCONTRABA
  | typeof NO_VA_A_DAR_PAGO
  | typeof SE_ESCONDE_Y_NO_SALE;

export const PAGO_EN_EFECTIVO_ID = 157;
export const PAGO_CON_TRANSFERENCIA_ID = 52569;
export const CONDONACION_ID = 137026;

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permiso de ubicación',
        message:
          'La aplicación necesita acceso a tu ubicación para poder seguir funcionando' +
          'por favor acepta el permiso',
        buttonNeutral: 'Preguntar después',
        buttonNegative: 'Cancelar',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Permiso de ubicación en segundo plano',
          message:
            'La aplicación necesita acceso a tu ubicación en segundo plano para poder seguir funcionando',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        },
      );
    }
  } catch (err) {
    console.warn(err);
  }
};

const SaleDetails = () => {
  const {userData, updatePaymentCoords, updateVisitaCoords} =
    useContext(AuthContext);
  const route = useRoute<SaleDetailScreenRouteProp>();
  const {saleId} = route.params;
  const navigation = useNavigation<SaleDetailsNavigationProp>();
  const {sale, loading, getSaleAgain, otherSales, porcentajeParcialBySale} =
    useGetSale(saleId);
  const [loadingSave, setLoadingSave] = useState<boolean>(false);
  const refLoadingSave = useRef(loadingSave);
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalVisitaVisible, setModalVisitaVisible] = useState<boolean>(false);
  const [modalMapVisible, setModalMapVisible] = useState<boolean>(false);
  const [modalCondonacionVisible, setModalCondonacionVisible] =
    useState<boolean>(false);
  const [payment, setPayment] = useState<number>(0);
  const [notaVisita, setNotaVisita] = useState<string>('');
  const [selectedNotaVisita, setSelectedNotaVisita] =
    useState<VisitaType>(NO_SE_ENCONTRABA);
  const [selectedFormaCobro, setSelectedFormaCobro] =
    useState<number>(PAGO_EN_EFECTIVO_ID);
  const [alertPayment, setAlertPayment] = useState<string>('');
  const [showAllLocations, setShowAllLocations] = useState<boolean>(false);
  const coords = useMemo(
    () => sale.pagos.map(pago => [Number(pago.LAT), Number(pago.LNG)]),
    [sale.pagos],
  );
  const {centroids} = useCalculateLocation({
    coords: coords,
    currentPosition: {lat: 0, lng: 0},
  });

  useEffect(() => {
    refLoadingSave.current = loadingSave;
  }, [loadingSave]);

  const {productos, loading: productosLoading} = useGetProductosByFolio(
    sale.FOLIO,
  );
  const progress = useMemo(() => {
    return ((sale.PRECIO_TOTAL - sale.SALDO_REST) / sale.PRECIO_TOTAL) * 100;
  }, [sale.PRECIO_TOTAL, sale.SALDO_REST]);

  const callNumber = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const sendWhatsapp = useCallback((phone: string) => {
    Linking.openURL('whatsapp://send?text= &phone=' + phone);
  }, []);

  const handleOpenMap = () => {
    setModalMapVisible(true);
  };

  const openCalendar = useCallback(() => {
    const url = 'content://com.android.calendar/time/'; // Para Android
    Linking.openURL(url).catch(err =>
      console.error('No se puede abrir el calendario', err),
    );
  }, []);

  const openCalculator = () => {
    const url = 'content://com.android.calculator2/';
    Linking.openURL(url).catch(err =>
      console.error('No se puede abrir el calendario', err),
    );
  };

  const handleOpenModalAddPayment = () => {
    setModalVisible(true);
    setPayment(0);
  };

  const handleAddPayment = useCallback(async () => {
    try {
      if (refLoadingSave.current) return;
      setLoadingSave(() => {
        refLoadingSave.current = true;
        return true;
      });
      if (payment <= 0) {
        setLoadingSave(() => {
          refLoadingSave.current = false;
          return false;
        });
        return setAlertPayment('EL PAGO DEBE SER MAYOR A 0');
      }

      await checkGPSEnabled();

      const id = uuid.v4().toString();

      const data: PaymentDto = {
        ID: id,
        CLIENTE_ID: sale.CLIENTE_ID,
        NOMBRE_CLIENTE: sale.CLIENTE,
        FECHA_HORA_PAGO: dayjs().toISOString(),
        COBRADOR: sale.NOMBRE_COBRADOR,
        COBRADOR_ID: userData.COBRADOR_ID,
        LAT: 0,
        LNG: 0,
        IMPORTE: payment,
        DOCTO_CC_ID: 0,
        DOCTO_CC_ACR_ID: sale.DOCTO_CC_ACR_ID,
        FORMA_COBRO_ID: selectedFormaCobro,
        ZONA_CLIENTE_ID: sale.ZONA_CLIENTE_ID,
        GUARDADO_EN_MICROSIP: false,
      };

      try {
        await sendPago(data, true, false);
        updatePaymentCoords(data);
        setModalVisible(false);
      } catch (e) {
        console.error('Error al agregar el documento: ', e);
      }

      getSaleAgain();
      goToPayment(id);
      setModalVisible(!modalVisible);
    } catch (err) {
      console.log('Error al guardar el pago', err);
    } finally {
      setLoadingSave(false);
      refLoadingSave.current = true;
    }
  }, [
    requestLocationPermission,
    getAccuratePosition,
    payment,
    sale,
    selectedFormaCobro,
    sendPago,
    getSaleAgain,
    goToPayment,
    userData,
  ]);

  const handleAddVisita = useCallback(() => {
    if (refLoadingSave.current) return;
    setLoadingSave(() => {
      refLoadingSave.current = true;
      return true;
    });
    requestLocationPermission().then(() => {
      getAccuratePosition()
        .then(async info => {
          const lat = info.coords.latitude;
          const lng = info.coords.longitude;
          const data: VisitaLocal = {
            CLIENTE_ID: sale.CLIENTE_ID,
            FECHA: dayjs().toISOString(),
            COBRADOR: sale.NOMBRE_COBRADOR,
            COBRADOR_ID: userData.COBRADOR_ID,
            LAT: lat,
            LNG: lng,
            NOTA: notaVisita,
            TIPO_VISITA: selectedNotaVisita,
            FORMA_COBRO_ID: selectedFormaCobro,
            ZONA_CLIENTE_ID: sale.ZONA_CLIENTE_ID,
            ID: uuid.v4().toString(),
            IMPTE_DOCTO_CC_ID: sale.DOCTO_CC_ACR_ID,
          };
          try {
            await sendVisita(
              data,
              true,
              selectedNotaVisita,
              sale.DOCTO_CC_ACR_ID,
              false,
            );
            updateVisitaCoords(data);
            setModalVisitaVisible(false);
          } catch (e) {
            console.error('Error adding document: ', e);
          }
          Alert.alert(
            'Imprimir ticket de visita',
            '¿Desea imprimir un ticket de visita?',
            [
              {text: 'Imprimir', onPress: () => goToNotice(saleId)},
              {
                text: 'Cerrar', // Texto del botón
                onPress: () => {},
              },
            ],
            {cancelable: false},
          );
          setModalVisitaVisible(false);
        })
        .catch(err => {
          Alert.alert(
            'Error al obtener la ubicación',
            'No se ha podido obtener la ubicación actual, por lo que LA VISITA NO SE HA GUARDADO',
          );
          console.log('Error al obtener la ubicación:', err);
          setLoadingSave(false);
          refLoadingSave.current = false;
        });
    });
    setLoadingSave(false);
    refLoadingSave.current = false;
  }, [
    requestLocationPermission,
    getAccuratePosition,
    sale,
    notaVisita,
    selectedNotaVisita,
    selectedFormaCobro,
    userData,
  ]);

  const handleOpenCondonacionModal = () => {
    setPayment(sale.SALDO_REST);
    setModalCondonacionVisible(true);
  };

  const handleAddCondonacion = useCallback(async () => {
    if (refLoadingSave.current) return;
    setLoadingSave(() => {
      refLoadingSave.current = true;
      return true;
    });

    if (payment <= 0) {
      setLoadingSave(() => {
        refLoadingSave.current = false;
        return false;
      });
      return setAlertPayment('EL PAGO DEBE SER MAYOR A 0');
    }

    const data: PaymentDto = {
      ID: uuid.v4().toString(),
      CLIENTE_ID: sale.CLIENTE_ID,
      NOMBRE_CLIENTE: sale.CLIENTE,
      FECHA_HORA_PAGO: dayjs().toISOString(),
      COBRADOR: sale.NOMBRE_COBRADOR,
      COBRADOR_ID: userData.COBRADOR_ID,
      LAT: 0,
      LNG: 0,
      IMPORTE: payment,
      DOCTO_CC_ID: 0,
      DOCTO_CC_ACR_ID: sale.DOCTO_CC_ACR_ID,
      FORMA_COBRO_ID: CONDONACION_ID,
      ZONA_CLIENTE_ID: sale.ZONA_CLIENTE_ID,
      GUARDADO_EN_MICROSIP: false,
    };
    try {
      await sendPago(data, true, false);
      updatePaymentCoords(data);
      setModalCondonacionVisible(false);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
    getSaleAgain();
    goToPayment(data.ID);
    setModalCondonacionVisible(!modalCondonacionVisible);
    setLoadingSave(false);
  }, [
    refLoadingSave,
    requestLocationPermission,
    getAccuratePosition,
    sale,
    payment,
    userData,
    goToPayment,
    getSaleAgain,
  ]);

  const handleCloseCondonacionModal = () => {
    setModalCondonacionVisible(!modalCondonacionVisible);
    setPayment(0);
  };

  const handleCloseVisitaModal = () => {
    setModalVisitaVisible(!modalVisitaVisible);
    setNotaVisita('');
    setSelectedNotaVisita(NO_SE_ENCONTRABA);
    setSelectedFormaCobro(PAGO_EN_EFECTIVO_ID);
  };

  const handleClosePaymentModal = () => {
    setModalVisible(!modalVisible);
    setPayment(0);
  };

  const handleInputPaymentChange = useCallback(
    (text: string) => {
      if (text === '') return setPayment(0);
      if (parseInt(text) < 0) return setPayment(0);
      if (parseInt(text) > sale.SALDO_REST) return setPayment(sale.SALDO_REST);
      if (parseInt(text) > 0 && parseInt(text) < sale.PARCIALIDAD) {
        setAlertPayment('EL PAGO ES MENOR A LA PARCIALIDAD ACORDADA');
      } else {
        setAlertPayment('');
        console.log('alertPayment', alertPayment);
      }
      setPayment(parseInt(text));
    },
    [sale.SALDO_REST, sale.PARCIALIDAD],
  );

  function goToPayment(paymentId: string) {
    navigation.navigate('Payment', {paymentId: paymentId, saleId: saleId});
  }

  const goToNotice = (saleId: number) => {
    navigation.navigate('Notice', {saleId: saleId});
  };

  const paymentsOrder = useMemo(() => {
    return [...sale.pagos].sort(
      (a, b) =>
        new Date(b.FECHA_HORA_PAGO).getTime() -
        new Date(a.FECHA_HORA_PAGO).getTime(),
    );
  }, [sale.pagos]);

  const cantsRepeat = useMemo(() => {
    return sale.pagos.reduce((acc: number[], pago) => {
      if (!acc.some(cant => cant === pago.IMPORTE)) {
        acc.push(pago.IMPORTE);
      }
      return acc;
    }, []);
  }, [sale.pagos]);

  useEffect(() => {
    if (sale.pagos.length > 0) {
      const lastPayment = paymentsOrder[0];
      setLat(Number(lastPayment.LAT));
      setLng(Number(lastPayment.LNG));
    }
  }, [sale.pagos]);

  const totalAbonado = sale.PRECIO_TOTAL - sale.SALDO_REST;
  const tiempoTranscurrido =
    dayjs().subtract(5, 'day').diff(dayjs(sale.FECHA).endOf('day'), 'month') +
    1;
  const interesesPorMes = {
    corto: (sale.MONTO_A_CORTO_PLAZO - sale.PRECIO_DE_CONTADO) / 4,
    largo: (sale.PRECIO_TOTAL - sale.MONTO_A_CORTO_PLAZO) / 7,
  };

  const saldoALiquidarHoy = useMemo(() => {
    return (
      (tiempoTranscurrido <= 1
        ? sale.PRECIO_DE_CONTADO
        : tiempoTranscurrido <= 3
        ? sale.PRECIO_DE_CONTADO + tiempoTranscurrido * interesesPorMes.corto
        : [4, 5].includes(tiempoTranscurrido)
        ? sale.MONTO_A_CORTO_PLAZO
        : tiempoTranscurrido <= 12
        ? sale.MONTO_A_CORTO_PLAZO +
          (tiempoTranscurrido - 4) * interesesPorMes.largo
        : sale.PRECIO_TOTAL) - totalAbonado
    );
  }, [
    tiempoTranscurrido,
    sale.PRECIO_DE_CONTADO,
    sale.MONTO_A_CORTO_PLAZO,
    sale.PRECIO_TOTAL,
    interesesPorMes.corto,
    interesesPorMes.largo,
    totalAbonado,
  ]);

  // console.log({tiempoTranscurrido, interesesPorMes, saldoALiquidarHoy});

  const statusPagosAtrasados =
    porcentajeParcialBySale.NUM_PAGOS_ATRASADOS < 1
      ? 'SUCCESS'
      : porcentajeParcialBySale.NUM_PAGOS_ATRASADOS < 5
      ? 'WARNING'
      : 'DANGER';
  const badgeAtrasadosStyle =
    statusPagosAtrasados === 'SUCCESS'
      ? saleDetailsStyles.badgeSuccess
      : statusPagosAtrasados === 'WARNING'
      ? saleDetailsStyles.badgeWarning
      : saleDetailsStyles.badgeDanger;
  const badgeTextAtrasadosStyle =
    statusPagosAtrasados === 'SUCCESS'
      ? saleDetailsStyles.badgeSuccessText
      : statusPagosAtrasados === 'WARNING'
      ? saleDetailsStyles.badgeWarningText
      : saleDetailsStyles.badgeDangerText;

  const handlePressPayment = useCallback(
    (item: PagoServer, index: number) => {
      dayjs(item.FECHA_HORA_PAGO).isAfter(
        userData.FECHA_CARGA_INICIAL.toDate(),
      ) && index === 0
        ? goToPayment(item.ID)
        : ToastAndroid.show('No puedes abrir este pago', ToastAndroid.SHORT);
    },
    [userData.FECHA_CARGA_INICIAL, goToPayment],
  );

  if (loading) {
    return (
      <View style={saleDetailsStyles.loaderContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <ScrollView style={saleDetailsStyles.container}>
      <View style={saleDetailsStyles.header}>
        <Pressable onPress={handleOpenMap}>
          <Image
            source={require('../../../../../assets/map.png')}
            style={saleDetailsStyles.mapImg}
          />
        </Pressable>
        <View style={saleDetailsStyles.titleContainer}>
          <Text style={saleDetailsStyles.title}>{sale.CLIENTE}</Text>
          <Text style={saleDetailsStyles.textPrimary}>{sale.FOLIO}</Text>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalMapVisible}
        style={saleDetailsStyles.modalMap}
        onRequestClose={() => {
          setModalMapVisible(!modalMapVisible);
          setShowAllLocations(false);
        }}>
        <View style={saleDetailsStyles.mapContainer}>
          <MapView
            style={saleDetailsStyles.map}
            zoomControlEnabled
            zoomTapEnabled
            userLocationCalloutEnabled
            showsUserLocation
            initialRegion={{
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.0222,
              longitudeDelta: 0.01,
            }}>
            {showAllLocations
              ? sale.pagos.map(pago => (
                  <Marker
                    key={pago.ID}
                    coordinate={{
                      latitude: Number(pago.LAT),
                      longitude: Number(pago.LNG),
                    }}
                  />
                ))
              : centroids.map(payment => (
                  <Marker
                    key={payment.LAT + payment.LNG}
                    coordinate={{
                      latitude: Number(payment.LAT),
                      longitude: Number(payment.LNG),
                    }}
                    title={dayjs(sale.FECHA).format('DD/MM/YYYY')}
                    description={sale.CALLE}
                  />
                ))}
          </MapView>
          <Pressable
            style={saleDetailsStyles.addPayModalButton}
            onPress={() => setShowAllLocations(value => !value)}>
            <Text style={{color: 'white'}}>
              {showAllLocations ? 'Quitar' : 'Mostrar'} todas las ubicaciones
            </Text>
          </Pressable>
          <Pressable
            style={saleDetailsStyles.closeMap}
            onPress={() => setModalMapVisible(false)}>
            <Icon name="close" size={24} color="white" />
          </Pressable>
        </View>
      </Modal>
      <View style={saleDetailsStyles.personalInfo}>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Domicilio:</Text>
          <Text style={saleDetailsStyles.textSecondary}>
            {sale.CALLE}, {sale.CIUDAD}, {sale.ESTADO}
          </Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>
            Aval o responsable:
          </Text>
          <Text style={saleDetailsStyles.textSecondary}>
            {sale.AVAL_O_RESPONSABLE}
          </Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <View style={saleDetailsStyles.row}>
            <View style={saleDetailsStyles.telInfo}>
              <Text style={saleDetailsStyles.textTertiary}>
                Fecha de venta:
              </Text>
              <Text style={saleDetailsStyles.textSecondary}>
                {dayjs(sale.FECHA).format('DD/MM/YYYY')}
              </Text>
            </View>
            <View style={saleDetailsStyles.telActions}>
              <TouchableOpacity
                style={[
                  saleDetailsStyles.telButton,
                  saleDetailsStyles.telWhatsapp,
                ]}>
                <Icon
                  name="calendar"
                  size={30}
                  color="green"
                  onPress={() => openCalendar()}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  saleDetailsStyles.telButton,
                  saleDetailsStyles.telWhatsapp,
                ]}>
                <Icon
                  name="calculator"
                  size={30}
                  color="green"
                  onPress={() => openCalculator()}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <View style={saleDetailsStyles.row}>
            <View style={saleDetailsStyles.telInfo}>
              <Text style={saleDetailsStyles.textTertiary}>Teléfono:</Text>
              <Text style={saleDetailsStyles.textSecondary}>
                {sale.TELEFONO}
              </Text>
            </View>
            <View style={saleDetailsStyles.telActions}>
              <TouchableOpacity
                style={[
                  saleDetailsStyles.telButton,
                  saleDetailsStyles.telPhone,
                ]}
                onPress={() => callNumber(sale.TELEFONO)}>
                <Icon name="phone" size={30} color={PRIMARY_COLOR} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  saleDetailsStyles.telButton,
                  saleDetailsStyles.telWhatsapp,
                ]}>
                <Icon
                  name="whatsapp"
                  size={30}
                  color="green"
                  onPress={() => sendWhatsapp(sale.TELEFONO)}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={saleDetailsStyles.rowHalf}>
          <View style={saleDetailsStyles.rowItem}>
            <Text style={saleDetailsStyles.textTertiary}>Total venta:</Text>
            <Text style={saleDetailsStyles.textSecondary}>
              ${sale.PRECIO_TOTAL}
            </Text>
          </View>
          <View style={saleDetailsStyles.rowItem}>
            <Text style={saleDetailsStyles.textTertiary}>
              Frecuencia de pago:
            </Text>
            <Text style={saleDetailsStyles.textSecondary}>
              {sale.FREC_PAGO}
            </Text>
          </View>
        </View>
        <View style={saleDetailsStyles.rowHalf}>
          <View style={saleDetailsStyles.rowItem}>
            <Text style={saleDetailsStyles.textTertiary}>Parcialidad:</Text>
            <Text style={saleDetailsStyles.textSecondary}>
              ${sale.PARCIALIDAD}
            </Text>
          </View>
          <View style={saleDetailsStyles.rowItem}>
            <Text style={saleDetailsStyles.textTertiary}>Enganche:</Text>
            <Text style={saleDetailsStyles.textSecondary}>
              ${sale.ENGANCHE}
            </Text>
          </View>
        </View>
        <View style={saleDetailsStyles.rowHalf}>
          <View style={saleDetailsStyles.rowItem}>
            <Text style={saleDetailsStyles.textTertiary}>
              Limite de crédito:
            </Text>
            <Text style={saleDetailsStyles.textSecondary}>
              ${sale.LIMITE_CREDITO}
            </Text>
          </View>
          <View style={saleDetailsStyles.rowItem}>
            <Text style={saleDetailsStyles.textTertiary}>
              Precio de contado:
            </Text>
            <Text style={saleDetailsStyles.textSecondary}>
              ${sale.PRECIO_DE_CONTADO}
            </Text>
          </View>
        </View>

        <View style={saleDetailsStyles.rowHalf}>
          <View style={saleDetailsStyles.rowItem}>
            <Text style={saleDetailsStyles.textTertiary}>
              Precio a {sale.TIEMPO_A_CORTO_PLAZOMESES} mes(es):
            </Text>
            <Text style={saleDetailsStyles.textSecondary}>
              ${sale.MONTO_A_CORTO_PLAZO}
            </Text>
          </View>
          <View style={saleDetailsStyles.rowItem}>
            <Text style={saleDetailsStyles.textTertiary}>Zona:</Text>
            <Text style={saleDetailsStyles.textSecondary}>
              {sale.ZONA_NOMBRE}
            </Text>
          </View>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Notas:</Text>
          <Text style={saleDetailsStyles.textSecondary}>{sale.NOTAS}</Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Vendedores:</Text>
          <Text style={saleDetailsStyles.textSecondary}>{sale.VENDEDOR_1}</Text>
          {sale.VENDEDOR_2 && (
            <Text style={saleDetailsStyles.textSecondary}>
              {sale.VENDEDOR_2}
            </Text>
          )}
          {sale.VENDEDOR_3 && (
            <Text style={saleDetailsStyles.textSecondary}>
              {sale.VENDEDOR_3}
            </Text>
          )}
        </View>

        {sale.PRECIO_DE_CONTADO !== 0 &&
          Number.isInteger(sale.PRECIO_DE_CONTADO) &&
          sale.SALDO_REST !== 0 && (
            <View>
              <ImageBackground
                style={saleDetailsStyles.pricingCard}
                source={require('../../../../../assets/bg-white-gradient.png')}>
                <Text style={saleDetailsStyles.pricingCardText}>
                  Hoy liquida con
                </Text>
                <Text style={saleDetailsStyles.pricingCardTitle}>
                  ${saldoALiquidarHoy.toFixed(0)}
                </Text>
                <Text style={saleDetailsStyles.pricingCardSubtitle}>
                  Precio{' '}
                  {tiempoTranscurrido == 1
                    ? 'de contado'
                    : 'a ' + tiempoTranscurrido + ' meses'}
                </Text>
                <View style={saleDetailsStyles.divider}></View>
                <Text style={saleDetailsStyles.pricingCardSecondaryText}>
                  Valido hasta{' '}
                  {dayjs(sale.FECHA)
                    .add(14, 'day')
                    .add(tiempoTranscurrido, 'month')
                    .format('DD/MM/YYYY')}
                </Text>
              </ImageBackground>
            </View>
          )}

        <Text style={saleDetailsStyles.subtitle}>Productos</Text>
        {productos.map((producto: Producto) => (
          <View style={saleDetailsStyles.productoItem} key={producto.POSICION}>
            <Text
              style={[
                saleDetailsStyles.textSecondary,
                saleDetailsStyles.productItemName,
              ]}>
              {producto.CANTIDAD} - {producto.ARTICULO}
            </Text>
            <Text
              style={[
                saleDetailsStyles.textSecondary,
                saleDetailsStyles.productoItemPrice,
              ]}>
              ${producto.PRECIO_UNITARIO_IMPTO}
            </Text>
          </View>
        ))}
      </View>

      {otherSales.length > 0 && (
        <>
          <Text style={[saleDetailsStyles.subtitle, {marginBottom: 10}]}>
            Ventas del Mismo Cliente
          </Text>
          <View style={{gap: 10, marginHorizontal: 20, marginBottom: 20}}>
            {otherSales.map(sale => {
              return (
                <Card
                  sale={sale}
                  key={sale.DOCTO_CC_ID}
                  onPress={() =>
                    navigation.navigate('SaleDetails', {
                      saleId: sale.DOCTO_CC_ID,
                    })
                  }
                />
              );
            })}
          </View>
        </>
      )}

      <View style={saleDetailsStyles.results}>
        <View style={saleDetailsStyles.resultItem}>
          <View style={saleDetailsStyles.resultItemIconContainer}>
            <Icon name="money" size={24} color="white" />
          </View>
          <View>
            <Text style={saleDetailsStyles.textPrimaryInverse}>
              ${sale.SALDO_REST}
            </Text>
            <Text style={saleDetailsStyles.textTertiaryInverse}>Saldo</Text>
          </View>
        </View>
        <View style={saleDetailsStyles.resultItem}>
          <View style={saleDetailsStyles.resultItemIconContainer}>
            <Icon name="percent" size={24} color="white" />
          </View>
          <View>
            <Text style={saleDetailsStyles.textPrimaryInverse}>
              {progress.toFixed(2)}%
            </Text>
            <Text style={saleDetailsStyles.textTertiaryInverse}>
              Porc. pagado
            </Text>
          </View>
        </View>
      </View>

      <View style={saleDetailsStyles.saleInfo}>
        {porcentajeParcialBySale.NUM_PAGOS_ATRASADOS <= 0.9999 ? (
          <View
            style={[saleDetailsStyles.badge, saleDetailsStyles.badgeSuccess1]}>
            <Text style={saleDetailsStyles.badgeSuccessText1}>
              NO TIENE ATRASOS
            </Text>
          </View>
        ) : dayjs().diff(dayjs(sale.FECHA), 'year') >= 1 ? (
          <View style={[saleDetailsStyles.badge, badgeAtrasadosStyle]}>
            <Text style={badgeTextAtrasadosStyle}>CTA. VENCIDA</Text>
          </View>
        ) : (
          <View style={[saleDetailsStyles.badge, badgeAtrasadosStyle]}>
            <Text style={badgeTextAtrasadosStyle}>PAGOS ATRASADOS: </Text>
            <Text style={badgeTextAtrasadosStyle}>
              {porcentajeParcialBySale.NUM_PAGOS_ATRASADOS.toFixed(0)}
            </Text>
          </View>
        )}
        {paymentsOrder[0] && (
          <View style={[saleDetailsStyles.badge, saleDetailsStyles.badgeBase]}>
            <Text style={saleDetailsStyles.badgeTextBase}>ÚLTIMO PAGO: </Text>
            <Text
              style={[saleDetailsStyles.badgeTextBase, {fontWeight: '600'}]}>
              {dayjs(paymentsOrder[0].FECHA_HORA_PAGO).fromNow().toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={saleDetailsStyles.addPayModalContainer}>
          <View style={saleDetailsStyles.addPayModal}>
            <Text style={saleDetailsStyles.addPayModalTitle}>Agregar Pago</Text>
            <TextInput
              style={saleDetailsStyles.addPayModalInput}
              placeholder="Cantidad"
              keyboardType="numeric"
              onChangeText={text => handleInputPaymentChange(text)}
              value={payment.toString()}
            />
            <View style={saleDetailsStyles.paySugerencias}>
              {!cantsRepeat.includes(sale.PARCIALIDAD) && (
                <Pressable
                  style={[
                    saleDetailsStyles.badgeSuccess,
                    sale.PARCIALIDAD === payment && {
                      backgroundColor: '#2e7d32',
                    },
                  ]}>
                  <Text
                    style={[
                      saleDetailsStyles.badgeSuccessText,
                      sale.PARCIALIDAD === payment && {color: 'white'},
                    ]}
                    onPress={() =>
                      handleInputPaymentChange(sale.PARCIALIDAD.toString())
                    }>
                    {sale.PARCIALIDAD}
                  </Text>
                </Pressable>
              )}
              {cantsRepeat.map(cant => (
                <Pressable
                  style={[
                    saleDetailsStyles.badgeSuccess,
                    cant === payment && {backgroundColor: '#2e7d32'},
                  ]}
                  key={cant}>
                  <Text
                    style={[
                      saleDetailsStyles.badgeSuccessText,
                      cant === payment && {color: 'white'},
                    ]}
                    onPress={() => handleInputPaymentChange(cant.toString())}>
                    {cant}
                  </Text>
                </Pressable>
              ))}
            </View>
            {alertPayment !== '' && (
              <Text style={saleDetailsStyles.alertPayment}>{alertPayment}</Text>
            )}
            <RNPickerSelect
              onValueChange={value => setSelectedFormaCobro(value)}
              style={{
                inputAndroid: {
                  color: 'black',
                  fontSize: 20,
                },
                inputIOS: {
                  color: 'black',
                  fontSize: 20,
                },
                placeholder: {
                  color: 'black',
                  fontSize: 20,
                },
                viewContainer: {
                  borderColor: 'lightgrey',
                  borderWidth: 1,
                  borderRadius: 10,
                },
              }}
              placeholder={{
                label: 'Efectivo',
                value: PAGO_EN_EFECTIVO_ID,
              }}
              items={[
                // {label: 'Efectivo', value: PAGO_EN_EFECTIVO_ID},
                {label: 'Transferencia', value: PAGO_CON_TRANSFERENCIA_ID},
              ]}
            />
            <Pressable
              style={[
                saleDetailsStyles.addPayModalButton,
                {backgroundColor: '#198754'},
              ]}
              onPress={() => handleAddPayment()}
              disabled={loadingSave}>
              {loadingSave && <ActivityIndicator size="small" color="white" />}

              {!loadingSave && (
                <Text style={saleDetailsStyles.addPaymentButtonText}>
                  Agregar
                </Text>
              )}
            </Pressable>
            <Pressable
              style={[
                saleDetailsStyles.addPayModalClose,
                {backgroundColor: '#dc3545'},
              ]}
              onPress={() => handleClosePaymentModal()}>
              <Text style={saleDetailsStyles.addPayModalCloseText}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Pressable
        style={[saleDetailsStyles.addPaymentButton]}
        onPress={() => handleOpenModalAddPayment()}>
        <Text style={saleDetailsStyles.addPaymentButtonText}>AGREGAR PAGO</Text>
        <Icon6 name="money-bills" size={40} color="white" />
      </Pressable>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginHorizontal: 20,
        }}>
        <Pressable
          style={[saleDetailsStyles.addCondonacionButton]}
          onPress={() => handleOpenCondonacionModal()}>
          <Text style={saleDetailsStyles.addPayModalCloseText}>
            AGREGAR CONDONACIÓN
          </Text>
          <Icon6 name="file-circle-check" size={30} color="white" />
        </Pressable>
        <Pressable
          style={[saleDetailsStyles.addVisitaButton]}
          onPress={() => setModalVisitaVisible(true)}>
          <Text style={saleDetailsStyles.addPayModalCloseText}>
            AGREGAR VISITA
          </Text>
          <Icon6 name="house" size={30} color="white" />
        </Pressable>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisitaVisible}
        onRequestClose={() => {
          setModalVisitaVisible(!modalVisitaVisible);
        }}>
        <View style={saleDetailsStyles.addPayModalContainer}>
          <View style={saleDetailsStyles.addPayModal}>
            <Text style={saleDetailsStyles.addPayModalTitle}>
              Agregar Visita
            </Text>
            <RNPickerSelect
              value={selectedNotaVisita}
              onValueChange={value => setSelectedNotaVisita(value)}
              placeholder={{
                label: NO_SE_ENCONTRABA,
                value: NO_SE_ENCONTRABA,
              }}
              items={[
                // {label: NO_SE_ENCONTRABA, value: NO_SE_ENCONTRABA},
                {label: NO_VA_A_DAR_PAGO, value: NO_VA_A_DAR_PAGO},
                {label: SE_ESCONDE_Y_NO_SALE, value: SE_ESCONDE_Y_NO_SALE},
              ]}
              style={{
                inputAndroid: {
                  color: 'black',
                  fontSize: 20,
                },
                inputIOS: {
                  color: 'black',
                  fontSize: 20,
                },
                placeholder: {
                  color: 'black',
                  fontSize: 20,
                },
                viewContainer: {
                  borderColor: 'lightgrey',
                  borderWidth: 1,
                  borderRadius: 10,
                },
              }}
            />
            <TextInput
              style={saleDetailsStyles.addNotaModalInput}
              placeholder="Nota Adicional"
              placeholderTextColor="gray"
              multiline
              scrollEnabled={false}
              numberOfLines={10}
              onChangeText={text => setNotaVisita(text)}
            />
            <Pressable
              style={[
                saleDetailsStyles.addPayModalButton,
                {backgroundColor: '#198754'},
              ]}
              onPress={handleAddVisita}
              disabled={loadingSave}>
              <Text style={saleDetailsStyles.addPaymentButtonText}>
                {loadingSave && (
                  <ActivityIndicator size="small" color="white" />
                )}

                {!loadingSave && (
                  <Text style={saleDetailsStyles.addPaymentButtonText}>
                    Agregar
                  </Text>
                )}
              </Text>
            </Pressable>
            <Pressable
              style={[
                saleDetailsStyles.addPayModalClose,
                {backgroundColor: '#dc3545'},
              ]}
              onPress={() => handleCloseVisitaModal()}>
              <Text style={saleDetailsStyles.addPayModalCloseText}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCondonacionVisible}
        onRequestClose={() => {
          setModalCondonacionVisible(!modalCondonacionVisible);
        }}>
        <View style={saleDetailsStyles.addPayModalContainer}>
          <View style={saleDetailsStyles.addPayModal}>
            <Text style={saleDetailsStyles.addPayModalTitle}>
              Agregar Condonación
            </Text>
            <TextInput
              style={saleDetailsStyles.addPayModalInput}
              placeholder="Cantidad"
              keyboardType="numeric"
              onChangeText={text => handleInputPaymentChange(text)}
              value={payment.toString()}
            />
            {alertPayment !== '' && (
              <Text style={saleDetailsStyles.alertPayment}>{alertPayment}</Text>
            )}
            <Pressable
              style={[
                saleDetailsStyles.addPayModalButton,
                {backgroundColor: '#198754'},
              ]}
              onPress={() => handleAddCondonacion()}>
              <Text style={saleDetailsStyles.addPaymentButtonText}>
                Agregar
              </Text>
            </Pressable>
            <Pressable
              style={[
                saleDetailsStyles.addPayModalClose,
                {backgroundColor: '#dc3545'},
              ]}
              onPress={() => handleCloseCondonacionModal()}
              disabled={loadingSave}>
              <Text style={saleDetailsStyles.addPayModalCloseText}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={saleDetailsStyles.payments}>
        <Text style={[saleDetailsStyles.subtitle, {marginBottom: 20}]}>
          Historial de pagos
        </Text>
        <FlatList
          data={paymentsOrder}
          keyExtractor={item => item.ID}
          ItemSeparatorComponent={() => <View style={{height: 5}} />}
          scrollEnabled={false}
          renderItem={({item, index}) => (
            <PaymentItem
              key={item.ID}
              payment={item}
              onPress={() => handlePressPayment(item, index)}
            />
          )}
        />
      </View>
    </ScrollView>
  );
};

export interface Payment {
  CLIENTE_ID: number;
  NOMBRE_CLIENTE: string;
  COBRADOR: string;
  COBRADOR_ID: number;
  DOCTO_CC_ID: number;
  DOCTO_CC_ACR_ID: number;
  FECHA_HORA_PAGO: string;
  FORMA_COBRO_ID: number;
  ZONA_CLIENTE_ID: number;
  ID: string;
  IMPORTE: number;
  LAT: number;
  LNG: number;
  GUARDADO_EN_MICROSIP: boolean;
}

export type PaymentDto = Payment;

export interface PaymentWithCliente extends Payment {
  CLIENTE: string;
}

const PaymentItem = memo(
  ({payment, onPress}: {payment: PagoServer; onPress: Function}) => {
    const {userData} = useContext(AuthContext);
    return (
      <Pressable
        style={{borderRadius: 20, overflow: 'hidden'}}
        onPress={() => onPress()}>
        <ImageBackground
          style={saleDetailsStyles.paymentItem}
          source={
            dayjs(userData.FECHA_CARGA_INICIAL.toDate()).isBefore(
              dayjs(payment.FECHA_HORA_PAGO),
            )
              ? require('../../../../../assets/bg-gradient-green.png')
              : dayjs(payment.FECHA_HORA_PAGO).month() % 2 === 0
              ? require('../../../../../assets/bg-white-gradient.png')
              : require('../../../../../assets/bg-gradient-blue-light.png')
          }
          resizeMode="cover">
          <View style={{width: '80%'}}>
            <Text
              style={[
                saleDetailsStyles.textSecondary,
                saleDetailsStyles.colorTextWhite,
              ]}>
              {payment.COBRADOR.slice(0, 20)}
              {payment.COBRADOR.length > 20 && '...'}
            </Text>
            <Text
              style={[
                saleDetailsStyles.textTertiary,
                saleDetailsStyles.colorTextWhite,
              ]}>
              {dayjs(payment.FECHA_HORA_PAGO)
                .format('dddd DD/MM/YYYY - hh:mm a')
                .toUpperCase()}
            </Text>
            <Text
              style={[
                saleDetailsStyles.textTertiary,
                saleDetailsStyles.colorTextWhite,
              ]}>
              {payment.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID && 'EFECTIVO'}
              {payment.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID &&
                'TRANSFERENCIA'}
              {payment.FORMA_COBRO_ID === CONDONACION_ID && 'CONDONACIÓN'}
            </Text>
          </View>
          <View>
            <Text
              style={[
                saleDetailsStyles.textSecondary,
                saleDetailsStyles.colorTextWhite,
                {fontSize: 24},
              ]}>
              ${payment.IMPORTE}
            </Text>
            <Text
              style={[
                saleDetailsStyles.textSecondary,
                saleDetailsStyles.colorTextWhite,
              ]}>
              {payment.GUARDADO_EN_MICROSIP ? 'Enviado' : 'No enviado'}
            </Text>
          </View>
        </ImageBackground>
      </Pressable>
    );
  },
);

export default SaleDetails;
