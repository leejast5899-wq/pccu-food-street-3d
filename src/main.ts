import './style.css';
import { GameController } from './game/GameController';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
new GameController(canvas);
