const TEMP_LANG = 'en';

function getURL(sentence: string, lang: string) {
    return `https://systran-systran-platform-for-language-processing-v1.p.rapidapi.com/nlp/morphology/extract/pos?input=${encodeURIComponent(sentence)}&lang=${lang}`
}

interface POSResponse {
    partsOfSpeech: Array<{
        start: number,
        end: number,
        text: string,
        pos: string
    }>
}

export async function getPOS(line: string, termIndex: number) {
    const sentences = line.split(/[.!?]/g);
    let seen = 0;
  
    for (let sentence of sentences) {
      if (seen <= termIndex && termIndex <= seen + sentence.length) {
        const result = await fetch(getURL(sentence, TEMP_LANG), {
            "method": "GET",
            "headers": {
                "x-rapidapi-key": "5e1aff4a8dmsh29e6efbd0a66e0ep1c9b55jsn31b784e15a17",
                "x-rapidapi-host": "systran-systran-platform-for-language-processing-v1.p.rapidapi.com"
            }
        })
    
        const json = await result.json() as POSResponse;

        const wordIndex = termIndex - seen;
        const match = json.partsOfSpeech?.find(pos => pos.start === wordIndex);

        if (match) {
            const posStr = match.pos.split('/')[1];
            
            if (posStr.startsWith('noun')) return 2;
            if (posStr.startsWith('verb')) return 6;
            if (posStr.startsWith('adj')) return 1;
            if (posStr.startsWith('adv')) return 4;
        }

        break;
      }
  
      seen += sentence.length + 1;
    }

    return null
}