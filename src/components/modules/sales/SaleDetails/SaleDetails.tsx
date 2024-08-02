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
} from 'react-native';
import React, {useContext, useEffect, useMemo, useState} from 'react';
import saleDetailsStyles from './saleDetails.style';
import Icon from 'react-native-vector-icons/FontAwesome';
import {PRIMARY_COLOR} from '../../../../contants/colors';
import MapView, {Marker} from 'react-native-maps';
import dayjs from 'dayjs';
import Geolocation from '@react-native-community/geolocation';
import RNPickerSelect from 'react-native-picker-select';
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
import {db} from '../../../../firebase/connection';
import {AuthContext} from '../../../../../App';
import useGetSale from '../../../../hooks/useGetSale';
import {SalesStackParamList} from '../../../../routes/SalesRoutes';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import useGetProductosByFolio from '../../../../hooks/useGetProductosByFolio';
export interface Producto {
  ID: string;
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

export const PAGO_EN_EFECTIVO_ID = 157;
export const PAGO_CON_TRANSFERENCIA_ID = 52569;
export const CONDONACION_ID = 137026;

const SaleDetails = () => {
  const {userData} = useContext(AuthContext);
  const route = useRoute<SaleDetailScreenRouteProp>();
  const {saleId} = route.params;
  const navigation = useNavigation<SaleDetailsNavigationProp>();
  const {sale, loading} = useGetSale(saleId);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisitaVisible, setModalVisitaVisible] = useState(false);
  const [modalMapVisible, setModalMapVisible] = useState(false);
  const [modalCondonacionVisible, setModalCondonacionVisible] = useState(false);
  const [payment, setPayment] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notaVisita, setNotaVisita] = useState('');
  const [selectedNotaVisita, setSelectedNotaVisita] = useState<string>('');
  const [selectedFormaCobro, setSelectedFormaCobro] =
    useState<number>(PAGO_EN_EFECTIVO_ID);
  const [alertPayment, setAlertPayment] = useState<string>('');

  const {productos, loading: productosLoading} = useGetProductosByFolio(
    sale.FOLIO,
  );
  const progress = useMemo(() => {
    return ((sale.PRECIO_TOTAL - sale.SALDO_REST) / sale.PRECIO_TOTAL) * 100;
  }, [sale.PRECIO_TOTAL, sale.SALDO_REST]);

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const sendWhatsapp = (phone: string) => {
    Linking.openURL('whatsapp://send?text= &phone=' + phone);
  };

  const handleOpenMap = () => {
    setModalMapVisible(true);
  };

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
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleOpenModalAddPayment = () => {
    setModalVisible(true);
    setPayment(0);
  };

  const handleAddPayment = async () => {
    if (payment <= 0) return setAlertPayment('EL PAGO DEBE SER MAYOR A 0');
    requestLocationPermission().then(() => {
      Geolocation.getCurrentPosition(info => {
        const lat = info.coords.latitude;
        const lng = info.coords.longitude;

        const data: PaymentDto = {
          CLIENTE_ID: sale.CLIENTE_ID,
          NOMBRE_CLIENTE: sale.CLIENTE,
          FECHA_HORA_PAGO: Timestamp.fromDate(dayjs().toDate()),
          COBRADOR: sale.NOMBRE_COBRADOR,
          COBRADOR_ID: userData.COBRADOR_ID,
          LAT: lat,
          LNG: lng,
          IMPORTE: payment,
          DOCTO_CC_ID: sale.DOCTO_CC_ID,
          DOCTO_CC_ACR_ID: sale.DOCTO_CC_ACR_ID,
          FORMA_COBRO_ID: selectedFormaCobro,
          ZONA_CLIENTE_ID: sale.ZONA_CLIENTE_ID,
          GUARDADO_EN_MICROSIP: false,
        };
        try {
          const batch = writeBatch(db);
          batch.set(doc(collection(db, 'pagos')), data);
          batch.update(doc(db, 'ventas', sale.ID), {
            SALDO_REST: sale.SALDO_REST - payment,
            ESTADO_COBRANZA: 'PAGADO',
          });
          batch.commit();

          setModalVisible(false);
        } catch (e) {
          console.error('Error adding document: ', e);
        }
        setModalVisible(!modalVisible);
      });
    });
  };

  const handleAddVisita = () => {
    requestLocationPermission().then(() => {
      Geolocation.getCurrentPosition(info => {
        const lat = info.coords.latitude;
        const lng = info.coords.longitude;
        const data = {
          CLIENTE_ID: sale.CLIENTE_ID,
          FECHA_HORA_VISITA: Timestamp.fromDate(dayjs().toDate()),
          COBRADOR: sale.NOMBRE_COBRADOR,
          COBRADOR_ID: userData.COBRADOR_ID,
          LAT: lat,
          LNG: lng,
          NOTA: notaVisita,
          TIPO_VISITA: selectedNotaVisita,
          FORMA_COBRO_ID: selectedFormaCobro,
          ZONA_CLIENTE_ID: sale.ZONA_CLIENTE_ID,
        };
        try {
          const batch = writeBatch(db);
          batch.set(doc(collection(db, 'visitas')), data);
          batch.commit();
          setModalVisitaVisible(false);
        } catch (e) {
          console.error('Error adding document: ', e);
        }
        setModalVisitaVisible(!modalVisitaVisible);
      });
    });
  };

  const handleOpenCondonacionModal = () => {
    setPayment(sale.SALDO_REST);
    setModalCondonacionVisible(true);
  };

  const handleAddCondonacion = () => {
    requestLocationPermission().then(() => {
      Geolocation.getCurrentPosition(info => {
        const lat = info.coords.latitude;
        const lng = info.coords.longitude;
        const data = {
          CLIENTE_ID: sale.CLIENTE_ID,
          FECHA_HORA_PAGO: Timestamp.fromDate(dayjs().toDate()),
          COBRADOR: sale.NOMBRE_COBRADOR,
          COBRADOR_ID: userData.COBRADOR_ID,
          LAT: lat,
          LNG: lng,
          IMPORTE: sale.SALDO_REST,
          DOCTO_CC_ID: sale.DOCTO_CC_ID,
          DOCTO_CC_ACR_ID: sale.DOCTO_CC_ACR_ID,
          FORMA_COBRO_ID: CONDONACION_ID,
          ZONA_CLIENTE_ID: sale.ZONA_CLIENTE_ID,
          GUARDADO_EN_MICROSIP: false,
        };
        try {
          const batch = writeBatch(db);
          batch.set(doc(collection(db, 'pagos')), data);
          batch.update(doc(db, 'ventas', sale.ID), {
            SALDO_REST: sale.SALDO_REST - data.IMPORTE,
            ESTADO_COBRANZA: 'PAGADO',
          });
          batch.commit();
        } catch (e) {
          console.error('Error adding document: ', e);
        }
        setModalCondonacionVisible(!modalCondonacionVisible);
      });
    });
  };

  const handleCloseCondonacionModal = () => {
    setModalCondonacionVisible(!modalCondonacionVisible);
    setPayment(0);
  };

  const handleCloseVisitaModal = () => {
    setModalVisitaVisible(!modalVisitaVisible);
    setNotaVisita('');
    setSelectedNotaVisita('');
    setSelectedFormaCobro(PAGO_EN_EFECTIVO_ID);
  };

  const handleClosePaymentModal = () => {
    setModalVisible(!modalVisible);
    setPayment(0);
  };

  const getPayments = () => {
    const q = query(
      collection(db, 'pagos'),
      where('DOCTO_CC_ID', '==', sale.DOCTO_CC_ID),
    );
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const pagosList: Payment[] = [];
      querySnapshot.forEach(doc => {
        pagosList.push({...doc.data(), ID: doc.id} as Payment);
      });
      setPayments(pagosList);
    });
    return unsubscribe;
  };

  useEffect(() => {
    let listener = getPayments();
    return () => listener();
  }, [sale]);

  const handleInputPaymentChange = (text: string) => {
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
  };

  const goToPayment = (paymentId: string) => {
    navigation.navigate('Payment', {paymentId: paymentId, saleId: saleId});
  };

  const paymentsOrder = payments.sort(
    (a, b) =>
      b.FECHA_HORA_PAGO.toDate().getTime() -
      a.FECHA_HORA_PAGO.toDate().getTime(),
  );

  useEffect(() => {
    if (payments.length > 0) {
      const lastPayment = paymentsOrder[0];
      setLat(lastPayment.LAT);
      setLng(lastPayment.LNG);
    }
  }, [payments]);

  if (loading || productosLoading) {
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
            source={require('../../../../../assets/map-icon.png')}
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
            <Marker
              coordinate={{latitude: lat, longitude: lng}}
              title={sale.CLIENTE}
              description={sale.CALLE}
            />
          </MapView>
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
          <Text style={saleDetailsStyles.textTertiary}>Fecha de venta:</Text>
          <Text style={saleDetailsStyles.textSecondary}>
            {sale.FECHA.toDate().toLocaleDateString()}
          </Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <View style={saleDetailsStyles.telContainer}>
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
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Total venta:</Text>
          <Text style={saleDetailsStyles.textSecondary}>
            ${sale.PRECIO_TOTAL}
          </Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Parcialidad:</Text>
          <Text style={saleDetailsStyles.textSecondary}>
            ${sale.PARCIALIDAD}
          </Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Enganche:</Text>
          <Text style={saleDetailsStyles.textSecondary}>${sale.ENGANCHE}</Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Limite de crédito:</Text>
          <Text style={saleDetailsStyles.textSecondary}>
            ${sale.LIMITE_CREDITO}
          </Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>
            Precio a {sale.TIEMPO_A_CORTO_PLAZOMESES} mes(es):
          </Text>
          <Text style={saleDetailsStyles.textSecondary}>
            ${sale.MONTO_A_CORTO_PLAZO}
          </Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Zona:</Text>
          <Text style={saleDetailsStyles.textSecondary}>
            {sale.ZONA_NOMBRE}
          </Text>
        </View>
        <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>Notas:</Text>
          <Text style={saleDetailsStyles.textSecondary}>{sale.NOTAS}</Text>
        </View>
        {/* <View style={saleDetailsStyles.personalInfoItem}>
          <Text style={saleDetailsStyles.textTertiary}>
            Frecuencia de pago:
          </Text>
          <Text style={saleDetailsStyles.textSecondary}>{
          }</Text>
        </View> */}
        <Text style={saleDetailsStyles.subtitle}>Productos</Text>
        {productos.map((producto: Producto) => (
          <View style={saleDetailsStyles.productoItem} key={producto.ID}>
            <Text
              style={[
                saleDetailsStyles.textSecondary,
                saleDetailsStyles.productItemName,
              ]}>
              {producto.ARTICULO}
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
              onPress={() => handleAddPayment()}>
              <Text style={saleDetailsStyles.addPaymentButtonText}>
                Agregar
              </Text>
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
        <Text style={saleDetailsStyles.addPaymentButtonText}>Agregar Pago</Text>
      </Pressable>
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
              onPress={handleAddVisita}>
              <Text
                style={saleDetailsStyles.addPaymentButtonText}
                disabled={selectedNotaVisita !== ''}>
                Agregar
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
      <Pressable
        style={[saleDetailsStyles.addVisitaButton]}
        onPress={() => setModalVisitaVisible(true)}>
        <Text style={saleDetailsStyles.addPayModalCloseText}>
          Agregar Visita
        </Text>
      </Pressable>
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
              onPress={() => handleCloseCondonacionModal()}>
              <Text style={saleDetailsStyles.addPayModalCloseText}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Pressable
        style={[saleDetailsStyles.addCondonacionButton]}
        onPress={() => handleOpenCondonacionModal()}>
        <Text style={saleDetailsStyles.addPayModalCloseText}>
          Agregar Condonación
        </Text>
      </Pressable>
      <View style={saleDetailsStyles.payments}>
        <Text style={saleDetailsStyles.subtitle}>Historial de pagos</Text>
        {paymentsOrder.map((payment: Payment) => (
          <PaymentItem
            key={payment.ID}
            payment={payment}
            onPress={() => goToPayment(payment.ID)}
          />
        ))}
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
  FECHA_HORA_PAGO: Timestamp;
  FORMA_COBRO_ID: number;
  ZONA_CLIENTE_ID: number;
  ID: string;
  IMPORTE: number;
  LAT: number;
  LNG: number;
  GUARDADO_EN_MICROSIP: boolean;
}

export type PaymentDto = Omit<Payment, 'ID'>;

export interface PaymentWithCliente extends Payment {
  CLIENTE: string;
}

const PaymentItem = ({
  payment,
  onPress,
}: {
  payment: Payment;
  onPress: Function;
}) => {
  return (
    <Pressable style={saleDetailsStyles.paymentItem} onPress={() => onPress()}>
      <Text style={saleDetailsStyles.textSecondary}>{payment.COBRADOR}</Text>
      <Text style={saleDetailsStyles.textTertiary}>
        {dayjs(payment.FECHA_HORA_PAGO.toDate()).format('DD/MM/YYYY - hh:mm a')}
      </Text>
      <Text style={saleDetailsStyles.textSecondary}>${payment.IMPORTE}</Text>
      <Text style={saleDetailsStyles.textTertiary}>
        {payment.FORMA_COBRO_ID === PAGO_EN_EFECTIVO_ID && 'EFECTIVO'}
        {payment.FORMA_COBRO_ID === PAGO_CON_TRANSFERENCIA_ID &&
          'TRANSFERENCIA'}
        {payment.FORMA_COBRO_ID === CONDONACION_ID && 'CONDONACIÓN'}
      </Text>
    </Pressable>
  );
};

export default SaleDetails;
