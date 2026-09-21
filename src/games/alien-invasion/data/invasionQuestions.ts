export type InvasionQuestionType = 'multiple_choice' | 'open' | 'unscramble';

export interface InvasionQuestion {
  stateId: string;
  type: InvasionQuestionType;
  prompt: string;
  answer: string;
  options?: string[];
}

export const INVASION_QUESTIONS: InvasionQuestion[] = [
  { stateId: 'AK', type: 'multiple_choice', prompt: 'It is very cold. I wear a ____.', options: ['coat', 'swimsuit', 'sandal', 'T-shirt'], answer: 'coat' },
  { stateId: 'AL', type: 'open', prompt: 'Make a sentence with can.', answer: 'I can swim. / She can sing.' },
  { stateId: 'AR', type: 'unscramble', prompt: 'Unscramble this space word.', answer: 'ROCKET' },
  { stateId: 'AZ', type: 'multiple_choice', prompt: 'The sun is ____ today.', options: ['hot', 'snowy', 'frozen', 'icy'], answer: 'hot' },
  { stateId: 'CA', type: 'open', prompt: 'Say a sentence: I like ____.', answer: 'I like pizza. / I like soccer.' },
  { stateId: 'CO', type: 'unscramble', prompt: 'Unscramble this space word.', answer: 'MOUNTAIN' },
  { stateId: 'CT', type: 'multiple_choice', prompt: 'She ____ English every day.', options: ['studies', 'study', 'studying', 'studied'], answer: 'studies' },
  { stateId: 'DE', type: 'open', prompt: 'What is the opposite of big?', answer: 'small / little' },
  { stateId: 'FL', type: 'unscramble', prompt: 'Unscramble this beach word.', answer: 'OCEAN' },
  { stateId: 'GA', type: 'multiple_choice', prompt: 'I ____ a sandwich for lunch.', options: ['eat', 'eats', 'eating', 'ateing'], answer: 'eat' },
  { stateId: 'HI', type: 'open', prompt: 'Make a sentence with want to.', answer: 'I want to swim. / I want to go.' },
  { stateId: 'IA', type: 'unscramble', prompt: 'Unscramble this farm word.', answer: 'CORN' },
  { stateId: 'ID', type: 'multiple_choice', prompt: 'Choose the potato sentence.', options: ['I like potatoes.', 'I likes potato.', 'I liking potato.', 'Potato I like.'], answer: 'I like potatoes.' },
  { stateId: 'IL', type: 'open', prompt: 'What is the opposite of cold?', answer: 'hot / warm' },
  { stateId: 'IN', type: 'unscramble', prompt: 'Unscramble this space word.', answer: 'ALIEN' },
  { stateId: 'KS', type: 'multiple_choice', prompt: 'There ____ a spaceship in the sky.', options: ['is', 'are', 'am', 'be'], answer: 'is' },
  { stateId: 'KY', type: 'open', prompt: 'Make a question with do you like.', answer: 'Do you like apples?' },
  { stateId: 'LA', type: 'unscramble', prompt: 'Unscramble this music word.', answer: 'JAZZ' },
  { stateId: 'MA', type: 'multiple_choice', prompt: 'We ____ to the park yesterday.', options: ['went', 'go', 'goes', 'going'], answer: 'went' },
  { stateId: 'MD', type: 'open', prompt: 'Say a sentence with because.', answer: 'I am happy because it is Friday.' },
  { stateId: 'ME', type: 'unscramble', prompt: 'Unscramble this tree word.', answer: 'PINE' },
  { stateId: 'MI', type: 'multiple_choice', prompt: 'How ____ lakes are there?', options: ['many', 'much', 'long', 'old'], answer: 'many' },
  { stateId: 'MN', type: 'open', prompt: 'What is the opposite of fast?', answer: 'slow' },
  { stateId: 'MO', type: 'unscramble', prompt: 'Unscramble this space word.', answer: 'PLANET' },
  { stateId: 'MS', type: 'multiple_choice', prompt: 'He is ____ than me.', options: ['taller', 'tall', 'tallest', 'more tall'], answer: 'taller' },
  { stateId: 'MT', type: 'open', prompt: 'Make a sentence with there is.', answer: 'There is a mountain. / There is a cow.' },
  { stateId: 'NC', type: 'unscramble', prompt: 'Unscramble this sky word.', answer: 'CLOUD' },
  { stateId: 'ND', type: 'multiple_choice', prompt: 'It is windy. The flag is ____.', options: ['flying', 'swim', 'eat', 'sleep'], answer: 'flying' },
  { stateId: 'NE', type: 'open', prompt: 'What is the opposite of day?', answer: 'night' },
  { stateId: 'NH', type: 'unscramble', prompt: 'Unscramble this hill word.', answer: 'STONE' },
  { stateId: 'NJ', type: 'multiple_choice', prompt: 'Please ____ the door.', options: ['close', 'closes', 'closing', 'closed'], answer: 'close' },
  { stateId: 'NM', type: 'open', prompt: 'Make a sentence with I saw.', answer: 'I saw a bird. / I saw a UFO.' },
  { stateId: 'NV', type: 'unscramble', prompt: 'Unscramble this night word.', answer: 'LIGHT' },
  { stateId: 'NY', type: 'multiple_choice', prompt: 'New York is a big ____.', options: ['city', 'farm', 'ocean', 'desert'], answer: 'city' },
  { stateId: 'OH', type: 'open', prompt: 'Say a sentence with let’s.', answer: 'Let’s play. / Let’s go.' },
  { stateId: 'OK', type: 'unscramble', prompt: 'Unscramble this weather word.', answer: 'STORM' },
  { stateId: 'OR', type: 'multiple_choice', prompt: 'Look! It is ____ now.', options: ['raining', 'rain', 'rains', 'rained'], answer: 'raining' },
  { stateId: 'PA', type: 'open', prompt: 'What is the opposite of old?', answer: 'new / young' },
  { stateId: 'RI', type: 'unscramble', prompt: 'Unscramble this tiny word.', answer: 'SMALL' },
  { stateId: 'SC', type: 'multiple_choice', prompt: 'My birthday is ____ July.', options: ['in', 'on', 'at', 'to'], answer: 'in' },
  { stateId: 'SD', type: 'open', prompt: 'Make a sentence with I have.', answer: 'I have a dog. / I have two stars.' },
  { stateId: 'TN', type: 'unscramble', prompt: 'Unscramble this music word.', answer: 'SONG' },
  { stateId: 'TX', type: 'multiple_choice', prompt: 'Texas is very ____.', options: ['big', 'bigger', 'biggest', 'the big'], answer: 'big' },
  { stateId: 'UT', type: 'open', prompt: 'Make a question with where.', answer: 'Where is the spaceship? / Where do you live?' },
  { stateId: 'VA', type: 'unscramble', prompt: 'Unscramble this space word.', answer: 'EARTH' },
  { stateId: 'VT', type: 'multiple_choice', prompt: 'The leaves are ____ in fall.', options: ['red', 'swim', 'loud', 'fast'], answer: 'red' },
  { stateId: 'WA', type: 'open', prompt: 'Say a sentence with it is.', answer: 'It is rainy. / It is cold.' },
  { stateId: 'WI', type: 'unscramble', prompt: 'Unscramble this drink word.', answer: 'MILK' },
  { stateId: 'WV', type: 'multiple_choice', prompt: 'We ____ hiking last weekend.', options: ['went', 'go', 'goes', 'going'], answer: 'went' },
  { stateId: 'WY', type: 'open', prompt: 'Make a sentence with I want.', answer: 'I want a star. / I want to win.' },
];

const FALLBACK: InvasionQuestion = {
  stateId: '??',
  type: 'open',
  prompt: 'Make a sentence in English.',
  answer: 'Any correct sentence.',
};

export function questionForState(stateId: string): InvasionQuestion {
  return INVASION_QUESTIONS.find(q => q.stateId === stateId) ?? { ...FALLBACK, stateId };
}

export function scrambleWord(word: string): string[] {
  const letters = word.toUpperCase().split('');
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = (i * 7 + word.length) % (i + 1);
    const tmp = letters[i];
    letters[i] = letters[j];
    letters[j] = tmp;
  }
  if (letters.join('') === word.toUpperCase()) {
    letters.reverse();
  }
  return letters;
}
