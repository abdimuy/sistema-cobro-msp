import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
  ImageLibraryOptions,
  CameraOptions,
} from 'react-native-image-picker';
import {RouteProp, useRoute} from '@react-navigation/native';
import {SalesStackParamList} from '../../../routes/SalesRoutes';
import {
  deleteGarantiasAndImages,
  getAllGarantias,
  getAllImages,
  saveGarantiaLocally,
} from '../../../services/garantiaService';
import uuid from 'react-native-uuid';
import dayjs from 'dayjs';
import {useNavigation} from '@react-navigation/native';
import {useGetGarantiaBySale} from '../../../hooks/useGetGarantiaBySale';
import usePrinter from '../../../hooks/usePrinter';
import useGetSale from '../../../hooks/useGetSale';
import {Picker} from '@react-native-picker/picker';

type GarantiasScreenRouteProp = RouteProp<SalesStackParamList, 'Garantias'>;

export default function Garantias() {
  const route = useRoute<GarantiasScreenRouteProp>();
  const navigation = useNavigation();
  const {saleId} = route.params;
  const [descripcion, setDescripcion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const {garantia} = useGetGarantiaBySale(saleId);
  const {sale} = useGetSale(saleId);

  const {
    connectPrinter,
    devices,
    loading: printerLoading,
    print,
    savePrinter,
    selectedPrinter,
    getListDevices,
  } = usePrinter();

  const cameraOptions: CameraOptions = {
    mediaType: 'photo',
    quality: 0.8,
    saveToPhotos: true,
  };
  const libraryOptions: ImageLibraryOptions = {
    mediaType: 'photo',
    quality: 0.8,
  };

  const onImageSelected = (asset?: Asset) => {
    if (asset?.uri) {
      setPhotoUris(prev => [...prev, asset.uri!]);
    }
  };

  const pickFromCamera = () => {
    launchCamera(cameraOptions, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.warn('Camera Error:', response.errorMessage);
        return;
      }
      onImageSelected(response.assets?.[0]);
    });
  };

  const pickFromGallery = () => {
    launchImageLibrary(libraryOptions, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.warn('Gallery Error:', response.errorMessage);
        return;
      }
      response.assets?.forEach(asset => onImageSelected(asset));
    });
  };

  const removeImage = (uri: string) => {
    setPhotoUris(prev => prev.filter(u => u !== uri));
  };

  const handleSubmit = async () => {
    if (!descripcion.trim()) {
      return Alert.alert('La descripción de la falla es requerida.');
    }
    if (photoUris.length === 0) {
      return Alert.alert('Debes agregar al menos una foto.');
    }
    try {
      const externalId = uuid.v4() as string;
      const date = dayjs().toISOString();
      const res = await saveGarantiaLocally(
        {
          DOCTO_CC_ID: saleId,
          DESCRIPTION: descripcion,
          OBSERVACIONES: observaciones,
          EXTERNAL_ID: externalId,
          ESTADO: 'SOLICITUD_RECIBIDA',
          UPLOADED: 0,
          FECHA_SOLICITUD: date,
        },
        photoUris.map(uri => ({
          IMG_PATH: uri,
          IMG_MIME: uri.split('.').pop() === 'jpg' ? 'image/jpeg' : 'image/png',
          FECHA_SUBIDA: new Date().toISOString(),
          GARANTIA_ID: externalId,
          ID: '',
        })),
      );
      Alert.alert('¡Guardado localmente!', `Imágenes: ${photoUris.length}`);
      setDescripcion('');
      setObservaciones('');
      setPhotoUris([]);
      navigation.goBack(); // Regresa a la pantalla anterior
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error al guardar: ' + err.message);
    }
  };

  const handleShowAllImages = async () => {
    const imagenes = await getAllImages();
    console.log('Todas las imágenes:', imagenes);
  };

  const handleShowAllGarantias = async () => {
    const garantias = await getAllGarantias();
    console.log('Todas las garantías:', garantias);
  };

  const handleDeleteAll = async () => {
    await deleteGarantiasAndImages();
    Alert.alert('Todas las garantías e imágenes han sido eliminadas.');
  };

  const ticketText = `AVISO DE PROCESO DE GARANTÍA

Estimado cliente:

Le informamos que su producgo ha sido recibido para revision bajo proceso de garantia. El tiempo estimado para este tramite es de uno a dos meses, dependiendo del diagnostico y tiempos de respuesta del proveedor o fabricante.

Al frimar este documento, usted autoriza la recoleccion del articulo dañado y reconoce que:

- El producto sera evaluado para determinar si aplica o no la garantia.

En caso de no proceder, se le notificara para que decida si desea continuar con una reparacion con costo adicional o la devolucion del articulo.

El articulo permanecera bajo resguardo hasta la resolucion del caso.

Agradecemos su comprension. Para cualquier duda o seguimiento, quedamos a su disposicion.

Atentamente
Muebles San Pablo
Departamento de Garantias

Nombre del cliente: ${sale?.CLIENTE || 'N/A'}


Firma del cliente: ______________________


Fecha de solicitud: ${
    garantia ? dayjs(garantia.FECHA_SOLICITUD).format('DD/MM/YYYY') : 'N/A'
  }
`;

  if (garantia) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={{fontSize: 14}}>{ticketText}</Text>

        <View style={[styles.section, {gap: 8, marginBottom: 16}]}>
          <Text style={styles.total}>Selecciona una impresora: </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              borderRadius: 10,
              height: 50,
            }}>
            <Picker
              selectedValue={selectedPrinter}
              onValueChange={itemValue => savePrinter(itemValue)}>
              <Picker.Item
                label="Selecciona una impresora"
                value={null}
                key={`printer-item-null`}
              />
              {devices.map((item, index) => (
                <Picker.Item
                  label={item.device_name}
                  value={item}
                  key={`printer-item-${item.inner_mac_address}`}
                />
              ))}
            </Picker>
          </View>
        </View>
        <View style={{alignItems: 'center'}}>
          <Pressable
            style={styles.button}
            onPress={() => {
              return connectPrinter();
            }}>
            <Text style={styles.buttonText}>Conectar Impresora</Text>
          </Pressable>
          <Pressable
            style={[styles.button]}
            onPress={() => {
              print(ticketText);
            }}>
            <Text style={styles.buttonText}>Imprimir</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Descripción de la falla *</Text>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Describe qué falla presenta la motocicleta"
        value={descripcion}
        onChangeText={setDescripcion}
        placeholderTextColor={'gray'}
      />

      <Text style={styles.label}>Observaciones</Text>
      <TextInput
        style={[styles.input, styles.smallInput]}
        multiline
        placeholder="Notas o comentarios adicionales (opcional)"
        value={observaciones}
        onChangeText={setObservaciones}
        placeholderTextColor={'gray'}
      />

      <Text style={styles.label}>Fotos de la falla *</Text>
      <View style={styles.photoList}>
        {photoUris.map(uri => (
          <View key={uri} style={styles.photoWrapper}>
            <Image source={{uri}} style={styles.preview} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(uri)}>
              <Text style={styles.removeText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.buttonsRow}>
        <Button title="Cámara" onPress={pickFromCamera} />
        <View style={styles.space} />
        <Button title="Galería" onPress={pickFromGallery} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Guardar garantía" onPress={handleSubmit} />
      </View>

      {/* <View style={styles.buttonContainer}>
        <Button title="Ver todas las imágenes" onPress={handleShowAllImages} />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Ver todas las garantías"
          onPress={handleShowAllGarantias}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Borrar garantias e imágenes" onPress={handleDeleteAll} />
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16},
  label: {marginTop: 12, marginBottom: 4, fontWeight: 'bold', color: 'black'},
  section: {
    display: 'flex',
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 6,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 6,
    padding: 8,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 18,
    color: 'black',
  },
  smallInput: {minHeight: 40},
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: 6,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f00',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  space: {width: 16},
  buttonContainer: {marginTop: 24},
  button: {
    backgroundColor: 'blue',
    padding: 8,
    borderRadius: 10,
    marginTop: 8,
    width: '90%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
