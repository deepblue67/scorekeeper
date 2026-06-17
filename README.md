# ScoreKeeper

Documentation de reprise de l'application ScoreKeeper.

Ce fichier sert deux objectifs :

- aider Christophe a se rappeler comment fonctionne l'application ;
- donner a Codex, ou a tout autre intervenant, le contexte necessaire pour reprendre le projet sans repartir de zero.

Derniere version documentee : `V20260612 00H12`.

Fichiers de production a deployer : `index.html` et `sw.js`.

Les autres fichiers (`tests`, `scripts`, `package.json`, `playwright.config.js`, `node_modules`, etc.) servent uniquement au travail local et aux tests. Ils ne sont pas necessaires pour utiliser l'application en production.

## Resume Du Projet

ScoreKeeper est une application web autonome de suivi de scores pour jeux de societe ou jeux de cartes.

Elle permet de :

- creer une partie ;
- choisir un jeu ;
- choisir une date ;
- selectionner des joueurs ;
- saisir les scores manche par manche ;
- modifier ou supprimer un score deja saisi ;
- passer aux manches suivantes ou revenir aux precedentes ;
- terminer une partie ;
- conserver l'historique ;
- consulter des statistiques ;
- gerer la liste des joueurs et des jeux ;
- exporter et importer toutes les donnees ;
- fonctionner hors ligne apres installation/cache ;
- choisir un theme visuel.

L'application est volontairement simple cote deploiement : elle tient dans deux fichiers principaux, `index.html` et `sw.js`.

## Intention Initiale

Le besoin fonctionnel etait deja satisfait par l'application de depart. La consigne forte etait donc :

> Ne surtout pas changer les fonctionnalites de l'application.

Les interventions ont porte sur :

- la securite ;
- la robustesse du stockage ;
- l'autonomie hors ligne ;
- la structure interne du code ;
- les tests ;
- l'apparence visuelle ;
- l'ajout de themes sans supprimer les existants.

Les fichiers originaux fournis au depart etaient :

- `C:\Users\cdesmottes\Downloads\index.html`
- `C:\Users\cdesmottes\Downloads\sw.js`

Ils n'ont pas vocation a etre modifies directement. La livraison travaillee se trouve ici :

```text
C:\Users\cdesmottes\Documents\Codex\2026-06-11\files-mentioned-by-the-user-index\outputs\scorekeeper
```

## Structure Des Fichiers

```text
scorekeeper/
  index.html
  sw.js
  README.md
  package.json
  package-lock.json
  playwright.config.js
  scripts/
    serve.mjs
  tests/
    scorekeeper.spec.js
    service-worker.unit.test.js
```

### `index.html`

Fichier principal de l'application.

Il contient :

- le HTML racine ;
- les meta tags PWA ;
- l'icone integree en base64 ;
- la librairie QR Code integree ;
- tous les styles CSS ;
- tous les themes ;
- toute la logique JavaScript ;
- la creation dynamique du manifest PWA ;
- l'enregistrement du service worker.

Il n'y a pas de framework externe.

### `sw.js`

Service worker de l'application.

Il gere :

- le cache de l'application ;
- le fonctionnement hors ligne ;
- la suppression des anciens caches ;
- la mise a jour forcee via `APP_VERSION`.

### `tests/scorekeeper.spec.js`

Tests Playwright de l'application dans un navigateur mobile simule.

Ils couvrent les principaux parcours utilisateur :

- creation d'une partie ;
- saisie de scores positifs et negatifs ;
- modification d'un score deja saisi ;
- modification depuis le tableau de detail ;
- suppression d'un score ;
- fin de partie ;
- historique apres rechargement ;
- export complet ;
- protection contre injection HTML ;
- resilience en cas d'echec de `localStorage` ;
- rejet d'un import invalide ;
- import valide avec sauvegarde prealable ;
- persistance du theme ;
- ajout de joueurs, groupes et jeux ;
- edition de joueurs depuis les reglages.

### `tests/service-worker.unit.test.js`

Tests unitaires du service worker.

Ils couvrent :

