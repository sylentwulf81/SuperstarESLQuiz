import { sounds } from '@/shared/utils/sound';

export type EngineSound =
  | 'coin'
  | 'starCoin'
  | 'powBlock'
  | 'powerUp'
  | 'boo'
  | 'blueShell'
  | 'bowser'
  | 'bowserFury'
  | 'superstar'
  | 'shuffle'
  | 'pop'
  | 'wrong'
  | 'blockHit'
  | 'specialCard'
  | 'correct'
  | 'blooper';

export type EngineEffect =
  | { kind: 'sound'; sound: EngineSound }
  | { kind: 'toast'; message: string }
  | { kind: 'scheduleSuperstar'; ms: number }
  | { kind: 'clearPulse'; ms: number; stateId: string };

export function playEngineSound(sound: EngineSound) {
  switch (sound) {
    case 'coin':
      sounds.playCoin();
      return;
    case 'starCoin':
      sounds.playStarCoin();
      return;
    case 'powBlock':
      sounds.playPowBlock();
      return;
    case 'powerUp':
      sounds.playPowerUp();
      return;
    case 'boo':
      sounds.playBoo();
      return;
    case 'blueShell':
      sounds.playBlueShell();
      return;
    case 'bowser':
      sounds.playBowser();
      return;
    case 'bowserFury':
      sounds.playBowserFury();
      return;
    case 'superstar':
      sounds.playSuperstar();
      return;
    case 'shuffle':
      sounds.playShuffle();
      return;
    case 'pop':
      sounds.playPop();
      return;
    case 'wrong':
      sounds.playWrong();
      return;
    case 'blockHit':
      sounds.playBlockHit();
      return;
    case 'specialCard':
      sounds.playSpecialCardFanfare();
      return;
    case 'correct':
      sounds.playCorrect();
      return;
    case 'blooper':
      sounds.playBlooper();
      return;
  }
}
