'use strict';

const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close').addEventListener('click', () => ipcRenderer.sendSync('close-about-window-sync'));
});