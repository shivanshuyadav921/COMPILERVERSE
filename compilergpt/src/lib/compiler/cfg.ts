// cfg.ts — Real CFG construction: partitions IR into basic blocks and computes edges.

import { IRInstr, irToString } from "./ir";

export interface BasicBlock {
  id: string;
  label: string;
  instrs: IRInstr[];
  successors: string[];
}

export interface CFG {
  blocks: BasicBlock[];
  edges: { from: string; to: string; kind: "fallthrough" | "branch" | "jump" }[];
}

export function buildCFG(code: IRInstr[]): CFG {
  if (code.length === 0) return { blocks: [], edges: [] };

  const leaders = new Set<number>();
  leaders.add(0);
  const labelToIndex = new Map<string, number>();
  code.forEach((instr, idx) => { if (instr.op === "label") labelToIndex.set(instr.label!, idx); });

  code.forEach((instr, idx) => {
    if (instr.op === "goto" || instr.op === "if_false") {
      const targetIdx = labelToIndex.get(instr.label!);
      if (targetIdx !== undefined) leaders.add(targetIdx);
      if (idx + 1 < code.length) leaders.add(idx + 1);
    }
  });

  const sortedLeaders = Array.from(leaders).sort((a, b) => a - b);
  const blocks: BasicBlock[] = [];
  for (let i = 0; i < sortedLeaders.length; i++) {
    const start = sortedLeaders[i];
    const end = i + 1 < sortedLeaders.length ? sortedLeaders[i + 1] : code.length;
    const instrs = code.slice(start, end);
    const first = instrs[0];
    const label = first.op === "label" ? first.label! : `B${start}`;
    blocks.push({ id: `B${start}`, label, instrs, successors: [] });
  }

  const edges: CFG["edges"] = [];
  blocks.forEach((block, idx) => {
    const lastInstr = block.instrs[block.instrs.length - 1];
    const nextBlock = blocks[idx + 1];
    if (lastInstr.op === "goto") {
      const targetIdx = labelToIndex.get(lastInstr.label!);
      const targetBlockId = targetIdx !== undefined ? findBlockContaining(blocks, targetIdx) : undefined;
      if (targetBlockId) { block.successors.push(targetBlockId); edges.push({ from: block.id, to: targetBlockId, kind: "jump" }); }
    } else if (lastInstr.op === "if_false") {
      const targetIdx = labelToIndex.get(lastInstr.label!);
      const targetBlockId = targetIdx !== undefined ? findBlockContaining(blocks, targetIdx) : undefined;
      if (targetBlockId) { block.successors.push(targetBlockId); edges.push({ from: block.id, to: targetBlockId, kind: "branch" }); }
      if (nextBlock) { block.successors.push(nextBlock.id); edges.push({ from: block.id, to: nextBlock.id, kind: "fallthrough" }); }
    } else if (lastInstr.op === "return" || lastInstr.op === "end_fn") {
      // no successor
    } else if (nextBlock) {
      block.successors.push(nextBlock.id);
      edges.push({ from: block.id, to: nextBlock.id, kind: "fallthrough" });
    }
  });

  return { blocks, edges };
}

function findBlockContaining(blocks: BasicBlock[], globalIdx: number): string | undefined {
  let offset = 0;
  for (const b of blocks) {
    if (globalIdx >= offset && globalIdx < offset + b.instrs.length) return b.id;
    offset += b.instrs.length;
  }
  return undefined;
}

export function blockToLines(block: BasicBlock): string[] {
  return block.instrs.map(irToString);
}
