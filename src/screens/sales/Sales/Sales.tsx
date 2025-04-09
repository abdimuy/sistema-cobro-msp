import {
  Text,
  View,
  TextInput,
  ListRenderItem,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
  FlatList,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import FocusAwareStatusBar from '../../../components/common/FocusAwareStatusBar/FocusAwareStatusBar';
import {PRIMARY_COLOR, TEXT_COLOR_TERTIARY} from '../../../contants/colors';
import SaleItem from '../../../components/modules/sales/SaleItem/SaleItem';
import salesStyles from './sales.styles';
import {search} from '../../../utils/search/search';
import {AuthContext} from '../../../../App';
import {StackNavigationProp} from '@react-navigation/stack';
import {SalesStackParamList} from '../../../routes/SalesRoutes';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {TabView, TabBar, SceneRendererProps} from 'react-native-tab-view';
import useGetZonaCliente from '../../../hooks/useGetZonaCliente';
import getSalesLocal from '../../../services/getSalesLocal';
import {SaleServer} from '../../home/Home';
import {SaleWithProductos} from '../../../services/getSaleLocal';
import Icon from 'react-native-vector-icons/FontAwesome6';
import dayjs from 'dayjs';

type SalesScreenNavigationProp = StackNavigationProp<
  SalesStackParamList,
  'Sales'
>;

interface SalesProps {
  sales: SaleWithProductos[];
  loading: boolean;
}

const Sales = ({sales, loading}: SalesProps) => {
  const navigation = useNavigation<SalesScreenNavigationProp>();
  const [searchText, setSearchText] = useState<string>('');

  const [filteredSales, setFilteredSales] =
    useState<SaleWithProductos[]>(sales);

  const handleSnapPress = useCallback((sale: SaleWithProductos) => {
    navigation.navigate('SaleDetails', {saleId: sale.DOCTO_CC_ID});
  }, []);

  const renderItem: ListRenderItem<SaleWithProductos> = useCallback(
    ({item}) => (
      <SaleItem
        sale={item}
        key={item.DOCTO_CC_ID}
        onPress={() => handleSnapPress(item)}
      />
    ),
    [handleSnapPress],
  );

  useEffect(() => {
    if (!searchText) {
      setFilteredSales(
        sales.sort((sale1, sale2) => {
          const sale1IsNew = sale1.PAGOS.length === 0;
          const sale2IsNew = sale2.PAGOS.length === 0;
          if (sale1IsNew === sale2IsNew) {
            return dayjs(sale1.PAGOS[0]?.FECHA_HORA_PAGO).diff(
              dayjs(sale2.PAGOS[0]?.FECHA_HORA_PAGO),
            );
          }
          return sale1IsNew ? -1 : 1;
        }),
      );
      return;
    }
    setFilteredSales(
      search(sales, ['CLIENTE', 'CALLE', 'FOLIO'], searchText, 0.3),
    );
  }, [searchText, sales]);

  if (loading) {
    return (
      <View style={salesStyles.constainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <FlatList
      style={salesStyles.list}
      data={filteredSales}
      renderItem={renderItem}
      keyExtractor={(item: SaleServer) => item.DOCTO_CC_ID.toString()}
      initialNumToRender={20}
      windowSize={40}
      ItemSeparatorComponent={() => (
        <View style={{height: 14, backgroundColor: 'transparent'}} />
      )}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={100}
      disableVirtualization={false}
    />
  );
};

type Route = {
  key: string;
  title: string;
};

type Props = {
  salesByStatus: {
    porVisitar: SaleWithProductos[];
    visitados: SaleWithProductos[];
    pagados: SaleWithProductos[];
  };
  loading: boolean;
};

type RenderSceneProps = SceneRendererProps & {
  route: Route;
};

const renderScene =
  (props: Props) =>
  ({route}: RenderSceneProps) => {
    switch (route.key) {
      case 'por-visitar':
        return (
          <Sales
            sales={props.salesByStatus.porVisitar}
            loading={props.loading}
          />
        );
      case 'visitados':
        return (
          <Sales
            sales={props.salesByStatus.visitados}
            loading={props.loading}
          />
        );
      case 'pagados':
        return (
          <Sales sales={props.salesByStatus.pagados} loading={props.loading} />
        );
      default:
        return null;
    }
  };

const Router = () => {
  const layout = useWindowDimensions();
  const isFocused = useIsFocused();
  const [sales, setSales] = useState<SaleWithProductos[]>([]);
  const {userData} = React.useContext(AuthContext);
  const [searchText, setSearchText] = useState<string>('');
  const {zonaCliente} = useGetZonaCliente(userData.ZONA_CLIENTE_ID);
  const [salesByStatus, setSalesByStatus] = useState<{
    porVisitar: SaleWithProductos[];
    visitados: SaleWithProductos[];
    pagados: SaleWithProductos[];
  }>({
    porVisitar: [],
    visitados: [],
    pagados: [],
  });
  const [salesByStatusSearch, setSalesByStatusSearch] = useState<{
    porVisitar: SaleWithProductos[];
    visitados: SaleWithProductos[];
    pagados: SaleWithProductos[];
  }>({
    porVisitar: [],
    visitados: [],
    pagados: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      getSalesLocal()
        .then(sales => {
          setSales(sales);

          const {porVisitar, visitados, pagados} = sales.reduce(
            (acc, sale) => {
              if (sale.ESTADO_COBRANZA === 'PENDIENTE') {
                acc.porVisitar.push(sale);
              } else if (sale.ESTADO_COBRANZA === 'PAGADO') {
                acc.pagados.push(sale);
              } else if (sale.ESTADO_COBRANZA === 'NO PAGADO') {
                acc.visitados.push(sale);
              } else if (sale.ESTADO_COBRANZA === 'VISITADO') {
                acc.visitados.push(sale);
              } else if (sale.ESTADO_COBRANZA === 'VOLVER VISITAR') {
                acc.porVisitar.push(sale);
              }
              return acc;
            },
            {
              porVisitar: [] as SaleWithProductos[],
              visitados: [] as SaleWithProductos[],
              pagados: [] as SaleWithProductos[],
            },
          );

          setSalesByStatus({
            porVisitar,
            visitados,
            pagados,
          });
          setRoutes([
            {key: 'por-visitar', title: `Por Visitar (${porVisitar.length})`},
            {key: 'visitados', title: `Visitados (${visitados.length})`},
            {
              key: 'pagados',
              title: `pagados (${pagados.length})`,
            },
          ]);
          setLoading(false);
        })
        .catch(err => {
          console.log(err);
          setLoading(false);
        });
    }
  }, [isFocused]);

  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    {key: 'por-visitar', title: 'Por Visitar'},
    {key: 'visitados', title: 'Visitados'},
    {key: 'pagados', title: 'pagados'},
  ]);

  useEffect(() => {
    if (!searchText) {
      setSalesByStatusSearch(salesByStatus);
      return;
    }
    const filteredSales = search(
      sales,
      ['CLIENTE', 'CALLE', 'FOLIO'],
      searchText,
      0.3,
    );
    const {porVisitar, visitados, pagados} = filteredSales.reduce(
      (acc, sale) => {
        if (sale.ESTADO_COBRANZA === 'PENDIENTE') {
          acc.porVisitar.push(sale);
        } else if (sale.ESTADO_COBRANZA === 'PAGADO') {
          acc.pagados.push(sale);
        } else if (sale.ESTADO_COBRANZA === 'NO PAGADO') {
          acc.visitados.push(sale);
        } else if (sale.ESTADO_COBRANZA === 'VISITADO') {
          acc.visitados.push(sale);
        } else if (sale.ESTADO_COBRANZA === 'VOLVER VISITAR') {
          acc.porVisitar.push(sale);
        }
        return acc;
      },
      {
        porVisitar: [] as SaleWithProductos[],
        visitados: [] as SaleWithProductos[],
        pagados: [] as SaleWithProductos[],
      },
    );

    setSalesByStatusSearch({
      porVisitar,
      visitados,
      pagados,
    });
  }, [searchText, salesByStatus]);

  return (
    <>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={PRIMARY_COLOR}
        animated
      />
      <View style={salesStyles.header}>
        <Text style={salesStyles.headerTitle}>{zonaCliente.ZONA_CLIENTE}</Text>
        <View style={salesStyles.headerSearch}>
          <TextInput
            style={salesStyles.headerSearchInput}
            value={searchText}
            placeholder="Buscar por nombre, folio o dirección"
            placeholderTextColor={TEXT_COLOR_TERTIARY}
            textAlignVertical="center"
            onChangeText={setSearchText}
          />
          <Pressable
            style={salesStyles.headerSearchIconContainer}
            onPress={() => setSearchText('')}>
            <Icon name="x" size={20} style={salesStyles.headerSearchIcon} />
          </Pressable>
        </View>
      </View>
      <TabView
        navigationState={{index, routes}}
        renderScene={renderScene({
          salesByStatus: {
            porVisitar: salesByStatusSearch.porVisitar,
            visitados: salesByStatusSearch.visitados,
            pagados: salesByStatusSearch.pagados,
          },
          loading,
        })}
        onIndexChange={setIndex}
        initialLayout={{width: layout.width}}
        collapsable={true}
        tabBarPosition="bottom"
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{backgroundColor: PRIMARY_COLOR}}
            style={{backgroundColor: 'white', height: 70}}
            labelStyle={{color: PRIMARY_COLOR, display: 'flex', fontSize: 15}}
            activeColor={PRIMARY_COLOR}
            inactiveColor={TEXT_COLOR_TERTIARY}
            scrollEnabled
          />
        )}
      />
    </>
  );
};

export default Router;
