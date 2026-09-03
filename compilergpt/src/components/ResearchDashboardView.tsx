"use client";
import { useMemo } from "react";
import { runHallucinationBenchmark } from "@/lib/compiler/hallucinationBenchmark";
import { CompileResult } from "@/lib/compiler/pipeline";

export default function ResearchDashboardView({ result }: { result: CompileResult }) {
  const benchmark = useMemo(() => runHallucinationBenchmark(result), [result]);

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-3 border border-border rounded-lg text-xs">
        <div>
          <span className="font-bold text-dusty-rose text-sm">
            AI Grounding & Hallucination Evaluation Research Suite
          </span>
          <p className="text-[11px] text-text-secondary">
            Empirical evaluation comparing Artifact-Grounded CompilerGPT against ungrounded Baseline LLMs across 7 core compiler reasoning tasks.
          </p>
        </div>
        <div className="px-3 py-1 bg-dusty-rose/20 text-dusty-rose border border-dusty-rose/40 rounded font-bold text-xs">
          Empirical Research Benchmark
        </div>
      </div>

      {/* Metrics Scorecards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3 border-l-4 border-l-sage">
          <div className="text-[10px] uppercase text-text-secondary font-bold">Grounded Accuracy</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-sage">{benchmark.groundedAccuracyRate}%</span>
            <span className="text-xs text-text-secondary">vs Baseline: {benchmark.baselineAccuracyRate}%</span>
          </div>
        </div>

        <div className="card p-3 border-l-4 border-l-terracotta">
          <div className="text-[10px] uppercase text-text-secondary font-bold">Hallucination Rate</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-sage">{benchmark.groundedHallucinationRate}%</span>
            <span className="text-xs text-terracotta">Baseline: {benchmark.baselineHallucinationRate}%</span>
          </div>
        </div>

        <div className="card p-3 border-l-4 border-l-ochre">
          <div className="text-[10px] uppercase text-text-secondary font-bold">Avg Artifact Citations</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-ochre">{benchmark.avgArtifactCitationCount}</span>
            <span className="text-xs text-text-secondary">citations / answer</span>
          </div>
        </div>

        <div className="card p-3 border-l-4 border-l-muted-teal">
          <div className="text-[10px] uppercase text-text-secondary font-bold">Total Evaluated Questions</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-text-primary">{benchmark.totalEvaluations}</span>
            <span className="text-xs text-text-secondary">formal queries</span>
          </div>
        </div>
      </div>

      {/* Comparative Question-by-Question Table */}
      <div className="card p-4 space-y-3">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
          Direct Comparative Reasoning Audit
        </h3>

        <div className="space-y-3">
          {benchmark.evaluations.map((ev) => (
            <div key={ev.questionId} className="p-3 bg-surface-elevated border border-border rounded-lg space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-text-primary">
                  [{ev.questionId} - {ev.category}] {ev.question}
                </span>
                <span className="px-2 py-0.5 bg-sage/20 text-sage font-bold rounded text-[10px] border border-sage/40">
                  {ev.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Grounded Column */}
                <div className="p-2.5 bg-surface border border-sage/40 rounded space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-sage">
                    <span>Grounded CompilerGPT</span>
                    <span>Citation Verified</span>
                  </div>
                  <p className="text-text-primary text-[11px] leading-relaxed">{ev.groundedAnswer}</p>
                  <div className="text-[10px] text-sage font-mono bg-surface-elevated p-1 rounded">
                    📌 {ev.groundedArtifactCitation}
                  </div>
                </div>

                {/* Baseline Column */}
                <div className="p-2.5 bg-surface border border-terracotta/40 rounded space-y-1 opacity-80">
                  <div className="flex justify-between items-center text-[10px] font-bold text-terracotta">
                    <span>Ungrounded Baseline LLM</span>
                    <span>Unsubstantiated Guess</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-relaxed italic">{ev.baselineAnswer}</p>
                  <div className="text-[10px] text-terracotta font-mono bg-surface-elevated p-1 rounded">
                    ⚠️ Zero compiler artifact citations.
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
