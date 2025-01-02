import BackgroundFetch from 'react-native-background-fetch';
import {ImageRepository} from '../data/repositories/ImageRepository';
import {UploadFragmentCommand} from '../data/commands/UploadFragmentCommand';

const registerBackgroundFetch = (repository: ImageRepository) => {
  BackgroundFetch.configure(
    {
      minimumFetchInterval: 15, // Intervalo mínimo en minutos
      stopOnTerminate: false, // Continuar en segundo plano
      startOnBoot: true, // Reiniciar después de reiniciar el dispositivo
      enableHeadless: true, // Permitir ejecución en modo headless
    },
    async taskId => {
      console.log('[BackgroundFetch] Task ejecutada: ', taskId);

      // Procesar fragmentos pendientes
      const pendingFragments = repository.getPendingFragments();
      for (const fragment of pendingFragments) {
        const uploadCommand = new UploadFragmentCommand(fragment, repository);
        await uploadCommand.execute();
      }

      // Finalizar la tarea
      BackgroundFetch.finish(taskId);
    },
    error => {
      console.error('[BackgroundFetch] Error: ', error);
    },
  );

  // Verificar estado del BackgroundFetch
  BackgroundFetch.status(status => {
    switch (status) {
      case BackgroundFetch.STATUS_AVAILABLE:
        console.log('BackgroundFetch disponible.');
        break;
      case BackgroundFetch.STATUS_DENIED:
        console.log('BackgroundFetch denegado.');
        break;
      case BackgroundFetch.STATUS_RESTRICTED:
        console.log('BackgroundFetch restringido.');
        break;
    }
  });
};

export default registerBackgroundFetch;
