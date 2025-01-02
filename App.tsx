import React, {useEffect, useMemo} from 'react';
import {Alert, Button, Image, View} from 'react-native';
import {RealmProvider, useRealm} from '@realm/react';
import {
  FragmentModel,
  ImageModel,
  ImageRepository,
} from './src/data/repositories/ImageRepository';
import {ImageFactory} from './src/services/ImageFactory';
import {UploadFragmentCommand} from './src/data/commands/UploadFragmentCommand';
import RNFS from 'react-native-fs';
import {requestStoragePermissions} from './src/services/permissions';
import registerBackgroundFetch from './src/services/BackgroundFetch';

const App = () => {
  const realm = useRealm();
  const repository = useMemo(() => new ImageRepository(realm), [realm]);

  useEffect(() => {
    requestStoragePermissions().then(granted => {
      if (!granted) {
        Alert.alert('Se requieren permisos de almacenamiento para continuar.');
      }
    });
  }, []);

  useEffect(() => {
    registerBackgroundFetch(repository);
  }, [repository]);

  /**
   * Procesa la imagen y sube sus fragmentos.
   * @param imagePath Ruta de la imagen a procesar.
   */
  const processAndUploadImages = async (imagePath: string) => {
    try {
      console.log(`Procesando imagen: ${imagePath}`);
      // Procesar la imagen y obtener su ID
      const imageId = await ImageFactory.processImage(imagePath, repository);

      console.log(`Image ID: ${imageId}`);

      // Obtener los fragmentos pendientes relacionados con la imagen actual
      console.log(
        'estas son la spendinetes: ',
        repository.getPendingFragments(),
      );
      const pendingFragments = repository
        .getPendingFragments()
        .filtered(`parentImage.id == "${imageId}"`);

      // Subir cada fragmento
      for (const fragment of pendingFragments) {
        const uploadCommand = new UploadFragmentCommand(fragment, repository);
        await uploadCommand.execute();
      }

      // Verificar si todos los fragmentos de la imagen están subidos
      const remainingPendingFragments = pendingFragments.filtered(
        'status == "pending"',
      );
      if (remainingPendingFragments.length === 0) {
        repository.updateImageStatus(imageId, 'completed');
        console.log('Todos los fragmentos han sido subidos con éxito.');
      }
    } catch (error) {
      console.error('Error procesando y subiendo la imagen:', error);
    }
  };

  /**
   * Copia una imagen estática al sistema de archivos local.
   * @returns Ruta de la imagen copiada.
   */
  const copyStaticImageToFileSystem = async (): Promise<string> => {
    try {
      // Ruta directa al archivo en assets
      const resolvedUri = Image.resolveAssetSource(
        require('./assets/images/leaf.jpg'),
      );
      const destinationPath = `${RNFS.DocumentDirectoryPath}/leaf.jpg`;

      console.log(
        `Copiando imagen desde: ${resolvedUri.uri
          .split('?')
          .at(0)} a: ${destinationPath}`,
      );

      // Copiar la imagen al sistema de archivos local
      await RNFS.copyFileAssets('leaf.jpg', destinationPath);

      return destinationPath;
    } catch (error) {
      console.error('Error copiando la imagen:', error);
      throw error;
    }
  };

  /**
   * Lógica del botón para copiar y procesar la imagen.
   */
  const handlePress = async () => {
    try {
      console.log('Iniciando el proceso de copiar y subir imagen...');
      const imagePath = await copyStaticImageToFileSystem();
      console.log(`Imagen copiada a: ${imagePath}`);
      await processAndUploadImages(`file://${imagePath}`);
    } catch (error) {
      console.error('Error en el flujo de procesamiento:', error);
    }
  };

  return (
    <View>
      <Button title="Procesar y Subir Imagen" onPress={handlePress} />
      <Image
        source={{uri: 'asset:/leaf.jpg'}}
        // eslint-disable-next-line react-native/no-inline-styles
        style={{width: 300, height: 300}}
      />
    </View>
  );
};

const RealmWrapper = () => (
  <RealmProvider schema={[ImageModel, FragmentModel]}>
    <App />
  </RealmProvider>
);

export default RealmWrapper;
