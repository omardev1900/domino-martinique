# 📢 Système Publicitaire — Spec Technique

> Décision client : 22 avril 2026
> Tâche TASKS.md : **[R2-M7]**
> Sprint : Lancement

---

## Vue d'ensemble

Deux phases distinctes et indépendantes :

| Phase | Nature | Priorité |
|---|---|---|
| **Phase 1** | Popup image géré par l'admin (interne) | 🔴 Bloquant lancement |
| **Phase 2** | AdMob (monétisation automatique) | ⚫ Post-lancement (Bloc 13) |

---

## Phase 1 — Publicité interne admin-managed

### Principe
L'admin upload une image depuis le dashboard. Il configure les dates, les endroits d'affichage et la fréquence. Le mobile affiche une popup plein écran aux bons moments.

---

### Modèle Firestore — collection `ads/{adId}`

```ts
interface Ad {
  id:         string;
  title:      string;           // Label admin uniquement (non affiché in-app)
  imageUrl:   string;           // URL Firebase Storage
  targetUrl:  string | null;    // Lien ouvert au tap sur l'image (optionnel)
  active:     boolean;          // Toggle ON/OFF global
  startsAt:   Timestamp;        // Date/heure de début de diffusion
  endsAt:     Timestamp;        // Date/heure de fin de diffusion
  placements: AdPlacement[];    // Liste des points d'injection activés
  frequency:  AdFrequency;      // Fréquence d'affichage par placement
  createdAt:  Timestamp;
}

type AdFrequency =
  | 'EVERY_TIME'        // À chaque fois que le placement est atteint
  | 'ONCE_PER_SESSION'  // Une seule fois par session (ouverture de l'app)
  | 'ONCE_PER_DAY';     // Une seule fois par jour calendaire

type AdPlacement =
  | 'HOME'                // Focus sur l'écran d'accueil
  | 'BEFORE_SOLO'         // Avant de lancer une partie solo
  | 'AFTER_ROUND_SOLO'    // Après chaque round (solo)
  | 'END_OF_MANCHE_SOLO'  // Fin de manche (solo)
  | 'END_OF_MATCH_SOLO'   // Fin de match complet (solo)
  | 'BEFORE_MULTI'        // Avant de rejoindre/créer une table multi
  | 'END_OF_MATCH_MULTI'; // Fin de match complet (multi)
```

---

### Règles d'affichage (mobile)

1. Récupérer toutes les pubs `active = true` depuis Firestore (onSnapshot ou getDoc selon le besoin)
2. Filtrer : `startsAt <= now <= endsAt`
3. Filtrer : la pub a le `placement` demandé dans sa liste
4. Vérifier le cooldown (AsyncStorage) selon `frequency` :
   - `EVERY_TIME` → toujours afficher
   - `ONCE_PER_SESSION` → clé `ad_shown_{adId}_session` (effacée à chaque démarrage)
   - `ONCE_PER_DAY` → clé `ad_shown_{adId}_date` comparée à la date du jour
5. Si plusieurs pubs valides pour un placement → afficher la plus récente (`createdAt` desc)
6. La pub passe toujours AVANT le cadeau quotidien (si les deux se déclenchent sur `HOME`)

---

### Fichiers à créer

| Fichier | Rôle |
|---|---|
| `mobile/src/core/types/ad.types.ts` | Types `Ad`, `AdPlacement`, `AdFrequency` |
| `mobile/src/core/services/ad.service.ts` | Singleton : fetch, filtre, cooldown, `showAdForPlacement()` |
| `mobile/src/components/AdBannerModal.tsx` | Popup plein écran : image, bouton X, tap = ouvre targetUrl |

### Fichiers à modifier (injection des 7 placements)

| Fichier | Placement injecté |
|---|---|
| `mobile/app/home.tsx` | `HOME` |
| `mobile/app/solo.tsx` | `BEFORE_SOLO` |
| `mobile/src/screens/GameScreen.tsx` | `AFTER_ROUND_SOLO`, `END_OF_MANCHE_SOLO`, `END_OF_MATCH_SOLO`, `END_OF_MATCH_MULTI` |
| `mobile/app/game/[id].tsx` ou lobby | `BEFORE_MULTI` |

### Fichiers Admin (Next.js dashboard)

| Fichier | Rôle |
|---|---|
| `admin/app/ads/page.tsx` | Liste des pubs avec toggle ON/OFF + bouton créer |
| `admin/app/ads/[id]/page.tsx` | Formulaire : upload image, URL cible, dates, placements (checkboxes), fréquence |

---

### Interface AdService

```ts
class AdService {
  // Charge toutes les pubs actives depuis Firestore (appeler au démarrage)
  async preload(): Promise<void>

  // Retourne true et marque le cooldown si une pub doit s'afficher
  async getAdForPlacement(placement: AdPlacement): Promise<Ad | null>

  // Réinitialise les cooldowns ONCE_PER_SESSION (à appeler au démarrage de l'app)
  resetSessionCooldowns(): void
}

export const adService = new AdService();
```

### Interface AdBannerModal

```tsx
<AdBannerModal
  ad={Ad}           // L'objet pub à afficher
  visible={boolean}
  onClose={() => void}
/>
```

---

### Firestore Rules (à ajouter)

```
match /ads/{adId} {
  allow read: if true;                              // Lecture publique
  allow write: if request.auth.token.admin == true; // Écriture admin seulement
}
```

---

## Phase 2 — AdMob (post-lancement)

> À traiter dans le **Bloc 13 — Paiements & Monétisation**.

### Étapes

1. Créer compte Google AdMob + déclarer les apps Android/iOS
2. Obtenir les `APP_ID` et `AD_UNIT_ID` pour chaque format
3. Intégrer SDK `react-native-google-mobile-ads`
4. Implémenter interstitiel au lancement (fréquence configurable)
5. Bannière optionnelle bas d'écran home
6. Désactiver pour les joueurs **VIP Pass** (Bloc 13)
7. Mode test AdMob obligatoire avant soumission store

### Dépendance

Phase 2 nécessite que les apps soient publiées sur Play Store / App Store (compte développeur actif).

---

## Ordre d'implémentation recommandé

```
1. ad.types.ts                   (5 min)
2. Firestore collection + rules  (10 min)
3. ad.service.ts                 (30 min)
4. AdBannerModal.tsx             (20 min)
5. Injection HOME (home.tsx)     (10 min)
6. Injection solo (solo.tsx + GameScreen) (20 min)
7. Injection multi (game/[id].tsx) (15 min)
8. Admin : liste + formulaire    (45 min)
```

**Durée estimée Phase 1 : ~2h30**
