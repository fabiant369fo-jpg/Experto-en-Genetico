import React, { useState, useEffect } from 'react';
import { TraitDefinition, CalculationResult } from './types';
import { calculatePunnett, extractUniqueLetters } from './utils/genetics';
import TraitForm from './components/TraitForm';
import PunnettSquare from './components/PunnettSquare';
import ResultsAnalysis from './components/ResultsAnalysis';
import ChatTutor from './components/ChatTutor';
import Mascot from './components/Mascot';

// Constants for default examples
const EXAMPLES = [
  { label: "Monohíbrido (Aa x Aa)", p1: "Aa", p2: "Aa" },
  { label: "Dihíbrido (AaBb x AaBb)", p1: "AaBb", p2: "AaBb" },
  { label: "Prueba (AB x ab)", p1: "AB", p2: "ab" },
  { label: "Ligado al Sexo (Hemofilia)", p1: "XH, Xh", p2: "Xh, Y" },
];

const App: React.FC = () => {
  const [parent1, setParent1] = useState('AaBb');
  const [parent2, setParent2] = useState('AaBb');
  const [traits, setTraits] = useState<TraitDefinition[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect unique letters and setup definition form
  useEffect(() => {
    const letters = extractUniqueLetters(parent1, parent2);
    
    // Preserve existing definitions if letter matches, else create new default
    const newTraits = letters.map(letter => {
      const existing = traits.find(t => t.letter === letter);
      return existing || {
        letter,
        name: '',
        dominant: '',
        recessive: ''
      };
    });
    
    // Only update if structure changed to avoid loop
    if (JSON.stringify(newTraits.map(t => t.letter)) !== JSON.stringify(traits.map(t => t.letter))) {
        setTraits(newTraits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent1, parent2]);

  const handleCalculate = () => {
    setError(null);
    try {
      if (!parent1 || !parent2) throw new Error("Ingresa ambos genotipos.");
      
      // RELAXED VALIDATION: Allow letters, numbers, commas, parentheses, and spaces
      // This supports "Xh, Y" or "(A, B)" formats from Chatbot
      if (!/^[a-zA-Z0-9,() ]+$/.test(parent1) || !/^[a-zA-Z0-9,() ]+$/.test(parent2)) {
         throw new Error("Caracteres no válidos. Usa letras, comas o paréntesis.");
      }
      
      const res = calculatePunnett(parent1, parent2, traits);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Error en el cálculo.");
      setResult(null);
    }
  };

  // Run calculation initially and when inputs change (debounced slightly or manual)
  useEffect(() => {
      const timer = setTimeout(() => {
          if (parent1 && parent2) handleCalculate();
      }, 500);
      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent1, parent2, traits]);

  const loadExample = (ex: typeof EXAMPLES[0]) => {
      setParent1(ex.p1);
      setParent2(ex.p2);
  };

  const handleAIUpdate = (p1: string, p2: string, newTraits?: Partial<TraitDefinition>[]) => {
    setParent1(p1);
    setParent2(p2);
    // Smooth scroll to inputs
    document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
    if (newTraits && newTraits.length > 0) {
      // Logic to merge AI trait suggestions could go here
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      {/* Header */}
      <header className="bg-science-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="text-4xl bg-white rounded-full p-1 shadow-sm animate-bounce">👨‍⚕️</div>
             <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-serif">MR. Genius</h1>
                <p className="text-science-100 text-sm font-medium">Tu especialista en Genética</p>
             </div>
          </div>
          <div className="text-xs mt-2 md:mt-0 opacity-90 text-right font-light">
            <div>Leyes de Mendel: Dominancia, Segregación</div>
            <div>& Distribución Independiente</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* SECTION 1: HERO & CHAT (Top of page) */}
        <section className="w-full">
            <ChatTutor onUpdateGenotypes={handleAIUpdate} />
        </section>

        {/* SECTION 2: CALCULATOR */}
        <div id="calculator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Inputs (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
                <section className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-science-500 sticky top-24">
                    <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-xl">
                    🧪 1. Genotipos Parentales
                    </h2>
                    
                    <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Padre 1</label>
                        <input 
                        type="text" 
                        value={parent1}
                        onChange={(e) => setParent1(e.target.value)}
                        className="w-full text-xl p-4 bg-slate-800 text-white border-2 border-slate-600 rounded-xl focus:border-science-400 placeholder-slate-500 outline-none font-mono tracking-widest text-center transition-all focus:scale-105"
                        placeholder="Ej: AaBb"
                        />
                    </div>
                    <div className="flex justify-center text-slate-300 font-bold text-2xl">×</div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Padre 2</label>
                        <input 
                        type="text" 
                        value={parent2}
                        onChange={(e) => setParent2(e.target.value)}
                        className="w-full text-xl p-4 bg-slate-800 text-white border-2 border-slate-600 rounded-xl focus:border-science-400 placeholder-slate-500 outline-none font-mono tracking-widest text-center transition-all focus:scale-105"
                        placeholder="Ej: aaBb"
                        />
                    </div>
                    </div>

                    {/* Quick Examples */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 mb-3">EJEMPLOS RÁPIDOS:</p>
                        <div className="flex flex-wrap gap-2">
                            {EXAMPLES.map((ex, i) => (
                                <button 
                                    key={i}
                                    onClick={() => loadExample(ex)}
                                    className="text-xs bg-slate-100 hover:bg-science-100 text-slate-600 hover:text-science-700 px-3 py-2 rounded-lg border border-slate-200 transition-colors font-medium"
                                >
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-science-50 text-science-800 text-xs rounded border border-science-100">
                        <strong>Nota del Doctor:</strong> El cálculo se actualiza automáticamente.
                    </div>
                </section>
            </div>

            {/* Right Column: Results (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
                {/* Trait Definition Form */}
                <TraitForm definitions={traits} onChange={setTraits} />

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2 animate-bounce">
                        ⚠️ {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-8">
                        {/* Visual Square */}
                        <PunnettSquare result={result} />

                        {/* Stats */}
                        <ResultsAnalysis result={result} />
                    </div>
                )}
            </div>
        </div>

      </main>

      {/* Floating Interactive Mascot */}
      <Mascot />
    </div>
  );
};

export default App;