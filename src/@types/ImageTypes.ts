export interface IFragment {
  id: string;
  path: string;
  status: FragmentStatus; // Estado del fragmento
}

export type FragmentStatus = 'pending' | 'uploaded' | 'failed';

export interface IImage {
  id: string;
  path: string;
  status: ImageStatus; // Estado de la imagen
  fragments: IFragment[];
}

export type ImageStatus = 'pending' | 'processing' | 'completed';
