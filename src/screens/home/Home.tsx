import React, {useState} from 'react';
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
import {Timestamp, doc, writeBatch} from '@react-native-firebase/firestore';
import {auth, db} from '../../firebase/connection';

const Home = () => {
  const {
    userData,
    sales,
    salesLoading: loading,
  } = React.useContext(AuthContext);

  const [loadingCargaInicial, setLoadingCargaInicial] = useState(false);
  const {
    loading: loadingPagos,
    pagos,
    pagosHoy,
    lastPagos,
    lastPagosWithCliente,
  } = useGetPagosRuta(userData.ZONA_CLIENTE_ID);

  const totalCobradoSemanal = pagos.reduce(
    (acc, pago) => acc + pago.IMPORTE,
    0,
  );
  const totalCobradoHoy = pagosHoy.reduce((acc, pago) => acc + pago.IMPORTE, 0);

  const porcentaje = (pagos.length / sales.length) * 100;

  const handlerCargaInicial = () => {
    const batch = writeBatch(db);
    setLoadingCargaInicial(true);
    sales.forEach(sale => {
      const ref = doc(db, 'ventas', sale.ID);
      batch.update(ref, {
        ESTADO_COBRANZA: 'PENDIENTE',
      });
    });

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
  };

  const closeSession = () => {
    return auth().signOut();
  };

  if (loading || loadingPagos || loadingCargaInicial) {
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
          <Text style={homeStyles.detailsTitleSecondary}>Ultimos pagos</Text>
          <View style={homeStyles.detailsColumn}>
            {lastPagosWithCliente.map(pago => (
              <View key={pago.ID} style={homeStyles.detailsColumnItem}>
                <Text style={homeStyles.detailsSubtitle}>
                  {pago.FECHA_HORA_PAGO.toDate().toLocaleDateString()}
                </Text>
                <Text style={homeStyles.detailsSubtitle}>
                  ${pago.CLIENTE_ID}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Pressable
        style={homeStyles.closeSesion}
        onPress={handleCargaInicialButton}>
        <Text style={homeStyles.closeSesionText}>Carga inicial</Text>
      </Pressable>

      <Pressable style={homeStyles.closeSesion} onPress={handleLogoutButton}>
        <Text style={homeStyles.closeSesionText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
};

export default Home;
