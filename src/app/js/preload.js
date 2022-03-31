/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

/*
    Ref:
    Error while importing electron in react | import { ipcRenderer } from 'electron'
    https://stackoverflow.com/a/59888788/710955
    https://github.com/electron/electron/issues/9920#issuecomment-575839738
    https://github.com/reZach/secure-electron-template/blob/master/docs/secureapps.md

    The best way to build Electron apps with security in mind.
    https://github.com/reZach/secure-electron-template
*/

const electron = require('electron');

const { contextBridge, ipcRenderer } = electron;

contextBridge.exposeInMainWorld('api', {
    require: (filename) => require(filename),
    sendSync: (channel, ...data) => {
        const validChannels = ['esuggest:suggestSynchronousMessage'];
        if (validChannels.includes(channel)) {
            return ipcRenderer.sendSync(channel, ...data);
        }
        return undefined;
    },
    send: (channel, ...data) => {
        const validChannels = ['esuggest:searchSuggest', 'esuggest:downloadSuggest', 'esuggest:showSuggestNGram'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, ...data);
        }
    },
    receive: (channel, func) => {
        const validChannels = ['esuggest:fromMain', 'esuggest:mainDataSuggestNGram'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
});
