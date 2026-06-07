import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

interface OpponentHandBarProps {
    /** Nombre de dominos restants dans la main (0–7) */
    handSize: number;
    /** Position de l'adversaire — détermine l'alignement de la barre */
    position: 'top-left' | 'top-right';
    /** Largeur de l'écran en px, pour le calcul adaptatif des tuiles */
    screenWidth: number;
}

/**
 * Affiche la main d'un adversaire sous forme de rectangles blancs face cachée.
 * Placé à droite du bloc stats pour top-left, à gauche pour top-right.
 * La taille des tuiles s'adapte à la largeur d'écran.
 */
export const OpponentHandBar: React.FC<OpponentHandBarProps> = ({
    handSize,
    position,
    screenWidth,
}) => {
    const tileSize = useMemo(() => {
        if (screenWidth >= 400) {
            return { w: 9, h: 16, gap: 3 };
        } else if (screenWidth >= 360) {
            return { w: 8, h: 14, gap: 3 };
        } else {
            return { w: 6, h: 11, gap: 2 };
        }
    }, [screenWidth]);

    // Barre vide si handSize = 0
    if (handSize <= 0) return null;

    const tiles = Array.from({ length: handSize });

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            layout={Layout.springify().damping(14).stiffness(120)}
            style={[
                styles.container,
                position === 'top-right' ? styles.alignRight : styles.alignLeft,
            ]}
        >
            {tiles.map((_, i) => (
                <Animated.View
                    key={i}
                    exiting={FadeOut.duration(200)}
                    style={[
                        styles.tile,
                        {
                            width: tileSize.w,
                            height: tileSize.h,
                            marginHorizontal: tileSize.gap / 2,
                        },
                    ]}
                />
            ))}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        // Centré verticalement dans le bloc adjacent (opponentInfoBlock ~40px de haut)
        alignSelf: 'center',
        paddingHorizontal: 3,
    },
    alignLeft: {
        // Pour top-left : la barre pousse vers la droite (côté centre de l'écran)
        justifyContent: 'flex-start',
    },
    alignRight: {
        // Pour top-right : la barre pousse vers la gauche (côté centre de l'écran)
        justifyContent: 'flex-end',
    },
    tile: {
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.25)',
        // Légère ombre pour donner du relief
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
});
