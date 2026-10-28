/**
 * Arquivo: src/ui/legal-modal.ts
 *
 * 1. O que este arquivo faz?
 * Renderiza o modal oficial de Termos de Uso, Política de Privacidade (LGPD/GDPR) e Aviso Educativo Oficial do SUS/MS
 * nos idiomas Português, Espanhol e Inglês, detalhando a finalidade lúdica e pedagógica do simulador.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 5 do Prompt 15 e os requisitos de conformidade legal de publicação para web, mobile e desktop,
 * assegurando transparência no tratamento de dados e isenção de responsabilidade médica de emergência.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O conteúdo dos termos está estruturado em LEGAL_TEXTS. Chame open() para exibir e close() para fechar.
 *
 * Importa: src/i18n/i18n.ts, src/core/sound-system.ts
 * Conecta-se com: src/ui/title-screen.ts, src/ui/settings-modal.ts, src/main.ts
 */

import { getLocale } from '../i18n/i18n';
import { soundSystem } from '../core/sound-system';

interface LegalContent {
  title: string;
  susTitle: string;
  susNotice: string;
  privacyTitle: string;
  privacyText: string;
  termsTitle: string;
  termsText: string;
  closeBtn: string;
}

const LEGAL_TEXTS: Record<'pt' | 'es' | 'en', LegalContent> = {
  pt: {
    title: 'Termos de Uso & Privacidade (LGPD / GDPR)',
    susTitle: 'Aviso Educativo (projeto independente)',
    susNotice:
      'O MediVille Manager é um projeto independente de entretenimento e estudo, sem vínculo com o Ministério da Saúde, o SUS ou o INEP. O simulador NÃO constitui serviço médico, telemedicina ou recomendação clínica para casos reais. Em situações de urgência ou emergência médica, ligue para o SAMU (192) ou procure a Unidade de Pronto Atendimento mais próxima.',
    privacyTitle: 'Política de Privacidade e Dados Locais',
    privacyText:
      'Respeitamos integralmente a sua privacidade segundo a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). Seus dados de progresso e estatísticas de jogo são armazenados prioritariamente no armazenamento local do seu navegador (LocalStorage / IndexedDB). Não comercializamos nem compartilhamos informações com terceiros para fins publicitários.',
    termsTitle: 'Termos de Uso',
    termsText:
      'Ao utilizar o MediVille Manager, você concorda com o uso estritamente lúdico, educacional e acadêmico da plataforma. As diretrizes clínicas, tabelas SIGTAP e protocolos RENAME foram adaptados com base em documentos públicos do Ministério da Saúde para fins de gamificação. As questões do Modo Revalida são provas oficiais do INEP (gov.br/inep), reproduzidas sem alterações e com a fonte indicada, conforme a licença Creative Commons Atribuição-SemDerivações 3.0. Os comentários das questões são escritos com ajuda de inteligência artificial e podem conter erros; o gabarito oficial do INEP é sempre a referência.',
    closeBtn: 'Entendido / Fechar',
  },
  es: {
    title: 'Términos de Uso y Privacidad (RGPD / LGPD)',
    susTitle: 'Aviso educativo (proyecto independiente)',
    susNotice:
      'MediVille Manager es un proyecto independiente, sin vínculo con el Ministerio de Salud de Brasil ni con el INEP. Es un simulador educativo sobre salud pública y principios del SUS. NO constituye asesoramiento médico ni atención de emergencia. En caso de emergencia real, acuda al centro de salud más cercano.',
    privacyTitle: 'Política de Privacidad y Datos Locales',
    privacyText:
      'Tus datos de partida se almacenan exclusivamente en el navegador o dispositivo del usuario. Cumplimos con el RGPD y no compartimos datos con terceros.',
    termsTitle: 'Términos de Uso',
    termsText:
      'El uso de este simulador es exclusivamente formativo y de entretenimiento. Los protocolos clínicos son adaptaciones de guías de salud pública.',
    closeBtn: 'Entendido / Cerrar',
  },
  en: {
    title: 'Terms of Use & Privacy Policy (GDPR / LGPD)',
    susTitle: 'Official Educational Notice (SUS / Ministry of Health)',
    susNotice:
      'MediVille Manager is a management simulation and educational game about public health systems (SUS). It does NOT provide medical advice, diagnosis, or emergency instructions. For real emergencies, call your local emergency services immediately.',
    privacyTitle: 'Privacy Policy & Local Storage',
    privacyText:
      'We respect your privacy under GDPR. Game saves and settings remain in your browser local storage. We do not sell or track personal identifiable data.',
    termsTitle: 'Terms of Service',
    termsText:
      'This simulator is provided for entertainment and healthcare management learning. Protocols and drug lists are simplified adaptations of official open documents.',
    closeBtn: 'Understood / Close',
  },
};

export class LegalModal {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public open(): void {
    const locale = getLocale();
    const langKey: 'pt' | 'es' | 'en' = locale === 'es' ? 'es' : (locale === 'en' ? 'en' : 'pt');
    const content = LEGAL_TEXTS[langKey];

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 flex flex-col space-y-4 max-h-[90dvh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">⚖️</span>
              <h3 class="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">${content.title}</h3>
            </div>
            <button id="btn-close-legal" class="min-w-[40px] min-h-[40px] rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 font-bold flex items-center justify-center">✕</button>
          </div>

          <div class="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
            <span class="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              🚨 ${content.susTitle}
            </span>
            <p class="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90 font-medium">
              ${content.susNotice}
            </p>
          </div>

          <div class="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <div>
              <h4 class="font-bold text-slate-900 dark:text-slate-100 mb-1">🛡️ ${content.privacyTitle}</h4>
              <p>${content.privacyText}</p>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 dark:text-slate-100 mb-1">📜 ${content.termsTitle}</h4>
              <p>${content.termsText}</p>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button id="btn-legal-confirm" class="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-md">
              ${content.closeBtn}
            </button>
          </div>
        </div>
      </div>
    `;

    const closeHandler = () => {
      soundSystem.playClick();
      this.close();
    };

    document.getElementById('btn-close-legal')?.addEventListener('click', closeHandler);
    document.getElementById('btn-legal-confirm')?.addEventListener('click', closeHandler);
  }

  public close(): void {
    this.container.innerHTML = '';
  }
}
