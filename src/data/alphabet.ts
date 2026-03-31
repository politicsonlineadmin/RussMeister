// ─── Cyrillic Alphabet Data ─────────────────────────────────

export type LetterGroup = 'friends' | 'false_friends' | 'new_basic' | 'new_advanced' | 'special';

export interface CyrillicLetter {
  upper: string;
  lower: string;
  name: string;
  sound: string;
  ipa: string;
  group: LetterGroup;
  latinLookalike?: string;
  exampleWord: string;
  exampleTranslation: string;
  exampleHighlight: number;
}

export const GROUP_INFO: Record<LetterGroup, { title: string; subtitle: string; description: string }> = {
  friends: {
    title: 'Friends',
    subtitle: 'Look AND sound similar to English',
    description: 'These letters will feel familiar! They look like Latin letters and make similar sounds.',
  },
  false_friends: {
    title: 'False Friends',
    subtitle: 'Look similar but sound DIFFERENT',
    description: 'Be careful with these! They look like Latin letters but make completely different sounds.',
  },
  new_basic: {
    title: 'New Friends',
    subtitle: 'New letters, new sounds',
    description: 'These are brand new shapes. Take your time learning each one.',
  },
  new_advanced: {
    title: 'More New Letters',
    subtitle: 'Expanding your alphabet',
    description: 'More unique Cyrillic letters to add to your collection.',
  },
  special: {
    title: 'Special Characters',
    subtitle: 'Signs and unique vowels',
    description: 'These include the hard/soft signs and some distinctive Russian vowels.',
  },
};

export const GROUP_ORDER: LetterGroup[] = ['friends', 'false_friends', 'new_basic', 'new_advanced', 'special'];

