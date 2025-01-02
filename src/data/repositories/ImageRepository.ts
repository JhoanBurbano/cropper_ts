import {Realm} from '@realm/react';
import {Results} from 'realm';

export interface ImageSchema extends Realm.Object {
  id: string;
  path: string;
  status: 'pending' | 'completed';
  fragments: Realm.List<FragmentSchema>;
}

export interface FragmentSchema extends Realm.Object {
  id: string;
  path: string;
  status: 'pending' | 'uploaded' | 'failed';
  parentImage: ImageSchema;
}

export const FragmentModel: Realm.ObjectSchema = {
  name: 'Fragment',
  primaryKey: 'id',
  properties: {
    id: 'string',
    path: 'string',
    status: 'string',
    parentImage: 'Image',
  },
};

export const ImageModel: Realm.ObjectSchema = {
  name: 'Image',
  primaryKey: 'id',
  properties: {
    id: 'string',
    path: 'string',
    status: 'string',
    fragments: 'Fragment[]',
  },
};

export class ImageRepository {
  private realm: Realm;

  constructor(realm: Realm) {
    this.realm = realm;
  }

  addImage(imageId: string, imagePath: string, fragments: string[]): void {
    this.realm.write(() => {
      const image = this.realm.create<ImageSchema>('Image', {
        id: imageId,
        path: imagePath,
        status: 'pending',
        fragments: [],
      });

      fragments.forEach((fragmentPath, index) => {
        const fragment = this.realm.create<FragmentSchema>('Fragment', {
          id: `${imageId}_fragment_${index}`,
          path: fragmentPath,
          status: 'pending',
          parentImage: image,
        });
        image.fragments.push(fragment);
      });
    });
  }

  getPendingFragments(): Results<
    Realm.Object<FragmentSchema, never> & FragmentSchema
  > {
    return this.realm
      .objects<FragmentSchema>('Fragment')
      .filtered('status == "pending"');
  }

  updateFragmentStatus(
    fragmentId: string,
    status: 'pending' | 'uploaded' | 'failed',
  ): void {
    this.realm.write(() => {
      const fragment = this.realm.objectForPrimaryKey<FragmentSchema>(
        'Fragment',
        fragmentId,
      );
      if (fragment) fragment.status = status;
    });
  }

  /**
   * Actualiza el estado de la imagen.
   * @param imageId ID de la imagen.
   * @param status Nuevo estado de la imagen.
   */
  updateImageStatus(imageId: string, status: 'pending' | 'completed'): void {
    this.realm.write(() => {
      const image = this.realm.objectForPrimaryKey<ImageSchema>(
        'Image',
        imageId,
      );
      if (image) image.status = status;
    });
  }
}
