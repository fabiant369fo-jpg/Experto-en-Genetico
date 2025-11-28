import React from 'react';
import { CalculationResult } from '../types';

interface Props {
  result: CalculationResult;
}

const ResultsAnalysis: React.FC<Props> = ({ result }) => {
  const formatFraction = (num: number, total: number) => `${num}/${total}`;
  const formatPercentage = (freq: number) => `${(freq * 100).toFixed(1)}%`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Genotypic Ratios */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="text-xl font-bold text-science-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            🧬 Proporciones Genotípicas
        </h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {result.genotypes.map((g, idx) => (
                <div key={idx} className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-science-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-xl font-bold text-slate-800 break-all bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{g.genotype}</span>
                        <div className="text-right ml-2 min-w-[80px]">
                            <span className="font-bold text-science-600 mr-2 text-lg">{formatFraction(g.count, result.totalCombinations)}</span>
                            <span className="text-xs text-slate-500 block font-medium">({formatPercentage(g.frequency)})</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {g.isHomozygousDominant && (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-red-100 text-red-700 rounded-full border border-red-200 font-bold">Homocigoto Dom.</span>
                        )}
                        {g.isHomozygousRecessive && (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200 font-bold">Homocigoto Rec.</span>
                        )}
                        {g.isHeterozygous && (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-purple-100 text-purple-700 rounded-full border border-purple-200 font-bold">Heterocigoto</span>
                        )}
                         {/* Display detected Sex info if present in description but not strictly valid Homo/Hetero */}
                         {!g.isHomozygousDominant && !g.isHomozygousRecessive && !g.isHeterozygous && (
                             g.phenotypeDescription.map((desc, i) => {
                                 if (desc.includes("Macho") || desc.includes("Hembra")) {
                                     return <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 font-bold">{desc}</span>;
                                 }
                                 return null;
                             })
                         )}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Phenotypic Ratios */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="text-xl font-bold text-science-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            👁️ Fenotipos y Probabilidades
        </h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {result.phenotypes.map((p, idx) => (
                <div key={idx} className="p-4 bg-science-50 rounded-xl border border-science-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                    <div className="pr-4">
                         <span className="font-bold text-slate-700 block break-words text-lg">
                            {p.phenotype.replace(/\|/g, ' - ')}
                         </span>
                    </div>
                    <div className="text-right whitespace-nowrap ml-2 bg-white px-3 py-2 rounded-lg border border-science-100 shadow-sm">
                         <span className="block font-bold text-xl text-science-600">{formatFraction(p.count, result.totalCombinations)}</span>
                         <span className="text-xs text-slate-400 font-bold">{formatPercentage(p.frequency)}</span>
                    </div>
                </div>
            ))}
        </div>
        <p className="mt-6 text-xs text-slate-500 italic bg-yellow-50 p-3 rounded border border-yellow-100">
            <strong>Nota:</strong> La interpretación de "sano" o "enfermo" depende de la dominancia definida. ¡Consúltalo con el Doctor en el chat!
        </p>
      </div>
    </div>
  );
};

export default ResultsAnalysis;