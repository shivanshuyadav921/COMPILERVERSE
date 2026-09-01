// dominator.ts — Dominator Tree and Dominance Frontier Analysis for Nova CFG.

import { CFG, BasicBlock } from "./cfg";

export interface DominatorTreeResult {
  idom: Record<string, string | null>;             // Block ID -> Immediate Dominator Block ID
  tree: Record<string, string[]>;                  // Block ID -> Array of Children Block IDs in Dom Tree
  frontiers: Record<string, string[]>;             // Block ID -> Array of Dominance Frontier Block IDs
  dominators: Record<string, string[]>;            // Block ID -> Array of all Dominators of Block ID
}

export function computeDominators(cfg: CFG): DominatorTreeResult {
  if (cfg.blocks.length === 0) {
    return { idom: {}, tree: {}, frontiers: {}, dominators: {} };
  }

  const entryId = cfg.blocks[0].id;
  const blocksMap = new Map<string, BasicBlock>();
  cfg.blocks.forEach(b => blocksMap.set(b.id, b));

  const preds: Record<string, string[]> = {};
  const succs: Record<string, string[]> = {};
  cfg.blocks.forEach(b => {
    preds[b.id] = [];
    succs[b.id] = [...b.successors];
  });
  cfg.edges.forEach(e => {
    if (!preds[e.to]) preds[e.to] = [];
    if (!preds[e.to].includes(e.from)) preds[e.to].push(e.from);
  });

  const allBlockIds = cfg.blocks.map(b => b.id);
  const dom: Record<string, Set<string>> = {};

  dom[entryId] = new Set([entryId]);
  allBlockIds.forEach(bId => {
    if (bId !== entryId) {
      dom[bId] = new Set(allBlockIds);
    }
  });

  let changed = true;
  let passes = 0;
  while (changed && passes++ < 100) {
    changed = false;
    allBlockIds.forEach(bId => {
      if (bId === entryId) return;
      const pBlocks = preds[bId] || [];
      let newDom: Set<string>;
      if (pBlocks.length === 0) {
        newDom = new Set([bId]);
      } else {
        newDom = new Set(dom[pBlocks[0]] || []);
        for (let i = 1; i < pBlocks.length; i++) {
          const pDom = dom[pBlocks[i]] || new Set();
          newDom = new Set([...newDom].filter(x => pDom.has(x)));
        }
        newDom.add(bId);
      }

      if (newDom.size !== dom[bId].size || [...newDom].some(x => !dom[bId].has(x))) {
        dom[bId] = newDom;
        changed = true;
      }
    });
  }

  // Compute Immediate Dominators (idom)
  // idom(b) = d in StrictDom(b) such that d is dominated by all other strict doms of b
  const idom: Record<string, string | null> = {};
  allBlockIds.forEach(bId => {
    if (bId === entryId) {
      idom[bId] = null;
      return;
    }
    const strictDoms = [...dom[bId]].filter(d => d !== bId);
    let immediate: string | null = null;
    strictDoms.forEach(d1 => {
      // d1 is immediate if for all d2 in strictDoms, d2 dominates d1
      const isImm = strictDoms.every(d2 => d2 === d1 || dom[d1].has(d2));
      if (isImm) immediate = d1;
    });
    idom[bId] = immediate;
  });

  // Compute Dominator Tree (parent -> children)
  const tree: Record<string, string[]> = {};
  allBlockIds.forEach(bId => { tree[bId] = []; });
  allBlockIds.forEach(bId => {
    const parent = idom[bId];
    if (parent && tree[parent]) {
      tree[parent].push(bId);
    }
  });

  // Compute Dominance Frontiers (DF)
  // DF(b) = { y | exists p in preds(y) s.t. b dominates p, and b does not strictly dominate y }
  const frontiers: Record<string, string[]> = {};
  allBlockIds.forEach(bId => { frontiers[bId] = []; });

  allBlockIds.forEach(y => {
    const pBlocks = preds[y] || [];
    if (pBlocks.length >= 2) {
      pBlocks.forEach(p => {
        let runner: string | null = p;
        while (runner !== null && runner !== idom[y]) {
          if (!frontiers[runner].includes(y)) {
            frontiers[runner].push(y);
          }
          runner = idom[runner];
        }
      });
    }
  });

  const dominatorsResult: Record<string, string[]> = {};
  allBlockIds.forEach(bId => {
    dominatorsResult[bId] = Array.from(dom[bId]).sort();
  });

  return {
    idom,
    tree,
    frontiers,
    dominators: dominatorsResult,
  };
}
