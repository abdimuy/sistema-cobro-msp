import React, {useContext, useEffect, useState} from 'react';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';

import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import Home, {SaleServer} from './src/screens/home/Home';
import DailyReport from './src/components/modules/reports/DailyReport/DailyReport';
import WeeklyReport from './src/components/modules/reports/WeeklyReport/WeeklyReport';
import LoginScreen from './src/screens/auth/login';
import {Spinner, View} from '@gluestack-ui/themed';
import {User as UserFB} from 'firebase/auth';
import {auth} from './src/firebase/connection';
import {User} from './src/screens/auth/getUser';
import useGetUser from './src/screens/auth/useGetUser';
import SalesNavigator, {SalesStackParamList} from './src/routes/SalesRoutes';
import useSales from './src/screens/sales/Sales/useSales';
import firestore, {Timestamp} from '@react-native-firebase/firestore';
import {BleManager} from 'react-native-ble-plx';
import {
  Alert,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {openDatabase} from './src/sqlite/connection';
import RouteMap from './src/screens/routeMap/RouteMap';
import sendPagosNotSent from './src/services/sendPagosNotSent';
import dayjs from 'dayjs';
import * as Keychain from 'react-native-keychain';

export type RootDrawerParamList = {
  Home: undefined;
  Sales: {
    screen: keyof SalesStackParamList;
    params: SalesStackParamList['SaleDetails'];
  };
  dailyReport: undefined;
  weeklyReport: undefined;
  Login: undefined;
  RouteMap: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export const AuthContext = React.createContext<{
  user: UserFB | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  userData: User;
  setUserData: React.Dispatch<React.SetStateAction<User>>;
  sales: SaleServer[];
  salesLoading: boolean;
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
});

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

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        userData,
        setUserData,
        sales,
        salesLoading: loading,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

function RootNav() {
  const {user, setUser, setUserData} = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  // const authenticateUser = async () => {
  //   try {
  //     console.log('Iniciando Autenticación');
  //     // Almacenar credenciales ficticias con control de acceso biométrico o cualquier método de seguridad
  //     await Keychain.setGenericPassword('user', 'password', {
  //       accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE, // Cambia a BIOMETRY_ANY para forzar la autenticación
  //       accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  //     });

  //     // Intenta recuperar las credenciales para activar la autenticación
  //     const credentials = await Keychain.getGenericPassword({
  //       authenticationPrompt: {
  //         title: 'Autenticación requerida',
  //         subtitle: 'Ingrese su patrón, PIN o contraseña para continuar',
  //         description: 'Esta acción requiere autenticación',
  //         cancel: 'Cancelar',
  //       },
  //     });

  //     if (credentials) {
  //       setIsAuthenticated(true);
  //     } else {
  //       setIsAuthenticated(false);
  //     }
  //   } catch (error) {
  //     console.error('Error de autenticación:', error);
  //     await Keychain.resetGenericPassword();
  //     setIsAuthenticated(false);
  //   }
  // };

  // useEffect(() => {
  //   const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  //     if (nextAppState === 'active') {
  //       await authenticateUser();
  //     }
  //   };

  //   // Llama a la autenticación inicial al cargar la app
  //   authenticateUser();

  //   // Agrega el listener de AppState
  //   const subscription = AppState.addEventListener(
  //     'change',
  //     handleAppStateChange,
  //   );

  //   // Limpia el listener cuando el componente se desmonta
  //   return () => {
  //     subscription.remove();
  //   };
  // }, []);

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

  useEffect(() => {
    const asyncFunc = () => {
      sendPagosNotSent(
        false,
        dayjs(userData?.FECHA_CARGA_INICIAL.toDate()),
        false,
      ).catch(err => {
        console.log(err);
      });
    };
    asyncFunc();
    const intervalId = setInterval(asyncFunc, 15 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // useEffect(() => {
  //   const asyncFunc = () => {
  //     sendPagosNotSent(
  //       true,
  //       dayjs(userData?.FECHA_CARGA_INICIAL.toDate()),
  //       false,
  //     ).catch(err => {
  //       console.log(err);
  //     });
  //   };
  //   asyncFunc();
  //   const intervalId = setInterval(asyncFunc, 30 * 60 * 1000);

  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, []);

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

  // if (!isAuthenticated) {
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         justifyContent: 'center',
  //         alignItems: 'center',
  //         backgroundColor: 'white',
  //       }}>
  //       <Text style={{color: 'Black', fontSize: 20}}>
  //         Autenticación requerida
  //       </Text>
  //       <Pressable onPress={authenticateUser}>
  //         <Text>Entrar</Text>
  //       </Pressable>
  //     </View>
  //   );
  // }

  return (
    <NavigationContainer>
      {user ? (
        <Drawer.Navigator
          drawerContent={props => <CustomDrawerContent {...props} />}
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
          <Drawer.Screen
            name="RouteMap"
            component={RouteMap}
            options={{
              drawerLabel: 'Mapa de ruta',
            }}
          />
        </Drawer.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label="Inicio"
        onPress={() => props.navigation.navigate('Home')}
      />
      <DrawerItem
        label="Clientes"
        onPress={() => props.navigation.navigate('Sales')}
      />
      <DrawerItem
        label="Reporte Diario"
        onPress={() => props.navigation.navigate('dailyReport')}
      />
      <DrawerItem
        label="Reporte Semanal"
        onPress={() => props.navigation.navigate('weeklyReport')}
      />
      <DrawerItem
        label="Mapa de ruta"
        onPress={() => props.navigation.navigate('RouteMap')}
      />
    </DrawerContentScrollView>
  );
};

export const requestLocationPermission = async () => {
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

const App = () => {
  const manager = new BleManager();
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);

  const initDb = async () => {
    const db = await openDatabase();

    await db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS pagos
            (
                ID TEXT PRIMARY KEY,
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
      ).then(response => {
        console.log('Response', response);
      });
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
          DIA_TEMPORAL_COBRANZA TEXT,
          AVAL_O_RESPONSABLE TEXT,
          PRECIO_DE_CONTADO REAL,
          FREC_PAGO TEXT
        );`,
      ).then(response => {
        console.log('Response', response);
      });
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

    await db.transaction(tx => {
      tx.executeSql(
        `
          CREATE TABLE IF NOT EXISTS visitas (
            ID                   TEXT NOT NULL,
            CLIENTE_ID           INTEGER NOT NULL,
            COBRADOR             TEXT NOT NULL DEFAULT '',
            COBRADOR_ID          INTEGER NOT NULL,
            FECHA                TEXT NOT NULL,
            FORMA_COBRO_ID       INTEGER NOT NULL,
            LAT                  REAL NOT NULL,
            LNG                  REAL NOT NULL,
            NOTA                 TEXT,
            TIPO_VISITA          TEXT NOT NULL,
            ZONA_CLIENTE_ID      INTEGER NOT NULL,
            IMPTE_DOCTO_CC_ID    INTERGER
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

    return () => {
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
