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
import {BleManager, Subscription} from 'react-native-ble-plx';
import {Alert, Linking, Platform} from 'react-native';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {openDatabase} from './src/sqlite/connection';
import RouteMap from './src/screens/routeMap/RouteMap';
import sendPagosNotSent from './src/services/sendPagosNotSent';
import dayjs from 'dayjs';
import getAccuratePosition from './src/utils/geolocation/getAccuratePosition';
import {
  PaymentDto,
  VisitaType,
} from './src/components/modules/sales/SaleDetails/SaleDetails';
import sendPago from './src/services/sendPago';
import {Transaction} from 'react-native-sqlite-storage';
import sendVisita, {VisitaLocal} from './src/services/sendVisita';

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
  updatePaymentCoords: (payment: PaymentDto) => void;
  updateVisitaCoords: (visita: VisitaLocal) => void;
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
  updatePaymentCoords: () => {},
  updateVisitaCoords: () => {},
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

  const updatePaymentCoords = (payment: PaymentDto) => {
    requestLocationPermission().then(async () => {
      try {
        const position = await getAccuratePosition();

        const editPayment: PaymentDto = {
          ...payment,
          LAT: position.coords.latitude,
          LNG: position.coords.longitude,
        };
        await sendPago(editPayment, false, true);
        const db = await openDatabase();
        await db.executeSql(`
          UPDATE pagos
          SET LAT = ${position.coords.latitude},
              LNG = ${position.coords.longitude}
          WHERE ID = '${payment.ID}'
        `);
      } catch (err) {
        console.log('Error al guardar el pago', err);
      }
    });
  };

  const updateVisitaCoords = (visita: VisitaLocal) => {
    requestLocationPermission().then(async () => {
      try {
        const position = await getAccuratePosition();

        const editVisita: VisitaLocal = {
          ...visita,
          LAT: position.coords.latitude,
          LNG: position.coords.longitude,
        };
        await sendVisita(
          editVisita,
          false,
          visita.TIPO_VISITA as VisitaType,
          0,
          true,
        );
        const db = await openDatabase();
        await db.executeSql(`
          UPDATE visitas
          SET LAT = ${position.coords.latitude},
              LNG = ${position.coords.longitude}
          WHERE ID = '${visita.ID}'
        `);
        console.log('El pago se ha enviado al servidor');
      } catch (err) {
        console.log('Error al guardar el pago', err);
      }
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        userData,
        setUserData,
        sales,
        salesLoading: loading,
        updatePaymentCoords,
        updateVisitaCoords,
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

export async function requestLocationPermission() {
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
}

const App = () => {
  const manager = new BleManager();
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [render, setRender] = useState<boolean>(false);

  const initDb = async () => {
    const db = await openDatabase();
    const columns: {
      table: 'pagos' | 'ventas' | 'productos' | 'visitas';
      column: string;
      complement: string;
    }[] = [
      {table: 'pagos', column: 'ID', complement: 'TEXT'},
      {table: 'pagos', column: 'CLIENTE_ID', complement: 'INT'},
      {table: 'pagos', column: 'NOMBRE_CLIENTE', complement: 'TEXT'},
      {table: 'pagos', column: 'COBRADOR', complement: 'TEXT'},
      {table: 'pagos', column: 'COBRADOR_ID', complement: 'INT'},
      {table: 'pagos', column: 'DOCTO_CC_ID', complement: 'INT'},
      {table: 'pagos', column: 'DOCTO_CC_ACR_ID', complement: 'INT'},
      {table: 'pagos', column: 'FECHA_HORA_PAGO', complement: 'TEXT'},
      {table: 'pagos', column: 'FORMA_COBRO_ID', complement: 'INT'},
      {table: 'pagos', column: 'ZONA_CLIENTE_ID', complement: 'INT'},
      {table: 'pagos', column: 'IMPORTE', complement: 'REAL'},
      {table: 'pagos', column: 'LAT', complement: 'REAL'},
      {table: 'pagos', column: 'LNG', complement: 'REAL'},
      {table: 'pagos', column: 'GUARDADO_EN_MICROSIP', complement: 'INT'},

      {table: 'ventas', column: 'DOCTO_CC_ACR_ID', complement: 'INTEGER'},
      {table: 'ventas', column: 'DOCTO_CC_ID', complement: 'INTEGER'},
      {table: 'ventas', column: 'FOLIO', complement: 'TEXT'},
      {table: 'ventas', column: 'CLIENTE_ID', complement: 'INTEGER'},
      {table: 'ventas', column: 'APLICADO', complement: 'TEXT'},
      {table: 'ventas', column: 'COBRADOR_ID', complement: 'INTEGER'},
      {table: 'ventas', column: 'CLIENTE', complement: 'TEXT'},
      {table: 'ventas', column: 'ZONA_CLIENTE_ID', complement: 'INTEGER'},
      {table: 'ventas', column: 'LIMITE_CREDITO', complement: 'REAL'},
      {table: 'ventas', column: 'NOTAS', complement: 'TEXT'},
      {table: 'ventas', column: 'ZONA_NOMBRE', complement: 'TEXT'},
      {table: 'ventas', column: 'IMPORTE_PAGO_PROMEDIO', complement: 'REAL'},
      {table: 'ventas', column: 'TOTAL_IMPORTE', complement: 'REAL'},
      {table: 'ventas', column: 'NUM_IMPORTES', complement: 'INTEGER'},
      {table: 'ventas', column: 'FECHA', complement: 'TEXT'}, // Formato ISO 8601 (YYYY-MM-DD HH:MM:SS)
      {table: 'ventas', column: 'PARCIALIDAD', complement: 'REAL'},
      {table: 'ventas', column: 'ENGANCHE', complement: 'REAL'},
      {
        table: 'ventas',
        column: 'TIEMPO_A_CORTO_PLAZOMESES',
        complement: 'INTEGER',
      },
      {table: 'ventas', column: 'MONTO_A_CORTO_PLAZO', complement: 'REAL'},
      {table: 'ventas', column: 'VENDEDOR_1', complement: 'TEXT'},
      {table: 'ventas', column: 'VENDEDOR_2', complement: 'TEXT'},
      {table: 'ventas', column: 'VENDEDOR_3', complement: 'TEXT'},
      {table: 'ventas', column: 'PRECIO_TOTAL', complement: 'REAL'},
      {table: 'ventas', column: 'IMPTE_REST', complement: 'REAL'},
      {table: 'ventas', column: 'SALDO_REST', complement: 'REAL'},
      {table: 'ventas', column: 'FECHA_ULT_PAGO', complement: 'TEXT'}, // Formato ISO 8601 (YYYY-MM-DD HH:MM:SS)
      {table: 'ventas', column: 'CALLE', complement: 'TEXT'},
      {table: 'ventas', column: 'CIUDAD', complement: 'TEXT'},
      {table: 'ventas', column: 'ESTADO', complement: 'TEXT'},
      {table: 'ventas', column: 'TELEFONO', complement: 'TEXT'},
      {table: 'ventas', column: 'NOMBRE_COBRADOR', complement: 'TEXT'},
      {table: 'ventas', column: 'ESTADO_COBRANZA', complement: 'TEXT'},
      {table: 'ventas', column: 'DIA_COBRANZA', complement: 'TEXT'},
      {table: 'ventas', column: 'DIA_TEMPORAL_COBRANZA', complement: 'TEXT'},
      {table: 'ventas', column: 'AVAL_O_RESPONSABLE', complement: 'TEXT'},
      {table: 'ventas', column: 'PRECIO_DE_CONTADO', complement: 'REAL'},
      {table: 'ventas', column: 'FREC_PAGO', complement: 'TEXT'},

      {table: 'productos', column: 'ARTICULO', complement: 'TEXT'},
      {table: 'productos', column: 'ARTICULO_ID', complement: 'INTEGER'},
      {table: 'productos', column: 'CANTIDAD', complement: 'INTEGER'},
      {table: 'productos', column: 'DOCTO_PV_DET_ID', complement: 'INTEGER'},
      {table: 'productos', column: 'DOCTO_PV_ID', complement: 'INTEGER'},
      {table: 'productos', column: 'FOLIO', complement: 'TEXT'},
      {table: 'productos', column: 'POSICION', complement: 'INTEGER'},
      {table: 'productos', column: 'PRECIO_TOTAL_NETO', complement: 'REAL'},
      {table: 'productos', column: 'PRECIO_UNITARIO_IMPTO', complement: 'REAL'},

      {table: 'visitas', column: 'ID', complement: 'TEXT NOT NULL'},
      {table: 'visitas', column: 'CLIENTE_ID', complement: 'INTEGER NOT NULL'},
      {
        table: 'visitas',
        column: 'COBRADOR',
        complement: "TEXT NOT NULL DEFAULT ''",
      },
      {table: 'visitas', column: 'COBRADOR_ID', complement: 'INTEGER NOT NULL'},
      {table: 'visitas', column: 'FECHA', complement: 'TEXT NOT NULL'},
      {
        table: 'visitas',
        column: 'FORMA_COBRO_ID',
        complement: 'INTEGER NOT NULL',
      },
      {table: 'visitas', column: 'LAT', complement: 'REAL NOT NULL'},
      {table: 'visitas', column: 'LNG', complement: 'REAL NOT NULL'},
      {table: 'visitas', column: 'NOTA', complement: 'TEXT'},
      {table: 'visitas', column: 'TIPO_VISITA', complement: 'TEXT NOT NULL'},
      {
        table: 'visitas',
        column: 'ZONA_CLIENTE_ID',
        complement: 'INTEGER NOT NULL',
      },
      {table: 'visitas', column: 'IMPTE_DOCTO_CC_ID', complement: 'INTEGER'},
      {table: 'visitas', column: 'GUARDADO_EN_MICROSIP', complement: 'INT'},
    ];

    const ensureTableExists = (
      tx: Transaction,
      tableName: string,
    ): Promise<void> => {
      return new Promise((resolve, reject) =>
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${tableName} (placeholder INTEGER);`,
          [],
          () => {
            console.log(
              `Tabla '${tableName}' creada/verificada correctamente.`,
            );
            resolve();
          },
          (_, error) => {
            console.log(
              `Error creando/verificando tabla '${tableName}':`,
              error,
            );
            reject(error);
          },
        ),
      );
    };

    const checkAndMigrateDatabase = async () => {
      return new Promise((resolve, reject) => {
        db.transaction(
          tx => {
            const tables = [...new Set(columns.map(c => c.table))]; // Obtener tablas únicas

            tables.forEach(table => {
              ensureTableExists(tx, table); // Asegurar que la tabla existe

              tx.executeSql(
                `PRAGMA table_info(${table});`,
                [],
                (_, {rows}) => {
                  const existingColumns = rows.raw().map(row => row.name);

                  columns
                    .filter(col => col.table === table)
                    .forEach(column => {
                      if (!existingColumns.includes(column.column)) {
                        console.log(
                          `Añadiendo columna '${column.column}' a la tabla '${table}'...`,
                        );
                        tx.executeSql(
                          `ALTER TABLE ${table} ADD COLUMN ${column.column} ${column.complement};`,
                          [],
                          () => {
                            console.log(
                              `Columna '${column.column}' añadida correctamente.`,
                            );
                          },
                          error => {
                            console.error(
                              `Error al añadir la columna '${column.column}':`,
                              error,
                            );
                          },
                        );
                      } else {
                        console.log(
                          `La columna '${column.column}' ya existe en la tabla '${table}', no es necesario modificarla.`,
                        );
                      }
                    });
                },
                error => {
                  console.error(
                    `Error obteniendo información de la tabla '${table}':`,
                    error,
                  );
                },
              );
            });
          },
          error => {
            console.log('Error en la migración de la base de datos:', error);
            reject(error);
          },
          () => {
            console.log('Migración completada.');
            resolve('Completado');
          },
        );
      });
    };

    await checkAndMigrateDatabase();

    // await db.transaction(tx => {
    //   tx.executeSql(
    //     `CREATE TABLE IF NOT EXISTS pagos
    //         (
    //             ID TEXT,
    //             CLIENTE_ID INT,
    //             NOMBRE_CLIENTE TEXT,
    //             COBRADOR TEXT,
    //             COBRADOR_ID INT,
    //             DOCTO_CC_ID INT,
    //             DOCTO_CC_ACR_ID INT,
    //             FECHA_HORA_PAGO TEXT,
    //             FORMA_COBRO_ID INT,
    //             ZONA_CLIENTE_ID INT,
    //             IMPORTE REAL,
    //             LAT REAL,
    //             LNG REAL,
    //             GUARDADO_EN_MICROSIP INT
    //         )
    //     `,
    //   ).then(response => {
    //     console.log('Response', response);
    //   });
    // });

    // await db.transaction(tx => {
    //   tx.executeSql(
    //     `CREATE TABLE IF NOT EXISTS ventas (
    //       DOCTO_CC_ACR_ID INTEGER,
    //       DOCTO_CC_ID INTEGER,
    //       FOLIO TEXT,
    //       CLIENTE_ID INTEGER,
    //       APLICADO TEXT,
    //       COBRADOR_ID INTEGER,
    //       CLIENTE TEXT,
    //       ZONA_CLIENTE_ID INTEGER,
    //       LIMITE_CREDITO REAL,
    //       NOTAS TEXT,
    //       ZONA_NOMBRE TEXT,
    //       IMPORTE_PAGO_PROMEDIO REAL,
    //       TOTAL_IMPORTE REAL,
    //       NUM_IMPORTES INTEGER,
    //       FECHA TEXT,  -- Formato ISO 8601 (YYYY-MM-DD HH:MM:SS)
    //       PARCIALIDAD REAL,
    //       ENGANCHE REAL,
    //       TIEMPO_A_CORTO_PLAZOMESES INTEGER,
    //       MONTO_A_CORTO_PLAZO REAL,
    //       VENDEDOR_1 TEXT,
    //       VENDEDOR_2 TEXT,
    //       VENDEDOR_3 TEXT,
    //       PRECIO_TOTAL REAL,
    //       IMPTE_REST REAL,
    //       SALDO_REST REAL,
    //       FECHA_ULT_PAGO TEXT,  -- Formato ISO 8601 (YYYY-MM-DD HH:MM:SS)
    //       CALLE TEXT,
    //       CIUDAD TEXT,
    //       ESTADO TEXT,
    //       TELEFONO TEXT,
    //       NOMBRE_COBRADOR TEXT,
    //       ESTADO_COBRANZA TEXT,
    //       DIA_COBRANZA TEXT,
    //       DIA_TEMPORAL_COBRANZA TEXT,
    //       AVAL_O_RESPONSABLE TEXT,
    //       PRECIO_DE_CONTADO REAL,
    //       FREC_PAGO TEXT
    //     );`,
    //   ).then(response => {
    //     console.log('Response', response);
    //   });
    // });

    // await db.transaction(tx => {
    //   tx.executeSql(
    //     `CREATE TABLE IF NOT EXISTS productos (
    //       ARTICULO TEXT,
    //       ARTICULO_ID INTEGER,
    //       CANTIDAD INTEGER,
    //       DOCTO_PV_DET_ID INTEGER,
    //       DOCTO_PV_ID INTEGER,
    //       FOLIO TEXT,
    //       POSICION INTEGER,
    //       PRECIO_TOTAL_NETO REAL,
    //       PRECIO_UNITARIO_IMPTO REAL
    //     );`,
    //   );
    // });

    // await db.transaction(tx => {
    //   tx.executeSql(
    //     `
    //       CREATE TABLE IF NOT EXISTS visitas (
    //         ID                   TEXT NOT NULL,
    //         CLIENTE_ID           INTEGER NOT NULL,
    //         COBRADOR             TEXT NOT NULL DEFAULT '',
    //         COBRADOR_ID          INTEGER NOT NULL,
    //         FECHA                TEXT NOT NULL,
    //         FORMA_COBRO_ID       INTEGER NOT NULL,
    //         LAT                  REAL NOT NULL,
    //         LNG                  REAL NOT NULL,
    //         NOTA                 TEXT,
    //         TIPO_VISITA          TEXT NOT NULL,
    //         ZONA_CLIENTE_ID      INTEGER NOT NULL,
    //         IMPTE_DOCTO_CC_ID    INTERGER
    //         GUARDADO_EN_MICROSIP INT
    //     );`,
    //   );
    // });

    return db;
  };

  useEffect(() => {
    let subscription: Subscription;

    const init = async () => {
      await initDb();
      setRender(true);
      subscription = manager.onStateChange(state => {
        if (state === 'PoweredOn') {
          setBluetoothEnabled(true);
        } else if (state === 'PoweredOff') {
          setBluetoothEnabled(false);
        }
      }, true);
    };

    init();

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

  // if (!bluetoothEnabled) {
  //   return (
  //     <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
  //       <Text style={{fontSize: 20, textAlign: 'center'}}>
  //         Esta aplicación requiere Bluetooth. Por favor actívalo.
  //       </Text>
  //     </View>
  //   );
  // }

  // if (!gpsEnabled) {
  //   return (
  //     <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
  //       <Text style={{fontSize: 20, textAlign: 'center'}}>
  //         Esta aplicación requiere GPS. Por favor actívalo.
  //       </Text>
  //     </View>
  //   );
  // }

  return <AuthProvider>{<RootNav />}</AuthProvider>;
  // return <AuthProvider>{render && <RootNav />}</AuthProvider>;
};

export default App;
