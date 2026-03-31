import type { CEFRLevel } from '@/types';

export interface GrammarTopicData {
  id: string;
  topic: string;
  level: CEFRLevel;
  description: string;
  explanation: string;
  examples: { russian: string; english: string; highlight: string }[];
}

export const GRAMMAR_CURRICULUM: Record<CEFRLevel, GrammarTopicData[]> = {
  A1: [
    {
      id: 'a1-present-tense',
      topic: 'Present Tense Conjugation',
      level: 'A1',
      description: 'Conjugating verbs in the present tense.',
      explanation:
        'Russian verbs in the present tense belong to one of two conjugation groups. First conjugation verbs (e.g. читать) take endings -ю, -ешь, -ет, -ем, -ете, -ют. Second conjugation verbs (e.g. говорить) take -ю, -ишь, -ит, -им, -ите, -ят. The infinitive ending often hints at the group: -ать/-ять are usually first, -ить is usually second.',
      examples: [
        {
          russian: 'Я читаю книгу каждый день.',
          english: 'I read a book every day.',
          highlight: 'читаю',
        },
        {
          russian: 'Ты говоришь по-русски очень хорошо.',
          english: 'You speak Russian very well.',
          highlight: 'говоришь',
        },
        {
          russian: 'Мы работаем в офисе.',
          english: 'We work in the office.',
          highlight: 'работаем',
        },
      ],
    },
    {
      id: 'a1-byt-est',
      topic: 'Быть and Есть',
      level: 'A1',
      description: 'The verb "to be" and its usage in Russian.',
      explanation:
        'In modern Russian, the verb быть (to be) is usually omitted in the present tense. Instead of "I am a student," Russians say "Я студент." The form есть is used to express existence or possession: "У меня есть..." (I have...). In the past and future, быть is used: был/была/было/были (past) and буду/будешь/будет (future).',
      examples: [
        {
          russian: 'Я студент.',
          english: 'I am a student.',
          highlight: 'Я студент',
        },
        {
          russian: 'У меня есть собака.',
          english: 'I have a dog.',
          highlight: 'есть',
        },
        {
          russian: 'Она была дома вчера.',
          english: 'She was at home yesterday.',
          highlight: 'была',
        },
      ],
    },
    {
      id: 'a1-nominative',
      topic: 'Nominative Case (Именительный падеж)',
      level: 'A1',
      description: 'The subject case — who or what performs the action.',
      explanation:
        'The nominative case is the dictionary form of nouns. It answers the questions кто? (who?) and что? (what?) and marks the subject of a sentence. Masculine nouns end in a consonant or -й/-ь, feminine in -а/-я/-ь, neuter in -о/-е. The nominative is used after это (this is): "Это мой друг."',
      examples: [
        {
          russian: 'Это мой брат.',
          english: 'This is my brother.',
          highlight: 'брат',
        },
        {
          russian: 'Книга лежит на столе.',
          english: 'The book is on the table.',
          highlight: 'Книга',
        },
        {
          russian: 'Дети играют во дворе.',
          english: 'The children play in the yard.',
          highlight: 'Дети',
        },
      ],
    },
    {
      id: 'a1-accusative',
      topic: 'Accusative Case (Винительный падеж)',
      level: 'A1',
      description: 'The direct object case.',
      explanation:
        'The accusative case marks the direct object — what is being acted upon. It answers кого? (whom?) and что? (what?). For inanimate masculine and all neuter nouns, the accusative equals the nominative. Feminine nouns change -а to -у and -я to -ю. Animate masculine nouns take the genitive form in the accusative.',
      examples: [
        {
          russian: 'Я читаю газету.',
          english: 'I am reading a newspaper.',
          highlight: 'газету',
        },
        {
          russian: 'Он видит брата.',
          english: 'He sees his brother.',
          highlight: 'брата',
        },
        {
          russian: 'Мы покупаем хлеб.',
          english: 'We are buying bread.',
          highlight: 'хлеб',
        },
      ],
    },
    {
      id: 'a1-gender',
      topic: 'Gender System (м/ж/ср)',
      level: 'A1',
      description: 'Masculine, feminine, and neuter nouns.',
      explanation:
        'Russian has three genders: masculine (мужской род), feminine (женский род), and neuter (средний род). Gender is usually predictable from the ending: consonant or -й → masculine (стол, музей), -а/-я → feminine (книга, земля), -о/-е → neuter (окно, море). Nouns ending in -ь can be either masculine (день) or feminine (ночь) and must be memorized.',
      examples: [
        {
          russian: 'Стол большой.',
          english: 'The table is big.',
          highlight: 'Стол',
        },
        {
          russian: 'Книга интересная.',
          english: 'The book is interesting.',
          highlight: 'Книга интересная',
        },
        {
          russian: 'Окно открыто.',
          english: 'The window is open.',
          highlight: 'Окно открыто',
        },
      ],
    },
    {
      id: 'a1-plural',
      topic: 'Plural Formation',
      level: 'A1',
      description: 'Forming plurals of Russian nouns.',
      explanation:
        'Russian plurals are formed by changing the ending: masculine nouns usually add -ы or -и (стол → столы, учитель → учителя). Feminine nouns change -а to -ы and -я to -и (книга → книги). Neuter nouns change -о to -а and -е to -я (окно → окна, море → моря). Some nouns have irregular plurals: ребёнок → дети, человек → люди.',
      examples: [
        {
          russian: 'Книги лежат на полке.',
          english: 'The books are on the shelf.',
          highlight: 'Книги',
        },
        {
          russian: 'У меня два брата.',
          english: 'I have two brothers.',
          highlight: 'брата',
        },
        {
          russian: 'Дома на этой улице старые.',
          english: 'The houses on this street are old.',
          highlight: 'Дома',
        },
      ],
    },
    {
      id: 'a1-word-order-questions',
      topic: 'Basic Word Order and Questions',
      level: 'A1',
      description: 'SVO order and forming questions.',
      explanation:
        'Russian word order is flexible but the default is Subject-Verb-Object. New or important information tends to come at the end of the sentence. Yes/no questions are formed simply by changing intonation — no word-order change is needed. Question words include кто (who), что (what), где (where), когда (when), почему (why), как (how).',
      examples: [
        {
          russian: 'Ты говоришь по-русски?',
          english: 'Do you speak Russian?',
          highlight: 'Ты говоришь',
        },
        {
          russian: 'Где ты живёшь?',
          english: 'Where do you live?',
          highlight: 'Где',
        },
        {
          russian: 'Когда начинается урок?',
          english: 'When does the lesson start?',
          highlight: 'Когда',
        },
      ],
    },
  ],

  A2: [
    {
      id: 'a2-past-tense',
      topic: 'Past Tense (Прошедшее время)',
      level: 'A2',
      description: 'Talking about the past using the past tense.',
      explanation:
        'The Russian past tense is formed from the infinitive stem plus -л (masculine), -ла (feminine), -ло (neuter), -ли (plural). It agrees with the subject in gender and number, not person: я/ты/он читал, я/ты/она читала, мы/вы/они читали. The auxiliary verb is not needed — just the -л form.',
      examples: [
        {
          russian: 'Я вчера читал книгу.',
          english: 'I read a book yesterday. (male speaker)',
          highlight: 'читал',
        },
        {
          russian: 'Она написала письмо.',
          english: 'She wrote a letter.',
          highlight: 'написала',
        },
        {
          russian: 'Дети играли в парке.',
          english: 'The children played in the park.',
          highlight: 'играли',
        },
      ],
    },
    {
      id: 'a2-modal-expressions',
      topic: 'Modal Expressions (мочь/должен/хотеть/нужно)',
      level: 'A2',
      description: 'Expressing ability, obligation, desire, and necessity.',
      explanation:
        'Мочь (can) conjugates as могу, можешь, может, etc. and takes an infinitive. Хотеть (to want) is irregular: хочу, хочешь, хочет, хотим, хотите, хотят. Должен/должна/должно/должны (must) is a short adjective agreeing with the subject. Нужно/надо (need to) is impersonal and used with the dative: "Мне нужно работать."',
      examples: [
        {
          russian: 'Я могу помочь тебе.',
          english: 'I can help you.',
          highlight: 'могу',
        },
        {
          russian: 'Мне нужно идти домой.',
          english: 'I need to go home.',
          highlight: 'нужно',
        },
        {
          russian: 'Он должен позвонить маме.',
          english: 'He must call his mom.',
          highlight: 'должен',
        },
      ],
    },
    {
      id: 'a2-dative',
      topic: 'Dative Case (Дательный падеж)',
      level: 'A2',
      description: 'The indirect object case — to whom / for whom.',
      explanation:
        'The dative case answers кому? (to whom?) and чему? (to what?). Masculine and neuter nouns take -у/-ю (друг → другу, учитель → учителю). Feminine nouns change -а to -е and -я to -е (сестра → сестре). The dative is used with verbs like давать (give), помогать (help), звонить (call), and with impersonal constructions: мне холодно (I am cold).',
      examples: [
        {
          russian: 'Я дал книгу другу.',
          english: 'I gave the book to a friend.',
          highlight: 'другу',
        },
        {
          russian: 'Мне нравится музыка.',
          english: 'I like music. (lit. Music is pleasing to me.)',
          highlight: 'Мне',
        },
        {
          russian: 'Она помогает сестре.',
          english: 'She helps her sister.',
          highlight: 'сестре',
        },
      ],
    },
    {
      id: 'a2-prepositional',
      topic: 'Prepositional Case (Предложный падеж)',
      level: 'A2',
      description: 'Used after в and на for location, and о for "about".',
      explanation:
        'The prepositional case is always used with a preposition — most commonly в (in), на (on/at), and о (about). Masculine and neuter nouns take -е (в доме, в окне). Feminine nouns change -а to -е (в школе). Some masculine nouns take the stressed -у after в/на: в лесу, на полу. This case answers the question где? (where?) for location.',
      examples: [
        {
          russian: 'Я живу в Москве.',
          english: 'I live in Moscow.',
          highlight: 'в Москве',
        },
        {
          russian: 'Книга на столе.',
          english: 'The book is on the table.',
          highlight: 'на столе',
        },
        {
          russian: 'Мы говорим о фильме.',
          english: 'We are talking about a film.',
          highlight: 'о фильме',
        },
      ],
    },
    {
      id: 'a2-comparative',
      topic: 'Comparative Adjectives',
      level: 'A2',
      description: 'Comparing things using adjectives.',
      explanation:
        'Russian has two comparative forms. The simple comparative adds -ее/-ей to the adjective stem: красивый → красивее, быстрый → быстрее. Some are irregular: хороший → лучше, плохой → хуже, большой → больше, маленький → меньше. The compound comparative uses более + adjective: более интересный. "Than" is expressed with чем or the genitive case.',
      examples: [
        {
          russian: 'Москва больше Петербурга.',
          english: 'Moscow is bigger than Petersburg.',
          highlight: 'больше',
        },
        {
          russian: 'Эта книга интереснее той.',
          english: 'This book is more interesting than that one.',
          highlight: 'интереснее',
        },
        {
          russian: 'Он бегает быстрее, чем я.',
          english: 'He runs faster than I do.',
          highlight: 'быстрее, чем',
        },
      ],
    },
  ],

  B1: [
    {
      id: 'b1-aspect',
      topic: 'Perfective vs Imperfective Aspect',
      level: 'B1',
      description: 'The fundamental distinction in Russian verbs.',
      explanation:
        'Every Russian verb has an aspect. Imperfective verbs describe ongoing, repeated, or habitual actions (читать — to read/be reading). Perfective verbs describe completed, one-time actions with a result (прочитать — to finish reading). Aspect pairs are often formed with prefixes: писать → написать, делать → сделать. Choosing the right aspect is essential for natural Russian.',
      examples: [
        {
          russian: 'Я читал эту книгу целый месяц.',
          english: 'I was reading this book for a whole month. (process)',
          highlight: 'читал',
        },
        {
          russian: 'Я прочитал эту книгу за неделю.',
          english: 'I finished reading this book in a week. (completed)',
          highlight: 'прочитал',
        },
        {
          russian: 'Каждый день она писала письма.',
          english: 'Every day she wrote letters. (habitual)',
          highlight: 'писала',
        },
      ],
    },
    {
      id: 'b1-genitive',
      topic: 'Genitive Case (Родительный падеж)',
      level: 'B1',
      description: 'Expressing possession, absence, quantity, and more.',
      explanation:
        'The genitive answers кого? (of whom?) and чего? (of what?). Masculine and neuter nouns take -а/-я (дом → дома, учитель → учителя). Feminine nouns change -а to -ы and -я to -и (книга → книги). The genitive is used after numbers 2-4 (два стола), after нет for absence (нет времени), after много/мало, and with some prepositions: из, от, до, без, для.',
      examples: [
        {
          russian: 'У меня нет времени.',
          english: 'I don\'t have time.',
          highlight: 'времени',
        },
        {
          russian: 'Это книга моего брата.',
          english: 'This is my brother\'s book.',
          highlight: 'моего брата',
        },
        {
          russian: 'В комнате много студентов.',
          english: 'There are many students in the room.',
          highlight: 'студентов',
        },
      ],
    },
    {
      id: 'b1-relative-clauses',
      topic: 'Relative Clauses (который)',
      level: 'B1',
      description: 'Connecting clauses with "who/which/that".',
      explanation:
        'Russian relative clauses use который (who/which/that), which agrees in gender and number with the noun it refers to but takes its case from its role in the relative clause. "The book which I read" → "Книга, которую я читал" (которую is feminine accusative because книга is feminine and it is the object of читал).',
      examples: [
        {
          russian: 'Человек, который звонил, мой друг.',
          english: 'The person who called is my friend.',
          highlight: 'который',
        },
        {
          russian: 'Фильм, который мы смотрели, был интересный.',
          english: 'The film that we watched was interesting.',
          highlight: 'который',
        },
        {
          russian: 'Девушка, которой я помог, учится в университете.',
          english: 'The girl whom I helped studies at university.',
          highlight: 'которой',
        },
      ],
    },
    {
      id: 'b1-conditional',
      topic: 'Conditional with бы',
      level: 'B1',
      description: 'Expressing hypothetical situations and wishes.',
      explanation:
        'The Russian conditional is formed with the past tense + the particle бы: "Я бы поехал" (I would go). For if-clauses, use если бы + past tense in both parts: "Если бы я знал, я бы пришёл" (If I had known, I would have come). Бы can also express polite requests: "Я хотел бы..." (I would like...). Russian does not distinguish between present and past unreal conditions.',
      examples: [
        {
          russian: 'Я бы помог тебе, но я занят.',
          english: 'I would help you, but I am busy.',
          highlight: 'бы помог',
        },
        {
          russian: 'Если бы я знал русский, я бы поехал в Россию.',
          english: 'If I knew Russian, I would go to Russia.',
          highlight: 'Если бы',
        },
        {
          russian: 'Я хотел бы чашку чая.',
          english: 'I would like a cup of tea.',
          highlight: 'хотел бы',
        },
      ],
    },
    {
      id: 'b1-reflexive',
      topic: 'Reflexive Verbs (-ся/-сь)',
      level: 'B1',
      description: 'Verbs with the reflexive particle -ся/-сь.',
      explanation:
        'Russian reflexive verbs end in -ся (after consonants and -ь) or -сь (after vowels). They can express: true reflexive action (мыться — to wash oneself), reciprocal action (встречаться — to meet each other), passive meaning (дом строится — the house is being built), or verbs that simply require -ся with no reflexive meaning (бояться — to be afraid, нравиться — to be pleasing).',
      examples: [
        {
          russian: 'Я учусь в университете.',
          english: 'I study at university.',
          highlight: 'учусь',
        },
        {
          russian: 'Они встречаются каждую пятницу.',
          english: 'They meet every Friday.',
          highlight: 'встречаются',
        },
        {
          russian: 'Дверь открылась сама.',
          english: 'The door opened by itself.',
          highlight: 'открылась',
        },
      ],
    },
    {
      id: 'b1-subordinating-conjunctions',
      topic: 'Subordinating Conjunctions',
      level: 'B1',
      description: 'Connecting complex sentences with conjunctions.',
      explanation:
        'Key subordinating conjunctions: что (that), потому что (because), так как (since), чтобы (in order to / so that), хотя (although), пока (while), когда (when), если (if). After чтобы, use the past tense for different subjects: "Я хочу, чтобы он пришёл." Subordinate clauses are always separated by commas in Russian.',
      examples: [
        {
          russian: 'Я думаю, что он прав.',
          english: 'I think that he is right.',
          highlight: 'что',
        },
        {
          russian: 'Она учит русский, чтобы читать Толстого.',
          english: 'She studies Russian in order to read Tolstoy.',
          highlight: 'чтобы',
        },
        {
          russian: 'Хотя было холодно, мы пошли гулять.',
          english: 'Although it was cold, we went for a walk.',
          highlight: 'Хотя',
        },
      ],
    },
  ],

  B2: [
    {
      id: 'b2-instrumental',
      topic: 'Instrumental Case (Творительный падеж)',
      level: 'B2',
      description: 'Expressing "with," instrument, and predicate nouns.',
      explanation:
        'The instrumental case answers кем? (by whom?) and чем? (with what?). Masculine and neuter nouns take -ом/-ем (друг → другом, учитель → учителем). Feminine nouns take -ой/-ей (книга → книгой, земля → землёй). It is used: with с (with) — "с другом"; for instruments — "писать ручкой"; after быть/стать in the past/future — "Он стал врачом"; after prepositions за, между, над, под, перед.',
      examples: [
        {
          russian: 'Я пишу ручкой.',
          english: 'I write with a pen.',
          highlight: 'ручкой',
        },
        {
          russian: 'Она стала врачом.',
          english: 'She became a doctor.',
          highlight: 'врачом',
        },
        {
          russian: 'Мы гуляем с друзьями в парке.',
          english: 'We walk with friends in the park.',
          highlight: 'с друзьями',
        },
      ],
    },
    {
      id: 'b2-passive',
      topic: 'Passive Constructions',
      level: 'B2',
      description: 'Forming passive sentences in Russian.',
      explanation:
        'Russian has several passive constructions. Reflexive passive uses -ся with imperfective verbs: "Дом строится рабочими" (The house is being built by workers). Short passive participles are formed from perfective verbs: построен, написан, сделан — "Книга написана Толстым" (The book was written by Tolstoy). The agent is in the instrumental case.',
      examples: [
        {
          russian: 'Этот роман написан Достоевским.',
          english: 'This novel was written by Dostoevsky.',
          highlight: 'написан Достоевским',
        },
        {
          russian: 'Здесь строится новая школа.',
          english: 'A new school is being built here.',
          highlight: 'строится',
        },
        {
          russian: 'Задача решена.',
          english: 'The problem is solved.',
          highlight: 'решена',
        },
      ],
    },
    {
      id: 'b2-participles',
      topic: 'Verbal Adjectives (Причастия)',
      level: 'B2',
      description: 'Active and passive participles.',
      explanation:
        'Russian has four types of participles: present active (-ущий/-ющий, -ащий/-ящий), past active (-вший/-ший), present passive (-емый/-имый), and past passive (-нный/-тый). Participles function as adjectives and agree with their noun in gender, number, and case. "Читающий мальчик" (the reading boy), "прочитанная книга" (the read book). They are characteristic of formal and written Russian.',
      examples: [
        {
          russian: 'Студент, читающий книгу, мой друг.',
          english: 'The student reading a book is my friend.',
          highlight: 'читающий',
        },
        {
          russian: 'Построенный дом очень красивый.',
          english: 'The built house is very beautiful.',
          highlight: 'Построенный',
        },
        {
          russian: 'Изучаемые темы очень важные.',
          english: 'The topics being studied are very important.',
          highlight: 'Изучаемые',
        },
      ],
    },
    {
      id: 'b2-verbal-adverbs',
      topic: 'Verbal Adverbs (Деепричастия)',
      level: 'B2',
      description: 'Expressing simultaneous or prior actions concisely.',
      explanation:
        'Деепричастия (verbal adverbs/gerunds) describe an action performed by the same subject as the main verb. Imperfective деепричастия end in -а/-я (читая — while reading) and express simultaneous action. Perfective ones end in -в/-вши/-ши (прочитав — having read) and express a prior action. The subject of both actions must be the same.',
      examples: [
        {
          russian: 'Читая книгу, она пила чай.',
          english: 'While reading a book, she drank tea.',
          highlight: 'Читая',
        },
        {
          russian: 'Закончив работу, он пошёл домой.',
          english: 'Having finished work, he went home.',
          highlight: 'Закончив',
        },
        {
          russian: 'Улыбаясь, она поздоровалась с нами.',
          english: 'Smiling, she greeted us.',
          highlight: 'Улыбаясь',
        },
      ],
    },
    {
      id: 'b2-complex-sentences',
      topic: 'Complex Sentence Structures',
      level: 'B2',
      description: 'Multi-clause sentences with various connectors.',
      explanation:
        'Advanced Russian uses layered clause structures: "Он сказал, что, если бы он знал, он бы пришёл" (He said that if he had known, he would have come). Key patterns include indirect speech (что + clause), purpose clauses (чтобы), concession (несмотря на то что), result (так что), and time clauses (после того как, до того как, прежде чем).',
      examples: [
        {
          russian: 'Несмотря на то что шёл дождь, мы пошли гулять.',
          english: 'Despite the fact that it was raining, we went for a walk.',
          highlight: 'Несмотря на то что',
        },
        {
          russian: 'После того как он позвонил, мы поехали в аэропорт.',
          english: 'After he called, we went to the airport.',
          highlight: 'После того как',
        },
        {
          russian: 'Она так устала, что сразу уснула.',
          english: 'She was so tired that she fell asleep immediately.',
          highlight: 'так ... что',
        },
      ],
    },
  ],

  C1: [
    {
      id: 'c1-advanced-aspect',
      topic: 'Advanced Aspect Nuance',
      level: 'C1',
      description: 'Subtle aspectual distinctions in complex contexts.',
      explanation:
        'At C1, aspect choice conveys subtle meaning: imperfective in negated past can mean "didn\'t even try" (Я не открывал окно — I didn\'t open the window [didn\'t touch it]) vs. perfective negation meaning "tried but failed" or "result undone" (Я не открыл окно — I didn\'t manage to open it). Aspect also affects imperatives: imperfective commands are softer invitations (Садитесь!), while perfective commands are specific instructions (Сядьте на этот стул!).',
      examples: [
        {
          russian: 'Кто открывал окно? — Здесь холодно!',
          english: 'Who opened the window? (and it may still be open)',
          highlight: 'открывал',
        },
        {
          russian: 'Садитесь, пожалуйста!',
          english: 'Please sit down! (general polite invitation)',
          highlight: 'Садитесь',
        },
        {
          russian: 'Я вам звонил вчера, но не дозвонился.',
          english: 'I was calling you yesterday but couldn\'t get through.',
          highlight: 'звонил ... не дозвонился',
        },
      ],
    },
    {
      id: 'c1-participial-phrases',
      topic: 'Participial Phrases',
      level: 'C1',
      description: 'Extended participial constructions in formal writing.',
      explanation:
        'In literary and academic Russian, participial phrases replace relative clauses for a more elevated style. "Студент, который читает книгу" becomes "Студент, читающий книгу" or, with a pre-positioned phrase, "Читающий книгу студент." These constructions can be quite long and are a hallmark of Russian academic and journalistic writing.',
      examples: [
        {
          russian: 'Написанная известным автором книга стала бестселлером.',
          english: 'The book written by a famous author became a bestseller.',
          highlight: 'Написанная известным автором',
        },
        {
          russian: 'Проживающие за границей граждане должны зарегистрироваться.',
          english: 'Citizens residing abroad must register.',
          highlight: 'Проживающие за границей',
        },
        {
          russian: 'Вопрос, рассматриваемый комиссией, очень сложный.',
          english: 'The question being considered by the commission is very complex.',
          highlight: 'рассматриваемый комиссией',
        },
      ],
    },
    {
      id: 'c1-stylistic-inversion',
      topic: 'Stylistic Inversion',
      level: 'C1',
      description: 'Manipulating word order for emphasis and style.',
      explanation:
        'Russian\'s flexible word order allows stylistic inversion for emphasis, contrast, and emotional coloring. Placing the rheme (new information) at the end is neutral; fronting it creates emphasis: "Книгу я уже прочитал" (The BOOK I\'ve already read). In literary Russian, inverted order creates poetic or dramatic effect: "Прекрасна была та ночь" (Beautiful was that night).',
      examples: [
        {
          russian: 'Книгу эту я уже прочитал.',
          english: 'THIS book I have already read.',
          highlight: 'Книгу эту',
        },
        {
          russian: 'Странный это был человек.',
          english: 'A strange man he was.',
          highlight: 'Странный это был',
        },
        {
          russian: 'Пришла зима.',
          english: 'Winter came. (literary/dramatic)',
          highlight: 'Пришла зима',
        },
      ],
    },
    {
      id: 'c1-discourse-markers',
      topic: 'Discourse Markers',
      level: 'C1',
      description: 'Connectors and fillers for natural discourse.',
      explanation:
        'Native-level Russian uses discourse markers to structure speech and text: итак (so then), таким образом (thus), кстати (by the way), впрочем (however/actually), дело в том, что (the thing is that), иными словами (in other words), с одной стороны ... с другой стороны (on the one hand ... on the other hand). Conversational fillers include ну (well), вот (so/here), значит (I mean/so).',
      examples: [
        {
          russian: 'Итак, давайте подведём итоги.',
          english: 'So then, let\'s summarize.',
          highlight: 'Итак',
        },
        {
          russian: 'Кстати, ты видел новый фильм?',
          english: 'By the way, have you seen the new film?',
          highlight: 'Кстати',
        },
        {
          russian: 'Дело в том, что у нас нет времени.',
          english: 'The thing is, we don\'t have time.',
          highlight: 'Дело в том, что',
        },
      ],
    },
    {
      id: 'c1-register',
      topic: 'Register Switching (Formal/Informal)',
      level: 'C1',
      description: 'Navigating ты/вы and formal vs. colloquial Russian.',
      explanation:
        'Russian register ranges from highly formal (academic, bureaucratic) to colloquial and slang. The ты/вы distinction is central: вы for strangers, elders, and formal contexts; ты for friends, family, and children. Formal Russian uses full forms (сейчас, потому что), while colloquial speech has reductions (щас, потому что → потому шо). Переход на "ты" (switching to ты) is a social milestone in relationships.',
      examples: [
        {
          russian: 'Вы не могли бы мне помочь?',
          english: 'Could you help me? (formal/polite)',
          highlight: 'Вы не могли бы',
        },
        {
          russian: 'Слушай, можешь помочь?',
          english: 'Hey, can you help? (informal)',
          highlight: 'Слушай, можешь',
        },
        {
          russian: 'Давайте перейдём на "ты".',
          english: 'Let\'s switch to informal "you."',
          highlight: 'перейдём на "ты"',
        },
      ],
    },
  ],

  C2: [
    {
      id: 'c2-literary-russian',
      topic: 'Literary Russian',
      level: 'C2',
      description: 'The language of Russian classic and modern literature.',
      explanation:
        'Literary Russian (литературный язык) encompasses the elevated register found in fiction, poetry, and formal prose. It features archaic verb forms (молвить — to utter), Church Slavonic vocabulary (очи — eyes, уста — lips, глас — voice), complex participial constructions, and rhetorical devices. Understanding Pushkin, Tolstoy, and Dostoevsky requires familiarity with 19th-century vocabulary and syntax that differs from modern spoken Russian.',
      examples: [
        {
          russian: 'Я помню чудное мгновенье: передо мной явилась ты.',
          english: 'I remember a wondrous moment: you appeared before me. (Pushkin)',
          highlight: 'чудное мгновенье',
        },
        {
          russian: 'Все счастливые семьи похожи друг на друга.',
          english: 'All happy families are alike. (Tolstoy)',
          highlight: 'похожи друг на друга',
        },
        {
          russian: 'Красота спасёт мир.',
          english: 'Beauty will save the world. (Dostoevsky)',
          highlight: 'спасёт',
        },
      ],
    },
    {
      id: 'c2-church-slavonic',
      topic: 'Church Slavonic Influence',
      level: 'C2',
      description: 'Recognizing Church Slavonic roots in modern Russian.',
      explanation:
        'Church Slavonic deeply shaped Russian vocabulary and style. Many doublets exist: native Russian ворота (gates) vs. Church Slavonic врата; город (city) vs. град; голова (head) vs. глава (chapter/head of state); золото (gold) vs. злато (poetic). Church Slavonic forms are perceived as elevated or archaic. The prefix пре- (very/exceedingly) and суффикс -ствие are Church Slavonic markers. Recognizing these layers enriches understanding of register and etymology.',
      examples: [
        {
          russian: 'Глава государства выступил с речью.',
          english: 'The head of state gave a speech.',
          highlight: 'Глава',
        },
        {
          russian: 'Врата храма были открыты.',
          english: 'The gates of the temple were open. (elevated)',
          highlight: 'Врата',
        },
        {
          russian: 'Здравствуйте — древнее приветствие.',
          english: '"Zdravstvuyte" is an ancient greeting. (from "здравие" — health)',
          highlight: 'Здравствуйте',
        },
      ],
    },
    {
      id: 'c2-regional-variation',
      topic: 'Regional Variation',
      level: 'C2',
      description: 'Dialects, regional features, and pronunciation differences.',
      explanation:
        'Despite being more uniform than many languages, Russian has notable regional variation. Northern dialects (Vologda, Arkhangelsk) preserve оканье — pronouncing unstressed "о" as [o] rather than reducing it to [a]. Southern dialects (Ryazan, Kursk) have яканье and fricative [ɣ] instead of [g]. Moscow speech (аканье) became the literary standard. Regional vocabulary also varies: подъезд vs. парадная (entrance), батон vs. булка (loaf).',
      examples: [
        {
          russian: 'В Петербурге говорят "парадная", а в Москве — "подъезд".',
          english: 'In Petersburg they say "paradnaya," but in Moscow — "podyezd." (entrance)',
          highlight: 'парадная ... подъезд',
        },
        {
          russian: 'На севере России сохраняется оканье.',
          english: 'In northern Russia, okanye (full pronunciation of "o") is preserved.',
          highlight: 'оканье',
        },
        {
          russian: 'Бабушка говорила "чаво" вместо "чего".',
          english: 'Grandma said "chavo" instead of "chego." (dialectal)',
          highlight: 'чаво',
        },
      ],
    },
    {
      id: 'c2-case-mastery',
      topic: 'Full Case Mastery in Idiomatic Usage',
      level: 'C2',
      description: 'Idiomatic and unexpected case usage in fixed expressions.',
      explanation:
        'Mastery of Russian cases includes idiomatic expressions where case usage is unpredictable: "что за + nominative" (what kind of), "от нечего делать" (genitive, out of boredom), "рука об руку" (accusative, hand in hand), "с глазу на глаз" (face to face). Verbs governing unexpected cases must be memorized: управлять + instrumental (to manage), избегать + genitive (to avoid), завидовать + dative (to envy).',
      examples: [
        {
          russian: 'Что за вопрос!',
          english: 'What kind of question is that!',
          highlight: 'Что за',
        },
        {
          russian: 'Он руководит компанией уже десять лет.',
          english: 'He has been managing the company for ten years. (instrumental)',
          highlight: 'компанией',
        },
        {
          russian: 'Нам не по пути.',
          english: 'We\'re not going the same way. (idiomatic dative)',
          highlight: 'не по пути',
        },
      ],
    },
  ],
};
