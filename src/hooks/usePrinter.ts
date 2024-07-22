import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BLEPrinter, IBLEPrinter} from 'react-native-thermal-receipt-printer';
import {PermissionsAndroid, Platform, ToastAndroid} from 'react-native';

const usePrinter = () => {
  const [selectedPrinter, setSelectedPrinter] = useState<IBLEPrinter>();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<IBLEPrinter[]>([]);

  const getListDevices = async () => {
    try {
      setLoading(true);
      await BLEPrinter.init();
      const results = await BLEPrinter.getDeviceList();
      setDevices(results);
    } catch (err) {
      console.warn('Failed to get devices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadPrinter = async () => {
      try {
        const printer = await AsyncStorage.getItem('selectedPrinter');
        if (printer) {
          const parsedPrinter = JSON.parse(printer);
          setSelectedPrinter(parsedPrinter);
        }
      } catch (err) {
        console.warn('Failed to load printer', err);
      }
    };
    loadPrinter();
  }, []);

  useEffect(() => {
    const requestBluetoothPermission = async () => {
      console.log('Requesting permissions');
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const allPermissionsGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED,
        );

        return allPermissionsGranted;
      }
      return true;
    };

    requestBluetoothPermission();

    getListDevices();
  }, []);

  const savePrinter = async (printer: IBLEPrinter) => {
    try {
      await AsyncStorage.setItem('selectedPrinter', JSON.stringify(printer));
      setSelectedPrinter(printer);
    } catch (err) {
      console.warn('Failed to save printer', err);
    }
  };

  const connectPrinter = async () => {
    if (!selectedPrinter) {
      console.warn('Impresora no seleccionada');
      return;
    }
    try {
      setLoading(true);
      await BLEPrinter.connectPrinter(selectedPrinter.inner_mac_address);
      ToastAndroid.show('Conectado a la impresora', ToastAndroid.SHORT);
    } catch (err) {
      console.warn('Failed to connect to printer', err);
    } finally {
      setLoading(false);
    }
  };

  const print = async (text: string) => {
    if (!selectedPrinter) return;
    try {
      await BLEPrinter.printText(text);
    } catch (err) {
      console.warn('Failed to print', err);
    }
  };

  return {
    devices,
    selectedPrinter,
    print,
    savePrinter,
    connectPrinter,
    getListDevices,
    loading,
  };
};

export default usePrinter;
