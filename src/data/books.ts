import type { CategoryId } from "./categories";
import liveJson from "./live.json";

type LiveRow = { cover: string | null; file: { kind: "epub" | "pdf"; url: string } | null; availability?: Availability };
const live = liveJson as Record<string, LiveRow>;

/**
 * Reading availability, decided by licence:
 *  - "here"      public domain in the US and Pakistan with a public-domain English text; hosted in the library
 *  - "elsewhere" in copyright; catalogued with legitimate external links only
 *  - "review"    public domain in some jurisdictions but not the US; link-only until decided
 */
export type Availability = "here" | "elsewhere" | "review";

export interface Book {
  slug: string;
  title: string;
  author: string;
  category: CategoryId;
  year: number;
  pages: number;
  availability: Availability;
  licence: string;
  blurb: string;
  /** Set once the ingestion pipeline has stored a file (public URL). */
  file?: { kind: "epub" | "pdf"; url: string };
  /** Real cover (Supabase storage or Open Library), filled by the pipeline. */
  coverUrl?: string;
  /** Pipeline-verified source; until then external links are built from title + author. */
  sourceUrl?: string;
  addedAt: string;
}

const PD = "Public domain";
const PD_T = "Public domain (public-domain English translation)";
const C = "In copyright — external links only";
const R = "Public domain outside the US — needs a decision";

const b = (
  slug: string, title: string, author: string, category: CategoryId, year: number, pages: number,
  availability: Availability, licence: string, blurb: string, addedAt = "2026-10-31",
): Book => {
  const l = live[slug];
  return {
    slug, title, author, category, year, pages, licence, blurb, addedAt,
    // A book is readable here only when a public-domain file actually exists in storage.
    availability: l?.file ? "here" : availability === "here" ? "review" : availability,
    file: l?.file ?? undefined,
    coverUrl: l?.cover ?? undefined,
  };
};

