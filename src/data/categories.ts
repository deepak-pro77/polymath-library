export type CategoryId =
  | "history"
  | "philosophy"
  | "science"
  | "psychology"
  | "economics"
  | "technology"
  | "literature"
  | "politics"
  | "geography"
  | "biography"
  | "mastery"
  | "art";

export type Mark = "gold" | "oxblood" | "sage";

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  blurb: string;
  mark: Mark;
  icon: "column" | "laurel" | "atom" | "brain" | "chart" | "chip" | "book" | "scale" | "globe" | "bust" | "flame" | "palette";
}

export const categories: Category[] = [
  { id: "history", name: "History & Civilizations", short: "History", blurb: "How we got here, and who paid for it.", mark: "oxblood", icon: "column" },
  { id: "philosophy", name: "Philosophy & Critical Thinking", short: "Philosophy", blurb: "The tools for thinking about thinking.", mark: "gold", icon: "laurel" },
  { id: "science", name: "Science & Mathematics", short: "Science", blurb: "What the universe is made of.", mark: "sage", icon: "atom" },
  { id: "psychology", name: "Psychology & Human Behavior", short: "Psychology", blurb: "Why people do what they do.", mark: "sage", icon: "brain" },
  { id: "economics", name: "Economics & Finance", short: "Economics", blurb: "Incentives, markets and money.", mark: "gold", icon: "chart" },
  { id: "technology", name: "Technology & AI", short: "Technology", blurb: "The machines, and what they want.", mark: "sage", icon: "chip" },
  { id: "literature", name: "Literature & Writing", short: "Literature", blurb: "The novels that outlived their centuries.", mark: "oxblood", icon: "book" },
  { id: "politics", name: "Politics & Society", short: "Politics", blurb: "Power, and how it is organised.", mark: "oxblood", icon: "scale" },
  { id: "geography", name: "Geography & World Cultures", short: "Geography", blurb: "Places, peoples and the spaces between.", mark: "sage", icon: "globe" },
  { id: "biography", name: "Biographies & Great Personalities", short: "Biography", blurb: "Lives worth studying closely.", mark: "oxblood", icon: "bust" },
  { id: "mastery", name: "Personal Development & Mastery", short: "Mastery", blurb: "Craft, discipline and deliberate practice.", mark: "gold", icon: "flame" },
  { id: "art", name: "Art & Creativity", short: "Art", blurb: "Making things, and making them well.", mark: "gold", icon: "palette" },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategoryId, Category>;
