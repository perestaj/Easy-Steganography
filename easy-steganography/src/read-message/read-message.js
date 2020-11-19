'use strict';

const { ipcRenderer } = require('electron');
const Jimp = require('jimp');

const initMessage = "EasySteganography";

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    document.getElementById('cancel').addEventListener('click', closeWindow);

    const imageFile = ipcRenderer.sendSync('open-file-sync');

    if (imageFile && imageFile.length === 1) {    
        let readImage;

        try {
            readImage = await Jimp.read(imageFile[0]);
        } catch (error) {
            window.alert('An error occurred while opening the image file!');
            closeWindow();
            return;
        }        

        const message = readMessage(readImage);
        if (!message || message.length === 0) {
            window.alert('No message has been found!');
            closeWindow();
            return;
        }

        const base64 = await readImage.getBase64Async(readImage.getMIME());
    
        document.getElementById('container-image').setAttribute('src', base64);
        document.getElementById('message').value = message;
    } else {
        closeWindow();
    }
}

function readMessage(readImage) {    
    const messageHeader = readMessageSegment(readImage.bitmap.data, 0, initMessage.length);
    
    if (messageHeader !== initMessage) {
        return '';
    }
    
    const length = readMessageSegment(readImage.bitmap.data, initMessage.length, 16);
    const messageLength = parseInt(length);
    const message = readMessageSegment(readImage.bitmap.data, initMessage.length + 16, messageLength);

    return message;
}

function readMessageSegment(data, startIndex, length) {
    let result = '';
    
    for (let i = 0; i < length; i++) {
        let currentByte = 0;

        for (let bit = 0; bit < 8; bit++) {
            if ((data[(i + startIndex) * 8 + bit] & 1) == 1) {
                currentByte += (1 << bit);
            }
        }

        result += String.fromCharCode(currentByte);
    }

    return result;
}

function closeWindow() {
    ipcRenderer.send('close-message-window-channel');
}