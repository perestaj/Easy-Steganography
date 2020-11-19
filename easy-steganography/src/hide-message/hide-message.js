'use strict';

const { ipcRenderer } = require('electron');

const Jimp = require('jimp');

document.addEventListener('DOMContentLoaded', (event) => {
    init();
});

async function init() {
    document.getElementById('close').addEventListener('click', closeWindow);
    document.getElementById('save').setAttribute('disabled', 'disabled');    

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

        const base64 = await readImage.getBase64Async(readImage.getMIME());
    
        document.getElementById('container-image').setAttribute('src', base64);        
    
        updateCharactersLeft(readImage.bitmap.data.length);
        const messageElement = document.getElementById('message');
        messageElement.setAttribute('maxLength', Math.floor(readImage.bitmap.data.length / 8));
        messageElement.addEventListener('input', () => updateCharactersLeft(readImage.bitmap.data.length));
        
        document.getElementById('save').addEventListener('click', async () => await hideMessage(readImage));        
    } else {
        closeWindow();
    }
}    

function updateCharactersLeft(bitmapSize) {    
    const initialLength = "EasySteganography".length + 16;
    const message = document.getElementById('message').value;
    const maxLength = Math.floor(bitmapSize / 8);

    let charactersLeft = maxLength - initialLength -  message.length;
    if (charactersLeft < 0) {
        charactersLeft = 0;
    }

    document.getElementById('charactersLeft').textContent = charactersLeft;

    const saveButton = document.getElementById('save');

    if (message.length === 0) {
        saveButton.setAttribute('disabled', 'disabled');
    } else {
        saveButton.removeAttribute('disabled');
    }
}

async function hideMessage(readImage) {
    const message = document.getElementById('message').value;

    let messageLength = message.length.toString();
    while (messageLength.length < 16) { 
        messageLength = "0" + messageLength; 
    }

    const messageToHide = "EasySteganography"+messageLength+message;

    for (let i = 0; i < messageToHide.length; i++)
    {
        for (let p = 0; p < 8; p++)
        {
            const pow = 1 << p;
            
            readImage.bitmap.data[i * 8 + p] = (messageToHide.charCodeAt(i) & pow) === pow ?
                readImage.bitmap.data[i * 8 + p] | 1 :
                readImage.bitmap.data[i * 8 + p] & 254;
        }
    }

    const saveFilePath = ipcRenderer.sendSync('save-file-sync');
    if (saveFilePath && saveFilePath.length > 0) {  
        document.getElementById('save').setAttribute('disabled', 'disabled');          
        await readImage.writeAsync(saveFilePath);

        closeWindow();
    }
}

function closeWindow() {
    ipcRenderer.send('close-message-window-channel');
}