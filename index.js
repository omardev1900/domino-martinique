import { createRoot } from 'react-dom/client';
import React from 'react';

const App = () => {
    return React.createElement('div', { className: 'flex flex-col items-center justify-center min-h-screen p-4 wood-texture' }, [
        React.createElement('h1', { className: 'text-5xl font-premium text-yellow-600 mb-8' }, 'Domino Martinique'),

        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl' }, [
            // Bouton APK
            React.createElement('a', {
                href: '/domino-v1.apk',
                className: 'bg-stone-800 p-10 rounded-3xl border-2 border-yellow-700 hover:scale-105 transition-transform text-center'
            }, [
                React.createElement('span', { className: 'text-4xl block mb-4' }, '🤖'),
                React.createElement('h2', { className: 'text-2xl font-bold' }, 'Télécharger l\'APK'),
                React.createElement('p', { className: 'text-stone-400 mt-2' }, 'Pour jouer sur Android (Recommandé)')
            ]),

            // Bouton Jouer en ligne
            React.createElement('a', {
                href: '/mobile',
                className: 'bg-stone-800 p-10 rounded-3xl border-2 border-blue-700 hover:scale-105 transition-transform text-center'
            }, [
                React.createElement('span', { className: 'text-4xl block mb-4' }, '🌐'),
                React.createElement('h2', { className: 'text-2xl font-bold' }, 'Jouer en ligne'),
                React.createElement('p', { className: 'text-stone-400 mt-2' }, 'Version Web (Beta)')
            ])
        ])
    ]);
};

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));