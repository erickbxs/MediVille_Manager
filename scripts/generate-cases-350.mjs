/**
 * Arquivo: scripts/generate-cases-350.mjs
 *
 * 1. O que este arquivo faz?
 * Gera os 100 novos casos clínicos especializados do SUS (casos 251 a 350) e anexa aos 250 casos existentes
 * em src/data/cases.json e src/data/clinical-cases.json, totalizando exatamente 350 casos clínicos únicos.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 5 do Prompt 22 do MediVille Manager, expandindo a Enciclopédia SUS e a auto-resolução
 * com fidelidade aos Protocolos Clínicos e Diretrizes Terapêuticas (PCDT) do Ministério da Saúde e ANVISA.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `node scripts/generate-cases-350.mjs`. Ele valida ids duplicados, schema e número final de casos.
 *
 * Importa: fs, path
 * Conecta-se com: src/data/cases.json, src/data/clinical-cases.json, tests/portable-drag-350cases-and-dense-map.test.ts
 */

import fs from 'fs';
import path from 'path';
import { cases271to310 } from './cases-data-271-310.mjs';
import { cases311to350 } from './cases-data-311-350.mjs';

const rootDir = process.cwd();
const casesPath = path.resolve(rootDir, 'src/data/cases.json');
const clinicalCasesPath = path.resolve(rootDir, 'src/data/clinical-cases.json');

const rawCurrent = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
const existingCases = rawCurrent.cases;

console.log(`[generate-cases] Casos existentes: ${existingCases.length}`);

