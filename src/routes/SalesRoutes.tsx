import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SaleDetails from '../components/modules/sales/SaleDetails/SaleDetails';
import Sales from '../screens/sales/Sales/Sales';
import Payment from '../components/modules/payments/Payment/Payment';
import Notice from '../components/modules/notice/Notice';
import Garantias from '../screens/sales/Garantias/Garantias';

export type SalesStackParamList = {
  Sales: undefined;
  SaleDetails: {saleId: number};
  Payment: {paymentId: string; saleId: number; sendByWhatsapp?: boolean};
  Notice: {saleId: number};
  Garantias: {saleId: number};
};

const SalesStack = createStackNavigator<SalesStackParamList>();

const SalesNavigator: React.FC = () => {
  return (
    <SalesStack.Navigator
      initialRouteName="Sales"
      detachInactiveScreens
      screenOptions={{
        headerShown: false,
      }}>
      <SalesStack.Screen name="Sales" component={Sales} />
      <SalesStack.Screen name="SaleDetails" component={SaleDetails} />
      <SalesStack.Screen name="Payment" component={Payment} />
      <SalesStack.Screen name="Notice" component={Notice} />
      <SalesStack.Screen name="Garantias" component={Garantias} />
    </SalesStack.Navigator>
  );
};

export default SalesNavigator;
