import { Button } from "@/components/ui/button";
import { Download, Smartphone, Globe, Play } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

/**
 * Design Philosophy: Tropical Vibrant & Ludique
 * - Énergie débordante avec couleurs vives et saturées
 * - Formes organiques et arrondies, asymétrie intentionnelle
 * - Animations ludiques rappelant les dominos qui tombent
 * - Narration culturelle de la Martinique
 */

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
              🎲
            </div>
            <span className="font-display text-xl font-bold text-primary hidden sm:inline">
              Domino Martinique
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#jeu" className="text-sm font-medium hover:text-primary transition-colors">
              Le Jeu
            </a>
            <a href="#versions" className="text-sm font-medium hover:text-primary transition-colors">
              Versions
            </a>
            <a href="#guide" className="text-sm font-medium hover:text-primary transition-colors">
              Guide
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-20">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/assets/hero.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/50" />
        </div>

        {/* SVG Wavy Divider - Top */}
        <svg
          className="absolute top-0 left-0 w-full h-24 text-background"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ transform: "scaleY(-1)" }}
        >
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>

        <div className="container relative z-10 max-w-4xl mx-auto px-4">
          <div className="space-y-8 text-center animate-fade-in">
            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="font-display text-5xl md:text-7xl font-bold text-primary leading-tight">
                DOMINO MARTINIQUAIS
              </h1>
              <p className="text-xl md:text-2xl text-foreground/80 font-light italic">
                Le Premier Jeu de Domino Traditionnel de la Martinique
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                disabled
              >
                <Download className="w-5 h-5 mr-2" />
                Télécharger APK (bientôt)
              </Button>
              <a href="/mobile">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-secondary text-secondary hover:bg-secondary/10 rounded-full px-8 py-6 text-lg font-semibold"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Jouer en Ligne
                </Button>
              </a>
            </div>

            {/* Badge */}
            <div className="flex justify-center pt-4">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-primary">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Version Bêta disponible
              </div>
            </div>
          </div>
        </div>

        {/* SVG Wavy Divider - Bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full h-24 text-background"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      </section>

      {/* Features Section */}
      <section id="versions" className="py-20 bg-background relative">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-4">
              Choisissez Votre Plateforme
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Jouez au domino traditionnel martiniquais où vous voulez, quand vous voulez
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Android Card */}
            <div
              className="group relative"
              onMouseEnter={() => setHoveredCard("android")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <div className="relative bg-white rounded-3xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Android (APK)
                </h3>
                <p className="text-foreground/70 mb-6">
                  Accédez au dossier sécurisé pour télécharger la dernière version de l'application
                </p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-3 font-semibold" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Bientôt disponible
                </Button>
              </div>
            </div>

            {/* Web/iOS Card */}
            <div
              className="group relative"
              onMouseEnter={() => setHoveredCard("web")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary via-accent to-primary rounded-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <div className="relative bg-white rounded-3xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/10 mb-6">
                  <Globe className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Jouer en Ligne
                </h3>
                <p className="text-foreground/70 mb-6">
                  Version iOS et Navigateur (Bêta) - Jouez directement sans installation
                </p>
                <a href="/mobile">
                  <Button className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-xl py-3 font-semibold">
                    <Play className="w-4 h-4 mr-2" />
                    Jouer Maintenant
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Guide Section */}
      <section id="guide" className="py-20 bg-gradient-to-b from-accent/5 to-background relative">
        {/* SVG Wavy Divider - Top */}
        <svg
          className="absolute top-0 left-0 w-full h-24 text-background"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ transform: "scaleY(-1)" }}
        >
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>

        <div className="container max-w-4xl relative z-10 pt-12">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary mb-4">
              Guide d'Installation Android
            </h2>
            <p className="text-lg text-foreground/70">
              Suivez ces étapes simples pour installer l'application
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Télécharger le fichier APK",
                description:
                  "Cliquez sur le bouton de téléchargement pour obtenir le fichier APK sécurisé",
              },
              {
                step: 2,
                title: "Autoriser l'installation",
                description:
                  "Ouvrez le fichier téléchargé et autorisez l'installation depuis cette source si Android vous le demande",
              },
              {
                step: 3,
                title: "Installer et Jouer",
                description:
                  "Installez l'application et profitez du jeu de domino traditionnel martiniquais",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-foreground/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="jeu" className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl opacity-20 blur-2xl" />
              <img
                src="/assets/domino-action.webp"
                alt="Jeu de Domino Martinique"
                className="relative rounded-3xl shadow-xl"
              />
            </div>

            {/* Content */}
            <div className="space-y-6">
              <h2 className="font-display text-4xl font-bold text-primary">
                Un Jeu Traditionnel Martiniquais
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Le domino est bien plus qu'un simple jeu en Martinique. C'est une tradition sociale,
                un moment de partage et de convivialité qui rassemble les familles et les amis autour
                d'une table.
              </p>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Notre application capture l'essence authentique du jeu traditionnel tout en le rendant
                accessible à tous, partout et à tout moment. Jouez en ligne avec vos amis ou en solo
                contre l'intelligence artificielle.
              </p>
              <div className="flex gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">Règles authentiques</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="font-medium text-foreground">Mode multijoueur</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="font-medium text-foreground">IA intelligente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">Statistiques</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 border-t border-border">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Domino Martinique</h3>
              <p className="text-background/80 text-sm">
                Le premier jeu de domino traditionnel de la Martinique, disponible sur mobile et web.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Liens Rapides</h3>
              <ul className="space-y-2 text-sm text-background/80">
                <li>
                  <a href="#versions" className="hover:text-background transition-colors">
                    Télécharger
                  </a>
                </li>
                <li>
                  <a href="#guide" className="hover:text-background transition-colors">
                    Guide d'installation
                  </a>
                </li>
                <li>
                  <a href="#jeu" className="hover:text-background transition-colors">
                    À propos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <p className="text-background/80 text-sm">
                Pour toute question ou suggestion, n'hésitez pas à nous contacter.
              </p>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center text-sm text-background/70">
            <p>&copy; 2026 Domino Martinique. Tous droits réservés.</p>
            <p className="mt-2">
              <Link href="/policy" className="underline hover:text-background transition-colors">
                Politique de confidentialité & Suppression des données
              </Link>
            </p>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
