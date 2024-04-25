import uuid from 'react-native-uuid';

export function generateRandomGUID () {
    return uuid.v4()?.toString();
}

// generate a random number of given length

export function generateRandomNumber (length = 4) {
    return Math.floor(Math.random() * Math.pow(10, length))
}
