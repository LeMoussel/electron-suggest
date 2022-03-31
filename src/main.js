/* eslint-disable dot-notation */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

const path = require('path');
const fs = require('fs');

/*
TODO
Test:
    normandie evreux
    bmw x2 2.0d
*/

// https://www.electronjs.org/
const {
    app,
    BrowserWindow,
    net,
    ipcMain,
    dialog,
} = require('electron');
// https://github.com/nashwaan/xml-js
const xmlToJs = require('xml-js');

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow = null;
let ngramWindow = null;

// Traverse each node in tree
function traverseTree(node, parentName, callback) {
    if (node.children) {
        callback(node, parentName);
        node.children.forEach((subNode) => {
            parentName.push(node.name);
            traverseTree(subNode, parentName, callback);
        });
    } else {
        callback(node, parentName);
    }
}

function hasKeyValue(arr, key, value) {
    return arr.some((el) => el[key] === value);
}

function findKeyValue(arr, key, value) {
    return arr.find((el) => {
        if (el[key] === value) { return el; }
        return null;
    });
}

function makeRequest(suggestURL) {
    return new Promise((resolve, reject) => {
        let responseBbody = '';

        const request = net.request({
            method: 'GET',
            url: suggestURL,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0',
            },
        });

        request.on('response', (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`${response.statusCode} - ${response.statusMessage}`));
            }

            // capture body of response - can be called more than once for large result
            response.on('data', (chunk) => {
                responseBbody += chunk.toString();
            });

            response.on('end', () => {
                resolve(responseBbody);
            });
        });
        request.on('error', (error) => {
            reject(error);
        });

        request.end();
    });
}

async function googleSuggest(keyword, language, country) {
    /*
        - client: Determines the type of response you want.
            For JSON, use 'chrome''.
            For XML, use 'toolbar'.
            For JSONP use 'youtube'.
        - language (hl - Langue de l’interface): autocomplete results language. For example en, de, tr.
            For more language codes you can visit Google supported language page.
            (https://developers.google.com/custom-search/docs/json_api_reference#interfaceLanguages)
        - country (gl - Code du pays): autocomplete results country. For example US, DE, TR.
            For more country codes you can visit Google supported country code page.
            (https://developers.google.com/custom-search/docs/json_api_reference#countryCodes)
        - jsonp: Specifies the name of the JSONP callback function.
            (Optional. Defaults to window.google.ac.h.)
        - context (ds): which type of google autosuggestion source you need.
            For Search as source use nothing, YouTube as source use 'yt',
            Products as source use 'sh', and News as source use 'n'.
        - query (q): the keyword that you need to search about its autocomplete.
    */
    const ggContexts = ['', 'yt', 'sh', 'n'];
    let suggestsData = new Set();

    await Promise.all(ggContexts.map(async (ds) => {
        const googleSuggestURL = new URL(`https://suggestqueries.google.com/complete/search?client=youtube&hl=${language}&gl=${country}&ds=${ds}&q=${keyword}`);
        const sData = await makeRequest(googleSuggestURL.href);
        const searchSuggestions = [];
        const jsonData = sData.substring(sData.indexOf('(') + 1, sData.lastIndexOf(')'));
        const result = JSON.parse(jsonData);
        result[1].forEach((elt) => {
            searchSuggestions.push(elt[0].trim());
        });
        searchSuggestions.splice(0, 1);

        suggestsData = new Set([...suggestsData, ...searchSuggestions]);
    }));
    return suggestsData;
}

