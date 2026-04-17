import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, NodeSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

const HANDLE_ID = "cabinet-drag-handle";

function findBlockAt(view: EditorView, coords: { left: number; top: number }) {
  const pos = view.posAtCoords(coords);
  if (!pos) return null;
  let $pos = view.state.doc.resolve(pos.inside >= 0 ? pos.inside : pos.pos);
  while ($pos.depth > 0 && !$pos.parent.type.isBlock) {
    $pos = view.state.doc.resolve($pos.before());
  }
  // Walk up until we find a top-level child of the doc
  let depth = $pos.depth;
  while (depth > 1) {
    const parent = view.state.doc.resolve($pos.before(depth)).parent;
    if (parent.type.name === "doc") break;
    depth -= 1;
  }
  const nodePos = depth === 0 ? 0 : $pos.before(Math.max(depth, 1));
  const node = view.state.doc.nodeAt(nodePos);
  if (!node) return null;
  const dom = view.nodeDOM(nodePos) as HTMLElement | null;
  return { pos: nodePos, node, dom };
}

function getOrCreateHandle(): HTMLDivElement {
  let el = document.getElementById(HANDLE_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = HANDLE_ID;
    el.setAttribute("data-drag-handle", "true");
    el.draggable = true;
    el.innerHTML = `<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="2.5" cy="3" r="1.2"/><circle cx="2.5" cy="8" r="1.2"/><circle cx="2.5" cy="13" r="1.2"/><circle cx="7.5" cy="3" r="1.2"/><circle cx="7.5" cy="8" r="1.2"/><circle cx="7.5" cy="13" r="1.2"/></svg>`;
    Object.assign(el.style, {
      position: "absolute",
      display: "none",
      cursor: "grab",
      padding: "2px 4px",
      borderRadius: "4px",
      color: "var(--muted-foreground)",
      opacity: "0.55",
      zIndex: "40",
      userSelect: "none",
      transition: "opacity 120ms ease",
    } as CSSStyleDeclaration);
    el.addEventListener("mouseenter", () => (el!.style.opacity = "1"));
    el.addEventListener("mouseleave", () => (el!.style.opacity = "0.55"));
    document.body.appendChild(el);
  }
  return el;
}

export const DragHandle = Extension.create({
  name: "dragHandle",

  addProseMirrorPlugins() {
    let currentBlock: { pos: number; node: { nodeSize: number }; dom: HTMLElement } | null = null;

    const handle = typeof document !== "undefined" ? getOrCreateHandle() : null;

    const hide = () => {
      if (handle) handle.style.display = "none";
      currentBlock = null;
    };

    return [
      new Plugin({
        key: new PluginKey("cabinetDragHandle"),
        view: (view) => {
          if (!handle) return { destroy: () => {} };

          const onMouseMove = (event: MouseEvent) => {
            if (!view.editable) return;
            const rect = view.dom.getBoundingClientRect();
            if (
              event.clientX < rect.left - 60 ||
              event.clientX > rect.right + 60 ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            ) {
              hide();
              return;
            }
            // Probe inside the editor with clientX clamped to content
            const probeX = Math.max(rect.left + 20, Math.min(rect.right - 20, event.clientX));
            const block = findBlockAt(view, { left: probeX, top: event.clientY });
            if (!block || !block.dom || !(block.dom instanceof HTMLElement)) {
              hide();
              return;
            }
            currentBlock = block as typeof currentBlock;
            const domRect = block.dom.getBoundingClientRect();
            handle.style.display = "flex";
            handle.style.top = `${window.scrollY + domRect.top + 4}px`;
            handle.style.left = `${window.scrollX + domRect.left - 22}px`;
          };

          const onMouseLeave = () => hide();

          const onDragStart = (event: DragEvent) => {
            if (!currentBlock || !event.dataTransfer) return;
            const { pos, dom } = currentBlock;

            // Select the block so PM treats it as the drag source
            const tr = view.state.tr.setSelection(
              NodeSelection.create(view.state.doc, pos)
            );
            view.dispatch(tr);

            const slice = view.state.selection.content();
            // Serialize slice content to HTML for external drop targets
            const tmp = document.createElement("div");
            tmp.appendChild(
              view.someProp("clipboardSerializer")?.serializeFragment(slice.content) ??
                document.createElement("div")
            );
            event.dataTransfer.clearData();
            event.dataTransfer.setData("text/html", tmp.innerHTML);
            event.dataTransfer.setData("text/plain", dom.textContent ?? "");
            event.dataTransfer.effectAllowed = "copyMove";
            event.dataTransfer.setDragImage(dom, 0, 0);

            // Hand PM the slice so its built-in drop handler performs the move
            view.dragging = { slice, move: true };
          };

          window.addEventListener("mousemove", onMouseMove);
          view.dom.addEventListener("mouseleave", onMouseLeave);
          handle.addEventListener("dragstart", onDragStart);

          return {
            destroy() {
              window.removeEventListener("mousemove", onMouseMove);
              view.dom.removeEventListener("mouseleave", onMouseLeave);
              handle.removeEventListener("dragstart", onDragStart);
              hide();
            },
          };
        },
      }),
    ];
  },
});
