import React, {useEffect, useState} from 'react';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';

import {createDrawerNavigator} from '@react-navigation/drawer';
import Home from './src/screens/home/Home';
import DailyReport from './src/components/modules/reports/DailyReport/DailyReport';
import WeeklyReport from './src/components/modules/reports/WeeklyReport/WeeklyReport';
import LoginScreen from './src/screens/auth/login';
import {Spinner, View} from '@gluestack-ui/themed';
import {User as UserFB} from 'firebase/auth';
import {auth} from './src/firebase/connection';
import {User} from './src/screens/auth/getUser';
import useGetUser from './src/screens/auth/useGetUser';
import SalesNavigator from './src/routes/SalesRoutes';
import {Sale} from './src/screens/sales/Sales/sales.types';
import useSales from './src/screens/sales/Sales/useSales';
import firestore, {Timestamp} from '@react-native-firebase/firestore';
import {BleManager} from 'react-native-ble-plx';
import {Alert, Linking, Platform, Text} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {openDatabase} from './src/sqlite/connection';

export type RootDrawerParamList = {
  Home: undefined;
  Sales: undefined;
  dailyReport: undefined;
  weeklyReport: undefined;
  Login: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export const AuthContext = React.createContext<{
  user: UserFB | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  userData: User;
  setUserData: React.Dispatch<React.SetStateAction<User>>;
  sales: Sale[];
  salesLoading: boolean;
  salesByDay: {
    domingo: Sale[];
    lunes: Sale[];
    martes: Sale[];
    miercoles: Sale[];
    jueves: Sale[];
    viernes: Sale[];
    sabado: Sale[];
  };
}>({
  user: null,
  setUser: () => {},
  userData: {
    COBRADOR_ID: 0,
    CREATED_AT: Timestamp.now(),
    EMAIL: '',
    NOMBRE: '',
    TELEFONO: '',
    FECHA_CARGA_INICIAL: Timestamp.now(),
    ID: '',
    ZONA_CLIENTE_ID: 0,
  },
  setUserData: () => {
    return;
  },
  sales: [],
  salesLoading: true,
  salesByDay: {
    domingo: [],
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: [],
  },
});

export interface SaleByDay {
  domingo: Sale[];
  lunes: Sale[];
  martes: Sale[];
  miercoles: Sale[];
  jueves: Sale[];
  viernes: Sale[];
  sabado: Sale[];
}

const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [user, setUser] = React.useState<UserFB | null>(null);
  const [userData, setUserData] = React.useState<User>({
    COBRADOR_ID: 0,
    CREATED_AT: Timestamp.now(),
    EMAIL: '',
    NOMBRE: '',
    TELEFONO: '',
    FECHA_CARGA_INICIAL: Timestamp.now(),
    ID: '',
    ZONA_CLIENTE_ID: 0,
  });
  const {sales, loading} = useSales(userData.ZONA_CLIENTE_ID);
  const [salesByDay, setSalesByDay] = React.useState<SaleByDay>({
    domingo: [],
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: [],
  });

  useEffect(() => {
    if (loading) {
      return;
    }
    const salesByDay = sales.reduce(
      (acc: SaleByDay, sale: Sale) => {
        const day = new Date(sale.FECHA.toDate()).getDay();
        switch (day) {
          case 0:
            return {...acc, domingo: [...acc.domingo, sale]};
          case 1:
            return {...acc, lunes: [...acc.lunes, sale]};
          case 2:
            return {...acc, martes: [...acc.martes, sale]};
          case 3:
            return {...acc, miercoles: [...acc.miercoles, sale]};
          case 4:
            return {...acc, jueves: [...acc.jueves, sale]};
          case 5:
            return {...acc, viernes: [...acc.viernes, sale]};
          case 6:
            return {...acc, sabado: [...acc.sabado, sale]};
          default:
            return acc;
        }
      },
      {
        domingo: [],
        lunes: [],
        martes: [],
        miercoles: [],
        jueves: [],
        viernes: [],
        sabado: [],
      },
    );
    setSalesByDay(salesByDay);
  }, [sales, loading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        userData,
        setUserData,
        sales,
        salesLoading: loading,
        salesByDay,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

function RootNav() {
  const {user, setUser, setUserData} = React.useContext(AuthContext);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(authUser => {
      if (authUser) {
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const {user: userData, loading: loadingUserData} = useGetUser(
    user?.email as string,
    user,
  );

  useEffect(() => {
    if (loadingUserData) {
      return;
    }
    setUserData(userData as User);
  }, [userData, loadingUserData]);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center'}}>
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Drawer.Navigator
          screenOptions={{
            drawerType: 'slide',
            headerShown: false,
            unmountOnBlur: true,
          }}>
          <Drawer.Screen
            name="Home"
            component={Home}
            options={{
              drawerLabel: 'Inicio',
            }}
          />
          <Drawer.Screen
            name="Sales"
            component={SalesNavigator}
            options={{
              drawerLabel: 'Clientes',
            }}
          />
          <Drawer.Screen
            name="dailyReport"
            component={DailyReport}
            options={{
              drawerLabel: 'Reporte Diario',
            }}
          />
          <Drawer.Screen
            name="weeklyReport"
            component={WeeklyReport}
            options={{
              drawerLabel: 'Reporte Semanal',
            }}
          />
        </Drawer.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}

const App = () => {
  const manager = new BleManager();
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  const requestLocationPermission = async () => {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const result = await check(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.DENIED) {
      const newResult = await request(permission);
      return newResult === RESULTS.GRANTED;
    } else if (result === RESULTS.BLOCKED) {
      Alert.alert(
        'Permiso de GPS Denegado',
        'Por favor, habilita el permiso de GPS desde la configuración.',
        [
          {
            text: 'Abrir Configuración',
            onPress: () => Linking.openSettings(),
          },
        ],
        {cancelable: false},
      );
      return false;
    }
    return false;
  };

  const initDb = async () => {
    const db = await openDatabase();

    await db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS pagos
            (
                CLIENTE_ID INT,
                NOMBRE_CLIENTE TEXT,
                COBRADOR TEXT,
                COBRADOR_ID INT,
                DOCTO_CC_ID INT,
                DOCTO_CC_ACR_ID INT,
                FECHA_HORA_PAGO TEXT,
                FORMA_COBRO_ID INT,
                ZONA_CLIENTE_ID INT,
                IMPORTE REAL,
                LAT REAL,
                LNG REAL,
                GUARDADO_EN_MICROSIP INT
            )
        `,
      );
    });

    await db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS ventas (
          DOCTO_CC_ACR_ID INTEGER,
          DOCTO_CC_ID INTEGER,
          FOLIO TEXT,
          CLIENTE_ID INTEGER,
          APLICADO TEXT,
          COBRADOR_ID INTEGER,
          CLIENTE TEXT,
          ZONA_CLIENTE_ID INTEGER,
          LIMITE_CREDITO REAL,
          NOTAS TEXT,
          ZONA_NOMBRE TEXT,
          IMPORTE_PAGO_PROMEDIO REAL,
          TOTAL_IMPORTE REAL,
          NUM_IMPORTES INTEGER,
          FECHA TEXT,  -- Formato ISO 8601 (YYYY-MM-DD HH:MM:SS)
          PARCIALIDAD REAL,
          ENGANCHE REAL,
          TIEMPO_A_CORTO_PLAZOMESES INTEGER,
          MONTO_A_CORTO_PLAZO REAL,
          VENDEDOR_1 TEXT,
          VENDEDOR_2 TEXT,
          VENDEDOR_3 TEXT,
          PRECIO_TOTAL REAL,
          IMPTE_REST REAL,
          SALDO_REST REAL,
          FECHA_ULT_PAGO TEXT,  -- Formato ISO 8601 (YYYY-MM-DD HH:MM:SS)
          CALLE TEXT,
          CIUDAD TEXT,
          ESTADO TEXT,
          TELEFONO TEXT,
          NOMBRE_COBRADOR TEXT,
          ESTADO_COBRANZA TEXT,
          DIA_COBRANZA TEXT,
          DIA_TEMPORAL_COBRANZA TEXT
        );`,
      );
    });

    await db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS productos (
          ARTICULO TEXT,
          ARTICULO_ID INTEGER,
          CANTIDAD INTEGER,
          DOCTO_PV_DET_ID INTEGER,
          DOCTO_PV_ID INTEGER,
          FOLIO TEXT,
          POSICION INTEGER,
          PRECIO_TOTAL_NETO REAL,
          PRECIO_UNITARIO_IMPTO REAL
        );`,
      );
    });

    return db;
  };

  useEffect(() => {
    initDb().catch(err => {
      console.log(err);
    });

    const subscription = manager.onStateChange(state => {
      if (state === 'PoweredOn') {
        setBluetoothEnabled(true);
      } else if (state === 'PoweredOff') {
        setBluetoothEnabled(false);
      }
    }, true);

    const checkAndRequestGPS = async () => {
      const hasLocationPermission = await requestLocationPermission();
      if (hasLocationPermission) {
        Geolocation.getCurrentPosition(
          position => {
            setGpsEnabled(true);
          },
          error => {
            if (error.code === 2) {
              // GPS deshabilitado
              setGpsEnabled(false);
              // showGPSAlert();
            }
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      }
    };

    const intervalId = setInterval(() => {
      checkAndRequestGPS();
    }, 5000); // Verificar cada 5 segundos

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    console.log('Initializing Firestore');
    firestore()
      .settings({
        persistence: true,
        cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
      })
      .then(() => {
        console.log('Firestore initialized');
      });
  }, []);

  if (!bluetoothEnabled) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, textAlign: 'center'}}>
          Esta aplicación requiere Bluetooth. Por favor actívalo.
        </Text>
      </View>
    );
  }

  // if (!gpsEnabled) {
  //   return (
  //     <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
  //       <Text style={{fontSize: 20, textAlign: 'center'}}>
  //         Esta aplicación requiere GPS. Por favor actívalo.
  //       </Text>
  //     </View>
  //   );
  // }

  return (
    <AuthProvider>
      <RootNav />
    </AuthProvider>
  );
};

export default App;