- installation et cache initial ;
- activation et nettoyage des anciens caches ;
- fallback hors ligne pour la navigation ;
- non-interception des requetes externes ;
- strategie cache-first pour les ressources locales ;
- verification de l'absence de dependances externes dans la livraison.

### `scripts/serve.mjs`

Petit serveur local de test.

Il sert l'application sur :

```text
http://127.0.0.1:4173
```

Il renvoie `Cache-Control: no-store`, ce qui evite les confusions pendant les tests locaux.

## Architecture Generale De L'Application

L'application est une Single Page Application faite en JavaScript natif.

Elle n'utilise ni React, ni Vue, ni Angular.

Le HTML contient seulement le squelette :

- une zone `#pages` ;
- cinq pages internes ;
- une navigation basse ;
- une racine de modale.

Les pages sont reconstruites dynamiquement par JavaScript.

Pages principales :

- `home` : creation d'une partie ;
- `game` : partie en cours ;
- `history` : historique ;
- `stats` : statistiques ;
- `settings` : reglages.

La navigation est construite par `buildNav()`.

Le rendu global passe par :

- `render()`
- `renderPage(id)`
- `goTab(id)`

Chaque page a une fonction de construction dediee :

- `buildHome(pg)`
- `buildGame(pg)`
- `buildHistory(pg)`
- `buildStats(pg)`
- `buildSettings(pg)`

Les modales sont construites par `showModal(...)`.

## Donnees Et Stockage

Les donnees sont stockees dans `localStorage`.

Cle principale :

```text
sk_v3
```

Cle du theme selectionne :

```text
sk_theme
```

Cle de sauvegarde avant import :

```text
sk_v3_backup
```

### Modele De Donnees

La structure principale ressemble a ceci :

```js
{
  games: ["Belote", "UNO", "..."],
  players: [
    {
      id: "p1",
      name: "Alice",
      emoji: "🦊",
      color: "av0",
      groups: ["famille"]
    }
  ],
  sessions: [],
  current: null
}
```

### Partie En Cours

Quand une partie est demarree, `current` contient une session active :

```js
{
  id: "...",
  gameName: "Belote",
  date: "2026-06-11",
  startedAt: 1710000000000,
  round: 1,
  players: [
    {
      id: "...",
      name: "Alice",
      emoji: "🦊",
      color: "av0",
      groups: ["famille"],
      scores: [],
      total: 0
    }
  ]
}
```

### Scores

Les scores sont stockes par joueur et par manche.

Format actuel :

```js
scores: [
  { r: 1, v: 42 },
  { r: 2, v: -7 }
]
```

`r` est le numero de manche.

`v` est la valeur du score.

Le total d'un joueur est recalcule a partir de ses scores.

La fonction centrale pour modifier un score est :

```js
updatePlayerRoundScore(data, playerId, round, score)
```

Si `score` est absent, le score de la manche est supprime.

Si `score` est fourni, il remplace le score existant pour cette manche.

Cette logique evite les doublons pour une meme manche.

## Gestion Des Mises A Jour

L'application utilise une constante :

```js
const APP_VERSION = 'V20260612 00H12';
```

Elle est presente dans :

- `index.html`
- `sw.js`

Elle sert a forcer la mise a jour du cache du service worker.

Quand on livre une nouvelle version, il faut toujours synchroniser cette constante dans les deux fichiers.

Le nom du cache est construit ainsi dans `sw.js` :

```js
const CACHE_PREFIX = 'scorekeeper-';
const CACHE_NAME = `${CACHE_PREFIX}${APP_VERSION}`;
```

Le test `tests/service-worker.unit.test.js` contient aussi le nom attendu du cache :

```js
const currentCacheName = "scorekeeper-V20260612 00H12";
```

Quand on change `APP_VERSION`, il faut donc mettre a jour :

- `index.html`
- `sw.js`
- `tests/service-worker.unit.test.js`

## Service Worker Et Hors Ligne

Le service worker met en cache :

```js
const CORE_ASSETS = [
  './',
  './index.html',
  './sw.js'
];
```

Strategie utilisee :

