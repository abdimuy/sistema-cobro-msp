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

type GarantiasScreenRouteProp = RouteProp<SalesStackParamList, 'Garantias'>;

export default function Garantias() {
  const route = useRoute<GarantiasScreenRouteProp>();
  const navigation = useNavigation();
  const {saleId} = route.params;
  const [descripcion, setDescripcion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

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
      console.log('Antes de guardar:');
      const res = await saveGarantiaLocally(
        {
          DOCTO_CC_ID: saleId,
          DESCRIPTION: descripcion,
          OBSERVACIONES: observaciones,
          EXTERNAL_ID: externalId,
          ESTADO: 'SOLICITUD_RECIBIDA',
          UPLOADED: 0,
          FECHA_SOLICITUD: dayjs().toISOString(),
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
});
