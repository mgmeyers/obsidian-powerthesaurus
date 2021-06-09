import { Plugin, debounce, MarkdownView } from "obsidian";

import { constructThesaurusPopover } from "./popover";
import { PowerThesaurusProvider } from "./PowerThesaurusProvider";

const spaceRegEx = /\s/;

export default class PowerThesaurusPlugin extends Plugin {
  destroyPopover: (() => void) | null = null;
  isPopoverLoading = false;

  handlePointerUp = debounce(
    () => {
      const activeLeaf = this.app.workspace.activeLeaf;

      if (activeLeaf && activeLeaf.view instanceof MarkdownView) {
        const view = activeLeaf.view;

        if (view.getMode() === "source") {
          const selection = view.editor.getSelection();

          if (!selection || spaceRegEx.test(selection)) return;

          const cursor = view.editor.getCursor("from");
          const line = view.editor.getLine(cursor.line);

          this.isPopoverLoading = true;

          new PowerThesaurusProvider()
            .getSynonyms(selection, line, cursor.ch)
            .then((list) => {
              if (list?.length && this.isPopoverLoading) {
                this.isPopoverLoading = false;
                this.destroyPopover = constructThesaurusPopover({
                  list,
                  selection,
                  editor: view.editor,
                });
              }
            })
            .catch((e) => {
              console.error(e);
            });
        }
      }
    },
    300,
    true
  );

  async onload() {
    document.on("pointerup", ".CodeMirror-line", this.handlePointerUp);

    this.registerDomEvent(window, "keydown", () => {
      if (this.isPopoverLoading) {
        this.isPopoverLoading = false;
      }

      if (this.destroyPopover) {
        this.destroyPopover();
      }
    });
  }

  onunload() {
    document.off("pointerup", ".CodeMirror-line", this.handlePointerUp);

    if (this.isPopoverLoading) {
      this.isPopoverLoading = false;
    }

    if (this.destroyPopover) {
      this.destroyPopover();
      this.destroyPopover = null;
    }
  }
}