- navigation : network-first, puis fallback vers `index.html` en cache ;
- ressources locales : cache-first ;
- requetes externes : ignorees ;
- requetes non-GET : ignorees ;
- anciens caches ScoreKeeper : supprimes a l'activation.

Cela signifie que l'application peut fonctionner hors ligne apres avoir ete chargee au moins une fois.

Attention : pour que la mise a jour soit bien prise en compte cote utilisateur, il peut etre necessaire de fermer puis relancer l'application apres deploiement.

## Fonctionnement Des Pages

### Accueil

Fonction :

```js
buildHome(pg)
```

L'accueil permet de :

- choisir un jeu ;
- choisir une date ;
- selectionner les joueurs ;
- reordonner les joueurs ;
- demarrer une partie.

Le bouton de demarrage reste desactive tant qu'il manque :

- un jeu ;
- au moins un joueur.

Si une partie est deja en cours, le demarrage d'une nouvelle partie est bloque.

### Partie

Fonction :

```js
buildGame(pg)
```

La page Partie contient trois onglets :

- `Scores`
- `Classement`
- `Detail`

Dans `Scores`, chaque joueur a une ligne cliquable permettant d'ouvrir le pave de saisie.

Le statut de la manche indique combien de joueurs ont deja saisi un score.

Quand tous les joueurs ont saisi leur score, l'application affiche que tout le monde a saisi.

Navigation de manche :

- manche precedente ;
- manche courante ;
- manche suivante.

La fin de partie passe la session active dans l'historique.

### Saisie De Score

Fonctions :

```js
showNumpad(player)
showEditScore(player, round, existingVal, onDone)
```

Le pave de saisie permet :

- d'entrer un nombre ;
- de passer en negatif avec `±` ;
- de supprimer avec `⌫` ;
- de valider ;
- de modifier un score existant ;
- de supprimer le score de la manche.

### Historique

Fonction :

```js
buildHistory(pg)
```

L'historique affiche les parties terminees.

Chaque entree contient :

- le jeu ;
- la date ;
- le nombre de joueurs ;
- le gagnant ;
- le score du gagnant.

L'historique sert aussi de base aux statistiques.

### Statistiques

Fonction :

```js
buildStats(pg)
```

Les statistiques sont calculees depuis les sessions terminees.

L'application distingue notamment :

- statistiques par jeu ;
- statistiques par joueur ;
- parties jouees ;
- victoires ;
- taux de victoire ;
- scores moyens.

### Reglages

Fonction :

```js
buildSettings(pg)
```

Les reglages permettent de :

- changer de theme ;
- ajouter un joueur ;
- modifier un joueur ;
- supprimer un joueur ;
- ajouter un jeu ;
- gerer les groupes de joueurs ;
- exporter les donnees ;
- importer des donnees.

## Themes

Les themes sont definis dans le tableau :

```js
const THEMES = [...]
```

Theme par defaut :

```js
let currentTheme = "teal";
```

Le theme est applique par :

```js
applyTheme(id)
```

Cette fonction :

- memorise le theme dans `localStorage` ;
- applique `data-theme` sur `document.documentElement` ;
- met a jour les variables CSS ;
- met a jour la couleur du navigateur ;
- adapte les inputs de date.

Themes disponibles dans la version `V20260612 00H12` :

1. `material` - Material
2. `teal` - Teal
3. `night` - Nuit
4. `sunset` - Sunset
5. `candy` - Candy
6. `jungle` - Jungle
7. `fiesta` - Fiesta
8. `myrtille` - Myrtille
9. `plage` - Plage
10. `agrume` - Agrume
11. `sakura` - Sakura
12. `minuit` - Minuit
13. `mercure` - Mercure

### Teal

Le theme Teal a ete modernise en style "Soft Modern".

Il est clair, calme, tactile, avec :

- fond tres doux ;
- cartes blanches ;
- coins arrondis ;
- bouton principal teal ;
- accueil compact ;
- tuiles joueurs modernes ;
- navigation basse claire.

### Mercure

Le theme Mercure a ete ajoute ensuite.