async function bingSuggest(keyword, language, country) {
    /*
    - query (kw) : The keyword that you need to search about its autocomplete.
    - market (mk):  Market code value that the results will return from it.
        * market and language codes page: https://docs.microsoft.com/en-us/bing/search-apis/bing-autosuggest/reference/market-codes
    */
    const marketCode = `${language.toLowerCase()}-${country}`;
    const bingSuggestURL = new URL(`https://api.bing.com/qsml.aspx?Market=${marketCode}&query=${keyword}`);
    const sData = await makeRequest(bingSuggestURL.href);
    const searchSuggestions = [];
    const result = JSON.parse(xmlToJs.xml2json(sData, { compact: true, spaces: 4 }));
    if (Object.prototype.hasOwnProperty.call(result, 'SearchSuggestion')) {
        if (Object.prototype.hasOwnProperty.call(result.SearchSuggestion, 'Section')) {
            if (Object.prototype.hasOwnProperty.call(result.SearchSuggestion.Section, 'Item')) {
                const suggests = result.SearchSuggestion.Section.Item;
                if (suggests.length > 0 && suggests[0].Text['_text'] === keyword) {
                    suggests.splice(0, 1);
                    suggests.forEach((elt) => {
                        searchSuggestions.push(elt.Text['_text'].trim());
                    });
                }
            }
        }
    }
    return new Set(searchSuggestions);
}

async function amazonSuggest(keyword) {
    /*
        - keyword : The keyword that you need to search about its autocomplete.
    */
    const amazonSuggestURL = new URL(`https://completion.amazon.com/search/complete?client=amazon-search-ui&search-alias=aps&mkt=1&q=${keyword}`);
    const sData = await makeRequest(amazonSuggestURL.href);
    const searchSuggestions = JSON.parse(sData);
    return new Set(searchSuggestions[1]);
}

async function wikiSuggest(keyword, language) {
    /*
    Wikipedia - OpenSearch: https://en.wikipedia.org/w/api.php?action=help&modules=opensearch
        - keyword : The keyword that you need to search about its autocomplete.
    */

    const wikiSuggestURL = new URL(`https://${language}.wikipedia.org/w/api.php?action=opensearch&format=json&search=${keyword}`);
    const sData = await makeRequest(wikiSuggestURL.href);
    const searchSuggestions = JSON.parse(sData);
    return new Set(searchSuggestions[1]);
}

async function yahooSuggest(keyword) {
    const yahooSuggestURL = new URL(`http://ff.search.yahoo.com/gossip?output=fxjson&command=${keyword}`);
    const sData = await makeRequest(yahooSuggestURL.href);
    const searchSuggestions = JSON.parse(sData);
    return new Set(searchSuggestions[1]);
}

async function ebaySuggest(keyword) {
    const ebaySuggestURL = new URL(`https://autosug.ebay.com/autosug?kwd=${keyword}&sId=71&callback=0`);
    const sData = await makeRequest(ebaySuggestURL.href);
    const searchSuggestions = JSON.parse(sData);
    if (Object.prototype.hasOwnProperty.call(searchSuggestions, 'res')) {
        if (Object.prototype.hasOwnProperty.call(searchSuggestions.res, 'sug')) {
            searchSuggestions.res.sug.splice(0, 1);
            return new Set(searchSuggestions.res.sug);
        }
    }

    return new Set([]);
}

async function makeSuggest(keyword, language, country) {
    const suggestsDataGoogle = await googleSuggest(keyword, language, country);
    const suggestsDataBing = await bingSuggest(keyword, language, country);
    const suggestsDataAmazon = await amazonSuggest(keyword);
    const suggestsDataWiki = await wikiSuggest(keyword, language);
    const suggestsDataYahoo = await yahooSuggest(keyword);
    const suggestsDataEbay = await ebaySuggest(keyword);

    return new Set([
        ...suggestsDataGoogle,
        ...suggestsDataBing,
        ...suggestsDataWiki,
        ...suggestsDataAmazon,
        ...suggestsDataYahoo,
        ...suggestsDataEbay,
    ]);
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 1000,
        icon: path.join(__dirname, 'app/img/icon.png'),
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, 'app/js/preload.js'), // use a preload script
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'app/html/index.html'));

    mainWindow.on('closed', () => {
        if (ngramWindow) {
            ngramWindow.close();
        }
        mainWindow = null;
    });
}