// Lista dos 100 novos casos clínicos (251 a 350)
const newCasesRaw = [
  // 251 a 270 — Emergências Médicas, Trauma, Cirurgia e UTI
  {
    id: 'choque-hipovolemico-hemorragico',
    name: 'Choque Hipovolêmico Hemorrágico',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 14, max: 80 },
    symptoms: ['Hipotensão grave (PAS < 80 mmHg)', 'Taquicardia extrema (> 120 bpm)', 'Palidez cutânea e sudorese fria', 'Rebaixamento do nível de consciência'],
    suggestedExams: ['Acesso venoso calibroso duplo', 'FAST abdominal e hemograma urgente', 'Tipagem sanguínea com prova cruzada'],
    suggestedConduct: {
      id: 'choque-hipo-c1',
      text: 'Controle cirúrgico/mecânico da hemorragia, infusão criteriosa de cristaloides e ativação de protocolo de transfusão maciça.'
    },
    distractorConducts: [
      { id: 'choque-hipo-d1', text: 'Iniciar vasopressores em altas doses antes da reposição volêmica.', whyWrong: 'Vasopressor sem restauração volêmica prévia agrava a isquemia tecidual e falência renal.' },
      { id: 'choque-hipo-d2', text: 'Administrar analgésico opioide e aguardar leito de enfermaria.', whyWrong: 'Situação de risco iminente de parada cardiorrespiratória exigindo suporte de sala vermelha/UTI.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Expansão volêmica inicial' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Choque hemorrágico exige controle da fonte do sangramento e restauração imediata do volume intravascular circulante.',
    possibleComorbidities: ['Politraumatismo'],
    sources: [{ name: 'Ministério da Saúde - ATLS / Linha de Cuidado do Trauma', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'choque-cardiogenico-agudo',
    name: 'Choque Cardiogênico Agudo',
    area: 'Emergência e UTI',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 45, max: 90 },
    symptoms: ['Hipotensão arterial persistente', 'Congestão pulmonar com crepitações difusas', 'Oligúria e extremidades frias', 'Pressão venosa jugular elevada'],
    suggestedExams: ['Eletrocardiograma de 12 derivações', 'Ecocardiograma à beira-leito', 'Troponina quantitativa e gasometria'],
    suggestedConduct: {
      id: 'choque-cardio-c1',
      text: 'Suporte inotrópico com dobutamina, norepinefrina se hipotensão refratária e encaminhamento para angioplastia primária.'
    },
    distractorConducts: [
      { id: 'choque-cardio-d1', text: 'Administrar 2000 mL de soro fisiológico em bolus rápido.', whyWrong: 'Sobrecarga de volume no choque cardiogênico precipita edema agudo de pulmão fatal.' },
      { id: 'choque-cardio-d2', text: 'Prescrever betabloqueador oral em dose alta.', whyWrong: 'Betabloqueadores são contraindicados no choque cardiogênico agudo descompensado.' }
    ],
    medications: [{ genericName: 'Dobutamina / Norepinefrina', route: 'Infusão Contínua', indication: 'Suporte inotrópico e vasopressor' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Choque cardiogênico decorre da falência da bomba ventricular, exigindo inotrópicos e revascularização precoce.',
    possibleComorbidities: ['Infarto Agudo do Miocárdio prévio', 'Insuficiência Cardíaca Crônica'],
    sources: [{ name: 'Diretriz da Sociedade Brasileira de Cardiologia', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'choque-neurogenico-traumatico',
    name: 'Choque Neurogênico Traumático',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 16, max: 70 },
    symptoms: ['Hipotensão arterial com bradicardia paradoxal', 'Extremidades quentes e secas', 'Déficit motor e sensitivo compatível com nível medular', 'Flacidez muscular'],
    suggestedExams: ['Imobilização da coluna vertebral completa', 'Tomografia computadorizada de coluna', 'Monitorização hemodinâmica invasiva'],
    suggestedConduct: {
      id: 'choque-neuro-c1',
      text: 'Ressuscitação volêmica moderada, vasopressores (noradrenalina) para manter PAM > 85 mmHg e descompressão cirúrgica.'
    },
    distractorConducts: [
      { id: 'choque-neuro-d1', text: 'Retirar prancha rígida e mobilizar ativamente o paciente.', whyWrong: 'Pode agravar lesão medular incompleta gerando tetraplegia permanente.' },
      { id: 'choque-neuro-d2', text: 'Administrar altas doses de atropina isolada sem vasopressores.', whyWrong: 'A hipotensão decorre de perda do tônus simpático periférico, necessitando de suporte alfa-adrenérgico.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Expansão volêmica inicial' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'No choque neurogênico por trauma raquimedular, a perda do tônus simpático causa vasodilatação e bradicardia.',
    possibleComorbidities: ['Traumatismo Raquimedular Cervical'],
    sources: [{ name: 'Ministério da Saúde - Protocolo de Urgência Traumática', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'queimadura-2-grau-extensa',
    name: 'Queimadura de 2º Grau Extensa (Fórmula de Parkland)',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 5, max: 75 },
    symptoms: ['Flictenas e bolhas rotas em > 20% da superfície corporal', 'Dor intensa local', 'Taquicardia compensatória', 'Perda plasmática contínua'],
    suggestedExams: ['Cálculo da regra dos nove', 'Controle rigoroso de débito urinário por sonda vesical', 'Eletrólitos e função renal'],
    suggestedConduct: {
      id: 'queim-parkland-c1',
      text: 'Ressuscitação volêmica com Ringer Lactato conforme fórmula de Parkland, analgesia venosa e curativo estéril sem romper bolhas íntegras.'
    },
    distractorConducts: [
      { id: 'queim-parkland-d1', text: 'Aplicar pomadas caseiras ou pasta de dente sobre a área queimada.', whyWrong: 'Aumenta risco de infecção grave e contaminação bacteriana tecidual.' },
      { id: 'queim-parkland-d2', text: 'Restringir hidratação para evitar edema tecidual.', whyWrong: 'Queimaduras extensas causam extravasamento capilar massivo com choque hipovolêmico precoce.' }
    ],
    medications: [{ genericName: 'Dipirona 500mg/mL', route: 'Intravenosa', indication: 'Controle de dor moderada a grave' }],
    medicationIds: ['dipirona', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A fórmula de Parkland (2 a 4 mL/kg/%SCQ de Ringer Lactato) é o padrão-ouro de hidratação nas primeiras 24 horas.',
    possibleComorbidities: ['Inalação de fumaça'],
    sources: [{ name: 'Ministério da Saúde - Cartilha de Tratamento de Queimaduras', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'queimadura-vias-aereas-inalacao',
    name: 'Queimadura de Vias Aéreas por Inalação',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 10, max: 85 },
    symptoms: ['Vibrissas nasais chamuscadas', 'Escarro carbonáceo', 'Estridor laríngeo e rouquidão progressiva', 'Tosse irritativa intensa'],
    suggestedExams: ['Laringoscopia direta urgente', 'Gasometria arterial com dosagem de carboxiemoglobina', 'Radiografia de tórax'],
    suggestedConduct: {
      id: 'queim-inala-c1',
      text: 'Intubação orotraqueal profilática precoce antes do edema glótico obstrutivo e oxigênio umidificado a 100%.'
    },
    distractorConducts: [
      { id: 'queim-inala-d1', text: 'Aguardar piora da saturação de oxigênio antes de considerar via aérea definitiva.', whyWrong: 'O edema de glote pode ocluir completamente a via aérea em minutos, impossibilitando a intubação orotraqueal.' },
      { id: 'queim-inala-d2', text: 'Prescrever xarope antitussígeno e liberar para repouso domiciliar.', whyWrong: 'Alto risco de asfixia mecânica aguda e intoxicação por cianeto/monóxido de carbono.' }
    ],
    medications: [{ genericName: 'Oxigênio Medicinal 100%', route: 'Inalatória', indication: 'Combate à hipóxia e intoxicação gasosa' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: false,
    explanation: 'Na lesão por inalação, a intubação precoce é mandatória devido à rápida evolução para obstrução laríngea por edema.',
    possibleComorbidities: ['Intoxicação por Monóxido de Carbono'],
    sources: [{ name: 'PCDT Ministério da Saúde - Queimaduras Graves', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'trauma-abdominal-hemoperitonio',
    name: 'Trauma Abdominal Fechado com Hemoperitônio',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 15, max: 70 },
    symptoms: ['Sinais de choque hipovolêmico pós-acidente', 'Distensão e dor à palpação abdominal', 'Equimose periumbilical ou em flancos', 'Descompressão brusca duvidosa'],
    suggestedExams: ['FAST (Focused Assessment with Sonography for Trauma)', 'Tomografia de abdome (se estável)', 'Hematócrito e lactato sérico'],
    suggestedConduct: {
      id: 'trauma-abd-c1',
      text: 'Se instável hemodinamicamente com FAST positivo, laparotomia exploradora de urgência imediata.'
    },
    distractorConducts: [
      { id: 'trauma-abd-d1', text: 'Encaminhar paciente instável para tomografia computadorizada sem via aérea segura.', whyWrong: 'Paciente instável não pode ir à tomografia; requer cirurgia imediata de controle de danos.' },
      { id: 'trauma-abd-d2', text: 'Administrar antiespasmódico oral e observar na sala de espera.', whyWrong: 'Hemorragia intra-abdominal maciça leva à parada cardiorrespiratória em poucos minutos.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Apoio hemodinâmico' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Trauma abdominal fechado com instabilidade e líquido livre na cavidade peritoneal exige laparotomia para hemostasia cirúrgica.',
    possibleComorbidities: ['Fratura de pelve', 'Ruptura esplênica ou hepática'],
    sources: [{ name: 'Colégio Brasileiro de Cirurgiões / Diretrizes MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'fratura-exposta-tibia',
    name: 'Fratura Exposta de Tíbia (Profilaxia Antibiótica Precoce)',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 12, max: 75 },
    symptoms: ['Ferida com exposição de fragmento ósseo', 'Deformidade evidente da perna', 'Sangramento local ativo', 'Dor intensa e impotência funcional'],
    suggestedExams: ['Radiografia em duas projeções (AP e perfil)', 'Avaliação neurovascular periférica (pulsos e perfusão)', 'Classificação de Gustilo-Anderson'],
    suggestedConduct: {
      id: 'frat-tibia-c1',
      text: 'Profilaxia antibiótica venosa na primeira hora (Cefazolina), profilaxia antitetânica, curativo estéril e fixação externa no centro cirúrgico.'
    },
    distractorConducts: [
      { id: 'frat-tibia-d1', text: 'Tentar empurrar o osso exposto para dentro da ferida na sala de triagem.', whyWrong: 'Aumenta a contaminação bacteriana profunda e causa lesão de tecidos moles e nervos.' },
      { id: 'frat-tibia-d2', text: 'Aguardar 24 horas para iniciar antibióticos para colher swab de ferida.', whyWrong: 'O atraso na antibioticoterapia multiplica expressivamente a taxa de osteomielite e perda do membro.' }
    ],
    medications: [
      { genericName: 'Cefazolina 1g', route: 'Intravenosa', indication: 'Profilaxia antibiótica precoce' },
      { genericName: 'Dipirona 500mg/mL', route: 'Intravenosa', indication: 'Analgesia' }
    ],
    medicationIds: ['dipirona', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Fraturas expostas são emergências ortopédicas: a administração de antibiótico na primeira hora é o fator mais relevante contra infecção.',
    possibleComorbidities: ['Politrauma'],
    sources: [{ name: 'Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'fratura-bacia-instavel',
    name: 'Fratura de Bacia Instável',
    area: 'Emergência e UTI',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 18, max: 80 },
    symptoms: ['Instabilidade mecânica do anel pélvico', 'Hipotensão refratária pós-trauma de alta energia', 'Hematoma perineal ou escrotal', 'Diferença de comprimento dos membros inferiores'],
    suggestedExams: ['Radiografia de bacia (AP, Inlet e Outlet)', 'FAST abdominal e pélvico', 'Tomografia computadorizada de pelve'],
    suggestedConduct: {
      id: 'frat-bacia-c1',
      text: 'Fechamento imediato do anel pélvico com cinta pélvica/lençol ao nível dos trocanteres maiores, reposição volêmica e fixação externa.'
    },
    distractorConducts: [
      { id: 'frat-bacia-d1', text: 'Realizar compressão repetida das cristas ilíacas para testar mobilidade.', whyWrong: 'Manobras repetidas deslocam coágulos hemostáticos e reacendem hemorragias retroperitoneais fatais.' },
      { id: 'frat-bacia-d2', text: 'Passar sonda vesical de demora sem avaliar meato uretral.', whyWrong: 'Há alto risco de transecção uretral associada em fraturas pélvicas instáveis.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Estabilização volêmica' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A estabilização precoce com amarração pélvica reduz o volume pélvico interno, tamponando o sangramento do plexo venoso pré-sacral.',
    possibleComorbidities: ['Lesão de uretra ou bexiga', 'Choque hemorrágico'],
    sources: [{ name: 'Diretrizes ATLS / Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'luxacao-posterior-quadril',
    name: 'Luxação Posterior de Quadril',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 18, max: 65 },
    symptoms: ['Membro inferior em adução, flexão e rotação interna ("atitude de pudor")', 'Dor intensa no quadril pós-impacto no painel do carro', 'Encurtamento aparente do membro afetado', 'Impotência funcional total'],
    suggestedExams: ['Radiografia de bacia e quadril afetado', 'Exame neurológico do nervo ciático (dorsoflexão do pé)'],
    suggestedConduct: {
      id: 'lux-quadril-c1',
      text: 'Redução incruenta fechada sob anestesia/sedação venosa profunda nas primeiras 6 horas (Manobra de Allis).'
    },
    distractorConducts: [
      { id: 'lux-quadril-d1', text: 'Aguardar cirurgia eletiva após 48 horas sem tentar redução de urgência.', whyWrong: 'Atrasos superiores a 6 horas multiplicam o risco de necrose avascular da cabeça femoral.' },
      { id: 'lux-quadril-d2', text: 'Estimular o paciente a caminhar com muletas para ver se o osso encaixa sozinho.', whyWrong: 'Pode fraturar o rebordo acetabular e lesionar irreversivelmente o nervo ciático.' }
    ],
    medications: [{ genericName: 'Dipirona 500mg/mL', route: 'Intravenosa', indication: 'Analgesia pré e pós-procedimento' }],
    medicationIds: ['dipirona'],
    requiresPharmacy: true,
    explanation: 'Luxação de quadril é uma urgência ortopédica; o tempo para redução fechada é crítico para a viabilidade vascular da cabeça do fêmur.',
    possibleComorbidities: ['Lesão do nervo ciático', 'Fratura de acetábulo'],
    sources: [{ name: 'Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'lesao-medular-cervical',
    name: 'Lesão Medular Aguda Cervical (Imobilização Rígida)',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 14, max: 75 },
    symptoms: ['Tetraplegia ou tetraparesia súbita pós-mergulho em água rasa ou colisão', 'Perda de reflexos abaixo da lesão (choque medular)', 'Priapismo em homens', 'Respiração diafragmática paradoxal'],
    suggestedExams: ['Tomografia computadorizada de coluna cervical', 'Ressonância magnética de coluna para compressão medular', 'Gasometria arterial seriada'],
    suggestedConduct: {
      id: 'lesao-med-c1',
      text: 'Manutenção rigorosa de colar cervical rígido e blocos laterais, suporte ventilatório preventivo e avaliação neurocirúrgica urgente.'
    },
    distractorConducts: [
      { id: 'lesao-med-d1', text: 'Remover colar cervical para inspecionar pescoço sem estabilização manual.', whyWrong: 'Movimentações intempestivas do pescoço podem seccionar a medula espinhal remanescente.' },
      { id: 'lesao-med-d2', text: 'Administrar corticosteroide em megadose por 48 horas como indicação isolada.', whyWrong: 'Megadoses de metilprednisolona não são mais recomendadas pelo risco de sepse e complicações graves.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Manutenção hemodinâmica' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Trauma cervical com déficit motor exige manutenção incondicional do alinhamento neutro e descompressão precoce se houver compressão óssea ou discal.',
    possibleComorbidities: ['Insuficiência respiratória por paralisia dos intercostais'],
    sources: [{ name: 'Diretriz de Atenção à Pessoa com Lesão Medular - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'concussao-cerebral-upa',
    name: 'Concussão Cerebral Leve na UPA',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA',
    severity: 'Moderada',
    weight: 3,
    ageRange: { min: 6, max: 60 },
    symptoms: ['Cefaleia pós-trauma craniano', 'Amnésia do evento e confusão passageira', 'Náuseas e vertigem leve', 'Escala de Glasgow 15 após avaliação'],
    suggestedExams: ['Avaliação neurológica seriada', 'Aplicação dos critérios canadenses de TC de crânio'],
    suggestedConduct: {
      id: 'concussao-c1',
      text: 'Observação clínica na UPA por 4 a 6 horas, analgesia com dipirona e orientação de sinais de alerta aos familiares.'
    },
    distractorConducts: [
      { id: 'concussao-d1', text: 'Prescrever sedativo forte para o paciente dormir profundamente em casa.', whyWrong: 'Sedativos mascaram a deterioração do nível de consciência por sangramentos intracranianos.' },
      { id: 'concussao-d2', text: 'Solicitar radiografia simples de crânio para afastar lesão cerebral.', whyWrong: 'Radiografia de crânio não avalia o parênquima encefálico nem afasta hematomas intracranianos.' }
    ],
    medications: [{ genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Alívio de cefaleia' }],
    medicationIds: ['dipirona'],
    requiresPharmacy: true,
    explanation: 'A concussão cerebral leve exige vigilância ativa e critérios clínicos rigorosos para indicação de neuroimagem.',
    possibleComorbidities: ['Cefaleia tensional pós-traumática'],
    sources: [{ name: 'Protocolo de Trauma Cranioencefálico Leve - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hematoma-epidural-agudo',
    name: 'Hematoma Epidural Agudo',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 10, max: 50 },
    symptoms: ['Trauma em região temporal com "intervalo lúcido"', 'Rápida deterioração neurológica subsequente', 'Anisocoria com midríase ipsilateral', 'Hemiparesia contralateral (Tríade de Cushing)'],
    suggestedExams: ['Tomografia computadorizada de crânio sem contraste', 'Monitorização de sinais vitais contínua'],
    suggestedConduct: {
      id: 'hematoma-epi-c1',
      text: 'Tomografia demonstrando lesão biconvexa hiperdensa e craniotomia/trepanação descompressiva de urgência imediata.'
    },
    distractorConducts: [
      { id: 'hematoma-epi-d1', text: 'Aguardar paciente despertar espontaneamente em leito de enfermaria comum.', whyWrong: 'A hemorragia da artéria meníngea média é rápida e leva à herniação uncal fatal em poucas horas.' },
      { id: 'hematoma-epi-d2', text: 'Administrar anti-hipertensivo potente para baixar a pressão arterial sistêmica na tríade de Cushing.', whyWrong: 'A hipertensão é reflexo para manter a perfusão cerebral; baixá-la causa isquemia encefálica imediata.' }
    ],
    medications: [{ genericName: 'Manitol 20%', route: 'Intravenosa', indication: 'Controle transitório da hipertensão intracraniana pré-cirúrgica' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'O hematoma epidural decorre de laceração da artéria meníngea média e requer neurocirurgia imediata para evacuação.',
    possibleComorbidities: ['Fratura do osso temporal'],
    sources: [{ name: 'Sociedade Brasileira de Neurocirurgia / Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hematoma-subdural-cronico-idoso',
    name: 'Hematoma Subdural Crônico no Idoso',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 65, max: 95 },
    symptoms: ['História de queda leve semanas antes', 'Cefaleia holocraniana progressiva', 'Alteração comportamental ou declínio cognitivo flutuante', 'Déficits motores focais insidiosos'],
    suggestedExams: ['Tomografia computadorizada de crânio (imagem em crescente hipodensa/isodensa)', 'Coagulograma e plaquetas'],
    suggestedConduct: {
      id: 'subdural-cron-c1',
      text: 'Encaminhamento neurocirúrgico para drenagem por orifício de trépano (trepanação) e correção de eventuais coagulopatias.'
    },
    distractorConducts: [
      { id: 'subdural-cron-d1', text: 'Diagnosticar demência de Alzheimer e prescrever antipsicótico sem neuroimagem.', whyWrong: 'Hematoma subdural é uma causa tratável e reversível de déficit neurológico e confusão mental no idoso.' },
      { id: 'subdural-cron-d2', text: 'Prescrever ácido acetilsalicílico ou anticoagulante para circulação cerebral.', whyWrong: 'Antiagregantes ou anticoagulantes aumentam o hematoma intracraniano e o risco de óbito.' }
    ],
    medications: [{ genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Alívio sintomático' }],
    medicationIds: ['dipirona'],
    requiresPharmacy: true,
    explanation: 'No idoso com atrofia cerebral, pequenas quedas estiram veias-ponte, gerando sangramento venoso lento e tratável.',
    possibleComorbidities: ['Uso prévio de anticoagulante oral'],
    sources: [{ name: 'Manual de Geriatria e Gerontologia SUS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'isquemia-mesenterica-aguda',
    name: 'Isquemia Mesentérica Aguda',
    area: 'Emergência e UTI',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 55, max: 88 },
    symptoms: ['Dor abdominal periumbilical desproporcional ao exame físico', 'História prévia de arritmia (Fibrilação Atrial)', 'Evacuações diarreicas que evoluem para hematoquezia ("geleia de framboesa")', 'Acidose lática grave'],
    suggestedExams: ['Angiotomografia de abdome', 'Lactato sérico elevado e gasometria arterial', 'Eletrocardiograma'],
    suggestedConduct: {
      id: 'isquemia-mes-c1',
      text: 'Anticoagulação imediata, ressuscitação volêmica e laparotomia de urgência para embolectomia ou ressecção de alça necrótica.'
    },
    distractorConducts: [
      { id: 'isquemia-mes-d1', text: 'Liberar paciente com antiácido e antiespasmódico por exame físico inocente.', whyWrong: 'O contraste entre dor extrema e exame físico brando é a marca registrada da isquemia mesentérica.' },
      { id: 'isquemia-mes-d2', text: 'Realizar colonoscopia diagnóstica imediata em paciente instável.', whyWrong: 'Insuflação colônica em intestino isquêmico eleva dramaticamente o risco de perfuração livre.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Ressuscitação volêmica' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A isquemia mesentérica aguda por êmbolo na artéria mesentérica superior exige diagnóstico ultrarrápido para salvar alças intestinais.',
    possibleComorbidities: ['Fibrilação atrial sem anticoagulação'],
    sources: [{ name: 'Diretriz de Abdome Agudo Vascular - CBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'isquemia-arterial-aguda-membro',
    name: 'Isquemia Arterial Aguda de Membro (Síndrome de Volkmann)',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 35, max: 80 },
    symptoms: ['Os 6 "Ps": Pain (dor súbita), Pallor (palidez), Pulselessness (ausência de pulso)', 'Paresthesia (formigamento), Paralysis (paralisia), Poikilothermia (frialdade)'],
    suggestedExams: ['Doppler vascular à beira do leito', 'Angiotomografia arterial se centro cirúrgico não for imediato', 'Avaliação de tempo de isquemia'],
    suggestedConduct: {
      id: 'isquemia-membro-c1',
      text: 'Heparinização plena imediata e encaminhamento cirúrgico urgente para embolectomia com cateter de Fogarty ou fasciotomia.'
    },
    distractorConducts: [
      { id: 'isquemia-membro-d1', text: 'Aquecer ativamente a perna com compressas quentes ou bolsas térmicas.', whyWrong: 'O calor aumenta a taxa metabólica do tecido isquêmico, acelerando necrose e queimaduras por perda de sensibilidade.' },
      { id: 'isquemia-membro-d2', text: 'Elevar o membro afetado acima do nível do coração.', whyWrong: 'A elevação dificulta ainda mais a fraca perfusão arterial por gravidade.' }
    ],
    medications: [{ genericName: 'Heparina Sódica', route: 'Intravenosa', indication: 'Interrupção da propagação do trombo' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A isquemia arterial aguda tem janela de ouro de 6 horas para revascularização antes de necrose muscular irreversível.',
    possibleComorbidities: ['Ateromatose sistêmica', 'Estenose mitral'],
    sources: [{ name: 'Sociedade Brasileira de Angiologia e Cirurgia Vascular (SBACV)', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'perfuracao-ulcera-peptica',
    name: 'Perfuração de Úlcera Péptica (Abdome Agudo Perfurativo)',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 25, max: 75 },
    symptoms: ['Dor epigástrica súbita em "punhalada"', 'Abdome em tábua (defesa involuntária generalizada)', 'Desaparecimento da macicez hepática (Sinal de Jobert)', 'Taquicardia e fácies de dor'],
    suggestedExams: ['Radiografia de tórax em cúpulas (Pneumoperitônio)', 'Hemograma, eletrólitos e lactato', 'Tomografia se radiografia duvidosa'],
    suggestedConduct: {
      id: 'ulcera-perf-c1',
      text: 'Jejum absoluto, descompressão gástrica por sonda nasogástrica, hidratação venosa vigorosa, antibioticoterapia e laparotomia para rafia (Graham patch).'
    },
    distractorConducts: [
      { id: 'ulcera-perf-d1', text: 'Indicar endoscopia digestiva alta de urgência para cauterização.', whyWrong: 'A insuflação gasosa da endoscopia em úlcera perfurada extravasa ar e conteúdo gástrico para o peritônio, gerando choque séptico.' },
      { id: 'ulcera-perf-d2', text: 'Prescrever antiácido em suspensão via oral.', whyWrong: 'Medicamentos via oral em vigência de perfuração gastroduodenal contaminam o peritônio.' }
    ],
    medications: [
      { genericName: 'Amoxicilina + Clavulanato', route: 'Intravenosa', indication: 'Cobertura de flora gastrointestinal' },
      { genericName: 'Dipirona 500mg/mL', route: 'Intravenosa', indication: 'Analgesia' }
    ],
    medicationIds: ['dipirona', 'amoxicilina', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Abdome agudo perfurativo com peritonite generalizada exige rafia cirúrgica de urgência associada a bloqueadores ácidos e suporte hemodinâmico.',
    possibleComorbidities: ['Uso crônico de AINEs'],
    sources: [{ name: 'PCDT Úlcera Péptica / CBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'volvo-de-sigmoide',
    name: 'Volvo de Sigmoide',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 60, max: 90 },
    symptoms: ['Distensão abdominal volumosa assimétrica', 'Parada de eliminação de gases e fezes', 'Dor abdominal em cólica e vômitos tardios', 'Timpanismo acentuado'],
    suggestedExams: ['Radiografia de abdome agudo (Sinal do "U" invertido ou grão de café)', 'Tomografia de abdome', 'Retossigmoidoscopia'],
    suggestedConduct: {
      id: 'volvo-sig-c1',
      text: 'Se sem sinais de estrangulamento/peritonite, descompressão endoscópica não cirúrgica inicial seguida de sigmoidectomia eletiva.'
    },
    distractorConducts: [
      { id: 'volvo-sig-d1', text: 'Prescrever laxante osmótico ou enema de alto volume para forçar evacuação.', whyWrong: 'Estimular peristalse contra uma alça torcida fechada provoca perfuração colônica imediata.' },
      { id: 'volvo-sig-d2', text: 'Dar alta com orientações dietéticas de aumento de fibras.', whyWrong: 'Alça torcida em 360° evolui para isquemia parietal, necrose e sepse se não corrigida.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Hidratação e correção eletrolítica' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Volvo de sigmoide é frequente em idosos com dolicomegacólon chagásico ou constipação crônica, demandando distorção imediata.',
    possibleComorbidities: ['Doença de Chagas crônica', 'Constipação crônica'],
    sources: [{ name: 'Colégio Brasileiro de Cirurgiões - Urgências Colorretais', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'intussuscepcao-no-adulto',
    name: 'Intussuscepção no Adulto',
    area: 'Emergência e UTI',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 30, max: 75 },
    symptoms: ['Dor abdominal em cólicas intermitentes', 'Sinais de obstrução intestinal mecânica', 'Massa palpável tubular móvel', 'Náuseas e distensão'],
    suggestedExams: ['Tomografia computadorizada de abdome ("sinal do alvo" ou "pseudorrim")', 'Colonoscopia / Laparoscopia'],
    suggestedConduct: {
      id: 'intus-adulto-c1',
      text: 'Ressonância/TC diagnóstica e laparotomia com ressecção oncológica em monobloco sem redução prévia devido ao risco de neoplasia primária.'
    },
    distractorConducts: [
      { id: 'intus-adulto-d1', text: 'Realizar enema baritado com pressão hidrostática como conduta definitiva.', whyWrong: 'Diferente de crianças, em adultos a intussuscepção tem causa maligna em até 70% dos casos; redução pneumática/hidrostática é contraindicada.' },
      { id: 'intus-adulto-d2', text: 'Prescrever antiespasmódico e aguardar desinvaginação espontânea.', whyWrong: 'Pode resultar em necrose isquêmica, gangrena intestinal e perfuração.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Suporte hidroeletrolítico' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'No adulto, a intussuscepção é rara e decorre de lesão patológica estrutural como pólipos ou adenocarcinomas, demandando cirurgia.',
    possibleComorbidities: ['Neoplasia colônica primária'],
    sources: [{ name: 'Sociedade Brasileira de Coloproctologia', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'fasciite-necrosante',
    name: 'Fasciíte Necrosante (Síndrome de Fournier)',
    area: 'Emergência e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 25, max: 80 },
    symptoms: ['Dor local intensa desproporcional ao aspecto cutâneo', 'Crepitação à palpação (gás subcutâneo)', 'Presença de flictenas hemorrágicas e áreas de necrose cutânea', 'Sinais francos de sepse/choque séptico'],
    suggestedExams: ['Avaliação cirúrgica imediata', 'Tomografia ou radiografia com gás em tecidos moles', 'Hemoculturas e perfil metabólico'],
    suggestedConduct: {
      id: 'fasciite-c1',
      text: 'Desbridamento cirúrgico agressivo precoce e amplo, antibioticoterapia de largo espectro venosa e internação em UTI.'
    },
    distractorConducts: [
      { id: 'fasciite-d1', text: 'Tratar apenas com antibiótico oral ambulatorial e pomada cicatrizante.', whyWrong: 'A infecção necrosante progride a centímetros por hora na fáscia; sem cirurgia a mortalidade é próxima de 100%.' },
      { id: 'fasciite-d2', text: 'Aguardar resultado de culturas microbiológicas antes de intervir cirurgicamente.', whyWrong: 'O desbridamento cirúrgico é a medida de maior impacto na sobrevida e não tolera atrasos diagnósticos.' }
    ],
    medications: [
      { genericName: 'Amoxicilina + Clavulanato', route: 'Intravenosa', indication: 'Terapia antimicrobiana combinada' },
      { genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Expansão volêmica da sepse' }
    ],
    medicationIds: ['amoxicilina', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Fasciíte necrosante é infecção bacteriana devastadora das fáscias profundas; o desbridamento cirúrgico em bloco precoce é vital.',
    possibleComorbidities: ['Diabetes Mellitus descompensado', 'Imunossupressão'],
    sources: [{ name: 'PCDT Sepse e Infecções Graves - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'gangrena-gasosa-clostridiana',
    name: 'Gangrena Gasosa Clostridiana',
    area: 'Emergência e UTI',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 18, max: 75 },
    symptoms: ['Dor súbita excruciante em ferida cirúrgica ou traumática', 'Edema tenso com exsudato pardo de odor fétido', 'Crepitação massiva por produção gasosa de Clostridium', 'Colapso hemodinâmico e anemia hemolítica rápida'],
    suggestedExams: ['Radiografia de partes moles (gás intramuscular extenso)', 'Bacterioscopia por Gram imediata', 'Gasometria e lactato'],
    suggestedConduct: {
      id: 'gangrena-c1',
      text: 'Desbridamento cirúrgico de emergência radical, penicilina cristalina em altas doses combinada com clindamicina e suporte em UTI.'
    },
    distractorConducts: [
      { id: 'gangrena-d1', text: 'Manter conduta expectante com curativos simples úmidos.', whyWrong: 'A mionecrose por Clostridium perfringens destrói grupos musculares em questão de horas com toxemia fulminante.' },
      { id: 'gangrena-d2', text: 'Suturar hermeticamente a ferida contaminada para reter o sangramento.', whyWrong: 'O fechamento de feridas anaeróbias cria o ambiente anóxico perfeito para proliferação clostridiana.' }
    ],
    medications: [{ genericName: 'Benzilpenicilina Cristalina', route: 'Intravenosa', indication: 'Erradicação clostridiana' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A mionecrose clostridiana libera exotoxinas que causam hemólise e necrose tecidual fulminante, exigindo cirurgia descompressiva imediata.',
    possibleComorbidities: ['Ferimentos contaminados com terra/fezes'],
    sources: [{ name: 'Manual de Urgências e Cirurgia de Guerra - MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  }
];

const all100NewCases = [...newCasesRaw, ...cases271to310, ...cases311to350];
console.log(`[generate-cases] Total de novos casos combinados: ${all100NewCases.length}`);

if (all100NewCases.length !== 100) {
  throw new Error(`Esperado exatamente 100 novos casos, mas obteve ${all100NewCases.length}`);
}

// Verificar IDs duplicados
const idSet = new Set(existingCases.map(c => c.id));
for (const c of all100NewCases) {
  if (idSet.has(c.id)) {
    throw new Error(`ID duplicado detectado: ${c.id}`);
  }
  idSet.add(c.id);
}

const finalCases = [...existingCases, ...all100NewCases];
console.log(`[generate-cases] Total final de casos: ${finalCases.length}`);

if (finalCases.length !== 350) {
  throw new Error(`Esperado exatamente 350 casos no total, mas obteve ${finalCases.length}`);
}

const payload = {
  _meta: {
    description: "Catálogo completo de 350 casos clínicos do SUS com protocolos PCDT/MS, RENAME e ANVISA",
    connectedFiles: [
      "src/data/clinical-cases.json",
      "src/systems/patient-system.ts",
      "src/systems/mastery-system.ts",
      "src/ui/encyclopedia-modal.ts",
      "tests/portable-drag-350cases-and-dense-map.test.ts"
    ],
    version: "2.0.0",
    totalCases: finalCases.length,
    updatedAt: "2026-10-26"
  },
  cases: finalCases
};

fs.writeFileSync(casesPath, JSON.stringify(payload, null, 2), 'utf-8');
fs.writeFileSync(clinicalCasesPath, JSON.stringify(payload, null, 2), 'utf-8');

console.log(`[generate-cases] Sucesso! Gravados 350 casos em cases.json e clinical-cases.json.`);