export const CYRILLIC_ALPHABET: CyrillicLetter[] = [
  // ─── Group 1: Friends ───────────────────────────────────────
  {
    upper: 'А', lower: 'а', name: 'а', sound: 'A (as in "father")',
    ipa: '/a/', group: 'friends', latinLookalike: 'A',
    exampleWord: 'Анна', exampleTranslation: 'Anna (name)', exampleHighlight: 0,
  },
  {
    upper: 'Е', lower: 'е', name: 'е', sound: 'YE (as in "yes")',
    ipa: '/je/', group: 'friends', latinLookalike: 'E',
    exampleWord: 'еда', exampleTranslation: 'food', exampleHighlight: 0,
  },
  {
    upper: 'К', lower: 'к', name: 'ка', sound: 'K (as in "kite")',
    ipa: '/k/', group: 'friends', latinLookalike: 'K',
    exampleWord: 'кот', exampleTranslation: 'cat', exampleHighlight: 0,
  },
  {
    upper: 'М', lower: 'м', name: 'эм', sound: 'M (as in "mom")',
    ipa: '/m/', group: 'friends', latinLookalike: 'M',
    exampleWord: 'мама', exampleTranslation: 'mom', exampleHighlight: 0,
  },
  {
    upper: 'О', lower: 'о', name: 'о', sound: 'O (as in "more")',
    ipa: '/o/', group: 'friends', latinLookalike: 'O',
    exampleWord: 'окно', exampleTranslation: 'window', exampleHighlight: 0,
  },
  {
    upper: 'Т', lower: 'т', name: 'тэ', sound: 'T (as in "top")',
    ipa: '/t/', group: 'friends', latinLookalike: 'T',
    exampleWord: 'торт', exampleTranslation: 'cake', exampleHighlight: 0,
  },

  // ─── Group 2: False Friends ─────────────────────────────────
  {
    upper: 'В', lower: 'в', name: 'вэ', sound: 'V (not B!)',
    ipa: '/v/', group: 'false_friends', latinLookalike: 'B',
    exampleWord: 'вода', exampleTranslation: 'water', exampleHighlight: 0,
  },
  {
    upper: 'Н', lower: 'н', name: 'эн', sound: 'N (not H!)',
    ipa: '/n/', group: 'false_friends', latinLookalike: 'H',
    exampleWord: 'нос', exampleTranslation: 'nose', exampleHighlight: 0,
  },
  {
    upper: 'Р', lower: 'р', name: 'эр', sound: 'R (not P!)',
    ipa: '/r/', group: 'false_friends', latinLookalike: 'P',
    exampleWord: 'рука', exampleTranslation: 'hand', exampleHighlight: 0,
  },
  {
    upper: 'С', lower: 'с', name: 'эс', sound: 'S (not C!)',
    ipa: '/s/', group: 'false_friends', latinLookalike: 'C',
    exampleWord: 'суп', exampleTranslation: 'soup', exampleHighlight: 0,
  },
  {
    upper: 'У', lower: 'у', name: 'у', sound: 'OO (not Y!)',
    ipa: '/u/', group: 'false_friends', latinLookalike: 'Y',
    exampleWord: 'утро', exampleTranslation: 'morning', exampleHighlight: 0,
  },
  {
    upper: 'Х', lower: 'х', name: 'ха', sound: 'KH (not X!)',
    ipa: '/x/', group: 'false_friends', latinLookalike: 'X',
    exampleWord: 'хлеб', exampleTranslation: 'bread', exampleHighlight: 0,
  },

  // ─── Group 3: New Basic ─────────────────────────────────────
  {
    upper: 'Б', lower: 'б', name: 'бэ', sound: 'B (as in "bad")',
    ipa: '/b/', group: 'new_basic',
    exampleWord: 'банк', exampleTranslation: 'bank', exampleHighlight: 0,
  },
  {
    upper: 'Г', lower: 'г', name: 'гэ', sound: 'G (as in "go")',
    ipa: '/ɡ/', group: 'new_basic',
    exampleWord: 'год', exampleTranslation: 'year', exampleHighlight: 0,
  },
  {
    upper: 'Д', lower: 'д', name: 'дэ', sound: 'D (as in "dog")',
    ipa: '/d/', group: 'new_basic',
    exampleWord: 'дом', exampleTranslation: 'house', exampleHighlight: 0,
  },
  {
    upper: 'Ж', lower: 'ж', name: 'жэ', sound: 'ZH (as in "pleasure")',
    ipa: '/ʐ/', group: 'new_basic',
    exampleWord: 'жук', exampleTranslation: 'beetle', exampleHighlight: 0,
  },
  {
    upper: 'З', lower: 'з', name: 'зэ', sound: 'Z (as in "zoo")',
    ipa: '/z/', group: 'new_basic',
    exampleWord: 'зуб', exampleTranslation: 'tooth', exampleHighlight: 0,
  },
  {
    upper: 'И', lower: 'и', name: 'и', sound: 'EE (as in "see")',
    ipa: '/i/', group: 'new_basic',
    exampleWord: 'имя', exampleTranslation: 'name', exampleHighlight: 0,
  },
  {
    upper: 'Й', lower: 'й', name: 'и краткое', sound: 'Y (short, as in "boy")',
    ipa: '/j/', group: 'new_basic',
    exampleWord: 'йогурт', exampleTranslation: 'yogurt', exampleHighlight: 0,
  },

  // ─── Group 4: New Advanced ──────────────────────────────────
  {
    upper: 'Л', lower: 'л', name: 'эл', sound: 'L (as in "lamp")',
    ipa: '/l/', group: 'new_advanced',
    exampleWord: 'лук', exampleTranslation: 'onion', exampleHighlight: 0,
  },
  {
    upper: 'П', lower: 'п', name: 'пэ', sound: 'P (as in "pot")',
    ipa: '/p/', group: 'new_advanced',
    exampleWord: 'папа', exampleTranslation: 'dad', exampleHighlight: 0,
  },
  {
    upper: 'Ф', lower: 'ф', name: 'эф', sound: 'F (as in "fun")',
    ipa: '/f/', group: 'new_advanced',
    exampleWord: 'факт', exampleTranslation: 'fact', exampleHighlight: 0,
  },
  {
    upper: 'Ц', lower: 'ц', name: 'цэ', sound: 'TS (as in "bits")',
    ipa: '/ts/', group: 'new_advanced',
    exampleWord: 'цирк', exampleTranslation: 'circus', exampleHighlight: 0,
  },
  {
    upper: 'Ч', lower: 'ч', name: 'че', sound: 'CH (as in "chip")',
    ipa: '/tɕ/', group: 'new_advanced',
    exampleWord: 'час', exampleTranslation: 'hour', exampleHighlight: 0,
  },
  {
    upper: 'Ш', lower: 'ш', name: 'ша', sound: 'SH (as in "ship")',
    ipa: '/ʂ/', group: 'new_advanced',
    exampleWord: 'шум', exampleTranslation: 'noise', exampleHighlight: 0,
  },
  {
    upper: 'Щ', lower: 'щ', name: 'ща', sound: 'SHCH (as in "fresh cheese")',
    ipa: '/ɕː/', group: 'new_advanced',
    exampleWord: 'щука', exampleTranslation: 'pike (fish)', exampleHighlight: 0,
  },

  // ─── Group 5: Special ───────────────────────────────────────
  {
    upper: 'Ъ', lower: 'ъ', name: 'твёрдый знак', sound: 'Hard sign (no sound, separates)',
    ipa: '', group: 'special',
    exampleWord: 'объект', exampleTranslation: 'object', exampleHighlight: 2,
  },
  {
    upper: 'Ы', lower: 'ы', name: 'ы', sound: 'Y (between "i" and "u")',
    ipa: '/ɨ/', group: 'special',
    exampleWord: 'сыр', exampleTranslation: 'cheese', exampleHighlight: 1,
  },
  {
    upper: 'Ь', lower: 'ь', name: 'мягкий знак', sound: 'Soft sign (softens previous consonant)',
    ipa: 'ʲ', group: 'special',
    exampleWord: 'мать', exampleTranslation: 'mother', exampleHighlight: 3,
  },
  {
    upper: 'Э', lower: 'э', name: 'э', sound: 'E (as in "bed")',
    ipa: '/ɛ/', group: 'special',
    exampleWord: 'это', exampleTranslation: 'this', exampleHighlight: 0,
  },
  {
    upper: 'Ю', lower: 'ю', name: 'ю', sound: 'YU (as in "you")',
    ipa: '/ju/', group: 'special',
    exampleWord: 'юг', exampleTranslation: 'south', exampleHighlight: 0,
  },
  {
    upper: 'Я', lower: 'я', name: 'я', sound: 'YA (as in "yard")',
    ipa: '/ja/', group: 'special',
    exampleWord: 'яблоко', exampleTranslation: 'apple', exampleHighlight: 0,
  },
];

