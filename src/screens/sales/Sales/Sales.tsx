import {
  Text,
  View,
  VirtualizedList,
  TextInput,
  ListRenderItem,
  ActivityIndicator,
  useWindowDimensions,
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
import {useNavigation} from '@react-navigation/native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import useGetZonaCliente from '../../../hooks/useGetZonaCliente';
import getSalesLocal from '../../../services/getSalesLocal';
import {SaleServer} from '../../home/Home';
import {SaleWithProductos} from '../../../services/getSaleLocal';

type SalesScreenNavigationProp = StackNavigationProp<
  SalesStackParamList,
  'Sales'
>;

const Sales = () => {
  const {userData} = React.useContext(AuthContext);
  const navigation = useNavigation<SalesScreenNavigationProp>();
  const {zonaCliente} = useGetZonaCliente(userData.ZONA_CLIENTE_ID);
  const [searchText, setSearchText] = useState<string>('');
  const [sales, setSales] = useState<SaleWithProductos[]>([]);
  const [loading, setLoading] = useState(true);

  const [filteredSales, setFilteredSales] =
    useState<SaleWithProductos[]>(sales);

  const handleSnapPress = useCallback((sale: SaleWithProductos) => {
    navigation.navigate('SaleDetails', {saleId: sale.DOCTO_CC_ID});
  }, []);

  const renderItem: ListRenderItem<SaleWithProductos> = ({item, index}) => (
    <SaleItem
      sale={item}
      key={item.DOCTO_CC_ID}
      onPress={() => handleSnapPress(item)}
    />
  );

  useEffect(() => {
    getSalesLocal()
      .then(sales => {
        setSales(sales);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!searchText) {
      setFilteredSales(sales);
      return;
    }
    setFilteredSales(
      search(sales, ['CLIENTE', 'CALLE', 'FOLIO'], searchText, 0.3),
    );
  }, [searchText, sales]);

  return (
    <View style={salesStyles.constainer}>
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
            placeholder="Buscar cliente por nombre, folio o dirección"
            placeholderTextColor={TEXT_COLOR_TERTIARY}
            textAlignVertical="center"
            onChangeText={setSearchText}
          />
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      ) : (
        <VirtualizedList
          style={salesStyles.list}
          data={filteredSales}
          renderItem={renderItem}
          keyExtractor={(item: SaleServer) => item.DOCTO_CC_ID.toString()}
          getItemCount={() => filteredSales.length}
          ItemSeparatorComponent={() => (
            <View style={{height: 14, backgroundColor: 'transparent'}} />
          )}
          getItem={(data, index) => data[index]}
        />
      )}
    </View>
  );
};

const SecondRoute = () => (
  <View style={{flex: 1, backgroundColor: '#673ab7'}} />
);

const renderScene = SceneMap({
  monday: Sales,
  second: SecondRoute,
  tercero: Sales,
  cuarto: Sales,
  quinto: Sales,
  sexto: Sales,
  sunday: Sales,
});

const Router = () => {
  const layout = useWindowDimensions();

  const currentDateIndex = new Date().getDay() - 1;
  const [index, setIndex] = useState(currentDateIndex);
  const [routes] = useState([
    {key: 'sunday', title: 'Domingo'},
    {key: 'monday', title: 'Lunes'},
    {key: 'second', title: 'Martes'},
    {key: 'tercero', title: 'Miercoles'},
    {key: 'cuarto', title: 'Jueves'},
    {key: 'quinto', title: 'Viernes'},
    {key: 'sexto', title: 'Sabado'},
  ]);

  return (
    <TabView
      navigationState={{index, routes}}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{width: layout.width}}
      collapsable={true}
      renderTabBar={props => (
        <TabBar
          {...props}
          indicatorStyle={{backgroundColor: PRIMARY_COLOR}}
          style={{backgroundColor: 'white'}}
          labelStyle={{color: PRIMARY_COLOR}}
          activeColor={PRIMARY_COLOR}
          inactiveColor={TEXT_COLOR_TERTIARY}
          scrollEnabled
        />
      )}
    />
  );
};

export default Sales;
