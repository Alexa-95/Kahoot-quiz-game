import { randomInt as cryptoRandomInt } from 'node:crypto';

export const QUESTION_COUNTS = [5, 10, 15, 20, 25];

export const QUESTION_POOL = [
  { text: 'Jaka jest stolica Australii?', type: 'choice', options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'], correctIndex: 1 },
  { text: 'Które miasto jest stolicą Kanady?', type: 'choice', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctIndex: 2 },
  { text: 'Jaka rzeka przepływa przez Kraków?', type: 'choice', options: ['Wisła', 'Odra', 'Warta', 'Bug'], correctIndex: 0 },
  { text: 'Który kraj ma kształt długiego, wąskiego pasa wzdłuż zachodniego wybrzeża Ameryki Południowej?', type: 'choice', options: ['Chile', 'Brazylia', 'Kolumbia', 'Urugwaj'], correctIndex: 0 },
  { text: 'Na jakim kontynencie leży pustynia Sahara?', type: 'choice', options: ['Azja', 'Afryka', 'Australia', 'Ameryka Południowa'], correctIndex: 1 },
  { text: 'Które z tych państw leży na Półwyspie Iberyjskim?', type: 'choice', options: ['Portugalia', 'Grecja', 'Chorwacja', 'Belgia'], correctIndex: 0 },
  { text: 'Jaka jest stolica Japonii?', type: 'choice', options: ['Kioto', 'Osaka', 'Tokio', 'Nara'], correctIndex: 2 },
  { text: 'Który ocean jest największy?', type: 'choice', options: ['Atlantycki', 'Indyjski', 'Arktyczny', 'Spokojny'], correctIndex: 3 },
  { text: 'Jak nazywa się najwyższy szczyt Afryki?', type: 'choice', options: ['Kilimandżaro', 'Mount Kenya', 'Ras Daszan', 'Atlas'], correctIndex: 0 },
  { text: 'Które miasto jest stolicą Włoch?', type: 'choice', options: ['Mediolan', 'Rzym', 'Neapol', 'Florencja'], correctIndex: 1 },
  { text: 'Jaki gaz rośliny pobierają z powietrza podczas fotosyntezy?', type: 'choice', options: ['Tlen', 'Azot', 'Dwutlenek węgla', 'Hel'], correctIndex: 2 },
  { text: 'Ile kości ma zwykle dorosły człowiek?', type: 'choice', options: ['106', '206', '306', '406'], correctIndex: 1 },
  { text: 'Która planeta jest największa w Układzie Słonecznym?', type: 'choice', options: ['Saturn', 'Neptun', 'Ziemia', 'Jowisz'], correctIndex: 3 },
  { text: 'Jaki jest symbol chemiczny złota?', type: 'choice', options: ['Ag', 'Au', 'Fe', 'Go'], correctIndex: 1 },
  { text: 'W jakiej temperaturze woda zamarza w skali Celsjusza?', type: 'choice', options: ['0°C', '10°C', '32°C', '100°C'], correctIndex: 0 },
  { text: 'Który narząd pompuje krew w ludzkim ciele?', type: 'choice', options: ['Płuca', 'Wątroba', 'Serce', 'Nerki'], correctIndex: 2 },
  { text: 'Jak nazywa się naturalny satelita Ziemi?', type: 'choice', options: ['Fobos', 'Księżyc', 'Europa', 'Tytan'], correctIndex: 1 },
  { text: 'Który metal jest cieczą w temperaturze pokojowej?', type: 'choice', options: ['Miedź', 'Aluminium', 'Rtęć', 'Cynk'], correctIndex: 2 },
  { text: 'Ile boków ma sześciokąt?', type: 'choice', options: ['Pięć', 'Sześć', 'Siedem', 'Osiem'], correctIndex: 1 },
  { text: 'Jak nazywa się proces, w którym ciecz zamienia się w gaz?', type: 'choice', options: ['Kondensacja', 'Krzepnięcie', 'Parowanie', 'Topnienie'], correctIndex: 2 },
  { text: 'Kto napisał powieść „Lalka”?', type: 'choice', options: ['Bolesław Prus', 'Henryk Sienkiewicz', 'Adam Mickiewicz', 'Stefan Żeromski'], correctIndex: 0 },
  { text: 'Kto jest autorem „Pana Tadeusza”?', type: 'choice', options: ['Juliusz Słowacki', 'Adam Mickiewicz', 'Jan Kochanowski', 'Cyprian Kamil Norwid'], correctIndex: 1 },
  { text: 'Jak ma na imię główny bohater serii książek o młodym czarodzieju J.K. Rowling?', type: 'choice', options: ['Harry', 'Ron', 'Neville', 'Percy'], correctIndex: 0 },
  { text: 'Który instrument ma zwykle 88 klawiszy?', type: 'choice', options: ['Akordeon', 'Fortepian', 'Organy', 'Ksylofon'], correctIndex: 1 },
  { text: 'Który malarz stworzył obraz „Mona Lisa”?', type: 'choice', options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet'], correctIndex: 2 },
  { text: 'Jak nazywa się polski hymn państwowy?', type: 'choice', options: ['Rota', 'Mazurek Dąbrowskiego', 'Bogurodzica', 'Warszawianka'], correctIndex: 1 },
  { text: 'Które miasto jest znane z wieży Eiffla?', type: 'choice', options: ['Paryż', 'Lyon', 'Bruksela', 'Genewa'], correctIndex: 0 },
  { text: 'Ile kolorów ma tradycyjnie tęcza?', type: 'choice', options: ['Pięć', 'Sześć', 'Siedem', 'Osiem'], correctIndex: 2 },
  { text: 'Jak nazywa się domowy adres internetowy strony, na przykład example.com?', type: 'choice', options: ['Domena', 'Bateria', 'Pamięć RAM', 'Kursor'], correctIndex: 0 },
  { text: 'Które zwierzę jest największym ssakiem na świecie?', type: 'choice', options: ['Słoń afrykański', 'Płetwal błękitny', 'Żyrafa', 'Orka'], correctIndex: 1 },
  { text: 'Ilu zawodników jednej drużyny piłkarskiej przebywa zwykle na boisku?', type: 'choice', options: ['9', '10', '11', '12'], correctIndex: 2 },
  { text: 'W jakim sporcie używa się rakiety i lotki?', type: 'choice', options: ['Squash', 'Badminton', 'Baseball', 'Rugby'], correctIndex: 1 },
  { text: 'Ile kół ma standardowy rower?', type: 'choice', options: ['Dwa', 'Trzy', 'Cztery', 'Pięć'], correctIndex: 0 },
  { text: 'Która figura szachowa porusza się w kształcie litery L?', type: 'choice', options: ['Wieża', 'Goniec', 'Skoczek', 'Hetman'], correctIndex: 2 },
  { text: 'W jakim sporcie rozgrywany jest turniej Wimbledon?', type: 'choice', options: ['Golf', 'Tenis', 'Krykiet', 'Hokej'], correctIndex: 1 },
  { text: 'Ile minut trwa jedna połowa standardowego meczu piłki nożnej, bez doliczonego czasu?', type: 'choice', options: ['30', '40', '45', '50'], correctIndex: 2 },
  { text: 'Które zwierzę jest znane z czarno-białego umaszczenia i jedzenia bambusa?', type: 'choice', options: ['Koala', 'Panda wielka', 'Lemur', 'Tapir'], correctIndex: 1 },
  { text: 'Jak nazywa się młode żaby, żyjące początkowo w wodzie?', type: 'choice', options: ['Kijanki', 'Larwy', 'Pisklęta', 'Nimfy'], correctIndex: 0 },
  { text: 'Który ptak potrafi zawisać w powietrzu, szybko machając skrzydłami?', type: 'choice', options: ['Struś', 'Koliber', 'Pingwin', 'Albatros'], correctIndex: 1 },
  { text: 'Ile nóg ma pająk?', type: 'choice', options: ['Sześć', 'Osiem', 'Dziesięć', 'Dwanaście'], correctIndex: 1 },
  { text: 'Ile minut ma jedna godzina?', type: 'choice', options: ['30', '45', '60', '90'], correctIndex: 2 },
  { text: 'Ile wynosi 9 × 7?', type: 'choice', options: ['56', '63', '72', '79'], correctIndex: 1 },
  { text: 'Ile wynosi połowa liczby 150?', type: 'choice', options: ['65', '70', '75', '80'], correctIndex: 2 },
  { text: 'Ile dni ma rok przestępny?', type: 'choice', options: ['364', '365', '366', '367'], correctIndex: 2 },
  { text: 'Ile milimetrów ma jeden centymetr?', type: 'choice', options: ['5', '10', '100', '1000'], correctIndex: 1 },
  { text: 'Który miesiąc ma zwykle najmniej dni?', type: 'choice', options: ['Luty', 'Kwiecień', 'Czerwiec', 'Wrzesień'], correctIndex: 0 },
  { text: 'W którym kierunku na mapie znajduje się wschód?', type: 'choice', options: ['Na górze', 'Na dole', 'Po prawej', 'Po lewej'], correctIndex: 2 },
  { text: 'Który z tych produktów zwykle robi się z kakao?', type: 'choice', options: ['Czekoladę', 'Chleb', 'Ser', 'Makaron'], correctIndex: 0 },
  { text: 'Jak nazywa się urządzenie mierzące temperaturę?', type: 'choice', options: ['Barometr', 'Termometr', 'Kompas', 'Higrometr'], correctIndex: 1 },
  { text: 'Czy Ziemia krąży wokół Słońca?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 0 },
  { text: 'Czy delfiny są rybami?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 1 },
  { text: 'Czy Polska należy do Unii Europejskiej?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 0 },
  { text: 'Czy dźwięk rozchodzi się w próżni?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 1 },
  { text: 'Czy pszczoły produkują miód?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 0 },
  { text: 'Czy Mount Everest leży w Alpach?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 1 },
  { text: 'Czy pingwiny są ptakami?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 0 },
  { text: 'Czy światło porusza się szybciej niż dźwięk?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 0 },
  { text: 'Czy stolicą Hiszpanii jest Barcelona?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 1 },
  { text: 'Czy rośliny potrzebują światła do fotosyntezy?', type: 'true_false', options: ['Prawda', 'Fałsz'], correctIndex: 0 }
];

/**
 * @param {unknown} questionCount
 * @param {(max: number) => number} [randomInteger]
 */
export function createRandomQuiz(questionCount, randomInteger = cryptoRandomInt) {
  if (typeof questionCount !== 'number' || !QUESTION_COUNTS.includes(questionCount)) {
    throw new Error(`Wybierz liczbę pytań: ${QUESTION_COUNTS.join(', ')}.`);
  }

  const selectedQuestions = shuffle(QUESTION_POOL, randomInteger).slice(0, questionCount);
  const questions = selectedQuestions.map((question) => {
    const answers = question.options.map((text, index) => ({ text, correct: index === question.correctIndex }));
    const shuffledAnswers = shuffle(answers, randomInteger);
    return {
      ...question,
      options: shuffledAnswers.map((answer) => answer.text),
      correctIndex: shuffledAnswers.findIndex((answer) => answer.correct)
    };
  });

  return { title: 'Quiz losowy', questions };
}

/**
 * @template T
 * @param {T[]} values
 * @param {(max: number) => number} randomInteger
 */
function shuffle(values, randomInteger) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
