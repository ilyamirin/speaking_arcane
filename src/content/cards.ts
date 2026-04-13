export type ArcanaType = "major" | "minor";
export type Orientation = "upright";

export const filterTags = [
  "Все",
  "Намерения",
  "Пауза",
  "Возвращение",
  "Выбор",
  "Самоощущение",
  "Коммуникация",
  "Границы",
  "Переход"
] as const;

export type FilterTag = (typeof filterTags)[number];

export interface TarotCard {
  id: TarotCardId;
  nameRu: string;
  imageKey: TarotCardId;
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

const tarotCardDefinitions = [
  { id: "fool", nameRu: "Шут", fileName: "fool.jpg", arcanaType: "major" },
  { id: "magician", nameRu: "Маг", fileName: "magician.jpg", arcanaType: "major" },
  { id: "highPriestess", nameRu: "Верховная Жрица", fileName: "high-priestess.jpg", arcanaType: "major" },
  { id: "empress", nameRu: "Императрица", fileName: "empress.jpg", arcanaType: "major" },
  { id: "emperor", nameRu: "Император", fileName: "emperor.jpg", arcanaType: "major" },
  { id: "hierophant", nameRu: "Иерофант", fileName: "hierophant.jpg", arcanaType: "major" },
  { id: "lovers", nameRu: "Влюблённые", fileName: "lovers.jpg", arcanaType: "major" },
  { id: "chariot", nameRu: "Колесница", fileName: "chariot.jpg", arcanaType: "major" },
  { id: "strength", nameRu: "Сила", fileName: "strength.jpg", arcanaType: "major" },
  { id: "hermit", nameRu: "Отшельник", fileName: "hermit.jpg", arcanaType: "major" },
  { id: "wheelOfFortune", nameRu: "Колесо Фортуны", fileName: "wheel-of-fortune.jpg", arcanaType: "major" },
  { id: "justice", nameRu: "Справедливость", fileName: "justice.jpg", arcanaType: "major" },
  { id: "hangedMan", nameRu: "Повешенный", fileName: "hanged-man.jpg", arcanaType: "major" },
  { id: "death", nameRu: "Смерть", fileName: "death.jpg", arcanaType: "major" },
  { id: "temperance", nameRu: "Умеренность", fileName: "temperance.jpg", arcanaType: "major" },
  { id: "devil", nameRu: "Дьявол", fileName: "devil.jpg", arcanaType: "major" },
  { id: "tower", nameRu: "Башня", fileName: "tower.jpg", arcanaType: "major" },
  { id: "star", nameRu: "Звезда", fileName: "star.jpg", arcanaType: "major" },
  { id: "moon", nameRu: "Луна", fileName: "moon.jpg", arcanaType: "major" },
  { id: "sun", nameRu: "Солнце", fileName: "sun.jpg", arcanaType: "major" },
  { id: "judgement", nameRu: "Суд", fileName: "judgement.jpg", arcanaType: "major" },
  { id: "world", nameRu: "Мир", fileName: "world.jpg", arcanaType: "major" },
  { id: "aceOfWands", nameRu: "Туз Жезлов", fileName: "ace-of-wands.jpg", arcanaType: "minor" },
  { id: "twoOfWands", nameRu: "Двойка Жезлов", fileName: "two-of-wands.jpg", arcanaType: "minor" },
  { id: "threeOfWands", nameRu: "Тройка Жезлов", fileName: "three-of-wands.jpg", arcanaType: "minor" },
  { id: "fourOfWands", nameRu: "Четвёрка Жезлов", fileName: "four-of-wands.jpg", arcanaType: "minor" },
  { id: "fiveOfWands", nameRu: "Пятёрка Жезлов", fileName: "five-of-wands.jpg", arcanaType: "minor" },
  { id: "sixOfWands", nameRu: "Шестёрка Жезлов", fileName: "six-of-wands.jpg", arcanaType: "minor" },
  { id: "sevenOfWands", nameRu: "Семёрка Жезлов", fileName: "seven-of-wands.jpg", arcanaType: "minor" },
  { id: "eightOfWands", nameRu: "Восьмёрка Жезлов", fileName: "eight-of-wands.jpg", arcanaType: "minor" },
  { id: "nineOfWands", nameRu: "Девятка Жезлов", fileName: "nine-of-wands.jpg", arcanaType: "minor" },
  { id: "tenOfWands", nameRu: "Десятка Жезлов", fileName: "ten-of-wands.jpg", arcanaType: "minor" },
  { id: "pageOfWands", nameRu: "Паж Жезлов", fileName: "page-of-wands.jpg", arcanaType: "minor" },
  { id: "knightOfWands", nameRu: "Рыцарь Жезлов", fileName: "knight-of-wands.jpg", arcanaType: "minor" },
  { id: "queenOfWands", nameRu: "Королева Жезлов", fileName: "queen-of-wands.jpg", arcanaType: "minor" },
  { id: "kingOfWands", nameRu: "Король Жезлов", fileName: "king-of-wands.jpg", arcanaType: "minor" },
  { id: "aceOfCups", nameRu: "Туз Кубков", fileName: "ace-of-cups.jpg", arcanaType: "minor" },
  { id: "twoOfCups", nameRu: "Двойка Кубков", fileName: "two-of-cups.jpg", arcanaType: "minor" },
  { id: "threeOfCups", nameRu: "Тройка Кубков", fileName: "three-of-cups.jpg", arcanaType: "minor" },
  { id: "fourOfCups", nameRu: "Четвёрка Кубков", fileName: "four-of-cups.jpg", arcanaType: "minor" },
  { id: "fiveOfCups", nameRu: "Пятёрка Кубков", fileName: "five-of-cups.jpg", arcanaType: "minor" },
  { id: "sixOfCups", nameRu: "Шестёрка Кубков", fileName: "six-of-cups.jpg", arcanaType: "minor" },
  { id: "sevenOfCups", nameRu: "Семёрка Кубков", fileName: "seven-of-cups.jpg", arcanaType: "minor" },
  { id: "eightOfCups", nameRu: "Восьмёрка Кубков", fileName: "eight-of-cups.jpg", arcanaType: "minor" },
  { id: "nineOfCups", nameRu: "Девятка Кубков", fileName: "nine-of-cups.jpg", arcanaType: "minor" },
  { id: "tenOfCups", nameRu: "Десятка Кубков", fileName: "ten-of-cups.jpg", arcanaType: "minor" },
  { id: "pageOfCups", nameRu: "Паж Кубков", fileName: "page-of-cups.jpg", arcanaType: "minor" },
  { id: "knightOfCups", nameRu: "Рыцарь Кубков", fileName: "knight-of-cups.jpg", arcanaType: "minor" },
  { id: "queenOfCups", nameRu: "Королева Кубков", fileName: "queen-of-cups.jpg", arcanaType: "minor" },
  { id: "kingOfCups", nameRu: "Король Кубков", fileName: "king-of-cups.jpg", arcanaType: "minor" },
  { id: "aceOfSwords", nameRu: "Туз Мечей", fileName: "ace-of-swords.jpg", arcanaType: "minor" },
  { id: "twoOfSwords", nameRu: "Двойка Мечей", fileName: "two-of-swords.jpg", arcanaType: "minor" },
  { id: "threeOfSwords", nameRu: "Тройка Мечей", fileName: "three-of-swords.jpg", arcanaType: "minor" },
  { id: "fourOfSwords", nameRu: "Четвёрка Мечей", fileName: "four-of-swords.jpg", arcanaType: "minor" },
  { id: "fiveOfSwords", nameRu: "Пятёрка Мечей", fileName: "five-of-swords.jpg", arcanaType: "minor" },
  { id: "sixOfSwords", nameRu: "Шестёрка Мечей", fileName: "six-of-swords.jpg", arcanaType: "minor" },
  { id: "sevenOfSwords", nameRu: "Семёрка Мечей", fileName: "seven-of-swords.jpg", arcanaType: "minor" },
  { id: "eightOfSwords", nameRu: "Восьмёрка Мечей", fileName: "eight-of-swords.jpg", arcanaType: "minor" },
  { id: "nineOfSwords", nameRu: "Девятка Мечей", fileName: "nine-of-swords.jpg", arcanaType: "minor" },
  { id: "tenOfSwords", nameRu: "Десятка Мечей", fileName: "ten-of-swords.jpg", arcanaType: "minor" },
  { id: "pageOfSwords", nameRu: "Паж Мечей", fileName: "page-of-swords.jpg", arcanaType: "minor" },
  { id: "knightOfSwords", nameRu: "Рыцарь Мечей", fileName: "knight-of-swords.jpg", arcanaType: "minor" },
  { id: "queenOfSwords", nameRu: "Королева Мечей", fileName: "queen-of-swords.jpg", arcanaType: "minor" },
  { id: "kingOfSwords", nameRu: "Король Мечей", fileName: "king-of-swords.jpg", arcanaType: "minor" },
  { id: "aceOfPentacles", nameRu: "Туз Пентаклей", fileName: "ace-of-pentacles.jpg", arcanaType: "minor" },
  { id: "twoOfPentacles", nameRu: "Двойка Пентаклей", fileName: "two-of-pentacles.jpg", arcanaType: "minor" },
  { id: "threeOfPentacles", nameRu: "Тройка Пентаклей", fileName: "three-of-pentacles.jpg", arcanaType: "minor" },
  { id: "fourOfPentacles", nameRu: "Четвёрка Пентаклей", fileName: "four-of-pentacles.jpg", arcanaType: "minor" },
  { id: "fiveOfPentacles", nameRu: "Пятёрка Пентаклей", fileName: "five-of-pentacles.jpg", arcanaType: "minor" },
  { id: "sixOfPentacles", nameRu: "Шестёрка Пентаклей", fileName: "six-of-pentacles.jpg", arcanaType: "minor" },
  { id: "sevenOfPentacles", nameRu: "Семёрка Пентаклей", fileName: "seven-of-pentacles.jpg", arcanaType: "minor" },
  { id: "eightOfPentacles", nameRu: "Восьмёрка Пентаклей", fileName: "eight-of-pentacles.jpg", arcanaType: "minor" },
  { id: "nineOfPentacles", nameRu: "Девятка Пентаклей", fileName: "nine-of-pentacles.jpg", arcanaType: "minor" },
  { id: "tenOfPentacles", nameRu: "Десятка Пентаклей", fileName: "ten-of-pentacles.jpg", arcanaType: "minor" },
  { id: "pageOfPentacles", nameRu: "Паж Пентаклей", fileName: "page-of-pentacles.jpg", arcanaType: "minor" },
  { id: "knightOfPentacles", nameRu: "Рыцарь Пентаклей", fileName: "knight-of-pentacles.jpg", arcanaType: "minor" },
  { id: "queenOfPentacles", nameRu: "Королева Пентаклей", fileName: "queen-of-pentacles.jpg", arcanaType: "minor" },
  { id: "kingOfPentacles", nameRu: "Король Пентаклей", fileName: "king-of-pentacles.jpg", arcanaType: "minor" }
] as const;

export type TarotCardId = (typeof tarotCardDefinitions)[number]["id"];

export const cards = Object.fromEntries(
  tarotCardDefinitions.map((definition) => [
    definition.id,
    {
      id: definition.id,
      nameRu: definition.nameRu,
      imageKey: definition.id,
      arcanaType: definition.arcanaType,
      orientation: "upright"
    } satisfies TarotCard
  ])
) as Record<TarotCardId, TarotCard>;

export const tarotImageManifest = Object.fromEntries(
  tarotCardDefinitions.map((definition) => [definition.id, `/cards/${definition.fileName}`])
) as Record<TarotCardId, string>;
