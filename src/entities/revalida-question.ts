/**
 * Arquivo: src/entities/revalida-question.ts
 * O que faz: Define a estrutura de uma questão oficial do Revalida (INEP) usada como "caso" de cada paciente no Modo Revalida.
 * Para que foi criado: Transformar o jogo em estudo leve para o Revalida com questões originais, sem alterar o texto (licença CC BY-ND do gov.br).
 * Como modificar/debugar: Os dados vêm de public/revalida/questions.json (gerado a partir dos PDFs do INEP). Campos novos devem ser opcionais.
 * Importa: nada
 * Conecta-se com: src/systems/revalida-system.ts, src/services/revalida-bank.ts, src/ui/decision-modal.ts, src/ui/revalida-bank-modal.ts
 */

export type RevalidaArea =
  | 'clinica_medica'
  | 'cirurgia'
  | 'ginecologia_obstetricia'
  | 'pediatria'
  | 'medicina_familia_comunidade';

export type RevalidaOptionKey = 'A' | 'B' | 'C' | 'D';

export interface RevalidaOption {
  key: RevalidaOptionKey;
  text: string;
}

export interface RevalidaQuestion {
  id: string;
  edition: string;
  editionLabel: string;
  number: number;
  area: RevalidaArea;
  stem: string;
  options: RevalidaOption[];
  answer: RevalidaOptionKey;
  images?: string[];
  preliminaryKey?: boolean;
}

export interface RevalidaCasePayload {
  question: RevalidaQuestion;
  reference: string;
  commentary: string | null;
}
