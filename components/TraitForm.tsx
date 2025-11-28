import React from 'react';
import { TraitDefinition } from '../types';

interface Props {
  definitions: TraitDefinition[];
  onChange: (defs: TraitDefinition[]) => void;
}

const TraitForm: React.FC<Props> = ({ definitions, onChange }) => {
  const handleChange = (index: number, field: keyof TraitDefinition, value: string) => {
    const newDefs = [...definitions];
    newDefs[index] = { ...newDefs[index], [field]: value };
    onChange(newDefs);
  };

  if (definitions.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <h3 className="text-lg font-bold text-science-800 mb-4 flex items-center">
        🧬 Definición de Rasgos (Fenotipos)
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {definitions.map((def, idx) => (
          <div key={def.letter} className="bg-science-50 p-4 rounded-lg border border-science-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-2xl text-science-700 bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm">
                {def.letter}
              </span>
              <span className="text-xs text-science-600 font-semibold uppercase tracking-wider">Gen {idx + 1}</span>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre del Rasgo (ej. Color)"
                className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-science-400 outline-none"
                value={def.name}
                onChange={(e) => handleChange(idx, 'name', e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <span className="font-bold text-slate-500 w-4">{def.letter}</span>
                <input
                    type="text"
                    placeholder="Dominante (ej. Púrpura)"
                    className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-science-400 outline-none"
                    value={def.dominant}
                    onChange={(e) => handleChange(idx, 'dominant', e.target.value)}
                />
              </div>
               <div className="flex gap-2 items-center">
                <span className="font-bold text-slate-400 w-4 lowercase">{def.letter}</span>
                <input
                    type="text"
                    placeholder="Recesivo (ej. Blanco)"
                    className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-science-400 outline-none"
                    value={def.recessive}
                    onChange={(e) => handleChange(idx, 'recessive', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TraitForm;