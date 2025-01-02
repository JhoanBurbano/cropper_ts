import {PermissionsAndroid, Platform} from 'react-native';

export async function requestStoragePermissions() {
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ];
    if (Platform.Version >= 33) {
      permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    }

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    return Object.values(granted).every(
      value => value === PermissionsAndroid.RESULTS.GRANTED,
    );
  }
  return true;
}
