import React, {useRef, useEffect} from 'react';
import {Animated, View, Text, Pressable, StyleSheet} from 'react-native';
import {
  CheckIcon,
  CloseIcon,
  Icon as IconAwesome,
  RemoveIcon,
  RepeatIcon,
} from '@gluestack-ui/themed';
import LinearGradient from 'react-native-linear-gradient';
import {SaleFull} from '../../../services/getSaleLocal';
import homeStyles from '../../../screens/home/home.styles';
import ProgressBar from '../ProgressBar/ProgressBar';
import {PRIMARY_COLOR} from '../../../contants/colors';

export default ({sale, onPress}: {sale: SaleFull; onPress: () => void}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación infinita para mover el gradiente
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 8000, // Duración del ciclo completo
        useNativeDriver: false,
      }),
    ).start();
  }, []);

  const gradientColors = [
    '#fb0094',
    '#0000ff',
    '#00ff00',
    '#ffff00',
    '#ff0000',
    '#fb0094',
  ];

  const rotateColors = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'], // Rotación en grados
  });

  return (
    <Pressable
      key={sale.DOCTO_CC_ID}
      style={[
        homeStyles.saleContainer,
        {backgroundColor: '#ebf5ff', borderWidth: 1, borderColor: '#a4cafe'},
      ]}
      onPress={onPress}>
      <View style={{gap: 10}}>
        <View style={[homeStyles.row, {gap: 0}]}>
          <View style={[homeStyles.col, {width: '70%'}]}>
            <Text
              numberOfLines={1}
              style={[
                homeStyles.text,
                {fontWeight: '700', fontSize: 17, color: '#1e429f'},
              ]}>
              {sale?.PRODUCTOS?.slice(0, 30)}
            </Text>
            <Text numberOfLines={1} style={homeStyles.detailsSubtitle}>
              {(sale?.CALLE + ' ' + sale?.CIUDAD + ' ' + sale?.ESTADO).slice(
                0,
                30,
              )}
            </Text>
            <Text numberOfLines={1}>
              <Text style={homeStyles.detailsSubtitle}>
                PARCIALIDAD:{' '}
                <Text
                  style={{
                    fontWeight: '600',
                    color: '#1e429f',
                    fontSize: 17,
                  }}>
                  ${sale?.PARCIALIDAD}
                </Text>
              </Text>
            </Text>
          </View>
          <View
            style={[homeStyles.col, {width: '30%', alignItems: 'flex-end'}]}>
            <View
              style={[
                homeStyles.iconContainer,
                {
                  backgroundColor:
                    sale?.ESTADO_COBRANZA === 'PAGADO'
                      ? 'lightgreen'
                      : sale?.ESTADO_COBRANZA === 'PENDIENTE'
                      ? 'lightgray'
                      : sale?.ESTADO_COBRANZA === 'NO PAGADO'
                      ? 'red'
                      : sale?.ESTADO_COBRANZA === 'VISITADO'
                      ? 'lightcoral'
                      : sale?.ESTADO_COBRANZA === 'VOLVER VISITAR'
                      ? 'orange'
                      : 'lightgray',
                },
              ]}>
              {sale?.ESTADO_COBRANZA === 'PAGADO' && (
                <IconAwesome as={CheckIcon} color="green" />
              )}
              {sale?.ESTADO_COBRANZA === 'PENDIENTE' && (
                <IconAwesome as={RemoveIcon} color="gray" />
              )}
              {sale?.ESTADO_COBRANZA === 'NO PAGADO' && (
                <IconAwesome as={CloseIcon} color="white" />
              )}
              {sale?.ESTADO_COBRANZA === 'VISITADO' && (
                <IconAwesome as={CheckIcon} color="green" />
              )}
              {sale?.ESTADO_COBRANZA === 'VOLVER VISITAR' && (
                <IconAwesome as={RepeatIcon} color="white" />
              )}
            </View>
          </View>
        </View>
        <View style={{gap: 5}}>
          <ProgressBar
            backgroundColor="lightgray"
            backgroudColorFilled={PRIMARY_COLOR}
            value={
              ((sale.PRECIO_TOTAL - sale.SALDO_REST) / sale.PRECIO_TOTAL) * 100
            }
            height={10}
            width="100%"
            borderRadius={5}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <Text numberOfLines={1}>
              <Text style={homeStyles.detailsSubtitle}>
                <Text
                  style={{
                    fontWeight: '600',
                    color: '#1e429f',
                    fontSize: 17,
                  }}>
                  ${sale.PRECIO_TOTAL - sale.SALDO_REST}
                </Text>{' '}
                Abonado
              </Text>
            </Text>
            <Text numberOfLines={1}>
              <Text style={homeStyles.detailsSubtitle}>
                Saldo:{' '}
                <Text
                  style={{
                    fontWeight: '600',
                    color: '#1e429f',
                    fontSize: 17,
                  }}>
                  ${sale?.SALDO_REST}
                </Text>
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};
