export type ArcanaType = "major" | "minor";
export type Orientation = "upright";
export type FilterTag =
  | "Все"
  | "Намерения"
  | "Пауза"
  | "Возвращение"
  | "Выбор"
  | "Самоощущение";

export interface TarotCard {
  id: string;
  nameRu: string;
  imageKey: string;
  arcanaType: ArcanaType;
  orientation: Orientation;
}

export interface DialogueLine {
  id: string;
  speakerCardId: TarotCard["id"];
  text: string;
  tone: "тёмная-нежность";
  focusCardId: TarotCard["id"];
}

export interface SpreadPost {
  id: string;
  slug: string;
  question: string;
  tags: FilterTag[];
  cards: [TarotCard, TarotCard, TarotCard];
  dialogue: DialogueLine[];
  interpreterSummary: string;
  introNote?: string;
}

export const filterTags: FilterTag[] = [
  "Все",
  "Намерения",
  "Пауза",
  "Возвращение",
  "Выбор",
  "Самоощущение"
];

export const tarotImageManifest = {
  lovers: "/cards/lovers.jpg",
  chariot: "/cards/chariot.jpg",
  twoOfCups: "/cards/two-of-cups.jpg",
  hermit: "/cards/hermit.jpg",
  moon: "/cards/moon.jpg",
  eightOfWands: "/cards/eight-of-wands.jpg",
  devil: "/cards/devil.jpg",
  strength: "/cards/strength.jpg",
  twoOfSwords: "/cards/two-of-swords.jpg",
  judgement: "/cards/judgement.jpg",
  sixOfCups: "/cards/six-of-cups.jpg",
  justice: "/cards/justice.jpg",
  highPriestess: "/cards/high-priestess.jpg",
  star: "/cards/star.jpg",
  nineOfSwords: "/cards/nine-of-swords.jpg"
} as const;

const cards = {
  lovers: {
    id: "lovers",
    nameRu: "Влюблённые",
    imageKey: "lovers",
    arcanaType: "major",
    orientation: "upright"
  },
  chariot: {
    id: "chariot",
    nameRu: "Колесница",
    imageKey: "chariot",
    arcanaType: "major",
    orientation: "upright"
  },
  twoOfCups: {
    id: "twoOfCups",
    nameRu: "Двойка Кубков",
    imageKey: "twoOfCups",
    arcanaType: "minor",
    orientation: "upright"
  },
  hermit: {
    id: "hermit",
    nameRu: "Отшельник",
    imageKey: "hermit",
    arcanaType: "major",
    orientation: "upright"
  },
  moon: {
    id: "moon",
    nameRu: "Луна",
    imageKey: "moon",
    arcanaType: "major",
    orientation: "upright"
  },
  eightOfWands: {
    id: "eightOfWands",
    nameRu: "Восьмёрка Жезлов",
    imageKey: "eightOfWands",
    arcanaType: "minor",
    orientation: "upright"
  },
  devil: {
    id: "devil",
    nameRu: "Дьявол",
    imageKey: "devil",
    arcanaType: "major",
    orientation: "upright"
  },
  strength: {
    id: "strength",
    nameRu: "Сила",
    imageKey: "strength",
    arcanaType: "major",
    orientation: "upright"
  },
  twoOfSwords: {
    id: "twoOfSwords",
    nameRu: "Двойка Мечей",
    imageKey: "twoOfSwords",
    arcanaType: "minor",
    orientation: "upright"
  },
  judgement: {
    id: "judgement",
    nameRu: "Суд",
    imageKey: "judgement",
    arcanaType: "major",
    orientation: "upright"
  },
  sixOfCups: {
    id: "sixOfCups",
    nameRu: "Шестёрка Кубков",
    imageKey: "sixOfCups",
    arcanaType: "minor",
    orientation: "upright"
  },
  justice: {
    id: "justice",
    nameRu: "Справедливость",
    imageKey: "justice",
    arcanaType: "major",
    orientation: "upright"
  },
  highPriestess: {
    id: "highPriestess",
    nameRu: "Верховная Жрица",
    imageKey: "highPriestess",
    arcanaType: "major",
    orientation: "upright"
  },
  star: {
    id: "star",
    nameRu: "Звезда",
    imageKey: "star",
    arcanaType: "major",
    orientation: "upright"
  },
  nineOfSwords: {
    id: "nineOfSwords",
    nameRu: "Девятка Мечей",
    imageKey: "nineOfSwords",
    arcanaType: "minor",
    orientation: "upright"
  }
} satisfies Record<string, TarotCard>;

