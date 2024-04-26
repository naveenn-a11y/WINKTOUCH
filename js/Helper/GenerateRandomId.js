import uuid from 'react-native-uuid';

export function generateRandomGUID () {
    return uuid.v4()?.toString();
}