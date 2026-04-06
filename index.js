import { createRoot } from 'react-dom/client';
import React from 'react';

const App = () => {
    return React.createElement('div', { className: 'min-h-screen bg-immersive flex flex-col items-center py-12 px-6' }, [
        // Header
        React.createElement('header', { className: 'text-center mb-16' }, [
            React.createElement('img', { 
                src: '/logo.png', 
                className: 'h-32 mb-6 mx-auto drop-shadow-2xl',
                alt: 'Logo Domino Martiniquais'
            }),
            React.createElement('h1', { className: 'text-4xl md:text-6xl font-extrabold gold-text uppercase tracking-widest' }, 'Domino Martiniquais'),
            React.createElement('p', { className: 'text-lg md:text-xl text-stone-400 mt-4 font-light italic' }, 'Le Premier Jeu de Domino Traditionnel de la Martinique')
        ]),

        // Main CTAs
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mb-24' }, [
            // CTA Android (APK)
            React.createElement('a', {
                href: '/domino-v1.apk',
                className: 'glass-gold p-12 rounded-[40px] transition-all duration-500 hover:-translate-y-2 group text-center flex flex-col items-center'
            }, [
                React.createElement('div', { className: 'w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-900/20 group-hover:scale-110 transition-transform' }, [
                    React.createElement('span', { className: 'text-4xl' }, '🤖')
                ]),
                React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'Android (APK)'),
                React.createElement('p', { className: 'text-stone-400 font-light' }, 'Téléchargement direct pour une expérience optimale')
            ]),

            // CTA Web / iOS
            React.createElement('a', {
                href: '/mobile',
                className: 'glass-gold p-12 rounded-[40px] transition-all duration-500 hover:-translate-y-2 group text-center flex flex-col items-center'
            }, [
                React.createElement('div', { className: 'w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform' }, [
                    React.createElement('span', { className: 'text-4xl' }, '🌐')
                ]),
                React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'Jouer en Ligne'),
                React.createElement('p', { className: 'text-stone-400 font-light' }, 'Version iOS / Navigateur (Bêta)')
            ])
        ]),

        // Guide d'installation
        React.createElement('section', { className: 'max-w-3xl w-full glass-gold rounded-3xl p-10 mb-12 border-white/5' }, [
            React.createElement('h3', { className: 'text-xl font-bold mb-6 flex items-center gap-2' }, [
                React.createElement('span', null, '📋'),
                'Guide d\'installation Android'
            ]),
            React.createElement('div', { className: 'space-y-4 text-stone-300' }, [
                React.createElement('div', { className: 'flex gap-4' }, [
                    React.createElement('span', { className: 'flex-shrink-0 w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center text-sm gold-text' }, '1'),
                    React.createElement('p', null, 'Cliquez sur le bouton pour télécharger le fichier APK.')
                ]),
                React.createElement('div', { className: 'flex gap-4' }, [
                    React.createElement('span', { className: 'flex-shrink-0 w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center text-sm gold-text' }, '2'),
                    React.createElement('p', null, 'Ouvrez le fichier téléchargé et autorisez "l\'installation depuis cette source" si Android vous le demande.')
                ]),
                React.createElement('div', { className: 'flex gap-4' }, [
                    React.createElement('span', { className: 'flex-shrink-0 w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center text-sm gold-text' }, '3'),
                    React.createElement('p', null, 'Installez l\'application et profitez du jeu !')
                ])
            ])
        ]),

        // Footer
        React.createElement('footer', { className: 'mt-auto py-8 text-stone-500 text-sm' }, [
            '© 2026 Domino Martiniquais - Fait avec passion pour les Antilles 🌴'
        ])
    ]);
};

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));