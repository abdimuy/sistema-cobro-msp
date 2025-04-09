import Geolocation, {
  GeolocationOptions,
  GeolocationResponse,
} from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import {Alert, Linking} from 'react-native';

export const checkGPSEnabled = async () => {
  try {
    const isGPSEnabled = await DeviceInfo.isLocationEnabled(); // Verifica si el GPS está habilitado
    if (!isGPSEnabled) {
      // Si el GPS está desactivado, notifica al usuario
      Alert.alert(
        'GPS desactivado',
        'El GPS está desactivado. Por favor, actívalo para continuar.',
        [
          {text: 'Abrir configuración', onPress: () => Linking.openSettings()},
          {text: 'Cancelar', style: 'cancel'},
        ],
      );
      throw new Error('GPS desactivado.');
    }
  } catch (err) {
    console.error('Error al verificar el GPS:', err);
    throw err;
  }
};

const getPosition = (
  options: GeolocationOptions,
): Promise<GeolocationResponse> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error),
      options,
    );
  });
};

const getAccuratePosition = async () => {
  try {
    await checkGPSEnabled();
    // Intentar obtener la ubicación con alta precisión
    console.log('Obteniendo la ubicacion con GPS');
    const position = await getPosition({
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    });
    return position;
  } catch (error) {
    console.log('Alta precisión falló, intentando con menor precisión:', error);
    try {
      // Intentar obtener la ubicación con menor precisión
      console.log('Obteniendo la ubicacion con datos');
      const position = await getPosition({
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 0,
      });
      return position;
    } catch (error2) {
      console.log(
        'Menor precisión también falló, no se obtuvo la ubicacion:',
        error2,
      );
      const positionDefault: GeolocationResponse = {
        coords: {
          latitude: 0, // Latitud ficticia
          longitude: 0, // Longitud ficticia
          altitude: null, // Altitud ficticia
          accuracy: 0, // Precisión ficticia (en metros)
          altitudeAccuracy: null, // Precisión de altitud ficticia
          heading: null, // Dirección ficticia (en grados)
          speed: null, // Velocidad ficticia (en metros/segundo)
        },
        timestamp: Date.now(),
      };
      return positionDefault;
    }
  }
};

export default getAccuratePosition;
