# Documentación de Integración del Módulo IR en una Aplicación React Native

Este documento describe los pasos necesarios para integrar la funcionalidad de **IR (Image Processing and Upload)** como un módulo adicional en una aplicación React Native existente.

---

## **Estructura del Módulo IR**

El módulo IR está diseñado para:

1. **Fragmentar Imágenes**: Divide cada imagen en 4 fragmentos iguales y los almacena localmente.
2. **Persistencia de Estados**: Utiliza **Realm** para rastrear los estados de las imágenes y fragmentos.
3. **Subida de Fragmentos**: Maneja la subida de fragmentos utilizando URLs prefirmadas.
4. **Tareas en Segundo Plano**: Procesa fragmentos pendientes incluso si la app está en segundo plano o cerrada.

### **Estructura del Código**

El módulo está organizado de la siguiente manera:

```plaintext
src/
├── data/
│   ├── repositories/
│   │   └── ImageRepository.ts    # Persistencia de imágenes y fragmentos en Realm
│   └── commands/
│       └── UploadFragmentCommand.ts # Lógica de subida de fragmentos
├── db/
│   └── IRImageManager.ts         # Manejo del sistema de archivos
├── services/
│   ├── BackgroundFetch.ts        # Configuración de tareas en segundo plano
│   ├── ImageFactory.ts           # Fragmentación y registro de imágenes
│   └── permissions.ts            # Manejo de permisos de almacenamiento
```

---

## **Pasos de Integración**

### **1. Instalación de Dependencias**

Asegúrate de tener las siguientes librerías instaladas en tu proyecto:

```bash
yarn add realm react-native-fs axios react-native-background-fetch @react-native-community/image-editor
```

#### **Configuración Adicional**

- **Android**:

  1. En `AndroidManifest.xml`:

     ```xml
     <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

     <service
         android:name="com.transistorsoft.rnbackgroundfetch.HeadlessTask"
         android:permission="android.permission.BIND_JOB_SERVICE"
         android:exported="true" />
     ```

  2. Configura `MainApplication.java`:

     ```java
     import com.transistorsoft.rnbackgroundfetch.RNBackgroundFetchPackage;

     @Override
     public void onCreate() {
         super.onCreate();
         BackgroundFetch.getInstance().registerReactHeadlessTask();
     }
     ```

- **iOS**:

  1. En `Info.plist`:
     ```xml
     <key>UIBackgroundModes</key>
     <array>
         <string>fetch</string>
     </array>
     ```
  2. Configura `AppDelegate.m`:

     ```objective-c
     #import "RNBackgroundFetch.h";

     - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
         [RNBackgroundFetch configureWithLaunchOptions:launchOptions];
         return YES;
     }
     ```

---

### **2. Importación del Módulo**

#### **a) Repositorios y Comandos**

Agrega los repositorios y comandos necesarios a tu aplicación:

- **`ImageRepository`**:
  Gestiona los estados de imágenes y fragmentos en Realm.

- **`UploadFragmentCommand`**:
  Maneja la lógica de subida de fragmentos con reintentos automáticos.

#### **b) Background Fetch**

Configura `BackgroundFetch.ts` para procesar fragmentos pendientes en segundo plano:

```typescript
import BackgroundFetch from 'react-native-background-fetch';
import {ImageRepository} from './repositories/ImageRepository';
import {UploadFragmentCommand} from './commands/UploadFragmentCommand';

const registerBackgroundFetch = (repository: ImageRepository) => {
  BackgroundFetch.configure(
    {
      minimumFetchInterval: 15,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
    },
    async taskId => {
      console.log(`[BackgroundFetch] Task ejecutada: ${taskId}`);

      const pendingFragments = repository.getPendingFragments();
      for (const fragment of pendingFragments) {
        const uploadCommand = new UploadFragmentCommand(fragment, repository);
        await uploadCommand.execute();
      }

      BackgroundFetch.finish(taskId);
    },
    error => {
      console.error('[BackgroundFetch] Error: ', error);
    },
  );

  BackgroundFetch.status(status => {
    console.log(`BackgroundFetch status: ${status}`);
  });
};

export default registerBackgroundFetch;
```

---

### **3. Lógica de Fragmentos en `App.tsx`**

Agrega la verificación de fragmentos pendientes al iniciar la app:

```typescript
import React, {useEffect, useMemo} from 'react';
import {RealmProvider, useRealm} from '@realm/react';
import {ImageRepository} from './repositories/ImageRepository';
import registerBackgroundFetch from './services/BackgroundFetch';
import {UploadFragmentCommand} from './commands/UploadFragmentCommand';

const App = () => {
  const realm = useRealm();
  const repository = useMemo(() => new ImageRepository(realm), [realm]);

  useEffect(() => {
    registerBackgroundFetch(repository);

    const processPendingFragments = async () => {
      const pendingFragments = repository.getPendingFragments();
      for (const fragment of pendingFragments) {
        const uploadCommand = new UploadFragmentCommand(fragment, repository);
        await uploadCommand.execute();
      }
    };

    processPendingFragments();
  }, [repository]);

  return null; // Tu UI aquí
};

export default App;
```

---

### **4. Probar la Implementación**

#### **Subida de Fragmentos**

1. Selecciona una imagen.
2. Verifica que los fragmentos se suben correctamente al servidor (por ejemplo, usando un servidor Express).

#### **Reintentos**

1. Simula un fallo apagando el servidor durante la subida.
2. Asegúrate de que los fragmentos fallidos se reintentan en la siguiente ejecución o tarea de segundo plano.

#### **Tareas en Segundo Plano**

1. Envía la app al segundo plano.
2. Verifica que las tareas de subida continúan ejecutándose.
