import { Synonym } from "./api";
import { matchCasing } from "match-casing";

import "./popover.css";

const POS_MAP: { [k: number]: string } = {
  1: "adj.",
  2: "n.",
  4: "adv.",
  6: "v.",
  7: "int.",
  9: "conj.",
  10: "prep.",
};

function getPosString(synonym: Synonym) {
  const pos = synonym?.pos.reduce<string[]>((mapped, p) => {
    if (POS_MAP[p]) {
      mapped.push(POS_MAP[p]);
    }

    return mapped;
  }, []);

  if (pos?.length) {
    return pos.join(", ");
  }

  return null;
}

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
  codeMirrorInstance: CodeMirror.Editor;
  selection: string;
}

export function constructThesaurusPopover({
  list,
  codeMirrorInstance,
  selection,
}: ConstructThesaurusPopoverParams) {
  const widget = createDiv({ cls: "pt-select" }, (div) => {
    list.forEach((synonym, i) => {
      div.createDiv({ cls: "pt-select-option" }, (option) => {
        option.dataset.index = i.toString();
        option.createDiv({ cls: "pt-select-label" }, (label) => {
          label.createDiv({ cls: "pt-term", text: synonym.term });
          label.createDiv({
            cls: "pt-meta-pos",
            text: getPosString(synonym),
          });
        });
        if (synonym.tags?.length) {
          option.createDiv({
            cls: "pt-meta-tags",
            text: synonym.tags.join(", "),
          });
        }
      });
    });

    div.createDiv({ cls: "pt-link-option" }, (div) => {
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

    div.createDiv({ cls: "pt-link-option" }, (div) => {
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
    widget.remove();
    document.body.removeEventListener("pointerdown", clickOutsideHandler);
    document.removeEventListener("keydown", escHandler);
  };

  const coords = codeMirrorInstance.cursorCoords(true, "window");

  widget.on("click", ".pt-select-option", (e, el) => {
    codeMirrorInstance.replaceSelection(
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
}
