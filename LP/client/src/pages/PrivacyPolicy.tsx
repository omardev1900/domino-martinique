import { Link } from "wouter";

const CONTACT_EMAIL = "contact@domino-martinique.online";
const APP_NAME = "Martinique Domino Cochon";
const COMPANY = "Omatrice";
const LAST_UPDATED = "6 mai 2026";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
              🎲
            </div>
            <span className="font-display text-xl font-bold text-primary hidden sm:inline">
              Domino Martinique Cochon
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
        <p className="text-muted-foreground text-sm mb-8">Dernière mise à jour : {LAST_UPDATED}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

          {/* Intro */}
          <section>
            <p>
              {APP_NAME} (ci-après « l'Application ») est éditée par <strong>{COMPANY}</strong>.
              La présente politique explique quelles données nous collectons, pourquoi, et comment vous pouvez exercer vos droits.
            </p>
          </section>

          {/* 1. Données collectées */}
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Données collectées</h2>
            <p>Lors de votre utilisation de l'Application, nous collectons :</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Adresse e-mail</strong> — utilisée pour la création de compte et l'authentification.</li>
              <li><strong>Pseudo</strong> — affiché aux autres joueurs pendant les parties.</li>
              <li><strong>Avatar</strong> — image de profil choisie parmi notre bibliothèque ou importée.</li>
              <li><strong>Données de jeu</strong> — statistiques de parties (victoires, défaites, cochons infligés/reçus, points), niveau de ligue, progression économique (coins, XP, diamonds).</li>
              <li><strong>Token de notification</strong> — identifiant technique pour l'envoi de notifications push (FCM), stocké dans Firebase.</li>
              <li><strong>Identifiant Firebase</strong> — généré automatiquement à la création du compte.</li>
            </ul>
            <p className="mt-3">Nous ne collectons <strong>pas</strong> : numéro de téléphone, localisation GPS, contacts, données bancaires (les paiements éventuels transitent par Google Play Billing).</p>
          </section>

          {/* 2. Finalités */}
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Pourquoi nous collectons ces données</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Créer et gérer votre compte joueur.</li>
              <li>Permettre le jeu en multijoueur temps réel.</li>
              <li>Calculer et afficher les classements (Ligue des Cochons, leaderboard).</li>
              <li>Envoyer des notifications push (rappels quotidiens, événements en jeu) — uniquement si vous avez accordé la permission.</li>
              <li>Détecter et prévenir les abus (triche, multi-comptes).</li>
              <li>Améliorer l'Application via des rapports d'erreurs anonymisés (Sentry).</li>
            </ul>
          </section>

          {/* 3. Partage */}
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Partage des données</h2>
            <p>Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées avec :</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Google Firebase</strong> (Firestore, Authentication, Storage, Cloud Functions) — hébergement et authentification. <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Politique de confidentialité Firebase</a>.</li>
              <li><strong>Sentry</strong> — rapports de crashs (données techniques anonymisées). <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Politique Sentry</a>.</li>
              <li><strong>Google AdMob / publicités admin</strong> — affichage de publicités dans l'Application. Les publicités peuvent utiliser un identifiant publicitaire anonymisé.</li>
            </ul>
          </section>

          {/* 4. Conservation */}
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Durée de conservation</h2>
            <p>
              Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre compte,
              l'ensemble de vos données (profil, statistiques, économie) est supprimé définitivement dans un délai de <strong>30 jours</strong>.
            </p>
          </section>

          {/* 5. Droits */}
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Vos droits</h2>
            <p>Conformément au RGPD et aux lois applicables, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Accès</strong> — obtenir une copie de vos données personnelles.</li>
              <li><strong>Rectification</strong> — corriger vos informations inexactes.</li>
              <li><strong>Effacement</strong> — supprimer votre compte et toutes vos données.</li>
              <li><strong>Opposition</strong> — vous opposer au traitement à des fins de marketing.</li>
              <li><strong>Portabilité</strong> — recevoir vos données dans un format structuré.</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline font-medium">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          {/* 6. Suppression du compte */}
          <section id="delete-account" className="bg-muted rounded-xl p-6 border border-border">
            <h2 className="text-xl font-semibold mb-3">6. Suppression de votre compte et de vos données</h2>
            <p className="mb-4">
              Vous pouvez supprimer votre compte et toutes les données associées directement depuis l'Application :
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Ouvrez l'Application <strong>{APP_NAME}</strong>.</li>
              <li>Accédez à <strong>Paramètres</strong> (icône ⚙️ dans la barre latérale).</li>
              <li>Appuyez sur l'onglet <strong>Compte</strong>.</li>
              <li>Faites défiler jusqu'à <strong>« Supprimer mon compte »</strong>.</li>
              <li>Confirmez la suppression en saisissant votre adresse e-mail.</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              La suppression est <strong>définitive et irréversible</strong>. Elle entraîne la suppression de :
              votre profil, vos statistiques, votre progression (coins, XP, diamonds, ligue), et votre compte d'authentification.
            </p>
            <p className="mt-3 text-sm">
              Si vous rencontrez des difficultés, envoyez une demande de suppression à :{" "}
              <a href={`mailto:${CONTACT_EMAIL}?subject=Demande de suppression de compte`} className="text-primary underline font-medium">
                {CONTACT_EMAIL}
              </a>. Nous traiterons votre demande sous 30 jours.
            </p>
          </section>

          {/* 7. Sécurité */}
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Sécurité</h2>
            <p>
              Vos données sont hébergées sur l'infrastructure Google Firebase, protégée par des règles de sécurité Firestore
              (accès strictement limité à l'utilisateur authentifié) et des clés d'API non versionnées.
              Les communications entre l'Application et les serveurs sont chiffrées via HTTPS/TLS.
            </p>
          </section>

          {/* 8. Mineurs */}
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Mineurs</h2>
            <p>
              L'Application est destinée aux personnes âgées de 13 ans et plus.
              Nous ne collectons pas sciemment de données personnelles d'enfants de moins de 13 ans.
              Si vous êtes parent et pensez que votre enfant a créé un compte, contactez-nous pour le supprimer.
            </p>
          </section>

          {/* 9. Modifications */}
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Modifications de cette politique</h2>
            <p>
              Nous pouvons mettre à jour cette politique. En cas de modification significative, une notification sera affichée
              dans l'Application. La date « Dernière mise à jour » en haut de cette page indique la version en vigueur.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p>
              Pour toute question relative à vos données personnelles :
            </p>
            <p className="mt-2">
              <strong>{COMPANY}</strong><br />
              E-mail :{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 {COMPANY} · {APP_NAME}</p>
          <p className="mt-1">
            <Link href="/" className="text-primary hover:underline">Retour à l'accueil</Link>
            {" · "}
            <Link href="/policy" className="hover:underline">Politique de confidentialité</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
