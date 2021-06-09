import { getPOS } from "./POSProvider";
import { Synonym, SynonymProvider } from "./types";

const apiUrl = "https://api.powerthesaurus.org/";

const POS_MAP: { [k: number]: string } = {
  1: "adj",
  2: "n",
  4: "adv",
  6: "v",
  7: "int",
  9: "conj",
  10: "prep",
};

export class PowerThesaurusProvider implements SynonymProvider {
  static appendAttribution(containerEl: HTMLElement, selection: string) {
    containerEl.createDiv({ cls: "pt-link-option" }, (div) => {
      div.createEl(
        "a",
        {
          cls: "external-link",
          text: "See more results",
          href: `https://www.powerthesaurus.org/${selection.toLowerCase()}/synonyms`,
        },
        (a) => {
          a.target = "_blank";
        }
      );
    });

    containerEl.createDiv({ cls: "pt-link-option" }, (div) => {
      div.createEl(
        "a",
        {
          cls: "external-link pt-powered-by",
          text: "Powered by power thesaurus",
          href: `https://www.powerthesaurus.org/`,
        },
        (a) => {
          a.target = "_blank";
        }
      );
    });
  }
  async getSynonyms(term: string, line: string, termIndex: number): Promise<null | Synonym[]> {
    try {
      const pos = await getPOS(line, termIndex);
      const termIdResult = await getTermId(term);
      const terms = termIdResult?.data?.search?.terms;
  
      if (pos && terms && terms.length) {
        const termId = terms[0].id;
        const searchResult = await getRelatedWords(termId, pos);
  
        const edges = searchResult?.data?.thesauruses?.edges;
  
        if (edges && edges.length) {
          const list = edges.map((edge: any) => {
            const tags = edge?.node?.relations?.tags;
            const pos = edge?.node?.relations?.parts_of_speech.map((p: number) => POS_MAP[p]);
            const term = edge?.node?.targetTerm?.name;
  
            return {
              term,
              pos,
              tags,
            };
          });

          return list;
        }
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}


export const SEARCH_QUERY = `query SEARCH_QUERY($query: String!) {
      search(query: $query) {
        terms {
          id
          name
          slug
          counters
          __typename
    }
    list
    correctedFrom
    __typename
  }
}`;

async function getTermId(term: string) {
  const response = await fetch(apiUrl, {
    method: "POST",
    //   mode: 'no-cors',
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Obsidian-PowerThesaurus/0.0.1",
    },
    body: JSON.stringify({
      operationName: "SEARCH_QUERY",
      variables: { query: term },
      query: SEARCH_QUERY,
    }),
  });

  return response.json();
}

export const THESAURUSES_QUERY = `query THESAURUSES_QUERY($after: String, $first: Int, $before: String, $last: Int, $termID: ID!, $list: List!, $sort: ThesaurusSorting!, $tagID: Int, $posID: Int, $syllables: Int, $type: Type) {
      thesauruses(
        termId: $termID
        sort: $sort
        list: $list
        after: $after
        first: $first
        before: $before
        last: $last
        tagId: $tagID
        partOfSpeechId: $posID
        syllables: $syllables
        type: $type
      ) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
          __typename
    }
    edges {
          node {
            _type
            id
            isPinned
            targetTerm {
              id
              name
              slug
              __typename
        }
        relations
        rating
        vote {
              voteType
              id
              __typename
        }
        votes
        __typename
      }
      __typename
    }
    __typename
  }
}`;

async function getRelatedWords(termId: string, pos: number = null) {
  const response = await fetch(apiUrl, {
    method: "POST",
    //   mode: 'no-cors',
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Obsidian-PowerThesaurus/0.0.1",
    },
    body: JSON.stringify({
      operationName: "THESAURUSES_QUERY",
      variables: {
        list: "SYNONYM",
        termID: termId,
        sort: { field: "RATING", direction: "DESC" },
        tagID: null,
        limit: 20,
        syllables: null,
        query: null,
        posID: null,
        first: 20,
        after: "",
      },
      query: THESAURUSES_QUERY,
    }),
  });

  return response.json();
}
