import {View, Text, Pressable, Alert} from 'react-native';
import React from 'react';
import {
  actualizarEstadoGarantia,
  deleteGarantiasAndImages,
  GarantiaRecord,
  getAllEventos,
  getAllGarantias,
} from '../../../../services/garantiaService';
import saleDetailsStyles from '../SaleDetails/saleDetails.style';
import {useNavigation} from '@react-navigation/native';
import {SaleDetailsNavigationProp} from '../SaleDetails/SaleDetails';
import {SaleFull} from '../../../../services/getSaleLocal';

const GarantiaSection = ({
  garantia,
  sale,
}: {
  garantia?: GarantiaRecord;
  sale: SaleFull;
}) => {
  const navigation = useNavigation<SaleDetailsNavigationProp>();

  const handleEntregarProducto = () => {
    Alert.alert(
      'Confirmación',
      '¿Estás seguro de entregar el producto al cliente?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Sí',
          onPress: async () => {
            console.log(
              'Entregando producto al cliente...',
              garantia?.EXTERNAL_ID,
            );
            try {
              await actualizarEstadoGarantia(
                garantia?.EXTERNAL_ID || '',
                'ENTREGADO',
              );
            } catch (error) {
              console.error('Error entregando producto al cliente:', error);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleRecolectarProducto = () => {
    Alert.alert(
      'Confirmación',
      '¿Estás seguro de recolectar el producto del cliente?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Sí',
          onPress: async () => {
            try {
              await actualizarEstadoGarantia(
                garantia?.EXTERNAL_ID || '',
                'RECOLECTADO',
              );
              console.log('Producto recolectado del cliente');
            } catch (error) {
              console.error('Error recolectando producto del cliente:', error);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const showAllEvents = async () => {
    try {
      const allGarantias = await getAllGarantias();
      const addEvents = await getAllEventos();
      console.log('Todas las garantías:', allGarantias);
      console.log('Todos los eventos de garantía:', addEvents);
      if (allGarantias.length > 0) {
      } else {
        Alert.alert('No hay garantías registradas para esta venta.');
      }
    } catch (error) {
      console.error('Error fetching all garantías:', error);
      Alert.alert('Error', 'No se pudieron cargar las garantías.');
    }
  };

  const deleteAll = async () => {
    try {
      // Aquí puedes llamar a la función que elimina todas las garantías e imágenes
      await deleteGarantiasAndImages();
      // await deleteGarantiasAndImages();
      Alert.alert(
        'Éxito',
        'Todas las garantías e imágenes han sido eliminadas.',
      );
    } catch (error) {
      console.error('Error al eliminar garantías e imágenes:', error);
      Alert.alert('Error', 'No se pudieron eliminar las garantías e imágenes.');
    }
  };

  return (
    <View style={{gap: 6}}>
      {garantia ? (
        <>
          <View
            style={{
              borderRadius: 10,
              padding: 15,
              backgroundColor: '#198754',
              marginBottom: 10,
              marginHorizontal: 20,
            }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: 10,
                color: 'white',
                textAlign: 'center',
              }}>
              Garantía Activa
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: 'white',
                textAlign: 'center',
                marginBottom: 10,
              }}>
              Se encuentra una garantía actualmente activa.
            </Text>
            <Text
              style={{
                fontSize: 20,
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              {garantia.ESTADO}
            </Text>
          </View>
        </>
      ) : (
        <Pressable
          style={saleDetailsStyles.ghostButton}
          onPress={() => {
            navigation.navigate('Garantias', {
              saleId: sale.DOCTO_CC_ID,
            });
          }}>
          <Text style={saleDetailsStyles.ghostButtonText}>
            INICIAR GARANTIA
          </Text>
        </Pressable>
      )}
      {garantia?.ESTADO === 'NOTIFICADO' && (
        <>
          <Pressable
            style={saleDetailsStyles.ghostButton}
            disabled={!garantia}
            onPress={() => {
              handleRecolectarProducto();
            }}>
            <Text style={saleDetailsStyles.ghostButtonText}>
              Recolectar producto del cliente
            </Text>
          </Pressable>
          <Pressable
            style={saleDetailsStyles.ghostButton}
            onPress={() => {
              navigation.navigate('Garantias', {
                saleId: sale.DOCTO_CC_ID,
              });
            }}>
            <Text style={saleDetailsStyles.ghostButtonText}>
              Imprimir aviso de garantía
            </Text>
          </Pressable>
        </>
      )}
      {garantia?.ESTADO === 'LISTO_PARA_ENTREGAR' && (
        <Pressable
          style={saleDetailsStyles.ghostButton}
          disabled={!garantia}
          onPress={() => {
            handleEntregarProducto();
          }}>
          <Text style={saleDetailsStyles.ghostButtonText}>
            Entregar producto al cliente
          </Text>
        </Pressable>
      )}
      {/*<Pressable style={saleDetailsStyles.ghostButton} onPress={showAllEvents}>
        <Text style={saleDetailsStyles.ghostButtonText}>
          Ver todas las garantías
        </Text>
      </Pressable>
      <Pressable style={saleDetailsStyles.ghostButton} onPress={deleteAll}>
        <Text style={saleDetailsStyles.ghostButtonText}>
          Eliminar todas las garantías
        </Text>
      </Pressable>
      */}
    </View>
  );
};

export default GarantiaSection;
