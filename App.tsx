import React, {useEffect} from 'react';
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
import {Timestamp, firebase} from '@react-native-firebase/firestore';

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
  return (
    <AuthProvider>
      <RootNav />
    </AuthProvider>
  );
};

export default App;
