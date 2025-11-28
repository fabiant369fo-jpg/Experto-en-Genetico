import React from 'react';
import { CalculationResult } from '../types';

interface Props {
  result: CalculationResult;
}

const PunnettSquare: React.FC<Props> = ({ result }) => {
  const { p1Gametes, p2Gametes, grid } = result;

  return (
    <div className="overflow-x-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100 animate-pop-in">
      <h3 className="text-xl font-bold text-science-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">🧮</span> Cuadro de Punnett
      </h3>
      
      <div className="inline-block min-w-max mx-auto w-full">
        <div className="flex flex-col items-center">
            {/* Top Label */}
            <div className="mb-2 font-bold text-science-700 text-sm uppercase tracking-widest bg-science-50 px-3 py-1 rounded-full">Padre 1</div>
            
            <div className="flex items-center">
                {/* Side Label */}
                <div className="mr-2 font-bold text-blue-800 text-sm uppercase tracking-widest -rotate-90 whitespace-nowrap h-20 flex items-center justify-center bg-blue-50 px-3 py-1 rounded-full">
                    Padre 2
                </div>

                <table className="border-collapse shadow-sm rounded-lg overflow-hidden">
                    <thead>
                    <tr>
                        <th className="p-4 bg-slate-100 border border-slate-300 text-slate-400 italic font-normal text-sm">
                            Gam.
                        </th>
                        {p1Gametes.map((g, i) => (
                        <th key={`p1-${i}`} className="p-4 bg-science-500 border border-science-600 text-white font-bold min-w-[80px] text-lg">
                            {g}
                        </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {p2Gametes.map((g2, rowIdx) => (
                        <tr key={`row-${rowIdx}`}>
                        <th className="p-4 bg-blue-500 border border-blue-600 text-white font-bold text-lg">
                            {g2}
                        </th>
                        {grid[rowIdx].map((genotype, colIdx) => (
                            <td 
                            key={`cell-${rowIdx}-${colIdx}`} 
                            className="p-4 border border-slate-200 text-center font-mono font-medium text-lg text-slate-700 bg-white hover:bg-yellow-50 transition-colors duration-200"
                            >
                            {genotype}
                            </td>
                        ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      
      <div className="mt-6 text-xs text-slate-500 text-center bg-slate-50 p-2 rounded-lg">
        * Gametos y Genotipos ordenados automáticamente por el sistema del Dr. Genius.
      </div>
    </div>
  );
};

export default PunnettSquare;