// ─── Syllables and words for reading practice ─────────────────

export const READING_SYLLABLES = [
  { text: 'ма', sound: 'ma' },
  { text: 'па', sound: 'pa' },
  { text: 'ба', sound: 'ba' },
  { text: 'та', sound: 'ta' },
  { text: 'ка', sound: 'ka' },
  { text: 'да', sound: 'da' },
  { text: 'на', sound: 'na' },
  { text: 'ла', sound: 'la' },
  { text: 'ра', sound: 'ra' },
  { text: 'са', sound: 'sa' },
  { text: 'мо', sound: 'mo' },
  { text: 'но', sound: 'no' },
  { text: 'ко', sound: 'ko' },
  { text: 'то', sound: 'to' },
  { text: 'ду', sound: 'du' },
];

export const READING_WORDS = [
  { word: 'мама', translation: 'mom' },
  { word: 'папа', translation: 'dad' },
  { word: 'банк', translation: 'bank' },
  { word: 'кот', translation: 'cat' },
  { word: 'дом', translation: 'house' },
  { word: 'нос', translation: 'nose' },
  { word: 'суп', translation: 'soup' },
  { word: 'рука', translation: 'hand' },
  { word: 'вода', translation: 'water' },
  { word: 'окно', translation: 'window' },
];

// ─── Quiz helpers ─────────────────────────────────────────────

export function getLettersByGroup(group: LetterGroup): CyrillicLetter[] {
  return CYRILLIC_ALPHABET.filter((l) => l.group === group);
}

/** Generate 4 options for a letter quiz, including the correct answer */
export function generateQuizOptions(
  correctLetter: CyrillicLetter,
  allLetters: CyrillicLetter[]
): string[] {
  const correctSound = correctLetter.sound;
  const others = allLetters
    .filter((l) => l.sound !== correctSound)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((l) => l.sound);

  const options = [correctSound, ...others].sort(() => Math.random() - 0.5);
  return options;
}
