export interface TraitDefinition {
  letter: string;
  name: string;
  dominant: string;
  recessive: string;
}

export interface GenotypeAnalysis {
  genotype: string;
  count: number;
  frequency: number; // 0-1
  isHomozygousDominant: boolean;
  isHomozygousRecessive: boolean;
  isHeterozygous: boolean;
  phenotypeDescription: string[];
}

export interface PhenotypeAnalysis {
  phenotype: string;
  count: number;
  frequency: number;
}

export interface CalculationResult {
  p1Gametes: string[];
  p2Gametes: string[];
  grid: string[][]; // Row -> Col
  totalCombinations: number;
  genotypes: GenotypeAnalysis[];
  phenotypes: PhenotypeAnalysis[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}