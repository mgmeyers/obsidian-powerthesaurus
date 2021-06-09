import { Synonym, SynonymProvider } from "./types";

const apiUrl = "https://api.datamuse.com/words?md=p&rel_syn=";

async function getDefinition(term: string, lc?: string, rc?: string) {
  let url = `https://api.datamuse.com/words?sp=${term}&md=pd&max=1`;

  if (lc) {
    url += `&lc=${lc}`;
  }

  if (rc) {
    url += `&rc=${rc}`;
  }

  const res = await fetch(url);
  const json = (await res.json()) as Array<{
    word: string;
    tags: string[];
    defs: string[];
  }>;

  if (json.length) {
    return json[0].defs.map((def) => {
      const split = def.split(/\t/);
      return {
        pos: split[0],
        def: split[1],
      };
    });
  }

  return null;
}

async function getMeansLike(def: string, pos: string): Promise<Synonym[]> {
  let url = `https://api.datamuse.com/words?md=p&ml=${def.replace(/\s/g, "+")}`;

  const res = await fetch(url);
  const json = (await res.json()) as Array<{ word: string; tags: string[] }>;

  return json
    .filter((r) => r.tags?.contains("syn") || r.tags?.contains(pos))
    .map((r) => {
      return {
        term: r.word,
        tags: [],
        partsOfSpeech: r.tags,
      };
    })
    .slice(0, 10);
}

export class DataMuseProvider implements SynonymProvider {
  async getSynonyms(
    term: string,
    line: string,
    termIndex: number
  ): Promise<null | Synonym[]> {
    try {
      const sentences = line.split(/(?:\.!;:\(\)\[\]\?)/g);

      let seen = 0;
      let lc: string;
      let rc: string;

      for (let sentence of sentences) {
        if (seen <= termIndex && termIndex <= seen + sentence.length) {
          const targetSentence = sentence.trim();
          const beforeWord = targetSentence
            .substring(0, termIndex - seen - 1)
            .trim();
          const afterWord = targetSentence
            .substr(termIndex + term.length)
            .trim();

          if (beforeWord) {
            lc = beforeWord.split(/\s+/g).pop();
          }

          if (afterWord) {
            rc = afterWord.split(/\s+/g).shift();
          }

          break;
        }

        seen += sentence.length + 1;
      }

      let url = apiUrl + term;

      if (lc) {
        url += `&lc=${lc}`;
      }

      if (rc) {
        url += `&rc=${rc}`;
      }

      const response = await fetch(url);
      const data = (await response.json()) as Array<{
        word: string;
        tags: string[];
      }>;

      return data.map((d) => {
        return {
          term: d.word,
          tags: [],
          partsOfSpeech: d.tags,
        };
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
