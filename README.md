# JardiLock

[https://jardilock.maxbraudel.com]([https://jardilock.maxbraudel.com])

## Important

Certaines actions et certains boutons sont deja integres dans l'interface, mais leur fonctionnalite metier n'est pas encore completement developpee.

Ce choix est volontaire : JardiLock est pense comme un projet qui continue apres le cours. L'objectif est de le faire evoluer progressivement vers un projet plus abouti, avec une logique de produit et une qualite de finition plus professionnelle.

## Presentation du projet

JardiLock est un catalogue de location de jardins prives.

Le site permet de parcourir des annonces de jardins, de filtrer finement les resultats, de naviguer entre une vue catalogue et une vue carte, d'ouvrir une annonce sans casser le contexte de navigation, de consulter la meteo associee, de se connecter a un compte et d'enregistrer des favoris localement.

L'experience a ete pensee avant tout pour la fluidite de navigation et pour le confort de consultation, en particulier sur le catalogue et sur mobile.

## Fonctionnement general

Le coeur du site est concentre sur [pages/gardens/index.vue](pages/gardens/index.vue).

En pratique, le projet fonctionne principalement comme une SPA, c'est-a-dire une single-page application, centree autour du catalogue. La page d'accueil [pages/index.vue](pages/index.vue) sert surtout de landing page d'entree, mais l'experience principale du produit se joue ensuite dans le catalogue.

Les differentes interfaces internes du catalogue ne sont pas gerees comme une succession classique de pages HTML completement distinctes. Le projet utilise plutot des vues superposees pilotees par l'URL, plus precisement via des parametres de hash. Cela permet de conserver les avantages d'une SPA, tout en recuperant une partie des avantages d'une navigation multi-pages.

Concretement, cela permet notamment de :

- conserver la position de scroll, l'etat des filtres, l'etat de la carte et le contexte visuel du catalogue ;
- ouvrir une annonce, un visualiseur d'images, une vue d'authentification ou les filtres mobiles sans recharger toute l'interface ;
- utiliser le bouton retour du navigateur de facon naturelle ;
- partager une URL representant une vue precise du catalogue ;
- alimenter un fil d'Ariane coherent, bien que l'on reste dans une interface principalement mono-page.

Dans le code, cette logique est centralisee par [composables/useOverlayRoute.ts](composables/useOverlayRoute.ts) et par [app/router.options.ts](app/router.options.ts).

## Connexion de demonstration

Pour la verification fonctionnelle du module de connexion, le compte de demonstration prevu est le suivant :

- Email : `test@gmail.com`
- Mot de passe : `motdepasse`

## Lancer le projet

### 1. Installer les dependances


Depuis [package.json](package.json) :

```bash
npm install
```


### 4. Lancer le site web

```bash
npm run dev
```

Le site Nuxt demarre par defaut sur le port `3000`.

### 5. Build

Pour produire une build du frontend :

```bash
npm run build
```

Pour lancer le serveur du build :

```bash
npm run start
```

## Ce qui fait la valeur du projet

## 1. Une vraie logique de SPA centree sur le catalogue

Le choix architectural principal du projet est d'avoir une navigation tres fluide autour d'un catalogue unique, sans casser l'etat de l'interface a chaque interaction.

L'utilisateur peut ouvrir une annonce, la fermer, revenir a la liste, passer en vue carte, revenir a une autre annonce, ouvrir le visualiseur, puis revenir en arriere sans perdre l'etat principal du catalogue. Cela evite de recharger le DOM complet entre chaque etape et rend la navigation beaucoup plus naturelle.

Cette approche permet notamment de conserver :

- la position de scroll ;
- les filtres actifs ;
- l'etat d'ouverture de certaines vues ;
- l'impression de continuite entre la liste, la carte et les annonces.

Le resultat recherche est une navigation tres fluide, tres lisible et tres agreable en usage reel.

## 2. Des vues pilotees par l'URL au sein d'une interface mono-page

JardiLock cherche a combiner deux qualites qui sont souvent opposees :

- la fluidite d'une SPA ;
- la lisibilite et la navigabilite d'une application a URLs partageables.

Au lieu de multiplier les pages classiques, le projet utilise des vues superposees pilotees par l'URL. Cela permet d'avoir un retour navigateur coherent, des URLs partageables et un fil d'Ariane utile, tout en restant sur une experience majoritairement mono-page.

Cette logique est particulierement visible pour :

- l'ouverture d'une annonce ;
- le visualiseur d'images ;
- les vues d'authentification ;
- l'ouverture des filtres sur mobile.

## 3. Un catalogue optimise pour afficher beaucoup de contenu dans un meme flux

Le projet part d'une contrainte volontaire : afficher un catalogue riche dans un seul conteneur de scroll, sans imposer une pagination classique.

Pour rendre cela viable, le composant [components/listing/ListingGrid.vue](components/listing/ListingGrid.vue) met en place une logique de virtualisation. En pratique, seules les lignes utiles dans le viewport, avec une marge de securite, sont rendues en permanence.

Le composant detecte aussi les scrolls rapides afin d'alleger temporairement le rendu visuel. L'objectif est d'eviter de faire exploser les couts de rendu et de chargement image lorsque l'utilisateur parcourt le catalogue tres vite.

Cela permet :

- d'eviter une pagination inutile sur un catalogue de taille moyenne ;
- de garder une sensation de fluidite ;
- de limiter les effets de surcharge visuelle et technique lors des scrolls rapides.

## 4. Une carte catalogue intelligente

Le catalogue propose aussi une vue carte qui n'est pas un simple affichage decoratif. Elle fait partie integrante du parcours de consultation.

Le systeme de carte s'appuie sur Leaflet et sur `leaflet.markercluster`. Les annonces proches sont regroupees intelligemment pour eviter un affichage illisible. Ce regroupement se decompose ensuite lors du zoom.

Le projet utilise aussi des optimisations specifiques pour garder une carte utilisable sur des zones denses, aussi bien en navigation classique qu'en zoom.

Cette logique est visible dans :

- [components/listing/ListingCatalogMap.vue](components/listing/ListingCatalogMap.vue) ;
- [utils/listingCatalogMap.ts](utils/listingCatalogMap.ts).

## 5. Des filtres riches et precis

Le projet integre un ensemble de filtres tres pousses, afin de rendre la recherche reellement utile.

On y trouve notamment des filtres sur :

- la localisation ;
- les equipements ;
- les types d'evenements ;
- la superficie ;
- le prix ;
- certaines contraintes de disponibilite et de calendrier.

Le champ de localisation est particulierement interessant, car il s'appuie sur un service public de recherche d'adresses et de zones geographiques, ce qui permet des suggestions plus pertinentes qu'un simple champ texte libre.

## 6. Une attention forte a l'experience mobile

Le projet a ete travaille avec une vraie attention a l'usage sur telephone.

L'objectif n'etait pas seulement d'avoir un site responsive, mais de proposer une navigation tactile satisfaisante.

Par exemple :

- certaines vues peuvent se fermer par geste vertical via la couche modale ;
- une annonce peut etre parcourue avec des gestes lateraux pour passer a l'annonce precedente ou suivante ;
- le visualiseur d'images prend en charge les gestes tactiles ;
- certains composants de saisie, comme le time picker, ont ete penses pour une interaction au scroll et au swipe.

Ces logiques sont visibles notamment dans :

- [components/ui/ModalShell.vue](components/ui/ModalShell.vue) ;
- [components/listing/ListingOverlay.vue](components/listing/ListingOverlay.vue) ;
- [components/listing/ListingGallery.vue](components/listing/ListingGallery.vue) ;
- [components/form/WheelTimePicker.vue](components/form/WheelTimePicker.vue).

## 7. Une gestion d'images pensee pour l'usage reel

Le serveur ne renvoie pas les images de la meme maniere selon le contexte d'affichage.

Une variante optimisee est servie pour les cartes du catalogue afin de limiter le poids et d'accelerer le chargement. Le serveur s'appuie sur Sharp pour generer une version adaptee a cet usage.

L'objectif est d'avoir :

- un catalogue plus leger ;
- un meilleur confort de chargement ;
- une separation claire entre affichage catalogue et affichage detaille.


## 8. Une base deja prete pour des evolutions produit

Le projet inclut deja plusieurs briques importantes pour une suite de developpement :

- une authentification avec session par cookie HTTP-only ;
- un systeme de favoris base sur le local storage ;
- une structuration propre entre frontend, API, services et logique metier ;
- des scripts de seed et de migration ;
- des points d'extension clairs pour la publication d'annonces, la gestion des comptes et d'autres evolutions futures.

Autrement dit, meme si toutes les fonctionnalites ne sont pas encore pleinement exploitees, la base technique a ete pensee pour evoluer proprement.

## APIs et services utilises

Cette section liste les services utilises par ordre d'importance dans le projet.

## 1. API interne JardiLock

Le projet utilise une API hébergée sur mon serveur linux : `https:jardilock-api.maxbraudel.com`

Il s'agit de l'API principale du projet, developpee specifiquement pour JardiLock.

Principales routes et usages :

- `GET /api/listings` : recuperation du catalogue ;
- `GET /api/listings/:slug` : recuperation d'une annonce detaillee ;
- `GET /api/listings/availability-by-date?date=...` : disponibilites du catalogue pour une date ;
- `GET /api/listings/:id/availability?date=...` : disponibilite d'une annonce precise ;
- `POST /api/listings` : creation d'annonce authentifiee ;
- `PUT /api/listings/:id` : mise a jour d'annonce ;
- `DELETE /api/listings/:id` : suppression d'annonce ;
- `POST /api/auth/register` : inscription ;
- `POST /api/auth/login` : connexion ;
- `POST /api/auth/logout` : deconnexion ;
- `GET /api/users/me` : recuperation du profil connecte ;
- `GET /api/users/:id/listings` : annonces associees a un utilisateur ;
- `GET /api/public-holidays` : jours feries utilises dans la logique de disponibilite ;
- `GET /api/health` : verification simple de l'etat du serveur.

La database d'images est géree par le serveur maison également.

Principale requete et usage :

- `GET /uploads/:listingId/:filename?variant=card` : livraison d'images optimisees pour le catalogue.

Ce service permet de servir des versions plus adaptees aux cartes du catalogue, avec un traitement image cote serveur.

## 3. API Adresse / Base Adresse Nationale

Le projet utilise l'API publique `https://api-adresse.data.gouv.fr/search/` pour les suggestions de recherche geographique.

Usage principal :

- recherche de lieux et de suggestions a partir d'un texte saisi dans le champ de localisation.


## 4. API geo.api.gouv.fr

Le projet utilise aussi `https://geo.api.gouv.fr` en soutien de la logique geographique.

Usage principal :

- enrichissement ou verification de metadonnees geographiques, notamment autour des regions, departements ou informations associees aux lieux.

Cette logique apparait a la fois dans le systeme de localisation et dans certains scripts de donnees cote serveur.

## 5. Open-Meteo

Le projet utilise l'API publique `https://api.open-meteo.com/v1/forecast`.

Usage principal :

- recuperer les previsions meteo d'une annonce a partir de sa latitude et de sa longitude ;
- afficher la temperature actuelle, le vent et une prevision sur plusieurs jours.

Cette integration est visible dans [components/listing/WeatherWidget.vue](components/listing/WeatherWidget.vue).

## 6. Leaflet et leaflet.markercluster

Il ne s'agit pas d'APIs HTTP a proprement parler, mais ce sont des services de cartographie essentiels dans le projet.

Usages principaux :

- affichage de la carte catalogue ;
- placement des annonces sur la carte ;
- regroupement visuel des marqueurs ;
- eclatement progressif des groupes au zoom.

## Qualite technique et experience utilisateur

Au-dela des fonctionnalites, plusieurs choix de conception cherchent a donner au projet une vraie coherence technique et produit.

## 1. Conservation du contexte utilisateur

Le projet cherche a eviter la frustration classique liee aux allers-retours entre liste, detail, carte et navigation navigateur. La conservation du contexte fait partie du coeur de l'experience.

## 2. Performance percue

Le catalogue, le chargement image, la navigation laterale entre annonces et la vue carte ont ete penses pour reduire les ruptures et garder une impression de reactivite.

## 3. Cohesion entre les vues

Le catalogue, l'annonce, la galerie, les filtres et certaines vues secondaires ne sont pas pensees comme des blocs isoles, mais comme des couches de navigation interdependantes.

## 4. Mobile comme environnement de premiere importance

Le mobile n'a pas ete traite comme une simple adaptation du desktop. Les interactions tactiles ont fait l'objet d'un vrai travail de comportement et de confort.

## Structure technique de la codebase

## Vue d'ensemble

Le frontend est organise autour de plusieurs niveaux clairs.

### Pages

- [pages/index.vue](pages/index.vue) : landing page ;
- [pages/gardens/index.vue](pages/gardens/index.vue) : coeur du catalogue ;
- [pages/gardens/[slug].vue](pages/gardens/[slug].vue) : point d'entree URL pour rediriger vers la vue annonce pilotee par hash.

### Layouts et structure applicative

- [layouts/default.vue](layouts/default.vue) : layout principal ;
- [app.vue](app.vue) : racine Nuxt ;
- [app/router.options.ts](app/router.options.ts) : comportement de scroll du routeur.

### Components

Le dossier `components` est structure par domaines :

- `layout` : header, footer, structure globale ;
- `listing` : catalogue, cartes, detail d'annonce, overlay, galerie, meteo ;
- `form` : composants de recherche et de saisie ;
- `auth` : interface de connexion / inscription ;
- `ui` : primitives reutilisables du design system.

### Composables

Les composables centralisent la logique interactive de l'application :

- gestion d'authentification ;
- gestion des favoris ;
- gestion du catalogue ;
- gestion de la carte ;
- gestion des vues superposees liees a l'URL.

Parmi les plus structurants :

- [composables/useListings.ts](composables/useListings.ts) ;
- [composables/useCatalogPageState.ts](composables/useCatalogPageState.ts) ;
- [composables/useOverlayRoute.ts](composables/useOverlayRoute.ts) ;
- [composables/useListingOverlayState.ts](composables/useListingOverlayState.ts) ;
- [composables/useAuth.ts](composables/useAuth.ts).

### Services frontend

Le frontend appelle l'API via une facade claire :

- [services/api.ts](services/api.ts) : surface publique des appels ;
- [services/api/listings.ts](services/api/listings.ts) : appels listing, disponibilite, localisation ;
- [services/api/auth.ts](services/api/auth.ts) : appels d'authentification ;
- [services/api/runtime.ts](services/api/runtime.ts) : configuration runtime, cookies et parsing des reponses.

### Types et utilitaires

- [types/domain.ts](types/domain.ts) : types metier principaux ;
- [utils/appState.ts](utils/appState.ts) : cles d'etat applicatif partage ;
- [utils/listingCatalog.ts](utils/listingCatalog.ts) : logique de filtres et de tri ;
- [utils/listingCatalogMap.ts](utils/listingCatalogMap.ts) : logique de regroupement et d'outils carte.

## Conclusion

JardiLock est un projet centre sur une question simple : comment construire un catalogue de location de jardins qui soit vraiment agreable a consulter, tres fluide, coherent dans sa navigation et solide dans ses fondations techniques.

Le projet n'est pas termine fonctionnellement, mais il ne s'agit pas d'un prototype jete. Il repose deja sur des choix d'architecture, de navigation, de performance et d'experience utilisateur qui ont ete travailles dans une logique de continuation et de professionnalisation.