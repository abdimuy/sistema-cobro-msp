import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import getRouteMapPoints, {
  RouteMapPoint,
} from '../../services/getRouteMapPoints';
import dayjs, {Dayjs} from 'dayjs';
import {routeMapsStyles} from './routeMaps.styles';
import MapView, {MapMarker, Marker} from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';

const RouteMap = () => {
  const [points, setPoints] = useState<RouteMapPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dates, setDates] = useState<{dateInit: Dayjs; dateEnd: Dayjs}>({
    dateInit: dayjs().startOf('day'),
    dateEnd: dayjs().endOf('day'),
  });
  const [date, setDate] = useState<Date>(dayjs().toDate());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const getPoints = () => {
    setLoading(true);
    getRouteMapPoints(dates.dateInit, dates.dateEnd)
      .then(points => {
        setPoints(points);
      })
      .catch(err => {
        Alert.alert('Error al obtener la ruta');
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getPoints();
    // requestLocationPermission();
  }, [dates]);

  useEffect(() => {
    setDates({
      dateInit: dayjs(date).startOf('day'),
      dateEnd: dayjs(date).endOf('day'),
    });
  }, [date]);

  const markersRef = useRef<{[key: string]: MapMarker}>({});
  const mapRef = useRef<MapView>(null);

  const focusLocation = (latitude: number, longitude: number, id: string) => {
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );

    if (markersRef.current[id]) {
      markersRef.current[id].showCallout();
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  const waypoints = points;

  return (
    <View style={routeMapsStyles.container}>
      <Text style={routeMapsStyles.title}>Mapa de Ruta</Text>
      <Pressable
        style={[routeMapsStyles.button]}
        onPress={() => {
          setShowDatePicker(true);
        }}>
        <Text style={[routeMapsStyles.buttonText]}>
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

      <MapView
        style={routeMapsStyles.map}
        initialRegion={{
          latitude: points[0]?.LAT || 18.462443,
          longitude: points[0]?.LNG || -97.392514,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        followsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        ref={mapRef}
        showsTraffic>
        {waypoints.map((point, index) => (
          <Marker
            key={point.DOCTO_CC_ID}
            coordinate={{latitude: point.LAT, longitude: point.LNG}}
            title={point.CLIENTE}
            description={point.CALLE}
            titleVisibility="adaptive"
            ref={ref =>
              ref ? (markersRef.current[point.DOCTO_CC_ID] = ref) : null
            }
          />
        ))}
      </MapView>

      <FlatList
        data={points}
        style={routeMapsStyles.list}
        renderItem={point => {
          return (
            <Pressable
              style={routeMapsStyles.listItem}
              onPress={() =>
                focusLocation(
                  point.item.LAT,
                  point.item.LNG,
                  point.item.DOCTO_CC_ID,
                )
              }>
              <View style={routeMapsStyles.listItemDetails}>
                <Text style={routeMapsStyles.text}>{point.item.CLIENTE}</Text>
                <Text style={routeMapsStyles.subtext}>
                  {dayjs(point.item.FECHA_HORA_PAGO).format(
                    'DD/MM/YYYY - hh:mm A',
                  )}
                </Text>
              </View>
              <Pressable></Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

export default RouteMap;

import {PermissionsAndroid, Platform} from 'react-native';

async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de ubicación',
          message:
            'La aplicación necesita acceso a tu ubicación para mostrarla en el mapa.',
          buttonNeutral: 'Preguntar luego',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Aceptar',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Permiso de ubicación concedido');
      } else {
        console.log('Permiso de ubicación denegado');
      }
    } catch (err) {
      console.warn(err);
    }
  }
}