Objectif visuel :

- chrome ;
- mercure ;
- acier brosse ;
- graphite ;
- reflet miroir ;
- accent cyan.

La premiere implementation etait trop sombre et trop graphite. Elle a ete corrigee pour se rapprocher de la proposition visuelle :

- titre chromé ;
- logo desature façon metal ;
- cartes d'accueil argent clair ;
- champs type acier brosse ;
- tuiles joueurs metalliques ;
- avatars façon medaillon ;
- bouton principal effet miroir ;
- fond sombre a texture subtile ;
- navigation basse sombre.

Important : les styles Mercure sont isoles sous :

```css
[data-theme="mercure"] ...
```

Ils ne doivent pas modifier les autres themes.

## Export Et Import

L'export utilise le format :

```text
SK1:<base64 JSON>
```

L'export contient :

- `version: 1`
- les jeux ;
- les joueurs ;
- les sessions terminees.

L'application peut afficher l'export :

- sous forme de QR Code ;
- sous forme de texte a copier.

La librairie QR Code est integree directement dans `index.html`, afin de ne pas dependre du reseau.

Avant import, les donnees sont validees par :

```js
validateImportData(data)
```

Un import invalide est refuse.

Avant un import valide, l'ancien etat est sauvegarde dans :

```text
sk_v3_backup
```

## Securite Et Robustesse

Plusieurs points ont ete corriges ou consolides :

### Protection Contre Injection HTML

Les valeurs utilisateur ou stockees sont echappees via :

```js
esc(value)
```

Objectif : eviter qu'un nom de joueur ou de jeu contenant du HTML soit execute.

Un test Playwright verifie ce comportement.

### Mise A Jour Atomique Des Donnees

Les modifications passent par :

```js
upd(fn)
```

Cette fonction :

- clone l'etat courant ;
- applique la modification ;
- tente de sauvegarder ;
- ne remplace l'etat en memoire que si la sauvegarde a reussi ;
- affiche une alerte si `localStorage` refuse l'ecriture.

Objectif : eviter de perdre l'etat en cas de quota depasse ou d'erreur de stockage.

### Validation Des Imports

Les imports sont valides avant remplacement des donnees.

Un import invalide ne remplace pas l'etat existant.

Un import valide cree une sauvegarde prealable.

### Autonomie Hors Ligne

La livraison ne doit pas contenir de dependances reseau critiques.

Un test verifie :

- aucun `<script src="https://...">` ;
- aucun `<link href="https://...">` ;
- service worker local.

## PWA Et Manifest

Le manifest n'est pas un fichier separe.

Il est genere dans `index.html` sous forme de Blob JavaScript.

Il contient notamment :

- `name`
- `short_name`
- `start_url`
- `display: standalone`
- `orientation`
- icone integree.

L'enregistrement du service worker se fait en fin de fichier :

```js
navigator.serviceWorker.register('./sw.js')
```

## Installation Et Tests Locaux

Depuis le dossier :

```text
C:\Users\cdesmottes\Documents\Codex\2026-06-11\files-mentioned-by-the-user-index\outputs\scorekeeper
```

Installer les dependances de test :

```powershell
npm install
```

Lancer tous les tests :

```powershell
npm test
```

Lancer seulement les tests du service worker :

```powershell
npm run test:sw
```

Lancer les tests Playwright en mode visible :

```powershell
npm run test:headed
```

Lancer le serveur local :

```powershell
npm run serve
```

URL locale :

```text
http://127.0.0.1:4173
```

Les tests Playwright utilisent Chrome et une taille d'ecran mobile :

```js
viewport: { width: 390, height: 844 }
```

## Etat Des Tests

Lors de la derniere validation de la version `V20260612 00H12` :

- 13 tests Playwright reussis ;
- 6 tests service worker reussis ;
- total : 19 tests reussis.

Commandes utilisees :

```powershell
npm.cmd run test:sw
```

et :

