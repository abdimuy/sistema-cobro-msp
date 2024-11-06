import {View, Text, TouchableOpacity} from 'react-native';
import React, {memo, useMemo} from 'react';
import saleItemStyles from './saleItem.styles';
import {PRIMARY_COLOR, TEXT_COLOR_SECONDARY} from '../../../../contants/colors';
import ProgressBar from '../../../common/ProgressBar/ProgressBar';
import {
  CheckIcon,
  Icon,
  RemoveIcon,
  CloseIcon,
  RepeatIcon,
} from '@gluestack-ui/themed';
import {SaleWithProductos} from '../../../../services/getSaleLocal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

const SaleItem = memo(
  ({
    sale,
    onPress = () => {},
  }: {
    sale: SaleWithProductos;
    onPress?: Function;
  }) => {
    const progress = useMemo(() => {
      return ((sale.PRECIO_TOTAL - sale.SALDO_REST) / sale.PRECIO_TOTAL) * 100;
    }, [sale.PRECIO_TOTAL, sale.SALDO_REST]);

    const isNew = useMemo(() => {
      return sale.PRECIO_TOTAL - sale.ENGANCHE === sale.SALDO_REST;
    }, [sale.PRECIO_TOTAL, sale.ENGANCHE, sale.SALDO_REST]);

    dayjs.extend(relativeTime);
    dayjs.locale('es');

    const statusPagosAtrasados =
      sale.PLAZOS_ATRASADOS < 1
        ? 'SUCCESS'
        : sale.PLAZOS_ATRASADOS < 5
        ? 'WARNING'
        : 'DANGER';
    const badgeAtrasadosStyle =
      statusPagosAtrasados === 'SUCCESS'
        ? saleItemStyles.badgeSuccess
        : statusPagosAtrasados === 'WARNING'
        ? saleItemStyles.badgeWarning
        : saleItemStyles.badgeDanger;
    const badgeTextAtrasadosStyle =
      statusPagosAtrasados === 'SUCCESS'
        ? saleItemStyles.badgeSuccessText
        : statusPagosAtrasados === 'WARNING'
        ? saleItemStyles.badgeWarningText
        : saleItemStyles.badgeDangerText;

    return (
      <TouchableOpacity
        style={[
          saleItemStyles.container,
          {
            backgroundColor:
              sale.ESTADO_COBRANZA === 'NO PAGADO'
                ? '#fdeded'
                : sale.ESTADO_COBRANZA === 'VOLVER VISITAR'
                ? '#fff4e5'
                : sale.ESTADO_COBRANZA === 'VISITADO'
                ? '#f5f5f5'
                : sale.ESTADO_COBRANZA === 'PENDIENTE'
                ? 'white'
                : sale.ESTADO_COBRANZA === 'PAGADO'
                ? '#edf7ed'
                : 'white',
          },
          isNew && saleItemStyles.isNew,
        ]}
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
                      : sale.ESTADO_COBRANZA === 'NO PAGADO'
                      ? 'red'
                      : sale.ESTADO_COBRANZA === 'VISITADO'
                      ? 'lightcoral'
                      : sale.ESTADO_COBRANZA === 'VOLVER VISITAR'
                      ? 'orange'
                      : 'lightgray',
                },
              ]}>
              {sale.ESTADO_COBRANZA === 'PAGADO' && (
                <Icon as={CheckIcon} color="green" />
              )}
              {sale.ESTADO_COBRANZA === 'PENDIENTE' && (
                <Icon as={RemoveIcon} color="gray" />
              )}
              {sale.ESTADO_COBRANZA === 'NO PAGADO' && (
                <Icon as={CloseIcon} color="white" />
              )}
              {sale.ESTADO_COBRANZA === 'VISITADO' && (
                <Icon as={CheckIcon} color="green" />
              )}
              {sale.ESTADO_COBRANZA === 'VOLVER VISITAR' && (
                <Icon as={RepeatIcon} color="white" />
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
                {sale?.DIA_COBRANZA.substring(0, 2)}
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
            {sale.AVAL_O_RESPONSABLE && (
              <Text style={saleItemStyles.aval}>{sale.AVAL_O_RESPONSABLE}</Text>
            )}
            <Text
              ellipsizeMode="tail"
              numberOfLines={2}
              style={saleItemStyles.address}>
              {sale.CALLE}, {sale.CIUDAD}, {sale.ESTADO}
            </Text>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={saleItemStyles.address}>
              {sale.PRODUCTOS.map(producto => producto.ARTICULO).join(', ')}
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
              Saldo{' '}
              <Text style={saleItemStyles.number}>${sale.SALDO_REST}</Text>
            </Text>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            {sale.PLAZOS_ATRASADOS <= 0.9999 ? (
              <View style={[saleItemStyles.badge, saleItemStyles.badgeSuccess]}>
                <Text style={saleItemStyles.badgeSuccessText}>
                  NO TIENE ATRASOS
                </Text>
              </View>
            ) : (
              <View style={[saleItemStyles.badge, badgeAtrasadosStyle]}>
                <Text style={badgeTextAtrasadosStyle}>PAGOS ATRASA: </Text>
                <Text style={badgeTextAtrasadosStyle}>
                  {sale.PLAZOS_ATRASADOS.toFixed(0)}
                </Text>
              </View>
            )}
            {sale.FECHA_ULT_PAGO && (
              <View style={[saleItemStyles.badge, saleItemStyles.badgeBase]}>
                <Text style={saleItemStyles.badgeTextBase}>ULT PAGO: </Text>
                <Text
                  style={[saleItemStyles.badgeTextBase, {fontWeight: '600'}]}>
                  {dayjs(sale.FECHA_ULT_PAGO).fromNow().toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

export default SaleItem;
