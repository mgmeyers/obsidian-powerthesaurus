import { Plugin, debounce } from "obsidian";
import { getSynonyms } from "./api";
import { constructThesaurusPopover } from "./popover";

const spaceRegEx = /\s/;

export default class PowerThesaurusPlugin extends Plugin {
  async onload() {
    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      const cursorHandler = debounce((instance: CodeMirror.Editor) => {
        if (!navigator.onLine) {
          return;
        }
        
        const selection = instance.getSelection();

        if (!selection || spaceRegEx.test(selection)) {
          return;
        }

        getSynonyms(selection).then((list) => {
          if (list) {
            constructThesaurusPopover({
              list,
              selection,
              codeMirrorInstance: instance,
            });
          }
        });
      }, 1000);

      cm.on("cursorActivity", cursorHandler);
    });
  }

  onunload() {}
}
