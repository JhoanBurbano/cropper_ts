import axios from 'axios';
import RNFS from 'react-native-fs';
import {FragmentSchema, ImageRepository} from '../repositories/ImageRepository';

export class UploadFragmentCommand {
  private fragment: FragmentSchema;
  private repository: ImageRepository;
  private retries: number = 0;
  private maxRetries: number = 3;

  constructor(fragment: FragmentSchema, repository: ImageRepository) {
    this.fragment = fragment;
    this.repository = repository;
  }

  async execute(): Promise<void> {
    try {
      const presignedUrl = await this.getPresignedUrl(this.fragment.path);
      const fragmentData = await RNFS.readFile(this.fragment.path, 'base64');

      await axios.put(presignedUrl, fragmentData, {
        headers: {'Content-Type': 'image/jpeg'},
      });

      this.repository.updateFragmentStatus(this.fragment.id, 'uploaded');
    } catch (error) {
      this.retries++;
      if (this.retries < this.maxRetries) {
        console.warn(`Reintentando subir fragmento: ${this.fragment.path}`);
        await this.execute();
      } else {
        console.error(
          `Falló la subida tras ${this.maxRetries} intentos`,
          error,
        );
        this.repository.updateFragmentStatus(this.fragment.id, 'failed');
      }
    }
  }

  private async getPresignedUrl(fragmentPath: string): Promise<string> {
    try {
      // Realiza una solicitud GET al servidor Express, pasando el fragmentPath como parámetro
      const response = await axios.get(
        'http://192.168.20.26:4000/presigned-url',
        {
          params: {fragmentPath},
        },
      );

      // Extrae la URL del cuerpo de la respuesta
      const {url} = response.data;

      console.log(
        `URL prefirmada obtenida para el fragmento ${fragmentPath}: ${url}`,
      );
      return url;
    } catch (error) {
      console.error(
        `Error al obtener la URL prefirmada para el fragmento ${fragmentPath}:`,
        error,
      );
      throw new Error('No se pudo obtener la URL prefirmada');
    }
  }
}
