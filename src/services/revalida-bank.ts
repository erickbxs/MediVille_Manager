/**
 * Arquivo: src/services/revalida-bank.ts
 * O que faz: Baixa o banco de questões do Revalida (public/revalida/questions.json) e os comentários
 * (public/revalida/comments.json) e entrega ao sistema do Modo Revalida.
 * Para que foi criado: Manter o arquivo grande de questões fora do pacote JavaScript principal (carrega sob demanda e fica no cache do PWA).
 * Como modificar/debugar: Se o download falhar, o jogo continua no modo antigo (casos clínicos do SUS). Veja o console: "[Revalida]".
 * Importa: src/core/config.ts, src/entities/revalida-question.ts, src/systems/revalida-system.ts
 * Conecta-se com: src/main.ts, public/revalida/questions.json, public/revalida/comments.json
 */

import { BALANCE } from '../core/config';
import type { RevalidaQuestion } from '../entities/revalida-question';
import { setRevalidaBank } from '../systems/revalida-system';

interface QuestionsFile {
  questions: RevalidaQuestion[];
}

interface CommentsFile {
  comments: Record<string, string>;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loadRevalidaBank(): Promise<number> {
  if (!BALANCE.revalida.enabled) return 0;
  const [questions, comments] = await Promise.all([
    fetchJson<QuestionsFile>(BALANCE.revalida.questionsUrl),
    fetchJson<CommentsFile>(BALANCE.revalida.commentsUrl),
  ]);
  if (!questions?.questions?.length) {
    console.warn('[Revalida] Banco de questões indisponível; usando casos clínicos antigos.');
    return 0;
  }
  setRevalidaBank(questions.questions, comments?.comments ?? {});
  return questions.questions.length;
}