```powershell
$server = Start-Process -FilePath node -ArgumentList 'scripts/serve.mjs' -WorkingDirectory (Get-Location) -WindowStyle Hidden -PassThru
try {
  Start-Sleep -Seconds 2
  $env:CI='1'
  $env:PLAYWRIGHT_NO_SERVER='1'
  npx.cmd playwright test --trace=off --reporter=dot
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}
```

Cette seconde forme est utile quand on veut controler explicitement le serveur de test.

## Deploiement

Pour deployer l'application, seuls ces deux fichiers sont necessaires :

```text
index.html
sw.js
```

Ils doivent etre places au meme niveau.

Le commentaire en haut de `sw.js` rappelle :

```js
// À placer à la RACINE du dépôt GitHub (même niveau qu'index.html)
```

Apres remplacement des fichiers en production :

1. ouvrir l'application ;
2. fermer completement l'application ;
3. la relancer ;
4. verifier que la version affichee dans Reglages correspond a la nouvelle version.

La fermeture/reouverture aide le service worker a prendre la nouvelle version.

## Regles Importantes Pour Une Future Modification

### Ne Pas Casser Les Fonctionnalites Existantes

L'application repond aux besoins fonctionnels.

Les modifications futures doivent donc etre prudentes :

- pas de changement de comportement sans demande explicite ;
- pas de refonte generale non necessaire ;
- pas de suppression de theme existant ;
- pas de changement de format d'export sans migration ;
- pas de dependance reseau pour une fonctionnalite essentielle.

### Toujours Incrementer La Version

Pour toute livraison modifiant `index.html` ou `sw.js`, incrementer :

- `APP_VERSION` dans `index.html` ;
- `APP_VERSION` dans `sw.js` ;
- `currentCacheName` dans `tests/service-worker.unit.test.js`.

Format actuellement utilise :

```text
VYYYYMMDD HHHH
```

Exemple :

```text
V20260612 00H12
```

### Toujours Lancer Les Tests

Avant de livrer :

```powershell
npm.cmd run test:sw
```

Puis :

```powershell
npx.cmd playwright test --trace=off --reporter=dot
```

ou :

```powershell
npm test
```

### Preserver L'Autonomie

Ne pas ajouter :

- script externe ;
- CSS externe ;
- police Google Fonts ;
- CDN ;
- dependance necessaire au runtime.

Si une librairie est necessaire en production, elle doit etre integree localement ou remplacee par du code natif.

### Attention Aux Themes

Les themes sont sensibles car beaucoup de styles sont globaux.

Pour un theme specifique, preferer des regles scoppées :

```css
[data-theme="nom-du-theme"] ...
```

Ne pas modifier les styles globaux si le changement concerne un seul theme.

### Attention A `innerHTML`

Le code utilise parfois `innerHTML` pour generer rapidement des blocs.

Quand une valeur vient de l'utilisateur ou de `localStorage`, utiliser `esc(...)` ou construire le texte via `textContent`.

## Historique Des Ameliorations Faites Dans Cette Conversation

### 1. Revue De Code

Une revue a ete faite avec l'objectif de ne pas modifier les fonctionnalites.

Points identifies :

- securiser les affichages ;
- fiabiliser `localStorage` ;
- valider les imports ;
- rendre l'application autonome hors ligne ;
- ajouter des tests de caracterisation.

### 2. Tests De Caracterisation

Une suite Playwright a ete ajoutee pour verrouiller les comportements existants.

Des tests unitaires du service worker ont aussi ete ajoutes.

### 3. Securite Des Affichages

Les donnees stockees et les noms utilisateurs ont ete echappes pour eviter l'execution de HTML ou JavaScript injecte.

### 4. Stockage Plus Robuste

Les mises a jour de l'etat passent par `upd(fn)`.

Une modification n'est prise en compte en memoire que si l'ecriture `localStorage` reussit.

### 5. Import Plus Sur

Les imports sont valides.

Une sauvegarde prealable est creee avant remplacement.

### 6. Application Autonome

La dependance QR Code a ete integree dans `index.html`.

Les tests verifient qu'il n'existe pas de dependance externe essentielle.

### 7. Refonte Visuelle Teal

