# ![Electron Suggest](/src/app/img/Electron_Suggest.png)

Electron Suggest permet d’obtenir des suggestions associées à la recherche sur une requête donnée à partir de  différentes source telles que Google Search, Google Products, Google News, YouTube, Bing, ....

![Electron Suggest Exemple](/src/app/img/Electron_Suggest-exemple.png)

## Pré-requis

 Electron Suggest utilisant Electron, si vous voulez modifier cet applicatif vous devez installer [Node.js](https://nodejs.org/fr/download/).

 **Remarque:** Il est recommandé d'utiliser la dernière version LTS disponible.

Pour vérifier que Node.js a été installé correctement, tapez les commandes suivantes dans votre terminal client :

```sh
node -v
npm -v
```

Ces deux commandes devraient imprimer respectivement les versions de Node.js et npm.

**Remarque:** Puisque Electron embarque Node.js dans son binaire, la version de Node.js exécutant votre code n'est pas lié à la version en cours d'exécution sur votre système.

## Installation

```sh
git clone https://github.com/LeMoussel/electron-suggest.git
cd electron-suggest
npm install

// Execution pour Windows
npm run start:win
// Execution pour Linux/Ubuntu
npm run start:unx
```

## Packaging et distribution de l'application

Pour distribuer cet applicatif, [electron-builder](https://www.electron.build/) est utilisé.

Le package de distribution est créé avec la commande suivante :

```sh
npm run build
```

```sh npm run build

> electron-suggest@1.0.0 build
> electron-builder build

  • electron-builder  version=22.14.13 os=10.0.19044
  • loaded configuration  file=package.json ("build" field)
  • writing effective config  file=release\builder-effective-config.yaml
  • packaging       platform=win32 arch=x64 electron=18.0.0 appOutDir=release\win-unpacked
  • building        target=zip arch=x64 file=release\electron-suggest-1.0.0-win.zip
  • building        target=nsis file=release\electron-suggest-1.0.0-win.exe archs=x64 oneClick=true perMachine=false
  • building block map  blockMapFile=release\electron-suggest-1.0.0-win.exe.blockmap
```

electron-buildere crée le dossier `release` où se trouvera le paquet de distribution.

```plain
// Example pour Windows

release/
├── electron-suggest-1.0.0-win.zip
├── electron-suggest-1.0.0-win.exe
└── ...
```
