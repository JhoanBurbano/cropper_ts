import RNFS from 'react-native-fs';
import ImageEditor from '@react-native-community/image-editor';
import {Image} from 'react-native';
import {ImageCropData} from '@react-native-community/image-editor/lib/typescript/src/types';

// Define los paths principales para las imágenes
const IR_IMAGES_PATH = `${RNFS.DocumentDirectoryPath}/ir_images`;
const SPLITTED_IMAGES_PATH = `${IR_IMAGES_PATH}/splitted`;

// Interfaz para describir los datos de la imagen dividida
export interface FragmentInfo {
  path: string;
  width: number;
  height: number;
}

export class IRImageManager {
  /**
   * Guarda una imagen en el sistema de archivos.
   * @param imagePath Ruta de la imagen de origen.
   * @param fileName Nombre del archivo destino.
   * @returns Ruta de la imagen guardada.
   */
  static async saveImage(imagePath: string, fileName: string): Promise<string> {
    const destinationPath = `${IR_IMAGES_PATH}/${fileName}`;
    await RNFS.mkdir(IR_IMAGES_PATH);
    await RNFS.copyFile(imagePath, destinationPath);
    return destinationPath;
  }

  /**
   * Divide una imagen en 4 fragmentos y los guarda.
   * @param imagePath Ruta de la imagen de origen.
   * @returns Array con la información de cada fragmento.
   */
  static async splitImage(imagePath: string): Promise<FragmentInfo[]> {
    const {width, height} = await new Promise<{width: number; height: number}>(
      (resolve, reject) =>
        Image.getSize(
          imagePath,
          (w, h) => resolve({width: w, height: h}),
          e => reject(e),
        ),
    );

    console.log(`Dimensiones de la imagen: ${width}x${height}`);

    const cropWidth = width / 2;
    const cropHeight = height / 2;
    const coordinates = [
      {x: 0, y: 0},
      {x: cropWidth, y: 0},
      {x: 0, y: cropHeight},
      {x: cropWidth, y: cropHeight},
    ];

    try {
      await RNFS.mkdir(SPLITTED_IMAGES_PATH);
    } catch (error) {
      console.error('Error creando el directorio de fragmentos:', error);
    }

    return Promise.all(
      coordinates.map(async (coord, index): Promise<FragmentInfo> => {
        const cropData: ImageCropData = {
          offset: {x: coord.x, y: coord.y},
          size: {width: cropWidth, height: cropHeight},
          displaySize: {width: cropWidth, height: cropHeight},
          resizeMode: 'contain',
        };

        const croppedImagePath = `${SPLITTED_IMAGES_PATH}/fragment_${index}.jpg`;
        const croppedImageUri = await ImageEditor.cropImage(
          imagePath,
          cropData,
        );
        console.log(`Fragmento ${index} creado:`, {croppedImageUri});
        await RNFS.moveFile(croppedImageUri.path, croppedImagePath);

        return {
          path: croppedImagePath,
          width: cropWidth,
          height: cropHeight,
        };
      }),
    );
  }

  /**
   * Elimina una imagen del sistema de archivos.
   * @param imagePath Ruta de la imagen a eliminar.
   */
  static async deleteImage(imagePath: string): Promise<void> {
    await RNFS.unlink(imagePath);
  }

  /**
   * Elimina múltiples fragmentos de imágenes.
   * @param fragments Array con las rutas de los fragmentos a eliminar.
   */
  static async deleteSplittedImages(fragments: string[]): Promise<void> {
    await Promise.all(fragments.map(path => RNFS.unlink(path)));
  }
}
