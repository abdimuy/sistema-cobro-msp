import React, {createRef} from 'react';
import ViewShot from 'react-native-view-shot';

export const generateAndCaptureImage = async (
  svgComponent: React.ReactNode,
): Promise<string> => {
  const viewShotRef = createRef<ViewShot>();

  // Envuelve el componente SVG en un ViewShot
  const viewShotWrapper = (
    <ViewShot ref={viewShotRef} options={{format: 'png', quality: 1}}>
      {svgComponent}
    </ViewShot>
  );

  // Verificar si el ref está inicializado antes de capturar
  if (!viewShotRef.current?.capture) {
    throw new Error('ViewShot ref is not initialized.');
  }

  // Capturar la imagen
  const uri = await viewShotRef.current.capture();
  return uri; // Retornar la URI de la imagen capturada
};
