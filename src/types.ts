export interface Synonym {
  term: string;
  partsOfSpeech: string[];
  tags: string[];
}

export interface Definition {
  term: string;
  partOfSpeech: string;
  tags: string[];
  definition: string;
  pronunciation: string;
}


export interface SynonymProvider {
    getSynonyms(word: string, line: string, wordIndex: number): Promise<Synonym[] | null>
}