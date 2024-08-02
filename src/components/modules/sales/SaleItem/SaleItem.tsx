import {View, Text, TouchableOpacity} from 'react-native';
import React, {useMemo} from 'react';
import saleItemStyles from './saleItem.styles';
import {PRIMARY_COLOR, TEXT_COLOR_SECONDARY} from '../../../../contants/colors';
import ProgressBar from '../../../common/ProgressBar/ProgressBar';
import {CheckIcon, Icon, RemoveIcon, CloseIcon} from '@gluestack-ui/themed';
import {Sale} from '../../../../screens/sales/Sales/sales.types';
import useGetProductosByFolio from '../../../../hooks/useGetProductosByFolio';

const SaleItem = ({
  sale,
  onPress = () => {},
}: {
  sale: Sale;
  onPress?: Function;
}) => {
  const progress = useMemo(() => {
    return ((sale.PRECIO_TOTAL - sale.SALDO_REST) / sale.PRECIO_TOTAL) * 100;
  }, [sale.PRECIO_TOTAL, sale.SALDO_REST]);

  const isNew = useMemo(() => {
    return sale.PRECIO_TOTAL - sale.ENGANCHE === sale.SALDO_REST;
  }, [sale.PRECIO_TOTAL, sale.ENGANCHE, sale.SALDO_REST]);

  const {productos, loading} = useGetProductosByFolio(sale.FOLIO);

  return (
    <TouchableOpacity
      style={[saleItemStyles.container, isNew && saleItemStyles.isNew]}
      onPress={e => onPress()}>
      <View style={saleItemStyles.details}>
        <View style={saleItemStyles.detailsIcons}>
          <View
            style={[
              saleItemStyles.iconContainer,
              {
                backgroundColor:
                  sale.ESTADO_COBRANZA === 'PAGADO'
                    ? 'lightgreen'
                    : sale.ESTADO_COBRANZA === 'PENDIENTE'
                    ? 'lightgray'
                    : 'lightcoral',
              },
            ]}>
            {sale.ESTADO_COBRANZA === 'PAGADO' && (
              <Icon as={CheckIcon} color="green" />
            )}
            {sale.ESTADO_COBRANZA === 'PENDIENTE' && (
              <Icon as={RemoveIcon} color="gray" />
            )}
            {sale.ESTADO_COBRANZA === 'NO PAGADO' && (
              <Icon as={CloseIcon} color="red" />
            )}
          </View>

          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              backgroundColor: PRIMARY_COLOR,
              borderRadius: 10,
              height: 50,
              width: 50,
            }}>
            <Text
              style={{
                color: TEXT_COLOR_SECONDARY,
                fontSize: 20,
                fontWeight: 'bold',
              }}>
              {sale.DIA_COBRANZA.substring(0, 2)}
            </Text>
          </View>
        </View>

        <View style={saleItemStyles.labels}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              width: 'auto',
            }}>
            {isNew && (
              <View style={saleItemStyles.badgeNewContainer}>
                <Text style={saleItemStyles.badgeNew}>Nueva</Text>
              </View>
            )}
            <Text style={saleItemStyles.name}>
              <Text style={saleItemStyles.number}>{sale.FOLIO}</Text>{' '}
              {sale.CLIENTE}
            </Text>
          </View>
          <Text
            ellipsizeMode="tail"
            numberOfLines={2}
            style={saleItemStyles.address}>
            {sale.CALLE}, {sale.CIUDAD}, {sale.ESTADO}
          </Text>
          <Text
            ellipsizeMode="tail"
            numberOfLines={2}
            style={saleItemStyles.address}>
            {productos.map(producto => producto.ARTICULO).join(', ')}
          </Text>
        </View>
      </View>

      <View style={saleItemStyles.progressContainer}>
        <ProgressBar
          backgroundColor="lightgray"
          backgroudColorFilled={PRIMARY_COLOR}
          value={progress}
          height={10}
          width="100%"
          borderRadius={5}
        />
        <View style={saleItemStyles.progressDetails}>
          <Text style={saleItemStyles.prograssCant}>
            <Text style={saleItemStyles.number}>
              ${sale.PRECIO_TOTAL - sale.SALDO_REST}
            </Text>{' '}
            Abonado
          </Text>
          <Text style={saleItemStyles.prograssCant}>
            Saldo <Text style={saleItemStyles.number}>${sale.SALDO_REST}</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SaleItem;