export const spreads: SpreadPost[] = [
  {
    id: "spread-after-date",
    slug: "after-date-second-meeting",
    question: "После свидания непонятно, захочет ли он увидеться ещё раз?",
    tags: ["Все", "Намерения"],
    introNote:
      "Слушай не только смысл слов, но и то, какая карта сейчас говорит громче остальных.",
    cards: [cards.lovers, cards.chariot, cards.twoOfCups],
    dialogue: [
      {
        id: "line-1",
        speakerCardId: "lovers",
        focusCardId: "lovers",
        tone: "тёмная-нежность",
        text: "Он уже почувствовал притяжение. Не космическое, а очень земное, с памятью о твоём взгляде."
      },
      {
        id: "line-2",
        speakerCardId: "chariot",
        focusCardId: "chariot",
        tone: "тёмная-нежность",
        text: "Притяжение ещё не обещание. Мужчина может хотеть подъехать ближе и всё равно держать поводья натянутыми."
      },
      {
        id: "line-3",
        speakerCardId: "twoOfCups",
        focusCardId: "twoOfCups",
        tone: "тёмная-нежность",
        text: "Но здесь желание взаимности уже случилось. Он примерил тебя к продолжению, а не к одной красивой ночи."
      },
      {
        id: "line-4",
        speakerCardId: "chariot",
        focusCardId: "chariot",
        tone: "тёмная-нежность",
        text: "Ему важно выглядеть собранным. Он не любит показывать, что задело сильнее, чем планировал."
      },
      {
        id: "line-5",
        speakerCardId: "lovers",
        focusCardId: "lovers",
        tone: "тёмная-нежность",
        text: "Поэтому пауза после свидания не равна холоду. Иногда мужчина молчит именно там, где уже выбирает."
      },
      {
        id: "line-6",
        speakerCardId: "twoOfCups",
        focusCardId: "twoOfCups",
        tone: "тёмная-нежность",
        text: "Если он появится снова, он пойдёт мягко: с простым сообщением, без пафоса, будто между вами ничего не дрогнуло."
      },
      {
        id: "line-7",
        speakerCardId: "chariot",
        focusCardId: "chariot",
        tone: "тёмная-нежность",
        text: "Но появится. Здесь нет карты ухода. Есть карта контроля над собственным волнением."
      },
      {
        id: "line-8",
        speakerCardId: "lovers",
        focusCardId: "lovers",
        tone: "тёмная-нежность",
        text: "Скажу проще: ты осталась у него внутри как вариант, который хочется не упустить."
      },
      {
        id: "line-9",
        speakerCardId: "twoOfCups",
        focusCardId: "twoOfCups",
        tone: "тёмная-нежность",
        text: "И если ответить ему спокойно, без проверки и уколов, встреча почти наверняка получит второе дыхание."
      }
    ],
    interpreterSummary:
      "Он настроен не на исчезновение, а на продолжение. В его манере будет сдержанность, но сама связка карт говорит о повторной инициативе и о взаимном интересе, который уже успел стать личным."
  },
  {
    id: "spread-warm-then-silence",
    slug: "warm-start-then-silence",
    question: "Почему он замолчал после тёплого начала?",
    tags: ["Все", "Пауза"],
    cards: [cards.eightOfWands, cards.hermit, cards.moon],
    dialogue: [
      {
        id: "line-1",
        speakerCardId: "eightOfWands",
        focusCardId: "eightOfWands",
        tone: "тёмная-нежность",
        text: "Сначала всё шло быстро. Он писал как человек, который уже почувствовал вкус ответа."
      },
      {
        id: "line-2",
        speakerCardId: "moon",
        focusCardId: "moon",
        tone: "тёмная-нежность",
        text: "А потом в него вошла тень. Не обязательно другая женщина. Чаще это собственные страхи, старые и липкие."
      },
      {
        id: "line-3",
        speakerCardId: "hermit",
        focusCardId: "hermit",
        tone: "тёмная-нежность",
        text: "Он ушёл не в приключение, а в свою внутреннюю комнату без окон. Там мужчины часто делают вид, что им никого не нужно."
      },
      {
        id: "line-4",
        speakerCardId: "eightOfWands",
        focusCardId: "eightOfWands",
        tone: "тёмная-нежность",
        text: "Ему стало слишком быстро слишком близко. Скорость напугала его сильнее, чем сама связь."
      },
      {
        id: "line-5",
        speakerCardId: "moon",
        focusCardId: "moon",
        tone: "тёмная-нежность",
        text: "И теперь он сам не уверен, чего боится больше: твоего молчания или твоего настоящего присутствия."
      },
      {
        id: "line-6",
        speakerCardId: "hermit",
        focusCardId: "hermit",
        tone: "тёмная-нежность",
        text: "Это пауза человека, который переваривает себя. Она неприятна, но она не выглядит как холодное презрение."
      },
      {
        id: "line-7",
        speakerCardId: "moon",
        focusCardId: "moon",
        tone: "тёмная-нежность",
        text: "Не пытайся вычислить его страх до молекулы. Эта тишина больше о нём, чем о твоей ценности."
      },
      {
        id: "line-8",
        speakerCardId: "eightOfWands",
        focusCardId: "eightOfWands",
        tone: "тёмная-нежность",
        text: "Если он вернётся, ритм уже не будет таким стремительным. Он попробует идти осторожнее, чем начал."
      },
      {
        id: "line-9",
        speakerCardId: "hermit",
        focusCardId: "hermit",
        tone: "тёмная-нежность",
        text: "А если не вернётся быстро, всё равно не считай ту первую искру выдумкой. Она была настоящей, просто ему не хватило внутреннего света выдержать её."
      }
    ],
    interpreterSummary:
      "Замолчал не потому, что ничего не почувствовал, а потому, что почувствовал и испугался скорости сближения. В этом раскладе пауза рождается из внутренней тревоги и закрытости, а не из пустоты."
  },
  {
    id: "spread-fear-or-no-continuation",
    slug: "fear-of-intimacy-or-no-continuation",
    question: "Это страх близости или ему просто не нужно продолжение?",
    tags: ["Все", "Намерения", "Выбор"],
    cards: [cards.devil, cards.strength, cards.twoOfSwords],
    dialogue: [
      {
        id: "line-1",
        speakerCardId: "devil",
        focusCardId: "devil",
        tone: "тёмная-нежность",
        text: "Его тянет. Не вежливо, не абстрактно, а телом, амбицией и жадностью к впечатлению."
      },
      {
        id: "line-2",
        speakerCardId: "twoOfSwords",
        focusCardId: "twoOfSwords",
        tone: "тёмная-нежность",
        text: "И всё же он сидит на месте, как будто завязал глаза собственными руками."
      },
      {
        id: "line-3",
        speakerCardId: "strength",
        focusCardId: "strength",
        tone: "тёмная-нежность",
        text: "Потому что близость для него сейчас не слабое место, а место борьбы. Он боится потерять контроль над собой."
      },
      {
        id: "line-4",
        speakerCardId: "devil",
        focusCardId: "devil",
        tone: "тёмная-нежность",
        text: "Если бы продолжение было ему не нужно, я бы давно погас. Но я здесь, плотный и горячий."
      },
      {
        id: "line-5",
        speakerCardId: "strength",
        focusCardId: "strength",
        tone: "тёмная-нежность",
        text: "Ему нужно не отсутствие чувств, а мужество выдержать чувства без бегства и без манипуляции."
      },
      {
        id: "line-6",
        speakerCardId: "twoOfSwords",
        focusCardId: "twoOfSwords",
        tone: "тёмная-нежность",
        text: "Пока решения нет. Есть зависшее состояние: хочется подойти, но ещё страшно признать цену этого шага."
      },
      {
        id: "line-7",
        speakerCardId: "devil",
        focusCardId: "devil",
        tone: "тёмная-нежность",
        text: "Не называй это равнодушием. Равнодушие не даёт такого напряжения в воздухе."
      },
      {
        id: "line-8",
        speakerCardId: "strength",
        focusCardId: "strength",
        tone: "тёмная-нежность",
        text: "Но и романтизировать его страх не нужно. Пока он не выбрал зрелость, тебе достаётся ожидание."
      },
      {
        id: "line-9",
        speakerCardId: "twoOfSwords",
        focusCardId: "twoOfSwords",
        tone: "тёмная-нежность",
        text: "Ответ такой: дело не в отсутствии желания. Дело в том, что он ещё не решил, способен ли вынести настоящее продолжение."
      }
    ],
    interpreterSummary:
      "Расклад склоняет к страху близости, а не к простому отсутствию интереса. В нём есть сильное влечение, но мужчина застрял в внутреннем клинче между желанием и контролем."
  },
  {
    id: "spread-ex-second-chance",
    slug: "ex-second-chance",
    question: "Стоит ли давать бывшему ещё один шанс?",
    tags: ["Все", "Возвращение", "Выбор"],
    cards: [cards.judgement, cards.sixOfCups, cards.justice],
    dialogue: [
      {
        id: "line-1",
        speakerCardId: "sixOfCups",
        focusCardId: "sixOfCups",
        tone: "тёмная-нежность",
        text: "Он возвращается не на пустое место. Между вами ещё жив запах старых обещаний."
      },
      {
        id: "line-2",
        speakerCardId: "judgement",
        focusCardId: "judgement",
        tone: "тёмная-нежность",
        text: "Возвращение здесь действительно возможно. Но я прихожу не ради ностальгии, а ради честного пересмотра."
      },
      {
        id: "line-3",
        speakerCardId: "justice",
        focusCardId: "justice",
        tone: "тёмная-нежность",
        text: "Именно. Второй шанс без новых правил станет просто красиво подсвеченным повтором старой боли."
      },
      {
        id: "line-4",
        speakerCardId: "sixOfCups",
        focusCardId: "sixOfCups",
        tone: "тёмная-нежность",
        text: "Сердце, конечно, первым делом тянется к тому, что уже было родным."
      },
      {
        id: "line-5",
        speakerCardId: "judgement",
        focusCardId: "judgement",
        tone: "тёмная-нежность",
        text: "Но родное должно выдержать правду. Что именно он понял? Что собирается менять? За счёт чего связь станет другой?"
      },
      {
        id: "line-6",
        speakerCardId: "justice",
        focusCardId: "justice",
        tone: "тёмная-нежность",
        text: "Тебе нельзя входить обратно только потому, что он снова стал тёплым. Нужны ясные действия, а не одно лишь узнаваемое тепло."
      },
      {
        id: "line-7",
        speakerCardId: "sixOfCups",
        focusCardId: "sixOfCups",
        tone: "тёмная-нежность",
        text: "Память сладка, но она плохой адвокат. Она защищает не будущее, а привычную боль."
      },
      {
        id: "line-8",
        speakerCardId: "judgement",
        focusCardId: "judgement",
        tone: "тёмная-нежность",
        text: "Если разговор между вами станет взрослым, шанс можно открыть. Если он снова просит просто чувствовать, не разбирая причин, дверь лучше не распахивать."
      },
      {
        id: "line-9",
        speakerCardId: "justice",
        focusCardId: "justice",
        tone: "тёмная-нежность",
        text: "Так что шанс не запрещён. Но он должен быть выдан не сердцем в сумерках, а твоим ясным решением днём."
      }
    ],
    interpreterSummary:
      "Возврат возможен, но только через честный пересмотр прошлой динамики. Давать шанс стоит не воспоминанию о нём, а только реальным доказательствам того, что мужчина вошёл в разговор и ответственность иначе, чем прежде."
  },
  {
    id: "spread-intuition-knows",
    slug: "intuition-already-knows",
    question: "Что моя интуиция уже знает о нём, а я не решаюсь признать?",
    tags: ["Все", "Самоощущение"],
    cards: [cards.highPriestess, cards.star, cards.nineOfSwords],
    dialogue: [
      {
        id: "line-1",
        speakerCardId: "highPriestess",
        focusCardId: "highPriestess",
        tone: "тёмная-нежность",
        text: "Ты уже многое увидела. Просто пока называешь это тревогой, чтобы не признавать точность своего знания."
      },
      {
        id: "line-2",
        speakerCardId: "star",
        focusCardId: "star",
        tone: "тёмная-нежность",
        text: "Твоё сердце всё ещё хочет верить в лучший вариант. И в этом нет стыда."
      },
      {
        id: "line-3",
        speakerCardId: "nineOfSwords",
        focusCardId: "nineOfSwords",
        tone: "тёмная-нежность",
        text: "Но ночами тебя будит не фантазия. Тебя будит расхождение между его образом и его реальным поведением."
      },
      {
        id: "line-4",
        speakerCardId: "highPriestess",
        focusCardId: "highPriestess",
        tone: "тёмная-нежность",
        text: "Интуиция уже поняла: он не так прозрачен, как тебе хотелось бы. Что-то важное он прячет даже от самого себя."
      },
      {
        id: "line-5",
        speakerCardId: "star",
        focusCardId: "star",
        tone: "тёмная-нежность",
        text: "При этом ты видишь в нём свет не случайно. Там действительно есть мягкость и возможность, иначе я бы не сияла рядом."
      },
      {
        id: "line-6",
        speakerCardId: "nineOfSwords",
        focusCardId: "nineOfSwords",
        tone: "тёмная-нежность",
        text: "Но возможность и надёжность — не одно и то же. Именно это ты и не хочешь произносить вслух."
      },
      {
        id: "line-7",
        speakerCardId: "highPriestess",
        focusCardId: "highPriestess",
        tone: "тёмная-нежность",
        text: "Ты уже знаешь, где в этой истории придётся перестать угадывать и начать спрашивать прямо."
      },
      {
        id: "line-8",
        speakerCardId: "star",
        focusCardId: "star",
        tone: "тёмная-нежность",
        text: "Надежду не нужно убивать. Ей нужно дать форму, в которой она сможет выдержать проверку реальностью."
      },
      {
        id: "line-9",
        speakerCardId: "nineOfSwords",
        focusCardId: "nineOfSwords",
        tone: "тёмная-нежность",
        text: "А до тех пор твоя бессонница будет говорить за тебя. Она уже говорит."
      }
    ],
    interpreterSummary:
      "Твоя интуиция уловила не пустоту, а несоответствие между потенциалом мужчины и его фактической надёжностью. Ты видишь в нём свет, но уже понимаешь, что одних обещающих ощущений недостаточно, чтобы считать связь безопасной."
  }
];
