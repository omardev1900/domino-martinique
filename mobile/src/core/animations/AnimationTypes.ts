import { Domino } from '../types';

export interface Point {
    x: number;
    y: number;
}

export interface FlyingDominoData {
    domino: Domino;
    startPoint: Point;
    endPoint?: Point;
    orientation: 'vertical' | 'horizontal';
    isReversed: boolean;
}
