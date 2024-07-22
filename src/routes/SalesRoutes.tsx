import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SaleDetails from '../components/modules/sales/SaleDetails/SaleDetails';
import Sales from '../screens/sales/Sales/Sales';
import Payment from '../components/modules/payments/Payment/Payment';

export type SalesStackParamList = {
  Sales: undefined;
  SaleDetails: {saleId: string};
  Payment: {paymentId: string; saleId: string};
};

const SalesStack = createStackNavigator<SalesStackParamList>();

const SalesNavigator: React.FC = () => {
  return (
    <SalesStack.Navigator
      initialRouteName="Sales"
      screenOptions={{
        headerShown: false,
      }}>
      <SalesStack.Screen name="Sales" component={Sales} />
      <SalesStack.Screen name="SaleDetails" component={SaleDetails} />
      <SalesStack.Screen name="Payment" component={Payment} />
    </SalesStack.Navigator>
  );
};

export default SalesNavigator;
