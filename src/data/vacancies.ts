export type Vacancy = {
  id: number;
  title: string;
  company: string;
  initials: string;
  location: string;
  schedule: string;
  salary: string;
  stack: string[];
  description: string;
  requirements: string[];
  createdAt: string;
};

export const vacancies: Vacancy[] = [
  {
    id: 1,
    title: "Junior Frontend Developer",
    company: "NovaScale Systems",
    initials: "NV",
    location: "Київ",
    schedule: "Віддалено",
    salary: "25 000–40 000 ₴",
    stack: ["React", "TypeScript", "JavaScript"],
    description:
      "Долучайся до команди вебпродукту: працюй поруч із досвідченими розробниками та поступово бери на себе нові задачі.",
    requirements: ["Базові знання React і TypeScript", "Розуміння HTML та CSS", "Готовність навчатися в команді"],
    createdAt: "2026-11-01T12:00:00.000Z",
  },
  {
    id: 2,
    title: "Junior Node.js Developer",
    company: "CyberLogic Systems",
    initials: "CL",
    location: "Львів",
    schedule: "Гібридно",
    salary: "28 000–42 000 ₴",
    stack: ["Node.js", "JavaScript", "TypeScript"],
    description:
      "Допомагай розвивати API та внутрішні інструменти. На старті передбачені менторство й регулярний перегляд прогресу.",
    requirements: ["Основи JavaScript і Node.js", "Знайомство з REST API", "Базові знання Git"],
    createdAt: "2026-10-28T12:00:00.000Z",
  },
  {
    id: 3,
    title: "Junior QA Engineer",
    company: "TerraX Labs",
    initials: "TX",
    location: "Віддалено",
    schedule: "Віддалено",
    salary: "22 000–35 000 ₴",
    stack: ["Manual QA", "API", "SQL"],
    description:
      "Перевіряй якість вебзастосунків, описуй сценарії та співпрацюй із розробниками над покращенням продукту.",
    requirements: ["Розуміння циклу тестування", "Уважність до деталей", "Базове знайомство з API"],
    createdAt: "2026-10-24T12:00:00.000Z",
  },
  {
    id: 4,
    title: "Trainee Python Developer",
    company: "DataNest",
    initials: "DN",
    location: "Київ",
    schedule: "Гібридно",
    salary: "20 000–32 000 ₴",
    stack: ["Python", "Django", "SQL"],
    description:
      "Почни кар'єру з невеликих backend-задач і розвивай навички Python у команді з відкритим код-рев'ю.",
    requirements: ["Основи Python", "Базовий SQL", "Бажання розвиватися в backend"],
    createdAt: "2026-10-19T12:00:00.000Z",
  },
  {
    id: 5,
    title: "Junior Java Developer",
    company: "NovaScale Systems",
    initials: "NV",
    location: "Дніпро",
    schedule: "Віддалено",
    salary: "27 000–41 000 ₴",
    stack: ["Java", "Spring", "SQL"],
    description:
      "Працюй над сервісами для фінансової платформи та вивчай практики побудови надійних backend-систем.",
    requirements: ["Основи Java", "Знайомство з ООП", "Базове розуміння реляційних баз даних"],
    createdAt: "2026-10-14T12:00:00.000Z",
  },
  {
    id: 6,
    title: "Junior UI Developer",
    company: "BrightPath",
    initials: "BP",
    location: "Віддалено",
    schedule: "Віддалено",
    salary: "24 000–38 000 ₴",
    stack: ["JavaScript", "React", "CSS"],
    description:
      "Допомагай створювати доступні інтерфейси й перетворювати дизайн-макети на зрозумілі вебсторінки.",
    requirements: ["Основи JavaScript і CSS", "Увага до деталей інтерфейсу", "Інтерес до доступності"],
    createdAt: "2026-10-09T12:00:00.000Z",
  },
];