Le theme Teal a ete modernise en style Soft Modern.

La premiere version etait trop eloignee de la maquette ; elle a ete corrigee avec :

- en-tete centre ;
- cartes Jeu et Date separees ;
- joueurs en tuiles ;
- bouton principal plus moderne ;
- navigation basse plus douce.

### 8. Ajout Du Theme Mercure

Un theme Mercure a ete imagine puis ajoute.

La premiere implementation etait trop sombre et trop graphite.

Elle a ensuite ete corrigee pour correspondre davantage a la proposition :

- chrome ;
- acier clair ;
- effet miroir ;
- titre metallique ;
- bouton principal noir/argent ;
- cartes claires en metal brosse.

### 9. Validation Finale

La derniere version validee est :

```text
V20260612 00H12
```

Avec :

- 13 themes disponibles ;
- 19 tests reussis ;
- aucun script externe ;
- aucun lien CSS externe ;
- fonctionnement hors ligne conserve.

## Points Connus Et Limites

### Application Monofichier

`index.html` est volumineux car il contient tout :

- CSS ;
- JS ;
- QR Code ;
- logo ;
- manifest dynamique.

C'est volontaire pour simplifier le deploiement.

Avantage :

- seulement `index.html` et `sw.js` a deployer.

Inconvenient :

- fichier long a maintenir.

### Pas De Backend

Toutes les donnees sont locales au navigateur.

Il n'y a pas :

- compte utilisateur ;
- synchronisation automatique ;
- base de donnees distante.

Pour transferer les donnees, utiliser l'export/import.

### Export QR Limite Par Taille

Si les donnees sont trop volumineuses, le QR Code peut devenir impossible ou peu pratique.

Dans ce cas, l'application propose le mode texte.

### Service Worker Et Cache

Le cache peut donner l'impression que la mise a jour n'est pas immediate.

Solution :

- incrementer `APP_VERSION` ;
- deployer `index.html` et `sw.js` ;
- fermer puis relancer l'application.

## Checklist Pour Une Future Livraison

Avant de livrer :

- [ ] modifier uniquement ce qui est demande ;
- [ ] conserver les fonctionnalites existantes ;
- [ ] incrementer `APP_VERSION` dans `index.html` ;
- [ ] incrementer `APP_VERSION` dans `sw.js` ;
- [ ] mettre a jour `currentCacheName` dans `tests/service-worker.unit.test.js` ;
- [ ] lancer les 6 tests service worker ;
- [ ] lancer les 13 tests Playwright ;
- [ ] verifier qu'il n'y a pas de dependance externe ;
- [ ] verifier visuellement les ecrans touches ;
- [ ] deployer uniquement `index.html` et `sw.js`.

## Commandes Utiles

Afficher la version dans les deux fichiers :

```powershell
Select-String -Path index.html,sw.js -Pattern "const APP_VERSION" |
  ForEach-Object { "{0}: {1}" -f $_.Filename,$_.Line.Trim() }
```

Verifier l'absence de scripts et liens externes :

```powershell
$externalScripts = Select-String -Path index.html -Pattern '<script\b[^>]*\bsrc=["'']https?://' -AllMatches
$externalLinks = Select-String -Path index.html -Pattern '<link\b[^>]*\bhref=["'']https?://' -AllMatches
"External scripts: $($externalScripts.Count)"
"External links: $($externalLinks.Count)"
```

Lancer le serveur local :

```powershell
npm.cmd run serve
```

Lancer les tests :

```powershell
npm.cmd test
```

## Pour Reprendre Le Projet Plus Tard

Lire dans cet ordre :

1. ce README ;
2. `index.html`, sections `VERSION`, `THEMES`, `STORE`, `RENDER`, puis les fonctions `buildHome`, `buildGame`, `buildSettings` ;
3. `sw.js` ;
4. `tests/scorekeeper.spec.js` ;
5. `tests/service-worker.unit.test.js`.

Regle d'or : ScoreKeeper fonctionne deja comme souhaite. Toute evolution doit etre une amelioration ciblee, verifiee par tests, et sans regression fonctionnelle.