ipcMain.on('esuggest:searchSuggest', async (_event, keyword, language, country) => {
    const results = { name: keyword, children: [] };

    // Level 1
    const suggests1 = await makeSuggest(keyword, language, country);
    suggests1.forEach((item) => {
        if (item.length >= 3) {
            results.children.push({
                name: item,
                children: [],
            });
        }
    });

    // Level 2
    const suggests2 = {};
    await Promise.all(results.children.map(async (kw) => {
        suggests2[kw.name] = await makeSuggest(kw.name, language, country);
    }));
    Object.entries(suggests2).forEach((values) => {
        const itemSuggest = findKeyValue(results.children, 'name', values[0]);
        values[1].forEach((item) => {
            if (item.length >= 3) {
                itemSuggest.children.push({
                    name: item,
                    children: [],
                });
            }
        });
    });

    if (mainWindow) {
        mainWindow.webContents.send('esuggest:fromMain', results);
    }
});

ipcMain.on('esuggest:showSuggestNGram', (_event, data) => {
    const wordsOnly = /[\w']+/g;
    const words = new Map();
    const suggests = [];

    traverseTree(data, [''], (node) => {
        if (node.children.length === 0) {
            suggests.push(node.name);
            node.name.replace(wordsOnly, (word) => {
                // We get a word here, store and count it
                const e = words.get(word);
                if (e) {
                    words.set(word, 1 + e);
                } else {
                    words.set(word, 1);
                }
            });
        }
    });

    if (ngramWindow) {
        ngramWindow.focus();
        return;
    }

    // https://github.com/electron/electron/blob/main/docs/api/browser-window.md
    ngramWindow = new BrowserWindow({
        height: 720,
        width: 1000,
        minHeight: 720,
        maxHeight: 700,
        minWidth: 800,
        icon: path.join(__dirname, 'app/img/icon.png'),
        show: false,
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, 'app/js/preload.js'), // use a preload script
        },
    });

    ngramWindow.loadFile(path.join(__dirname, 'app/html/ngram.html'));

    ngramWindow.once('ready-to-show', async () => {
        await ngramWindow.webContents.executeJavaScript('localStorage.clear();');

        // eslint-disable-next-line quotes
        const jsonKeywords = JSON.stringify(Array.from(words.entries())).replace(/'/g, "\\'");
        await ngramWindow.webContents.executeJavaScript(`localStorage.setItem("ngramsKeywords",'${jsonKeywords}');`);
        // eslint-disable-next-line quotes
        const jsonSuggest = JSON.stringify(suggests).replace(/'/g, "\\'");
        await ngramWindow.webContents.executeJavaScript(`localStorage.setItem("ngramsSuggests",'${jsonSuggest}');`);

        ngramWindow.webContents.send('esuggest:mainDataSuggestNGram');
        ngramWindow.show();
    });

    ngramWindow.on('closed', () => {
        ngramWindow = null;
    });

    /*
    ngramWindow.webContents.once('dom-ready', () => {
        ngramWindow.webContents.send('esuggest:mainDataSuggestNGram', words);
    });
    */
});

ipcMain.on('esuggest:downloadSuggest', (_event, data) => {
    const filename = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
        title: 'Enregistrer sous',
        defaultPath: 'ElectronSuggest',
        buttonLabel: 'Enregistrer',
        filters: [
            { name: 'Fichier JSON', extensions: ['json'] },
            { name: 'Tous les fichiers', extensions: ['*'] },
        ],
    });

    if (filename) {
        fs.writeFile(filename, JSON.stringify(data), (err) => {
            let options = {
                title: 'Enregistrement OK',
                type: 'info',
                message: `Sauvegardé sous ${filename}`,
                buttons: ['Fermer'],
            };
            if (err) {
                options = {
                    title: 'Erreur d\'Enregistrement',
                    type: 'error',
                    message: err.name || 'Sauvegarde Erreur',
                    detail: err.toString(),
                    buttons: ['Fermer'],
                };
            }
            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
        });
    }
});

app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

app.on('browser-window-created', (e, win) => {
    win.removeMenu();
});