export const books: Book[] = [
  // History & Civilizations
  b("a-short-history-of-nearly-everything", "A Short History of Nearly Everything", "Bill Bryson", "history", 2003, 544, "elsewhere", C, "Science from the Big Bang to us, told by someone who found it funny."),
  b("sapiens", "Sapiens", "Yuval Noah Harari", "history", 2011, 443, "elsewhere", C, "A sweeping history of humankind, from our origins to the present day."),
  b("homo-deus", "Homo Deus", "Yuval Noah Harari", "history", 2015, 449, "elsewhere", C, "Where humanity may go once hunger, plague and war are no longer our main problems."),
  b("guns-germs-and-steel", "Guns, Germs, and Steel", "Jared Diamond", "history", 1997, 480, "elsewhere", C, "Why some societies conquered others: geography, crops and animals, not genes."),
  b("the-lessons-of-history", "The Lessons of History", "Will & Ariel Durant", "history", 1968, 128, "elsewhere", C, "Twelve brief essays distilling a lifetime spent writing the story of civilization."),
  b("the-histories", "The Histories", "Herodotus", "history", -430, 640, "here", PD_T, "The first work of history ever written, and still one of the most entertaining."),
  b("the-republic", "The Republic", "Plato", "history", -375, 416, "here", PD_T, "Socrates on justice, the ideal city and why philosophers should rule."),
  b("the-muqaddimah", "The Muqaddimah", "Ibn Khaldun", "history", 1377, 512, "review", "Arabic original public domain; the standard English translation is in copyright", "The fourteenth-century introduction to history that invented sociology on the way."),
  b("our-oriental-heritage", "The Story of Civilization: Our Oriental Heritage", "Will Durant", "history", 1935, 1049, "elsewhere", C, "The first volume of Durant's monumental history, from Sumer to Japan."),
  b("the-analects", "The Analects", "Confucius", "history", -400, 256, "here", PD_T, "Proposed replacement for the duplicate entry: the sayings that shaped East Asia for two millennia."),

  // Philosophy & Critical Thinking
  b("meditations", "Meditations", "Marcus Aurelius", "philosophy", 170, 254, "here", PD_T, "The private notebook of a Roman emperor, written for no one but himself."),
  b("the-daily-stoic", "The Daily Stoic", "Ryan Holiday & Stephen Hanselman", "philosophy", 2016, 416, "elsewhere", C, "One Stoic meditation for every day of the year."),
  b("beyond-good-and-evil", "Beyond Good and Evil", "Friedrich Nietzsche", "philosophy", 1886, 240, "here", PD_T, "Nietzsche's assault on the moral certainties of his age."),
  b("thus-spoke-zarathustra", "Thus Spoke Zarathustra", "Friedrich Nietzsche", "philosophy", 1883, 352, "here", PD_T, "A philosophical novel about the death of God and what might come after."),
  b("the-problems-of-philosophy", "The Problems of Philosophy", "Bertrand Russell", "philosophy", 1912, 130, "here", PD, "The clearest short introduction to what philosophy actually asks."),
  b("the-story-of-philosophy", "The Story of Philosophy", "Will Durant", "philosophy", 1926, 592, "here", "Public domain in the US since 2022 (published 1926)", "The lives and ideas of the great philosophers, from Plato to Dewey."),
  b("the-art-of-thinking-clearly", "The Art of Thinking Clearly", "Rolf Dobelli", "philosophy", 2011, 384, "elsewhere", C, "Ninety-nine cognitive errors, one short chapter each."),
  b("thinking-fast-and-slow", "Thinking, Fast and Slow", "Daniel Kahneman", "philosophy", 2011, 499, "elsewhere", C, "The two systems of the mind, by the psychologist who won the economics Nobel."),
  b("the-nicomachean-ethics", "The Nicomachean Ethics", "Aristotle", "philosophy", -340, 400, "here", PD_T, "Aristotle on virtue, friendship and what a good life consists of."),
  b("letters-from-a-stoic", "Letters from a Stoic", "Seneca", "philosophy", 65, 256, "here", PD_T, "Advice from one Roman to another on time, death, wealth and how to live."),
  b("meditations-on-first-philosophy", "Meditations on First Philosophy", "René Descartes", "philosophy", 1641, 112, "here", PD_T, "Six meditations that doubt everything and rebuild knowledge from a single certainty."),

  // Science & Mathematics
  b("cosmos", "Cosmos", "Carl Sagan", "science", 1980, 365, "elsewhere", C, "The universe, and our place in it, from the most beloved explainer of science."),
  b("the-demon-haunted-world", "The Demon-Haunted World", "Carl Sagan", "science", 1995, 457, "elsewhere", C, "Science as a candle in the dark: how to think sceptically and why it matters."),
  b("a-brief-history-of-time", "A Brief History of Time", "Stephen Hawking", "science", 1988, 256, "elsewhere", C, "Black holes, the Big Bang and the nature of time, for readers without equations."),
  b("the-elegant-universe", "The Elegant Universe", "Brian Greene", "science", 1999, 448, "elsewhere", C, "String theory and the search for a single theory of everything."),
  b("the-selfish-gene", "The Selfish Gene", "Richard Dawkins", "science", 1976, 360, "elsewhere", C, "Evolution seen from the gene's point of view."),
  b("the-origin-of-species", "The Origin of Species", "Charles Darwin", "science", 1859, 502, "here", PD, "The book that explained how life changes, written with extraordinary care."),
  b("the-gene", "The Gene", "Siddhartha Mukherjee", "science", 2016, 592, "elsewhere", C, "An intimate history of the unit of heredity."),
  b("the-emperor-of-all-maladies", "The Emperor of All Maladies", "Siddhartha Mukherjee", "science", 2010, 571, "elsewhere", C, "A biography of cancer, from ancient Egypt to modern medicine."),
  b("surely-youre-joking-mr-feynman", "Surely You're Joking, Mr. Feynman!", "Richard Feynman", "science", 1985, 391, "elsewhere", C, "Adventures of a curious character who happened to win a Nobel Prize."),
  b("the-fabric-of-the-cosmos", "The Fabric of the Cosmos", "Brian Greene", "science", 2004, 569, "elsewhere", C, "Space, time and the texture of reality."),

  // Psychology & Human Behavior
  b("mans-search-for-meaning", "Man's Search for Meaning", "Viktor Frankl", "psychology", 1946, 165, "elsewhere", C, "A psychiatrist survives the camps and asks what makes life worth living."),
  b("influence", "Influence", "Robert Cialdini", "psychology", 1984, 320, "elsewhere", C, "The six principles of persuasion, and how to recognise them being used on you."),
  b("the-psychology-of-money", "The Psychology of Money", "Morgan Housel", "psychology", 2020, 256, "elsewhere", C, "Timeless lessons on wealth, greed and happiness."),
  b("predictably-irrational", "Predictably Irrational", "Dan Ariely", "psychology", 2008, 304, "elsewhere", C, "The hidden forces that shape our decisions."),
  b("the-power-of-habit", "The Power of Habit", "Charles Duhigg", "psychology", 2012, 371, "elsewhere", C, "Why we do what we do, and how habits can be changed."),
  b("thinking-in-bets", "Thinking in Bets", "Annie Duke", "psychology", 2018, 288, "elsewhere", C, "Making smarter decisions when you don't have all the facts."),
  b("behave", "Behave", "Robert Sapolsky", "psychology", 2017, 790, "elsewhere", C, "The biology of humans at our best and worst."),
  b("the-man-who-mistook-his-wife-for-a-hat", "The Man Who Mistook His Wife for a Hat", "Oliver Sacks", "psychology", 1985, 233, "elsewhere", C, "Clinical tales of the strangest things a brain can do."),

  // Economics & Finance
  b("the-wealth-of-nations", "The Wealth of Nations", "Adam Smith", "economics", 1776, 1076, "here", PD, "The founding text of economics, and still surprising on nearly every page."),
  b("capital-in-the-twenty-first-century", "Capital in the Twenty-First Century", "Thomas Piketty", "economics", 2013, 696, "elsewhere", C, "Three centuries of data on wealth and why inequality grows."),
  b("freakonomics", "Freakonomics", "Steven D. Levitt & Stephen J. Dubner", "economics", 2005, 320, "elsewhere", C, "A rogue economist explores the hidden side of everything."),
  b("poor-economics", "Poor Economics", "Abhijit V. Banerjee & Esther Duflo", "economics", 2011, 320, "elsewhere", C, "What actually works against global poverty, from randomised trials."),
  b("the-intelligent-investor", "The Intelligent Investor", "Benjamin Graham", "economics", 1949, 640, "elsewhere", C, "The definitive book on value investing."),
  b("the-millionaire-next-door", "The Millionaire Next Door", "Thomas J. Stanley & William D. Danko", "economics", 1996, 258, "elsewhere", C, "The surprising habits of people who quietly build wealth."),
  b("zero-to-one", "Zero to One", "Peter Thiel & Blake Masters", "economics", 2014, 224, "elsewhere", C, "Notes on startups, and how to build the future."),
  b("the-lean-startup", "The Lean Startup", "Eric Ries", "economics", 2011, 336, "elsewhere", C, "How to build a company by learning faster than everyone else."),
  b("the-personal-mba", "The Personal MBA", "Josh Kaufman", "economics", 2010, 464, "elsewhere", C, "The essential business ideas, without the tuition."),
  b("good-to-great", "Good to Great", "Jim Collins", "economics", 2001, 300, "elsewhere", C, "Why some companies make the leap and others don't."),

  // Technology & AI
  b("the-innovators", "The Innovators", "Walter Isaacson", "technology", 2014, 542, "elsewhere", C, "The hackers, geniuses and geeks who created the digital revolution."),
  b("life-3-0", "Life 3.0", "Max Tegmark", "technology", 2017, 364, "elsewhere", C, "Being human in the age of artificial intelligence."),
  b("superintelligence", "Superintelligence", "Nick Bostrom", "technology", 2014, 352, "elsewhere", C, "Paths, dangers and strategies for a world with minds greater than ours."),
  b("artificial-intelligence-a-modern-approach", "Artificial Intelligence: A Modern Approach", "Stuart Russell & Peter Norvig", "technology", 1995, 1136, "elsewhere", C, "The standard university textbook on AI."),
  b("code", "Code", "Charles Petzold", "technology", 1999, 400, "elsewhere", C, "The hidden language of computer hardware and software, from flashlights to CPUs."),
  b("the-pragmatic-programmer", "The Pragmatic Programmer", "Andrew Hunt & David Thomas", "technology", 1999, 352, "elsewhere", C, "From journeyman to master: the craft of writing software."),
  b("clean-code", "Clean Code", "Robert C. Martin", "technology", 2008, 464, "elsewhere", C, "A handbook of agile software craftsmanship."),
  b("the-singularity-is-near", "The Singularity Is Near", "Ray Kurzweil", "technology", 2005, 652, "elsewhere", C, "When humans transcend biology, according to its most confident prophet."),

  // Literature & Writing
  b("1984", "1984", "George Orwell", "literature", 1949, 328, "review", R, "Big Brother, doublethink and the most quoted dystopia ever written."),
  b("animal-farm", "Animal Farm", "George Orwell", "literature", 1945, 112, "review", R, "A fairy story about a revolution that eats itself."),
  b("crime-and-punishment", "Crime and Punishment", "Fyodor Dostoevsky", "literature", 1866, 545, "here", PD_T, "A murder, a conscience, and the long road to confession."),
  b("the-brothers-karamazov", "The Brothers Karamazov", "Fyodor Dostoevsky", "literature", 1880, 796, "here", PD_T, "Three brothers, a murdered father and every question that matters."),
  b("the-great-gatsby", "The Great Gatsby", "F. Scott Fitzgerald", "literature", 1925, 180, "here", PD, "Wealth, longing and the green light at the end of the dock."),
  b("to-kill-a-mockingbird", "To Kill a Mockingbird", "Harper Lee", "literature", 1960, 281, "elsewhere", C, "Justice and childhood in a small Alabama town."),
  b("pride-and-prejudice", "Pride and Prejudice", "Jane Austen", "literature", 1813, 432, "here", PD, "The wittiest novel in English about marriage, money and misjudgement."),
  b("the-count-of-monte-cristo", "The Count of Monte Cristo", "Alexandre Dumas", "literature", 1844, 1276, "here", PD_T, "Betrayal, a fortune, and the most patient revenge in literature."),
  b("don-quixote", "Don Quixote", "Miguel de Cervantes", "literature", 1605, 1023, "here", PD_T, "The first modern novel, about a man who believed the books."),
  b("the-stranger", "The Stranger", "Albert Camus", "literature", 1942, 123, "review", R, "A man, a beach, a murder, and an indifferent universe."),

  // Politics & Society
  b("the-prince", "The Prince", "Niccolò Machiavelli", "politics", 1532, 140, "here", PD_T, "How to gain power and keep it, with unsettling honesty."),
  b("the-social-contract", "The Social Contract", "Jean-Jacques Rousseau", "politics", 1762, 168, "here", PD_T, "Man is born free, and everywhere he is in chains."),
  b("the-communist-manifesto", "The Communist Manifesto", "Karl Marx & Friedrich Engels", "politics", 1848, 64, "here", PD_T, "The pamphlet that reorganised the twentieth century."),
  b("democracy-in-america", "Democracy in America", "Alexis de Tocqueville", "politics", 1835, 992, "here", PD_T, "A Frenchman's astonishingly perceptive tour of the young republic."),
  b("the-clash-of-civilizations", "The Clash of Civilizations", "Samuel P. Huntington", "politics", 1996, 368, "elsewhere", C, "The remaking of world order along cultural lines."),
  b("the-open-society-and-its-enemies", "The Open Society and Its Enemies", "Karl Popper", "politics", 1945, 768, "elsewhere", C, "A defence of liberal democracy against Plato, Hegel and Marx."),

  // Geography & World Cultures
  b("the-silk-roads", "The Silk Roads", "Peter Frankopan", "geography", 2015, 636, "elsewhere", C, "A new history of the world, with its centre moved east."),
  b("orientalism", "Orientalism", "Edward Said", "geography", 1978, 368, "elsewhere", C, "How the West imagined the East, and why it mattered."),
  b("factfulness", "Factfulness", "Hans Rosling", "geography", 2018, 342, "elsewhere", C, "Ten reasons we're wrong about the world, and why things are better than you think."),

  // Biographies & Great Personalities
  b("steve-jobs", "Steve Jobs", "Walter Isaacson", "biography", 2011, 656, "elsewhere", C, "The authorised biography of a difficult genius."),
  b("leonardo-da-vinci", "Leonardo da Vinci", "Walter Isaacson", "biography", 2017, 624, "elsewhere", C, "The original polymath, through his notebooks."),
  b("einstein-his-life-and-universe", "Einstein: His Life and Universe", "Walter Isaacson", "biography", 2007, 675, "elsewhere", C, "How a patent clerk rewrote physics."),
  b("the-autobiography-of-benjamin-franklin", "The Autobiography of Benjamin Franklin", "Benjamin Franklin", "biography", 1791, 160, "here", PD, "A printer, scientist and statesman explains how he made himself."),
  b("long-walk-to-freedom", "Long Walk to Freedom", "Nelson Mandela", "biography", 1994, 656, "elsewhere", C, "Twenty-seven years in prison, and what came after."),
  b("the-diary-of-a-young-girl", "The Diary of a Young Girl", "Anne Frank", "biography", 1947, 283, "review", "Copyright status contested between jurisdictions — needs a decision", "Two years in hiding, written by a girl who wanted to be a writer."),

  // Personal Development & Mastery
  b("mastery", "Mastery", "Robert Greene", "mastery", 2012, 318, "elsewhere", C, "The path from apprentice to master, through the lives of those who walked it."),
  b("deep-work", "Deep Work", "Cal Newport", "mastery", 2016, 296, "elsewhere", C, "Rules for focused success in a distracted world."),
  b("atomic-habits", "Atomic Habits", "James Clear", "mastery", 2018, 320, "elsewhere", C, "Tiny changes, remarkable results."),
  b("so-good-they-cant-ignore-you", "So Good They Can't Ignore You", "Cal Newport", "mastery", 2012, 304, "elsewhere", C, "Why skills trump passion in the quest for work you love."),
  b("think-and-grow-rich", "Think and Grow Rich", "Napoleon Hill", "mastery", 1937, 238, "review", "Widely reported as unrenewed and public domain in the US — pipeline must confirm before hosting", "The 1937 self-help classic that started the genre."),
  b("the-7-habits-of-highly-effective-people", "The 7 Habits of Highly Effective People", "Stephen R. Covey", "mastery", 1989, 381, "elsewhere", C, "Principle-centred habits for personal and professional effectiveness."),
  b("grit", "Grit", "Angela Duckworth", "mastery", 2016, 352, "elsewhere", C, "The power of passion and perseverance."),
  b("the-almanack-of-naval-ravikant", "The Almanack of Naval Ravikant", "Eric Jorgenson", "mastery", 2020, 242, "elsewhere", "Free to read online with the author's permission; links only", "A guide to wealth and happiness, assembled from a decade of tweets and talks."),
  b("the-art-of-learning", "The Art of Learning", "Josh Waitzkin", "mastery", 2007, 288, "elsewhere", C, "A chess prodigy turned martial-arts champion on how mastery is actually built."),

  // Art & Creativity
  b("the-creative-act", "The Creative Act", "Rick Rubin", "art", 2023, 432, "elsewhere", C, "A way of being, from the producer who shaped forty years of music."),
  b("steal-like-an-artist", "Steal Like an Artist", "Austin Kleon", "art", 2012, 160, "elsewhere", C, "Ten things nobody told you about being creative."),
  b("on-writing", "On Writing", "Stephen King", "art", 2000, 288, "elsewhere", C, "A memoir of the craft, by the most prolific storyteller alive."),
  b("the-elements-of-style", "The Elements of Style", "William Strunk Jr.", "art", 1918, 52, "here", "Public domain (the 1918 Strunk edition; the Strunk & White edition is in copyright)", "Omit needless words. The little book that taught a century to write."),
  b("the-war-of-art", "The War of Art", "Steven Pressfield", "art", 2002, 190, "elsewhere", C, "Breaking through the blocks that stand between you and your work."),

  // Additional intellectual challenges (shelved with their disciplines)
  b("the-interpretation-of-dreams", "The Interpretation of Dreams", "Sigmund Freud", "psychology", 1899, 630, "here", PD_T, "The book that opened the unconscious for business."),
  b("the-world-as-will-and-representation", "The World as Will and Representation", "Arthur Schopenhauer", "philosophy", 1818, 534, "here", PD_T, "Pessimism, art and the blind striving beneath all things."),
  b("tao-te-ching", "Tao Te Ching", "Lao Tzu", "philosophy", -400, 96, "here", PD_T, "Eighty-one verses on the way that cannot be named."),
  b("the-bhagavad-gita", "The Bhagavad Gita", "Attributed to Vyasa", "philosophy", -200, 160, "here", PD_T, "A warrior's crisis on the battlefield, answered by a god."),
];

export const bookBySlug = Object.fromEntries(books.map((bk) => [bk.slug, bk])) as Record<string, Book>;

export function booksInCategory(id: CategoryId) {
  return books.filter((bk) => bk.category === id);
}

/** Legitimate external destinations, built from title + author (replaced by verified URLs by the pipeline). */
export function externalLinks(book: Book) {
  const q = encodeURIComponent(`${book.title} ${book.author}`);
  const links = [
    { label: "Open Library", href: `https://openlibrary.org/search?q=${q}` },
    { label: "Google Books", href: `https://www.google.com/books/edition/_/?q=${q}` },
  ];
  if (book.availability !== "elsewhere") {
    links.unshift({ label: "Project Gutenberg", href: `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(book.title)}` });
    links.push({ label: "Standard Ebooks", href: `https://standardebooks.org/ebooks?query=${encodeURIComponent(book.title)}` });
  }
  return links;
}

export const availabilityLabel: Record<Availability, string> = {
  here: "Read here",
  elsewhere: "Read elsewhere",
  review: "Under review",
};
