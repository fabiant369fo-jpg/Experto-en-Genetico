import { TraitDefinition, CalculationResult, GenotypeAnalysis, PhenotypeAnalysis } from '../types';

// Helper: Normalize allele string (e.g., "bA" -> "Ab")
export const normalizeGenotype = (raw: string): string => {
  const map = new Map<string, string[]>();
  
  for (const char of raw) {
    const key = char.toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(char);
  }

  const sortedKeys = Array.from(map.keys()).sort();
  let result = "";

  sortedKeys.forEach(key => {
    const alleles = map.get(key)!;
    // Sort: Capital first (ASCII: 'A' < 'a')
    alleles.sort(); 
    result += alleles.join('');
  });

  return result;
};

const parseGenotypeToGroups = (genotype: string): string[][] => {
  const map = new Map<string, string[]>();
  for (const char of genotype) {
    if (!/[a-zA-Z]/.test(char)) continue;
    const key = char.toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(char);
  }
  return Array.from(map.values()).sort((a, b) => a[0].toUpperCase().localeCompare(b[0].toUpperCase()));
};

// Generate Gametes using Cartesian Product or Custom Split
export const generateGametes = (genotype: string): string[] => {
  // SPECIAL FEATURE: If comma detected, user is providing explicit gametes/alleles (e.g. "Xh, Y")
  if (genotype.includes(',')) {
      // Remove parens if present, split by comma, trim whitespace
      return genotype.replace(/[()]/g, '').split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  const groups = parseGenotypeToGroups(genotype);
  if (groups.length === 0) return [];

  let results: string[] = [""];

  for (const group of groups) {
    const nextResults: string[] = [];
    for (const existing of results) {
      for (const allele of group) {
        nextResults.push(existing + allele);
      }
    }
    results = nextResults;
  }

  return results;
};

const getPhenotypeDescription = (genotype: string, traits: TraitDefinition[], isCustom: boolean): string[] => {
  // If custom inputs (sex linked etc), we try to be smart about what we show.
  if (isCustom) {
      const descriptions: string[] = [];
      
      // Attempt to detect Sex
      const hasY = genotype.includes('Y');
      // Simple heuristic: if it has Y, it's Male. If it has XX and no Y, Female.
      const hasXX = (genotype.match(/X/g) || []).length >= 2;
      
      if (hasY) {
          descriptions.push("Macho (XY)");
      } else if (hasXX) {
          descriptions.push("Hembra (XX)");
      } else {
          descriptions.push("Genotipo Combinado");
      }

      // If specific trait markers are found (like 'h' for hemofilia), add them?
      // For now, return the genotype itself as a description if it's very custom,
      // or rely on the Chatbot to explain details. 
      // We will return the sorted genotype string as a pseudo-phenotype label 
      // so it appears clearly in the table.
      descriptions.push(genotype); 
      
      return descriptions;
  }

  const descriptions: string[] = [];
  const processedKeys = new Set<string>();

  for (const char of genotype) {
    const key = char.toUpperCase();
    if (processedKeys.has(key)) continue;
    
    processedKeys.add(key);
    const trait = traits.find(t => t.letter === key);
    
    const genePair = genotype.split('').filter(c => c.toUpperCase() === key);
    const hasDominant = genePair.some(c => c === c.toUpperCase());
    
    if (trait) {
        const desc = hasDominant 
            ? (trait.dominant || `${trait.name || key} (Dom)`) 
            : (trait.recessive || `${trait.name || key} (Rec)`);
        descriptions.push(desc);
    } else {
        descriptions.push(hasDominant ? `Rasgo ${key} Dominante` : `Rasgo ${key} Recesivo`);
    }
  }
  return descriptions;
};

const analyzeGenotypeString = (genotype: string): { isHomoDom: boolean, isHomoRec: boolean, isHetero: boolean } => {
  // Simplified analysis for custom strings
  if (!/^[a-zA-Z]+$/.test(genotype)) {
      return { isHomoDom: false, isHomoRec: false, isHetero: false };
  }

  const groups = parseGenotypeToGroups(genotype);
  let allHomoDom = true;
  let allHomoRec = true;
  let hasHetero = false;

  for (const group of groups) {
      const p1 = group[0];
      const p2 = group[1] || p1; 

      if (p1 !== p2) {
          hasHetero = true;
          allHomoDom = false;
          allHomoRec = false;
      } else {
          if (p1 === p1.toUpperCase()) {
              allHomoRec = false;
          } else {
              allHomoDom = false;
          }
      }
  }

  return {
      isHomoDom: allHomoDom,
      isHomoRec: allHomoRec,
      isHetero: hasHetero
  };
};

export const calculatePunnett = (p1: string, p2: string, traits: TraitDefinition[]): CalculationResult => {
  const isCustom = p1.includes(',') || p2.includes(',');

  const p1Gametes = generateGametes(p1);
  const p2Gametes = generateGametes(p2);

  const grid: string[][] = [];
  const genotypeCounts = new Map<string, number>();

  for (let r = 0; r < p2Gametes.length; r++) {
    const row: string[] = [];
    for (let c = 0; c < p1Gametes.length; c++) {
      const g1 = p1Gametes[c];
      const g2 = p2Gametes[r];
      
      let finalCombo = "";
      
      if (isCustom) {
          // Custom Sort Logic for Sex Chromosomes
          // We want X to come before Y
          // We want Capital before Lowercase generally, but 'Xh' is a unit.
          // Since we already split units in generateGametes, g1 and g2 are units (e.g. "Xh", "Y", "A", "b")
          
          const parts = [g1, g2];
          parts.sort((a, b) => {
              // Priority: X alleles first, then alphabetical
              const aIsX = a.toUpperCase().startsWith('X');
              const bIsX = b.toUpperCase().startsWith('X');
              if (aIsX && !bIsX) return -1;
              if (!aIsX && bIsX) return 1;
              return a.localeCompare(b);
          });
          
          finalCombo = parts.join(' '); // Use space for clarity in custom mode e.g. "XH Xh"
      } else {
          const rawCombo = g1 + g2;
          finalCombo = normalizeGenotype(rawCombo);
      }
      
      row.push(finalCombo);
      genotypeCounts.set(finalCombo, (genotypeCounts.get(finalCombo) || 0) + 1);
    }
    grid.push(row);
  }

  const total = p1Gametes.length * p2Gametes.length;

  // Process Genotypes
  const genotypes: GenotypeAnalysis[] = Array.from(genotypeCounts.entries()).map(([gt, count]) => {
     // Analyze hom/het only for standard letter inputs
     const { isHomoDom, isHomoRec, isHetero } = isCustom 
        ? { isHomoDom: false, isHomoRec: false, isHetero: false } 
        : analyzeGenotypeString(gt);

     return {
         genotype: gt,
         count,
         frequency: count / total,
         isHomozygousDominant: isHomoDom,
         isHomozygousRecessive: isHomoRec,
         isHeterozygous: isHetero,
         phenotypeDescription: getPhenotypeDescription(gt, traits, isCustom)
     };
  });

  genotypes.sort((a, b) => b.count - a.count || a.genotype.localeCompare(b.genotype));

  // Process Phenotypes
  const phenotypeCounts = new Map<string, number>();
  genotypes.forEach(g => {
      // For custom, the phenotype desc might include "Macho (XY)" and the genotype "Xh Y"
      // We join them to form a unique key for grouping
      const phenoStr = g.phenotypeDescription.join(' | ');
      phenotypeCounts.set(phenoStr, (phenotypeCounts.get(phenoStr) || 0) + g.count);
  });

  const phenotypes: PhenotypeAnalysis[] = Array.from(phenotypeCounts.entries()).map(([pheno, count]) => ({
      phenotype: pheno,
      count,
      frequency: count / total
  })).sort((a, b) => b.count - a.count);

  return {
    p1Gametes,
    p2Gametes,
    grid,
    totalCombinations: total,
    genotypes,
    phenotypes
  };
};

export const extractUniqueLetters = (p1: string, p2: string): string[] => {
    // If custom mode, don't try to extract letters for traits
    if (p1.includes(',') || p2.includes(',')) return [];
    
    const set = new Set<string>();
    (p1 + p2).split('').forEach(c => {
        if (/[a-zA-Z]/.test(c)) set.add(c.toUpperCase());
    });
    return Array.from(set).sort();
};