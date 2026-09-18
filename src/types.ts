export type CharacterId = 'yoshi' | 'mario' | 'peach' | 'daisy' | 'donkey_kong' | 'luigi';

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  themeColor: string; // Tailwind color class or hex
  accentColor: string;
  bgColor: string;
  borderColor: string;
  avatarIcon: string;
  imageUrl?: string;
  imagePromptDescription: string;
  catchphrase: string;
  superstarTitle: string;
}

export interface Team {
  id: string;
  characterId: CharacterId;
  name: string;
  coins: number;
  stars: number;
  streak: number;
  blocksOpened: number;
  coinsStolen: number;
  hasDoubleTurn: boolean; // Mushroom / Superstar power-up
  skipTurns?: number; // Blue Shell freeze rounds
  customImageUrl?: string;
}

export type QuestionType = 'multiple_choice' | 'open_trivia' | 'unscramble' | 'mystery_card';

export interface BaseQuestion {
  id: number;
  blockNumber: number;
  type: QuestionType;
  title: string;
  category: 'holiday_trivia' | 'vocabulary' | 'spelling' | 'mystery' | 'carol';
  image?: string;
  imageUrl?: string;
  imageAlt?: string;
  rewardCoins: number;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface OpenTriviaQuestion extends BaseQuestion {
  type: 'open_trivia';
  answer: string;
  hint?: string;
}

export interface UnscrambleQuestion extends BaseQuestion {
  type: 'unscramble';
  scrambledLetters: string[];
  targetWord: string;
  hint?: string;
}

export interface MysteryCardQuestion extends BaseQuestion {
  type: 'mystery_card';
  description: string;
}

export type GameQuestion = 
  | MultipleChoiceQuestion 
  | OpenTriviaQuestion 
  | UnscrambleQuestion 
  | MysteryCardQuestion;

export type Question = GameQuestion;

export type RewardCardType = 
  | 'great_coins_3'
  | 'hidden_block'
  | 'ghost_steal_5'
  | 'wonderful_coins_5'
  | 'super_star_x2'
  | 'super_coins_10'
  | 'blue_shell'
  | 'bowser_revolution'
  | 'coins_1'
  | 'coins_3'
  | 'coins_5'
  | 'coins_10'
  | 'mushroom_x2'
  | 'boo_steal_5'
  | 'boo_steal_10';

export interface RewardCard {
  id: string;
  type: RewardCardType;
  title: string;
  subtitle: string;
  coins: number;
  description: string;
  iconName: string;
  badgeColor: string;
}

export type GameTheme = 'christmas' | 'summer';

export interface BlockState {
  id: number;
  isOpened: boolean;
  openedByTeamId?: string;
  isIncorrectCleared?: boolean; // Cleared with X when missed
  rewardCoins?: number;
  question: GameQuestion;
}

export type GameView = 
  | 'setup'
  | 'board'
  | 'superstar';
