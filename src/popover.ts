import { Editor } from "obsidian";
import { Synonym } from "./types";
import { matchCasing } from "match-casing";

import "./popover.css";

function repositionWidget(
  widget: HTMLDivElement,
  coords: { left: number; top: number; bottom: number }
) {
  const height = widget.clientHeight;
  const width = widget.clientWidth;

  if (coords.bottom + height > window.innerHeight) {
    widget.style.setProperty("top", `${coords.top - height}px`);
  }

  if (coords.left + width > window.innerWidth) {
    widget.style.setProperty("left", `${window.innerWidth - width - 15}px`);
  }
}

interface ConstructThesaurusPopoverParams {
  list: Synonym[];
  editor: Editor;
  selection: string;
}

export function constructThesaurusPopover({
  list,
  editor,
  selection,
}: ConstructThesaurusPopoverParams) {
  let isDestroyed = false;

  const widget = createDiv({ cls: "pt-select" }, (div) => {
    list.forEach((synonym, i) => {
      div.createDiv({ cls: "pt-select-option" }, (option) => {
        option.dataset.index = i.toString();

        option.createDiv({ cls: "pt-select-label" }, (label) => {
          label.createDiv({ cls: "pt-term", text: synonym.term });
          if (synonym.partsOfSpeech?.length) {
            label.createDiv({
              cls: "pt-meta-pos",
              text: synonym.partsOfSpeech.join(", "),
            });
          }
        });

        if (synonym.tags?.length) {
          option.createDiv({
            cls: "pt-meta-tags",
            text: synonym.tags.join(", "),
          });
        }
      });
    });
  });

  const clickOutsideHandler = (e: MouseEvent) => {
    const isTargetInWidget =
      e.target instanceof Node && widget.contains(e.target);

    if (!isTargetInWidget) {
      selfDestruct();
    }
  };

  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      selfDestruct();
    }
  };

  const selfDestruct = () => {
    if (isDestroyed) return;

    isDestroyed = true;
    widget.remove();
    document.body.removeEventListener("pointerdown", clickOutsideHandler);
    document.removeEventListener("keydown", escHandler);
  };

  let coords: { top: number; left: number; bottom: number };

  if ((editor as any).cursorCoords) {
    coords = (editor as any).cursorCoords(true, "window");
  } else if ((editor as any).coordsAtPos) {
    const offset = editor.posToOffset(editor.getCursor("from"));
    coords = (editor as any).coordsAtPos(offset);
  } else {
    return;
  }

  widget.on("click", ".pt-select-option", (e, el) => {
    editor.replaceSelection(
      matchCasing(list[parseInt(el.dataset.index)].term, selection)
    );
    selfDestruct();
  });

  widget.style.left = `${coords.left}px`;
  widget.style.top = `${coords.bottom}px`;

  document.body.appendChild(widget);

  repositionWidget(widget, coords);

  document.body.addEventListener("pointerdown", clickOutsideHandler);
  document.addEventListener("keydown", escHandler);

  return selfDestruct;
}
