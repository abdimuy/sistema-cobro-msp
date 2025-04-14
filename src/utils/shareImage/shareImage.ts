import Share from 'react-native-share';

export const shareImage = async (imageUri: string): Promise<void> => {
  try {
    await Share.open({
      title: 'Compartir Imagen',
      message: 'Aquí está la imagen generada.',
      url: imageUri,
      type: 'application/octet-stream',
    });
  } catch (error) {
    console.error('Error al compartir la imagen:', error);
    throw error;
  }
};
