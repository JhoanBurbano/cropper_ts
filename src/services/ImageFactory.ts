import {ImageRepository} from '../data/repositories/ImageRepository';
import {IRImageManager} from '../db/IRImageManager';

export class ImageFactory {
  static async processImage(
    imagePath: string,
    repository: ImageRepository,
  ): Promise<string> {
    const imageId = `image_${Date.now()}`;
    try {
      const fragments = await IRImageManager.splitImage(imagePath);
      repository.addImage(
        imageId,
        imagePath,
        fragments.map(fragment => fragment.path),
      );
      console.log(`Imagen procesada: ${imageId}`);
      return imageId;
    } catch (error) {
      console.error('Error (Splitting)', error);
      return imageId;
    }
  }
}
