import { Plugin, debounce } from "obsidian";
import { getSynonyms } from "./api";
import { constructThesaurusPopover } from "./popover";

const spaceRegEx = /\s/;

export default class PowerThesaurusPlugin extends Plugin {
  destroyPopover: (() => void) | null = null;

  async onload() {
    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      const cursorHandler = debounce((instance: CodeMirror.Editor) => {
        const selection = instance.getSelection();

        if (!selection || spaceRegEx.test(selection)) {
          return;
        }

        getSynonyms(selection).then((list) => {
          if (list) {
            this.destroyPopover = constructThesaurusPopover({
              list,
              selection,
              codeMirrorInstance: instance,
            });
          }
        });
      }, 1000);

      cm.on("cursorActivity", instance => {
        if (this.destroyPopover) {
          this.destroyPopover();
          this.destroyPopover = null;
        }

        if (!navigator.onLine) {
          return;
        }

        cursorHandler(instance);
      });
    });
  }

  onunload() {
    if (this.destroyPopover) {
      this.destroyPopover();
      this.destroyPopover = null;
    }
  }
}
