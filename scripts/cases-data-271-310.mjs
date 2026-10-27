/**
 * Arquivo: scripts/cases-data-271-310.mjs
 *
 * 1. O que este arquivo faz?
 * Define 40 casos clínicos especializados do SUS (casos 271 a 310):
 * - 271 a 290: Infectologia, Vigilância Epidemiológica SUS e Medicina Tropical
 * - 291 a 310: Cardiologia, Pneumologia, Nefrologia e Clínica Médica
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Integrar a expansão da Enciclopédia SUS para 350 casos clínicos reais no Prompt 22.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Importado por scripts/generate-cases-350.mjs. Cada caso possui condutas, distratores e fontes baseadas no PCDT/MS.
 *
 * Importa: (módulo puro de dados)
 * Conecta-se com: scripts/generate-cases-350.mjs, src/data/cases.json
 */

export const cases271to310 = [
  // 271 a 290 — Infectologia, Vigilância Epidemiológica SUS e Medicina Tropical
  {
    id: 'raiva-humana-profilaxia',
    name: 'Raiva Humana (Profilaxia Pós-Exposição com Soro e Vacina)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UBS e UPA',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 2, max: 80 },
    symptoms: ['Mordedura profunda por morcego ou animal raivoso desaparecido', 'Ansiedade e parestesia local', 'Espasmos laríngeos e hidrofobia (em fase clínica)'],
    suggestedExams: ['Avaliação da gravidade do ferimento e espécie agressora', 'Lavagem exaustiva com água e sabão'],
    suggestedConduct: {
      id: 'raiva-c1',
      text: 'Lavagem imediata com água e sabão, infiltração de Soro Antirrábico Homólogo (SAR) na ferida e esquema vacinal completo (4 doses).'
    },
    distractorConducts: [
      { id: 'raiva-d1', text: 'Suturar o ferimento imediatamente sem aplicar soro nem vacina.', whyWrong: 'A sutura inocula o vírus no tecido profundo e acelera o acometimento do sistema nervoso central com 100% de letalidade.' },
      { id: 'raiva-d2', text: 'Aguardar 10 dias para ver se o paciente apresenta sintomas de raiva antes de vacinar.', whyWrong: 'Uma vez iniciados os sintomas neurológicos, a doença é virtualmente 100% fatal.' }
    ],
    medications: [{ genericName: 'Soro Antirrábico + Vacina de Raiva', route: 'Infiltração local e Intramuscular', indication: 'Imunização passiva e ativa' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A profilaxia pós-exposição precoce é a única intervenção eficaz para prevenir a encefalite rábica humana fatal.',
    possibleComorbidities: ['Ferimento por animal silvestre'],
    sources: [{ name: 'Guia de Vigilância em Saúde - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'tetano-acidental',
    name: 'Tétano Acidental (Soro Antitetânico + Metronidazol)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 10, max: 85 },
    symptoms: ['Trismo e riso sardônico característicos', 'Opistótono e contraturas musculares paroxísticas', 'Espasmos desencadeados por estímulos luminosos e sonoros', 'Ausência de febre alta'],
    suggestedExams: ['Diagnóstico estritamente clínico', 'Avaliação do histórico vacinal', 'Gasometria e lactato'],
    suggestedConduct: {
      id: 'tetano-c1',
      text: 'Imunoglobulina humana antitetânica (ou SAT), metronidazol venoso, desbridamento da porta de entrada e isolamento em quarto escuro e silencioso com suporte ventilatório.'
    },
    distractorConducts: [
      { id: 'tetano-d1', text: 'Estimular o paciente com luz forte e ruído para testar reflexos motores.', whyWrong: 'Estímulos sensoriais desencadeiam espasmos paroxísticos graves com laringoespasmo e asfixia.' },
      { id: 'tetano-d2', text: 'Prescrever relaxante muscular oral ambulatorial e dispensar.', whyWrong: 'Tétano é emergência com indicação de UTI pelo alto risco de parada respiratória por fadiga diafragmática.' }
    ],
    medications: [
      { genericName: 'Metronidazol 500mg', route: 'Intravenosa', indication: 'Eliminação da forma vegetativa de Clostridium tetani' },
      { genericName: 'Diazepam 10mg', route: 'Intravenosa', indication: 'Controle de espasmos musculares' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'O tétano é prevenível por vacinação regular e exige neutralização da toxina tetanospasmina e sedação em ambiente hospitalar.',
    possibleComorbidities: ['Ferimento pérfuro-cortante contaminado'],
    sources: [{ name: 'Manual de Manejo do Tétano - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'botulismo-alimentar',
    name: 'Botulismo Alimentar',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 5, max: 75 },
    symptoms: ['Paralisia flácida simétrica e descendente', 'Ptose palpebral e diplopia ("visão dupla")', 'Disfagia e boca seca', 'Insuficiência respiratória progressiva com lucidez preservada'],
    suggestedExams: ['Notificação compulsória imediata à Vigilância Epidemiológica', 'Pesquisa da toxina botulínica no soro e alimentos', 'Eletromiografia'],
    suggestedConduct: {
      id: 'botulismo-c1',
      text: 'Internação em UTI com suporte ventilatório precoce e administração do Soro Antibotulínico Trivalente (AB-E).'
    },
    distractorConducts: [
      { id: 'botulismo-d1', text: 'Administrar antibióticos aminoglicosídeos empiricamente.', whyWrong: 'Aminoglicosídeos bloqueiam a junção neuromuscular e agravam a paralisia respiratória botulínica.' },
      { id: 'botulismo-d2', text: 'Liberar paciente diagnosticado como miastenia gravis ambulatorial.', whyWrong: 'A toxina botulínica progride para paralisia do diafragma em poucas horas.' }
    ],
    medications: [{ genericName: 'Soro Antibotulínico', route: 'Intravenosa', indication: 'Neutralização da toxina circulante' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A toxina botulínica inibe a liberação de acetilcolina na junção neuromuscular; o soro impede nova ligação de toxina.',
    possibleComorbidities: ['Consumo recente de conservas caseiras ou embutidos'],
    sources: [{ name: 'Guia de Vigilância Epidemiológica do Botulismo - MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'colera-hidratacao-rapida',
    name: 'Cólera (Hidratação Venosa Rápida + Azitromicina)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 2, max: 80 },
    symptoms: ['Diarreia aquosa profusa e incolor ("água de arroz")', 'Vômitos frequentes e desidratação em horas', 'Cãibras musculares intensas por perda de potássio', 'Olhos encovados e perda de turgor cutâneo'],
    suggestedExams: ['Pesquisa de Vibrio cholerae em fezes (Cary-Blair)', 'Eletrólitos séricos e gasometria venosa'],
    suggestedConduct: {
      id: 'colera-c1',
      text: 'Hidratação venosa vigorosa imediata com Ringer Lactato (Plano C de desidratação), SRO continuado e azitromicina em dose única.'
    },
    distractorConducts: [
      { id: 'colera-d1', text: 'Prescrever loperamida para cessar a diarreia aquosa.', whyWrong: 'Antidiarreicos inibem o trânsito intestinal e aumentam a absorção da enterotoxina colérica.' },
      { id: 'colera-d2', text: 'Restringir líquidos venosos por medo de hiponatremia.', whyWrong: 'Na cólera a perda hídrica pode ultrapassar 1 litro por hora, levando ao choque hipovolêmico fatal.' }
    ],
    medications: [
      { genericName: 'Azitromicina 500mg', route: 'Oral', indication: 'Redução da duração da diarreia e eliminação bacteriana' },
      { genericName: 'Sais para Reidratação Oral (SRO)', route: 'Oral', indication: 'Manutenção hidroeletrolítica' }
    ],
    medicationIds: ['sais-reidratacao', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A hidratação parenteral maciça imediata é o pilar salvador na cólera epidêmica grave.',
    possibleComorbidities: ['Distúrbio hidroeletrolítico grave'],
    sources: [{ name: 'Manual Integrado de Vigilância e Manejo da Cólera - MS/OPAS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'febre-tifoide',
    name: 'Febre Tifoide (Ciprofloxacino / Ceftriaxona)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 10, max: 65 },
    symptoms: ['Febre alta prolongada com bradicardia relativa (Sinal de Faget)', 'Hepatoesplenomegalia dolorosa', 'Roséolas tíficas no tronco', 'Dor abdominal e constipação inicial que vira diarreia'],
    suggestedExams: ['Hemocultura seriada na 1ª semana', 'Coprocultura a partir da 2ª semana', 'Hemograma com leucopenia e desvio'],
    suggestedConduct: {
      id: 'tifoide-c1',
      text: 'Antibioticoterapia com Ceftriaxona venosa ou Ciprofloxacino oral, monitorização de sangramento intestinal e hidratação.'
    },
    distractorConducts: [
      { id: 'tifoide-d1', text: 'Tratar apenas como virose comum com paracetamol e repouso.', whyWrong: 'A infecção por Salmonella Typhi não tratada evolui com perfuração ileal e peritonite séptica fatal.' },
      { id: 'tifoide-d2', text: 'Prescrever anti-inflamatório não esteroidal para baixar a febre.', whyWrong: 'Aumenta consideravelmente o risco de hemorragia e perfuração das placas de Peyer ulceradas.' }
    ],
    medications: [{ genericName: 'Ceftriaxona 1g', route: 'Intravenosa', indication: 'Erradicação de Salmonella Typhi' }],
    medicationIds: ['paracetamol', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A febre tifoide é bacteremia sistêmica com risco de complicações ileais graves se o antibiótico não for administrado.',
    possibleComorbidities: ['Ulceração de placas de Peyer'],
    sources: [{ name: 'Guia de Vigilância em Saúde - Febre Tifoide - MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'brucelose-humana',
    name: 'Brucelose Humana',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UBS e UPA',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 18, max: 70 },
    symptoms: ['Febre ondulante vespertina prolongada', 'Sudorese profusa com odor fétido característico', 'Artralgia migratória e lombalgia crônica', 'Contato ocupacional com gado ou consumo de leite cru'],
    suggestedExams: ['Sorologia de aglutinação de Wright', 'Rosa Bengala', 'Hemocultura em meio bifásico'],
    suggestedConduct: {
      id: 'brucelose-c1',
      text: 'Esquema duplo prolongado com Doxiciclina associada a Rifampicina por 6 semanas e notificação à vigilância sanitária.'
    },
    distractorConducts: [
      { id: 'brucelose-d1', text: 'Monoterapia com amoxicilina por 7 dias.', whyWrong: 'A Brucella é bactéria intracelular facultativa; monoterapia curta gera recaídas em quase 100% dos casos.' },
      { id: 'brucelose-d2', text: 'Prescrever analgésicos e liberar sem terapia antimicrobiana.', whyWrong: 'Evolui para espondilodiscite crônica, endocardite e sequelas articulares graves.' }
    ],
    medications: [{ genericName: 'Doxiciclina + Rifampicina', route: 'Oral', indication: 'Terapia combinada para bactéria intracelular' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A brucelose zoonótica requer antibioticoterapia combinada prolongada para erradicar o reservatório intracelular.',
    possibleComorbidities: ['Espondilite lombar'],
    sources: [{ name: 'Ministério da Saúde - Zoonoses de Notificação', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'neurocisticercose-cerebral',
    name: 'Cisticercose Cerebral (Neurocisticercose)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 15, max: 70 },
    symptoms: ['Crises convulsivas de início no adulto', 'Cefaleia crônica com náuseas', 'Sinais focais motores ou hipertensão intracraniana', 'Histórico de moradia em zona rural'],
    suggestedExams: ['Ressonância magnética de crânio ou Tomografia (cistos com escólex e calcificações)', 'Sorologia ELISA para cisticercose'],
    suggestedConduct: {
      id: 'neurocistic-c1',
      text: 'Antiparasitário com Albendazol associado a corticoterapia prévia (dexametasona) e anticonvulsivante (carbamazepina).'
    },
    distractorConducts: [
      { id: 'neurocistic-d1', text: 'Iniciar albendazol sem corticoide protetor prévio.', whyWrong: 'A morte dos parasitas encefálicos sem corticoide desencadeia edema cerebral massivo e crise convulsiva refratária.' },
      { id: 'neurocistic-d2', text: 'Indicar punção lombar na vigência de hipertensão intracraniana grave.', whyWrong: 'Risco iminente de herniação amigdaliana e parada respiratória por gradiente de pressão.' }
    ],
    medications: [
      { genericName: 'Albendazol 400mg', route: 'Oral', indication: 'Ação antiparasitária sobre cistos viáveis' },
      { genericName: 'Dexametasona 4mg', route: 'Oral / Venosa', indication: 'Controle de reação inflamatória cerebral' }
    ],
    medicationIds: ['paracetamol', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A neurocisticercose é a causa parasitária mais comum de epilepsia no Brasil; o tratamento antiparasitário exige cobertura de corticoide.',
    possibleComorbidities: ['Epilepsia secundária'],
    sources: [{ name: 'PCDT Neurocisticercose - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'filariose-linfatica',
    name: 'Filariose Linfática (Elefantíase)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UBS e UPA',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 10, max: 75 },
    symptoms: ['Linfedema progressivo de membros inferiores e genitália', 'Episódios recorrentes de adenolinfangite ("febre filarial")', 'Pele espessada e verrucosa', 'Área endêmica de transmissão vetorial por Culex'],
    suggestedExams: ['Pesquisa de microfilárias no sangue periférico em gota espessa noturna (22h às 02h)', 'Ultrassonografia de cordão espermático (Dança filarial)'],
    suggestedConduct: {
      id: 'filariose-c1',
      text: 'Tratamento com Dietilcarbamazina (DEC) em dose única anual ou esquema de 12 dias e cuidados higiênico-locais para prevenção de erisipela secundária.'
    },
    distractorConducts: [
      { id: 'filariose-d1', text: 'Indicar amputação imediata do membro afetado no diagnóstico inicial.', whyWrong: 'Cuidados higiênicos, drenagem linfática e profilaxia de infecções secundárias revertem ou estabilizam o linfedema sem mutilação.' },
      { id: 'filariose-d2', text: 'Prescrever anti-helmíntico comum sem investigar filariose.', whyWrong: 'Dietilcarbamazina é a medicação específica preconizada pelo programa de eliminação do SUS.' }
    ],
    medications: [{ genericName: 'Dietilcarbamazina', route: 'Oral', indication: 'Microfilaricida específico' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A filariose linfática é doença tropical negligenciada alvo de programa nacional de eliminação do Ministério da Saúde.',
    possibleComorbidities: ['Infecções bacterianas de repetição (erisipela)'],
    sources: [{ name: 'Programa Nacional de Eliminação da Filariose Linfática - MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'oncocercose',
    name: 'Oncocercose ("Cegueira dos Rios")',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UBS',
    severity: 'Grave',
    weight: 2,
    ageRange: { min: 8, max: 65 },
    symptoms: ['Prurido cutâneo intenso e lesões papulares (oncodermatite)', 'Nódulos subcutâneos indolores sobre proeminências ósseas', 'Lesões oculares com ceratite e perda visual progressiva', 'Residência em área indígena endêmica (Simulídeos/borrachudos)'],
    suggestedExams: ['Biópsia de pele superficial a fresco (skin snip)', 'Exame oftalmológico com lâmpada de fenda'],
    suggestedConduct: {
      id: 'onco-c1',
      text: 'Administração semestral de Ivermectina em dose oral supervisionada e encaminhamento oftalmológico para controle das lesões corneanas.'
    },
    distractorConducts: [
      { id: 'onco-d1', text: 'Prescrever Dietilcarbamazina (DEC) de rotina.', whyWrong: 'A DEC desencadeia reação de Mazzotti grave com choque anafilactoide e piora imediata da lesão ocular.' },
      { id: 'onco-d2', text: 'Tratar apenas com corticoide tópico e dispensar.', whyWrong: 'A sobrevida das microfilárias continuará lesando a retina e o nervo óptico até a cegueira definitiva.' }
    ],
    medications: [{ genericName: 'Ivermectina 6mg', route: 'Oral', indication: 'Microfilaricida seguro de escolha' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A oncocercose é controlada no Brasil com ivermectina periódica na população Yanomami pelo Ministério da Saúde e OMS.',
    possibleComorbidities: ['Ceratite esclerosante'],
    sources: [{ name: 'Programa Brasileiro de Eliminação da Oncocercose - MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'tracoma-folicular',
    name: 'Tracoma Inflamatório Folicular',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 1, max: 15 },
    symptoms: ['Hiperemia conjuntival e sensação de corpo estranho', 'Presença de 5 ou mais folículos na conjuntiva tarsal superior', 'Secreção mucopurulenta crônica', 'Ambiente escolar com múltiplos casos'],
    suggestedExams: ['Exame clínico com eversão da pálpebra superior e lupa de mão 2.5x', 'Classificação pela escala simplificada da OMS (TF)'],
    suggestedConduct: {
      id: 'tracoma-c1',
      text: 'Tratamento em dose única com Azitromicina oral para o paciente e todos os contatos domiciliares, associado a orientações de higiene facial.'
    },
    distractorConducts: [
      { id: 'tracoma-d1', text: 'Prescrever colírio de corticoide isolado sem antibiótico.', whyWrong: 'Corticoides tópicos agravam a infecção por Chlamydia trachomatis e favorecem cegueira precoce.' },
      { id: 'tracoma-d2', text: 'Tratar apenas a criança afetada ignorando os irmãos e pais conviventes.', whyWrong: 'O reservatório intrafamiliar não tratado reinfecta a criança rapidamente.' }
    ],
    medications: [{ genericName: 'Azitromicina 500mg / Suspensão', route: 'Oral', indication: 'Erradicação de Chlamydia trachomatis em dose única' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'O tracoma folicular é a principal causa infecciosa de cegueira no mundo; o manejo exige a estratégia SAFE da OMS.',
    possibleComorbidities: ['Conjuntivite bacteriana secundária'],
    sources: [{ name: 'Manual de Vigilância do Tracoma - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'malaria-cerebral-falciparum',
    name: 'Malária Cerebral por Plasmodium falciparum (Artesunato EV)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 10, max: 70 },
    symptoms: ['Coma ou sonolência profunda pós-viagem a área amazônica', 'Crises epilépticas e rigidez de nuca', 'Anemia hemolítica grave e icterícia', 'Acidose lática e hipoglicemia'],
    suggestedExams: ['Gota espessa ou teste rápido para P. falciparum', 'Glicemia capilar e gasometria venosa imediata', 'Parasitemia quantitativa'],
    suggestedConduct: {
      id: 'malaria-cerebral-c1',
      text: 'Artesunato intravenoso de urgência (0h, 12h, 24h e a cada 24h), correção imediata da hipoglicemia e suporte intensivo em UTI.'
    },
    distractorConducts: [
      { id: 'malaria-cerebral-d1', text: 'Prescrever cloroquina por via oral para o paciente em coma.', whyWrong: 'P. falciparum é resistente à cloroquina e paciente em coma não pode deglutir medicação oral.' },
      { id: 'malaria-cerebral-d2', text: 'Aguardar novo pico febril para confirmar diagnóstico laboratorial.', whyWrong: 'Na malária grave por falciparum, atrasos de poucas horas são fatais devido ao sequestro de hemácias nos capilares cerebrais.' }
    ],
    medications: [
      { genericName: 'Artesunato 60mg', route: 'Intravenosa', indication: 'Esquizontecida de ação ultrarrápida' },
      { genericName: 'Glicose 50%', route: 'Intravenosa', indication: 'Correção de hipoglicemia grave' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'O artesunato venoso reduz a mortalidade da malária grave em mais de 30% em comparação com derivados da quinina.',
    possibleComorbidities: ['Insuficiência renal aguda (Blackwater fever)'],
    sources: [{ name: 'Guia de Tratamento da Malária no Brasil - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'paracoccidioidomicose',
    name: 'Paracoccidioidomicose (Itraconazol / Sulfametoxazol-Trimetoprima)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UBS e UPA',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 30, max: 70 },
    symptoms: ['Lesões ulceradas com pontilhado hemorrágico em orofaringe ("estomatite moriforme de Aguiar-Pupo")', 'Tosse crônica e dispneia progressiva', 'Linfonodomegalia cervical ou generalizada', 'Histórico de atividade rural e fumo'],
    suggestedExams: ['Exame micológico direto (leveduras em "roda de leme")', 'Radiografia de tórax (infiltrado em "asa de borboleta")', 'Sorologia para Paracoccidioides'],
    suggestedConduct: {
      id: 'pbmicose-c1',
      text: 'Itraconazol oral por 9 a 12 meses (ou sulfametoxazol-trimetoprima na indisponibilidade) e acompanhamento clínico semestral.'
    },
    distractorConducts: [
      { id: 'pbmicose-d1', text: 'Prescrever apenas colutório anestésico para as aftas orais e liberar.', whyWrong: 'A infecção fúngica pulmonar e sistêmica continuará progredindo para fibrose pulmonar irreversível.' },
      { id: 'pbmicose-d2', text: 'Iniciar esquema antituberculose empírico sem exame confirmatório.', whyWrong: 'Não trata a micose sistêmica e posterga a cura clínica, gerando falso alívio transitório.' }
    ],
    medications: [{ genericName: 'Itraconazol 100mg', route: 'Oral', indication: 'Antifúngico triazólico de escolha' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A paracoccidioidomicose é a principal micose sistêmica no Brasil, exigindo tratamento antifúngico prolongado.',
    possibleComorbidities: ['Tuberculose pulmonar concomitante'],
    sources: [{ name: 'PCDT da Paracoccidioidomicose - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'histoplasmose-pulmonar-aguda',
    name: 'Histoplasmose Pulmonar Aguda',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 15, max: 70 },
    symptoms: ['Febre alta, calafrios e tosse seca', 'Dor torácica pleurítica e astenia profunda', 'Histórico recente de limpeza de galinheiro, caverna ou poço antigo (fezes de morcegos/aves)', 'Infiltrado reticulonodular difuso'],
    suggestedExams: ['Radiografia e TC de tórax', 'Pesquisa de antígeno urinário para Histoplasma', 'Cultura micológica'],
    suggestedConduct: {
      id: 'histo-c1',
      text: 'Se forma moderada/grave: Itraconazol oral por 6 a 12 semanas (ou Anfotericina B venosa se hipoxemia grave).'
    },
    distractorConducts: [
      { id: 'histo-d1', text: 'Prescrever xarope de guaco e orientar retorno se piorar em 1 mês.', whyWrong: 'Em inalações massivas de esporos pode haver insuficiência respiratória hipoxêmica rápida.' },
      { id: 'histo-d2', text: 'Iniciar ceftriaxona e claritromicina assumindo apenas pneumonia bacteriana típica.', whyWrong: 'A etiologia fúngica não responde a antibacterianos usuais.' }
    ],
    medications: [{ genericName: 'Itraconazol 100mg', route: 'Oral', indication: 'Controle de infecção fúngica tecidual' }],
    medicationIds: ['dipirona'],
    requiresPharmacy: true,
    explanation: 'Histoplasma capsulatum é inalado de solos enriquecidos com dejetos de aves ou morcegos, demandando antifúngicos em casos sintomáticos.',
    possibleComorbidities: ['Imunossupressão ou infecção por HIV'],
    sources: [{ name: 'Guia de Micoses Sistêmicas - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'criptococose-meningea',
    name: 'Criptococose Meníngea (Anfotericina B)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 20, max: 70 },
    symptoms: ['Cefaleia subaguda progressiva de forte intensidade', 'Febre vespertina e náuseas', 'Rigidez de nuca branda ou ausente', 'Paralisia do VI par craniano (diplopia) e confusão'],
    suggestedExams: ['Punção lombar com medição da pressão de abertura', 'Tinta da China (Nankin) no líquor demonstrando leveduras capsuladas', 'Teste de aglutinação em látex para antígeno criptocócico'],
    suggestedConduct: {
      id: 'cripto-men-c1',
      text: 'Indução com Anfotericina B venosa associada a fluconazol e punções lombares de alívio diárias se pressão liquórica > 250 mmH2O.'
    },
    distractorConducts: [
      { id: 'cripto-men-d1', text: 'Prescrever apenas paracetamol e liberar como enxaqueca refratária.', whyWrong: 'A hipertensão intracraniana fúngica leva à perda visual irreversível e óbito por herniação.' },
      { id: 'cripto-men-d2', text: 'Instalar corticoide em alta dose no primeiro dia de indução antifúngica.', whyWrong: 'O corticoide na indução da criptococcose aumenta a mortalidade e retarda a depuração liquórica do fungo.' }
    ],
    medications: [
      { genericName: 'Anfotericina B / Fluconazol', route: 'Intravenosa', indication: 'Fase de indução antifúngica' },
      { genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Pré-hidratação protetora renal' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Cryptococcus neoformans/gattii causa meningoencefalite grave com alta morbimortalidade; o controle da pressão de abertura é crucial.',
    possibleComorbidities: ['Infecção por HIV / AIDS'],
    sources: [{ name: 'PCDT de Infecções Oportunistas no HIV - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'pneumocistose-pulmonar-pcp',
    name: 'Pneumocistose Pulmonar - PCP (Sulfametoxazol-Trimetoprima)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 18, max: 65 },
    symptoms: ['Dispneia insidiosa e tosse seca sem expectoração', 'Febre vespertina subaguda', 'Dessaturação desproporcional ao esforço mínimo', 'Taquipneia marcante com ausculta pulmonar limpa'],
    suggestedExams: ['Gasometria arterial (Gradiente alvéolo-arterial)', 'Tomografia de tórax (Infiltrado em vidro fosco bilateral)', 'Pesquisa de Pneumocystis jirovecii no escarro induzido ou LBA'],
    suggestedConduct: {
      id: 'pcp-c1',
      text: 'Sulfametoxazol-Trimetoprima em altas doses venoso ou oral por 21 dias associado a corticoterapia precoce se PaO2 < 70 mmHg.'
    },
    distractorConducts: [
      { id: 'pcp-d1', text: 'Tratar com amoxicilina oral simples e aguardar melhora em 10 dias.', whyWrong: 'Pneumocystis é um fungo atípico resistente aos antibióticos betalactâmicos comuns.' },
      { id: 'pcp-d2', text: 'Suspender a hidratação e não administrar oxigenioterapia.', whyWrong: 'A hipoxemia na PCP é grave e causa parada cardiorrespiratória se não ofertado suporte de oxigênio.' }
    ],
    medications: [
      { genericName: 'Sulfametoxazol + Trimetoprima', route: 'Oral / Venosa', indication: 'Terapia de escolha para Pneumocystis' },
      { genericName: 'Prednisona 20mg', route: 'Oral', indication: 'Prevenção de dano alveolar inflamatório' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A associação de corticoide antes do início do antimicrobiano é salva-vidas na pneumonia hipoxêmica por Pneumocystis.',
    possibleComorbidities: ['Imunodepressão grave (CD4 < 200)'],
    sources: [{ name: 'PCDT Coinfecção HIV/Tuberculose/Micoses - MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'citomegalovirose-retiniana',
    name: 'Citomegalovirose Retiniana / Sistêmica',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 20, max: 70 },
    symptoms: ['Escotomas móveis e embaçamento visual progressivo', 'Perda visual periférica rápida', 'Fundo de olho com exsudatos algodonosos e hemorragias ("pizza com queijo e molho")', 'Histórico de imunodeficiência avançada'],
    suggestedExams: ['Mapeamento de retina com oftalmologista', 'Carga viral quantitativa por PCR para CMV', 'Contagem de linfócitos CD4'],
    suggestedConduct: {
      id: 'cmv-retina-c1',
      text: 'Ganciclovir intravenoso (ou Valganciclovir oral em indução) e encaminhamento oftalmológico de urgência para injeção intravítrea.'
    },
    distractorConducts: [
      { id: 'cmv-retina-d1', text: 'Prescrever colírio lubrificante artificial para aliviar a visão turva.', whyWrong: 'A necrose retiniana pelo CMV é fulminante e irreversível sem terapia antiviral sistêmica.' },
      { id: 'cmv-retina-d2', text: 'Administrar aciclovir oral em dose de herpes labial.', whyWrong: 'O aciclovir tem potência insuficiente contra a DNA polimerase do citomegalovírus.' }
    ],
    medications: [{ genericName: 'Ganciclovir / Valganciclovir', route: 'Intravenosa / Oral', indication: 'Inibição da replicação do CMV' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A retinite por CMV é uma emergência oftalmológica em imunodeprimidos, demandando terapia antiviral rápida para salvar a visão.',
    possibleComorbidities: ['AIDS com CD4 < 50'],
    sources: [{ name: 'Diretrizes Clínicas de Manejo do CMV no SUS - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'virus-sincicial-respiratorio-prematuro',
    name: 'Vírus Sincicial Respiratório (VSR) em Prematuro',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 0, max: 1 },
    symptoms: ['Prematuro com coriza prévia que evolui com taquipneia', 'Tiragem subcostal e intercostal evidente', 'Sibilância difusa e crepitações finas', 'Recusa alimentar e episódios de apneia'],
    suggestedExams: ['Oximetria contínua', 'Painel molecular viral para VSR', 'Radiografia de tórax com hiperinsuflação'],
    suggestedConduct: {
      id: 'vsr-premat-c1',
      text: 'Oxigenioterapia para manter SatO2 > 92%, aspiração cuidadosa das vias aéreas superiores, hidratação fracionada e isolamento de contato.'
    },
    distractorConducts: [
      { id: 'vsr-premat-d1', text: 'Prescrever xaropes antitussígenos e descongestionantes orais sistêmicos.', whyWrong: 'São contraindicados em lactentes por risco elevado de intoxicação, convulsões e óbito.' },
      { id: 'vsr-premat-d2', text: 'Iniciar antibiótico de largo espectro rotineiramente.', whyWrong: 'Bronquiolite viral não melhora com antibióticos; o uso desnecessário seleciona bactérias resistentes.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Inalatória / Nasal', indication: 'Fluidificação de secreções respiratórias' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A bronquiolite por VSR em prematuros exige suporte de oxigênio e hidratação; a prevenção é feita com Palivizumabe no SUS.',
    possibleComorbidities: ['Displasia broncopulmonar da prematuridade'],
    sources: [{ name: 'Diretrizes Nacionais de Manejo da Bronquiolite Viral Aguda - SBP/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'mpox-monkeypox-vigilancia',
    name: 'Mpox / Monkeypox (Isolamento + Analgesia e Cuidado de Lesões)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UBS e UPA',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 16, max: 65 },
    symptoms: ['Erupção cutânea com pápulas, vesículas, pústulas e crostas umbilicadas', 'Linfadenopatia proeminente retroauricular ou inguinal', 'Febre, astenia e odinofagia', 'Dor anorretal ou genital intensa'],
    suggestedExams: ['Coleta de swab do fluido das lesões cutâneas para PCR de Orthopoxvirus', 'Notificação compulsória imediata'],
    suggestedConduct: {
      id: 'mpox-c1',
      text: 'Isolamento de contato e gotículas até cicatrização completa de todas as crostas, analgesia escalonada e higienização local com soro.'
    },
    distractorConducts: [
      { id: 'mpox-d1', text: 'Rompimento traumático e curetagem das vesículas para drenar o pus.', whyWrong: 'Aumenta a disseminação viral no ambiente, causa cicatrizes inestéticas e facilita infecção bacteriana secundária.' },
      { id: 'mpox-d2', text: 'Prescrever aciclovir oral como antiviral de rotina.', whyWrong: 'O aciclovir não tem ação contra o vírus da Mpox (Orthopoxvirus).' }
    ],
    medications: [
      { genericName: 'Paracetamol 500mg', route: 'Oral', indication: 'Alívio sintomático de febre e mialgia' },
      { genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Controle de dor moderada' }
    ],
    medicationIds: ['paracetamol', 'dipirona', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'O manejo da Mpox baseia-se em quebra da cadeia de transmissão, alívio da dor (proctite/odinofagia) e cuidados com lesões.',
    possibleComorbidities: ['Coinfecção por IST (Sífilis, HIV)'],
    sources: [{ name: 'Plano de Contingência Nacional para Mpox - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hantavirose-cardiopulmonar',
    name: 'Hantavirose — Síndrome Cardiopulmonar',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 18, max: 65 },
    symptoms: ['Pródromo febril inespecífico com mialgia intensa em coxas e dorso', 'Evolução abrupta para tosse seca e taquipneia', 'Edema pulmonar não cardiogênico rápido com choque circulatório', 'Histórico de contato com galpões rurais/roedores silvestres'],
    suggestedExams: ['Sorologia IgM para Hantavírus (ELISA)', 'Hemograma com trombocitopenia e imunoblastos (> 10%)', 'Radiografia de tórax com infiltrado interstício-alveolar difuso'],
    suggestedConduct: {
      id: 'hanta-c1',
      text: 'Transferência imediata para UTI com restrição hídrica criteriosa, oxigenação precoce e suporte inotrópico precoce.'
    },
    distractorConducts: [
      { id: 'hanta-d1', text: 'Administrar infusão rápida de 3000 mL de soro fisiológico.', whyWrong: 'A hantavirose cursa com hiperpermeabilidade capilar extrema; sobrecarga volêmica afoga os pulmões e eleva a mortalidade.' },
      { id: 'hanta-d2', text: 'Liberar paciente da UPA por ausência de estertores no início.', whyWrong: 'A síndrome cardiopulmonar instala-se catastroficamente em poucas horas.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Volume mínimo estrito guiado por metas' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A hantavirose apresenta letalidade superior a 35% no Brasil; a hidratação excessiva é o erro mais fatal no seu manejo.',
    possibleComorbidities: ['Exposição à poeira de fezes de roedores silvestres'],
    sources: [{ name: 'Manual de Vigilância e Manejo da Hantavirose - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'febre-do-oropouche',
    name: 'Febre do Oropouche (Manejo Sintomático e Vigilância)',
    area: 'Infectologia e Vigilância',
    typicalUnit: 'UBS e UPA',
    severity: 'Moderada',
    weight: 3,
    ageRange: { min: 5, max: 75 },
    symptoms: ['Febre alta de início súbito com cefaleia retro-orbitária', 'Mialgia generalizada e artralgias intensas', 'Tontura e calafrios', 'Possibilidade de recaída dos sintomas após 1 a 2 semanas'],
    suggestedExams: ['RT-PCR para vírus Oropouche em sangue', 'Diagnóstico diferencial obrigatório para Dengue, Zika e Chikungunya'],
    suggestedConduct: {
      id: 'oropouche-c1',
      text: 'Hidratação oral vigorosa, analgesia com dipirona/paracetamol, repouso e notificação compulsória para rastreio vetorial (maruim/Culicoides).'
    },
    distractorConducts: [
      { id: 'oropouche-d1', text: 'Prescrever ácido acetilsalicílico (AAS) para as dores.', whyWrong: 'Por ser arbovirose com risco de sangramento, o uso de salicilatos é contraindicado.' },
      { id: 'oropouche-d2', text: 'Iniciar antibioticoterapia profilática para febre alta.', whyWrong: 'Oropouche é uma infecção viral transmitida por artrópodes; antibióticos são ineficazes.' }
    ],
    medications: [
      { genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Controle térmico e álgico' },
      { genericName: 'Sais para Reidratação Oral (SRO)', route: 'Oral', indication: 'Hidratação precoce' }
    ],
    medicationIds: ['dipirona', 'sais-reidratacao'],
    requiresPharmacy: true,
    explanation: 'A febre do Oropouche é uma arbovirose reemergente no Brasil transmitida pelo mosquito-pólvora (maruim), exigindo vigilância ativa.',
    possibleComorbidities: ['Endemia de dengue'],
    sources: [{ name: 'Nota Técnica Vigilância da Febre do Oropouche - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },

  // 291 a 310 — Cardiologia, Pneumologia, Nefrologia e Clínica Médica
  {
    id: 'estenose-mitral-reumatica',
    name: 'Estenose Mitral Reumática Sintomática',
    area: 'Cardiologia',
    typicalUnit: 'UBS e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 25, max: 70 },
    symptoms: ['Dispneia progressiva aos esforços e ortopneia', 'Ruflar diastólico em ápice com reforço pré-sistólico', 'Estalido de abertura mitral', 'Fácies mitral (rubor malar cianótico)'],
    suggestedExams: ['Ecocardiograma transtorácico com escore de Wilkins', 'Eletrocardiograma (sobrecarga de átrio esquerdo)', 'Radiografia de tórax'],
    suggestedConduct: {
      id: 'est-mitral-c1',
      text: 'Otimização com betabloqueador para controle de frequência, diurético de alça para congestão e profilaxia com Penicilina Benzatina.'
    },
    distractorConducts: [
      { id: 'est-mitral-d1', text: 'Prescrever vasodilatador arterial potente isolado em altas doses.', whyWrong: 'A redução brusca da pós-carga sem aumento do débito mitral gera hipotensão grave e colapso.' },
      { id: 'est-mitral-d2', text: 'Estimular paciente a correr na esteira para melhorar a respiração.', whyWrong: 'A taquicardia reduz o tempo de enchimento diastólico e desencadeia edema agudo de pulmão na estenose mitral.' }
    ],
    medications: [{ genericName: 'Benzilpenicilina Benzatina 1.200.000 UI', route: 'Intramuscular', indication: 'Profilaxia secundária da febre reumática' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'No Brasil, a febre reumática é a etiologia hegemônica da estenose mitral; a profilaxia com penicilina benzatina previne novos surtos.',
    possibleComorbidities: ['Fibrilação atrial crônica'],
    sources: [{ name: 'Diretriz Brasileira de Valvopatias - SBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'insuficiencia-mitral-aguda',
    name: 'Insuficiência Mitral Aguda',
    area: 'Cardiologia',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 40, max: 80 },
    symptoms: ['Edema agudo de pulmão fulminante pós-infarto', 'Sopro sistólico suave precoce em ápice', 'Hipotensão e choque cardiogênico', 'Crepitações difusas em ambos os hemitórax'],
    suggestedExams: ['Ecocardiograma à beira-leito imediato', 'Cineangiocoronariografia', 'Eletrocardiograma'],
    suggestedConduct: {
      id: 'insuf-mitral-aguda-c1',
      text: 'Estabilização com vasodilatador intravenoso (nitroprussiato), balão intra-aórtico de contrapulsação e cirurgia de urgência para troca/reparo valvar.'
    },
    distractorConducts: [
      { id: 'insuf-mitral-aguda-d1', text: 'Infundir 2 litros de soro fisiológico para combater a hipotensão.', whyWrong: 'Agrava catastroficamente a congestão pulmonar por sobrecarga retrógrada no átrio esquerdo não adaptado.' },
      { id: 'insuf-mitral-aguda-d2', text: 'Liberar paciente com anti-hipertensivo oral para retorno eletivo.', whyWrong: 'Ruptura de músculo papilar ou cordoalha tem altíssima taxa de letalidade sem intervenção cirúrgica imediata.' }
    ],
    medications: [{ genericName: 'Furosemida / Nitroprussiato', route: 'Intravenosa', indication: 'Descongestionamento pulmonar urgente' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A insuficiência mitral aguda não dá tempo para o átrio esquerdo dilatar, transmitindo pressão retrógrada direta ao leito capilar pulmonar.',
    possibleComorbidities: ['Infarto agudo do miocárdio de parede inferior'],
    sources: [{ name: 'Diretriz de Emergências Cardiovasculares - SBC/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'insuficiencia-aortica-cronica',
    name: 'Insuficiência Aórtica Crônica',
    area: 'Cardiologia',
    typicalUnit: 'UBS e Hospital',
    severity: 'Grave',
    weight: 2,
    ageRange: { min: 30, max: 75 },
    symptoms: ['Sopro diastólico aspirativo em foco aórtico acessório', 'Pressão de pulso divergente (ex: 160x40 mmHg)', 'Pulso em martelo d\'água (pulso de Corrigan)', 'Batimento visível das carótidas e cabeça'],
    suggestedExams: ['Ecocardiograma com doppler', 'Radiografia de tórax (cardiomegalia importante)', 'Eletrocardiograma com sobrecarga ventricular esquerda'],
    suggestedConduct: {
      id: 'insuf-aortica-c1',
      text: 'Tratamento clínico com vasodilatadores e acompanhamento ecocardiográfico rigoroso para indicação cirúrgica antes de queda da fração de ejeção.'
    },
    distractorConducts: [
      { id: 'insuf-aortica-d1', text: 'Prescrever betabloqueador em dose máxima bradicardizante.', whyWrong: 'A bradicardia prolonga a diástole, aumentando o volume regurgitante da aorta para o ventrículo esquerdo.' },
      { id: 'insuf-aortica-d2', text: 'Descartar doença cardíaca pela pressão sistólica elevada.', whyWrong: 'A pressão sistólica alta com diastólica muito baixa é reflexo do enorme volume ejetado e regurgitado.' }
    ],
    medications: [{ genericName: 'Enalapril 10mg', route: 'Oral', indication: 'Redução da pós-carga ventricular' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'Na insuficiência aórtica crônica, o ventrículo sofre sobrecarga volumétrica maciça compensatória que demanda vigilância funcional periódica.',
    possibleComorbidities: ['Válvula aórtica bicúspide', 'Ectasia da raiz aórtica'],
    sources: [{ name: 'Diretriz da Sociedade Brasileira de Cardiologia - Valvopatias', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'cardiomiopatia-hipertrofica',
    name: 'Cardiomiopatia Hipertrófica',
    area: 'Cardiologia',
    typicalUnit: 'UBS e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 14, max: 45 },
    symptoms: ['Síncope ou pré-síncope aos esforços em jovem atleta', 'Dor torácica atípica e dispneia', 'Sopro sistólico que aumenta com manobra de Valsalva', 'Histórico familiar de morte súbita precoce'],
    suggestedExams: ['Ecocardiograma (hipertrofia septal assimétrica > 15 mm)', 'Holter de 24 horas para TVNS', 'Ressonância magnética cardíaca'],
    suggestedConduct: {
      id: 'cmh-c1',
      text: 'Betabloqueador oral (ou verapamil), proibição de esportes competitivos e avaliação de risco de morte súbita para implante de CDI.'
    },
    distractorConducts: [
      { id: 'cmh-d1', text: 'Prescrever digoxina para melhorar a força do coração hipertrofiado.', whyWrong: 'Inotrópicos positivos aumentam a contratilidade e pioram drasticamente a obstrução da via de saída do VE.' },
      { id: 'cmh-d2', text: 'Prescrever vasodilatador nitrato para alívio da dor aos esforços.', whyWrong: 'Vasodilatadores reduzem o volume do VE, exacerbando o colapso e a obstrução dinâmica.' }
    ],
    medications: [{ genericName: 'Atenolol 50mg', route: 'Oral', indication: 'Aumento do tempo de enchimento diastólico e redução do gradiente' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A cardiomiopatia hipertrófica é a causa mais prevalente de morte súbita em atletas jovens, exigindo estratificação de risco imediata.',
    possibleComorbidities: ['Mutações nos genes do sarcômero cardíaco'],
    sources: [{ name: 'Diretriz Brasileira de Miocardiopatias - SBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'cardiomiopatia-chagasica-cronica',
    name: 'Cardiomiopatia Chagásica Crônica',
    area: 'Cardiologia',
    typicalUnit: 'UBS e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 35, max: 75 },
    symptoms: ['Insuficiência cardíaca com predominância direita (estase jugular, edema)', 'Bloqueio de Ramo Direito + BDAS no ECG', 'Episódios de palpitações e síncope por arritmia ventricular', 'Aneurisma de ponta de ventrículo esquerdo'],
    suggestedExams: ['Sorologia para Chagas (duas técnicas distintas)', 'Eletrocardiograma de 12 derivações', 'Ecocardiograma e Holter de 24 horas'],
    suggestedConduct: {
      id: 'chagas-cardio-c1',
      text: 'Terapia padrão da IC (IECA/BRA + Betabloqueador + Espironolactona), amiodarona para arritmias ventriculares e anticoagulação se aneurisma apical.'
    },
    distractorConducts: [
      { id: 'chagas-cardio-d1', text: 'Prescrever benznidazol como terapia curativa exclusiva da insuficiência avançada.', whyWrong: 'O antiparasitário não reverte a cardiopatia chagásica dilatada avançada com fibrose instalada.' },
      { id: 'chagas-cardio-d2', text: 'Suspender betabloqueadores por medo de arritmias.', whyWrong: 'Betabloqueadores reduzem mortalidade quando titulados adequadamente sob vigilância de bloqueios.' }
    ],
    medications: [
      { genericName: 'Enalapril 10mg', route: 'Oral', indication: 'Remodelamento ventricular' },
      { genericName: 'Furosemida 40mg', route: 'Oral', indication: 'Controle de sobrecarga hídrica' }
    ],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A cardiopatia chagásica é altamente arritmogênica e tromboembólica, sendo causa importante de IC e morte súbita no interior do Brasil.',
    possibleComorbidities: ['Megacólon e megaesôfago chagásicos'],
    sources: [{ name: 'Consenso Brasileiro em Doença de Chagas - Ministério da Saúde/SBMT', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'sindrome-no-sinusal',
    name: 'Síndrome do Nó Sinusal (Doença do Nó)',
    area: 'Cardiologia',
    typicalUnit: 'UBS e Hospital',
    severity: 'Grave',
    weight: 2,
    ageRange: { min: 65, max: 90 },
    symptoms: ['Bradicardia sinusal persistente inapropriada', 'Pausas sinusais > 3 segundos com síncope ou lipotimia', 'Síndrome bradi-taqui (alternância com fibrilação atrial)', 'Fadiga crônica no idoso'],
    suggestedExams: ['Holter de 24 horas', 'Eletrocardiograma', 'Ecocardiograma'],
    suggestedConduct: {
      id: 'doenca-no-c1',
      text: 'Suspensão de fármacos cronotrópicos negativos e implante de Marcapasso Cardíaco Definitivo (câmara dupla DDDR).'
    },
    distractorConducts: [
      { id: 'doenca-no-d1', text: 'Iniciar betabloqueador para tratar a fase de taquicardia sem marcapasso prévio.', whyWrong: 'O bloqueador aprofundará as pausas sinusais, provocando assistolia fatal na fase bradicárdica.' },
      { id: 'doenca-no-d2', text: 'Atribuir a tontura e quedas apenas ao envelhecimento natural sem investigar ritmo.', whyWrong: 'Pausas sinusais são causas frequentes de traumatismo cranioencefálico por quedas no idoso.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Acesso venoso de suporte' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A disfunção do nó sinusal sintomática por esclerose idiopática no idoso tem no marcapasso permanente seu tratamento resolutivo.',
    possibleComorbidities: ['Fibrilação atrial paroxística'],
    sources: [{ name: 'Diretriz de Dispositivos Cardíacos Eletrônicos Implantáveis - DECA/SBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'flutter-atrial',
    name: 'Flutter Atrial',
    area: 'Cardiologia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Moderada',
    weight: 3,
    ageRange: { min: 45, max: 80 },
    symptoms: ['Palpitações rápidas e regulares (frequência ventricular em torno de 150 bpm)', 'Sensação de batedeira no peito e cansaço', 'Ondas "F" em dente de serra nas derivações inferiores no ECG', 'Condução atrioventricular típica 2:1'],
    suggestedExams: ['Eletrocardiograma de 12 derivações', 'Ecocardiograma para avaliação de trombos e cavidades'],
    suggestedConduct: {
      id: 'flutter-c1',
      text: 'Controle de frequência com betabloqueador/bloqueador de canal de cálcio, anticoagulação oral e cardioversão elétrica ou ablação por cateter do istmo cavotricuspídeo.'
    },
    distractorConducts: [
      { id: 'flutter-d1', text: 'Realizar cardioversão imediata sem anticoagulação em arritmia de início desconhecido > 48h sem ecocardiograma transesofágico.', whyWrong: 'Risco gravíssimo de embolização cerebral maciça de trombo atrial pré-existente.' },
      { id: 'flutter-d2', text: 'Dar alta sem anticoagulação por achar que flutter não produz trombos.', whyWrong: 'O risco tromboembólico do flutter atrial é idêntico ao da fibrilação atrial.' }
    ],
    medications: [{ genericName: 'Atenolol 50mg', route: 'Oral', indication: 'Controle de resposta ventricular' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'O flutter atrial típico decorre de macrorreentrada no átrio direito, tendo alta taxa de cura por ablação por radiofrequência.',
    possibleComorbidities: ['DPOC', 'Hipertensão Arterial'],
    sources: [{ name: 'Diretriz de Arritmias Cardíacas - SBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'sindrome-wolff-parkinson-white',
    name: 'Síndrome de Wolff-Parkinson-White',
    area: 'Cardiologia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 12, max: 45 },
    symptoms: ['Intervalo PR curto (< 120 ms) e Onda Delta no ECG de repouso', 'Taquicardias paroxísticas súbitas com palpitações intensas', 'Tontura e sensação de desmaio aos esforços'],
    suggestedExams: ['Eletrocardiograma de 12 derivações', 'Estudo eletrofisiológico invasivo'],
    suggestedConduct: {
      id: 'wpw-c1',
      text: 'Encaminhamento para Estudo Eletrofisiológico com Ablação por Radiofrequência da via acessória (feixe de Kent).'
    },
    distractorConducts: [
      { id: 'wpw-d1', text: 'Administrar Verapamil ou Diltiazem na vigência de fibrilação atrial com pré-excitação.', whyWrong: 'Bloqueia o nó AV e desvia a condução exclusivamente para a via acessória, precipitando fibrilação ventricular e parada cardíaca.' },
      { id: 'wpw-d2', text: 'Tratar apenas com ansiolíticos atribuindo as palpitações a síndrome do pânico.', whyWrong: 'A via anômala congênita pode conduzir a frequências extremas com risco de morte súbita.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Acesso venoso para emergência' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A síndrome de WPW possui via acessória que conecta diretamente átrio e ventrículo; a ablação é o padrão de cura definitivo.',
    possibleComorbidities: ['Taquicardia por reentrada atrioventricular (TRAV)'],
    sources: [{ name: 'Diretriz Brasileira de Arritmias e Eletrofisiologia - SOBRAC/SBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hipertensao-arterial-pulmonar',
    name: 'Hipertensão Arterial Pulmonar Primária',
    area: 'Pneumologia e Cardiologia',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 2,
    ageRange: { min: 20, max: 60 },
    symptoms: ['Dispneia progressiva desproporcional sem causa óbvia em mulher jovem', 'Hiperfonese de segunda bulha em foco pulmonar (P2 hiperfonética)', 'Turgência jugular patológica e edema periférico', 'Síncope ao esforço físico moderado'],
    suggestedExams: ['Ecocardiograma com estimativa de PSAP', 'Cateterismo cardíaco direito (Padrão-ouro com PAPm >= 20 mmHg)', 'Espirometria e TC de tórax'],
    suggestedConduct: {
      id: 'hap-c1',
      text: 'Tratamento específico em centro de referência SUS com antagonistas dos receptores de endotelina (bosentana) ou inibidores de PDE-5 (sildenafila).'
    },
    distractorConducts: [
      { id: 'hap-d1', text: 'Prescrever apenas broncodilatador inalatório assumindo asma refratária.', whyWrong: 'A doença é de remodelamento arterial pulmonar proliferativo e não responde a beta-2 agonistas.' },
      { id: 'hap-d2', text: 'Estimular atividade física extenuante para melhorar a capacidade respiratória.', whyWrong: 'A síncope por falência aguda do ventrículo direito aos esforços é causa frequente de óbito súbito.' }
    ],
    medications: [{ genericName: 'Sildenafila 20mg', route: 'Oral', indication: 'Vasodilatação pulmonar seletiva' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A HAP é doença proliferativa e progressiva dos pequenos vasos pulmonares, demandando terapia vasodilatadora específica.',
    possibleComorbidities: ['Doenças do tecido conjuntivo (Esclerose Sistêmica)'],
    sources: [{ name: 'PCDT da Hipertensão Arterial Pulmonar - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'fibrose-pulmonar-idiopatica',
    name: 'Fibrose Pulmonar Idiopática',
    area: 'Pneumologia',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 2,
    ageRange: { min: 60, max: 85 },
    symptoms: ['Tosse seca persistente sem expectoração há meses', 'Dispneia aos esforços progressiva e incapacitante', 'Crepitações teleinspiratórias em bases pulmonares ("em velcro")', 'Baqueteamento digital (hipocratismo digital)'],
    suggestedExams: ['Tomografia de tórax de alta resolução (Padrão de pneumonia intersticial usual / faveolamento subpleural)', 'Espirometria com padrão restritivo e queda da DLCO'],
    suggestedConduct: {
      id: 'fpi-c1',
      text: 'Encaminhamento para pneumologia especializada para início de antifibróticos (pirfenidona ou nintedanibe), reabilitação pulmonar e avaliação para transplante.'
    },
    distractorConducts: [
      { id: 'fpi-d1', text: 'Prescrever cursos repetidos de antibióticos por achar que os estertores são infecção.', whyWrong: 'Os estertores decorrem da abertura de alvéolos com fibrose rígida e não de secreção bacteriana.' },
      { id: 'fpi-d2', text: 'Prescrever corticoterapia crônica em altas doses com azatioprina.', whyWrong: 'O ensaio PANTHER comprovou que corticoide + azatioprina aumenta mortalidade na fibrose pulmonar idiopática.' }
    ],
    medications: [{ genericName: 'Oxigenioterapia Domiciliar', route: 'Inalatória', indication: 'Correção de hipoxemia crônica' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: false,
    explanation: 'A FPI é doença pulmonar fibrosante progressiva restrita aos pulmões; os antifibróticos reduzem o declínio da capacidade vital forçada.',
    possibleComorbidities: ['Doença do refluxo gastroesofágico'],
    sources: [{ name: 'Diretrizes de Doenças Pulmonares Intersticiais - SBPT/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'sarcoidose-pulmonar',
    name: 'Sarcoidose Pulmonar',
    area: 'Pneumologia',
    typicalUnit: 'Hospital',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 25, max: 55 },
    symptoms: ['Adenopatia hilar bilateral simétrica assintomática ou com tosse seca', 'Eritema nodoso em membros inferiores', 'Uveíte anterior crônica', 'Fadiga, perda de peso e sudorese noturna'],
    suggestedExams: ['Radiografia e Tomografia de tórax', 'Biópsia transbrônquica (granulomas não caseosos)', 'Dosagem sérica de Enzima Conversora de Angiotensina (ECA)'],
    suggestedConduct: {
      id: 'sarcoidose-c1',
      text: 'Se sintomática com alteração funcional ou acometimento ocular/cardíaco: corticoterapia oral com Prednisona por 6 a 12 meses.'
    },
    distractorConducts: [
      { id: 'sarcoidose-d1', text: 'Iniciar esquema RIPE para tuberculose sem pesquisa de BAAR ou biópsia.', whyWrong: 'A sarcoidose apresenta granulomas não caseosos imunomediados e piora sem o manejo adequado com corticoide.' },
      { id: 'sarcoidose-d2', text: 'Ignorar queixas oculares e não solicitar avaliação oftalmológica.', whyWrong: 'A uveíte sarcoídica não diagnosticada pode causar sinéquias e cegueira permanente.' }
    ],
    medications: [{ genericName: 'Prednisona 20mg', route: 'Oral', indication: 'Imunossupressão dos granulomas sarcoídicos' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A sarcoidose é doença granulomatosa multissistêmica; o estadiamento do envolvimento pulmonar e extrapulmonar orienta o uso de corticoides.',
    possibleComorbidities: ['Hipercalcemia / Nefrolitíase'],
    sources: [{ name: 'Diretrizes de Sarcoidose - SBPT/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'aspergilose-broncopulmonar-alergica',
    name: 'Aspergilose Broncopulmonar Alérgica (ABPA)',
    area: 'Pneumologia',
    typicalUnit: 'Hospital',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 18, max: 60 },
    symptoms: ['Asma grave de difícil controle', 'Expectoração de tampões mucosos acastanhados', 'Infiltrados pulmonares recorrentes na radiografia', 'Eosinofilia sanguínea importante'],
    suggestedExams: ['IgE total muito elevada (> 1000 UI/mL)', 'IgE específica e IgG para Aspergillus fumigatus', 'Tomografia de tórax (bronquiectasias centrais)'],
    suggestedConduct: {
      id: 'abpa-c1',
      text: 'Corticoterapia oral (Prednisona) para suprimir a resposta imune associada a antifúngico oral (Itraconazol) para reduzir a carga de Aspergillus.'
    },
    distractorConducts: [
      { id: 'abpa-d1', text: 'Prescrever apenas broncodilatador de curta duração sem investigar alergia fúngica.', whyWrong: 'A inflamação fúngica crônica não tratada evolui com bronquiectasias centrais e fibrose pulmonar terminal.' },
      { id: 'abpa-d2', text: 'Tratar com antibiótico comum assumindo broncopneumonia bacteriana.', whyWrong: 'A ABPA é uma reação de hipersensibilidade ao fungo Aspergillus colonizador e requer corticoide.' }
    ],
    medications: [
      { genericName: 'Prednisona 20mg', route: 'Oral', indication: 'Supressão da hipersensibilidade imunológica' },
      { genericName: 'Itraconazol 100mg', route: 'Oral', indication: 'Redução da carga fúngica brônquica' }
    ],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A ABPA é complicação imunológica da asma e fibrose cística que exige a combinação de corticoide e antifúngico para evitar bronquiectasias irreversíveis.',
    possibleComorbidities: ['Asma grave corticodependente'],
    sources: [{ name: 'Diretrizes de Asma Grave e Doenças Alérgicas - ASBAI/SBPT', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'nefrite-intersticial-aguda-medicamentosa',
    name: 'Nefrite Intersticial Aguda Medicamentosa',
    area: 'Nefrologia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 2,
    ageRange: { min: 20, max: 80 },
    symptoms: ['Elevação aguda de ureia e creatinina após uso de AINEs, antibióticos ou IBP', 'Tríade clássica (presente em minoria): febre, rash cutâneo e eosinofilia', 'Piúria estéril e hematúria microscópica', 'Eosinofilúria'],
    suggestedExams: ['Sumário de urina (EAS) e sedimentoscopia', 'Hemograma com contagem de eosinófilos', 'Biópsia renal se não houver melhora'],
    suggestedConduct: {
      id: 'nia-c1',
      text: 'Suspensão imediata de todos os medicamentos causadores suspeitos e corticoterapia com prednisona se ausência de recuperação renal rápida.'
    },
    distractorConducts: [
      { id: 'nia-d1', text: 'Aumentar a dose do anti-inflamatório causador para tratar a febre associada.', whyWrong: 'A manutenção do fármaco nefrotóxico converte a inflamação intersticial em fibrose renal crônica irreversível.' },
      { id: 'nia-d2', text: 'Indicar diálise de rotina sem suspender as medicações prescritas.', whyWrong: 'A remoção precoce do agente desencadeante é a intervenção de maior eficácia na recuperação renal.' }
    ],
    medications: [{ genericName: 'Prednisona 20mg', route: 'Oral', indication: 'Controle de infiltrado inflamatório no túbulo-interstício renal' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A NIA é reação imunoalérgica renal frequente após uso de AINEs ou antibióticos; a retirada precoce restaura a filtração glomerular.',
    possibleComorbidities: ['Lesão Renal Aguda'],
    sources: [{ name: 'Diretrizes de Injúria Renal Aguda - Sociedade Brasileira de Nefrologia', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'acidose-tubular-renal',
    name: 'Acidose Tubular Renal',
    area: 'Nefrologia',
    typicalUnit: 'Hospital',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 5, max: 65 },
    symptoms: ['Acidose metabólica com ânion gap normal (hiperclorêmica)', 'Hipocalemia ou hipercalemia refratária dependendo do tipo', 'Nefrocalcinose e litíase renal de repetição', 'Atraso de crescimento pôndero-estatural na criança'],
    suggestedExams: ['Gasometria venosa e eletrólitos séricos', 'Ânion gap urinário', 'pH urinário matinal'],
    suggestedConduct: {
      id: 'atr-c1',
      text: 'Reposição oral de bicarbonato de sódio ou citrato de potássio e correção das causas secundárias subjacentes.'
    },
    distractorConducts: [
      { id: 'atr-d1', text: 'Prescrever cloreto de amônio para acidificar a urina.', whyWrong: 'Aprofunda a acidose sistêmica grave e desmineraliza a matriz óssea.' },
      { id: 'atr-d2', text: 'Restringir potássio e sódio na dieta sem avaliar o tipo tubular.', whyWrong: 'Na ATR tipo 1 e 2 há perda urinária massiva de potássio e bicarbonato, exigindo reposição contínua.' }
    ],
    medications: [{ genericName: 'Bicarbonato de Sódio / Citrato de Potássio', route: 'Oral', indication: 'Alcalinização sistêmica e proteção tubular' }],
    medicationIds: ['sais-reidratacao'],
    requiresPharmacy: true,
    explanation: 'A acidose tubular decorre de incapacidade dos túbulos renais em secretar hidrogênio ou reabsorver bicarbonato.',
    possibleComorbidities: ['Raquitismo / Osteomalácia'],
    sources: [{ name: 'Tratado de Nefrologia Clínica - SBN', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'rabdomiolise-aguda-hidratacao',
    name: 'Rabdomiólise Aguda por Esforço ou Trauma (Soro Fisiológico Vigoroso)',
    area: 'Nefrologia e Emergência',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 18, max: 60 },
    symptoms: ['Urina escura ("cor de coca-cola")', 'Mialgia difusa e fraqueza muscular pós-exercício extenuante ou trauma por esmagamento', 'Oligúria progressiva', 'Sensibilidade dolorosa à compressão muscular'],
    suggestedExams: ['Creatinofosfoquinase (CPK) extremamente elevada (> 5 a 10 vezes o valor normal)', 'Sumário de urina (positivo para sangue na fita com ausência de hemácias no sedimento)', 'Eletrólitos com foco em potássio sérico'],
    suggestedConduct: {
      id: 'rabdo-c1',
      text: 'Hidratação venosa vigorosa imediata com Soro Fisiológico 0,9% (alvo de débito urinário 200 a 300 mL/h) e monitorização contínua de hipercalemia.'
    },
    distractorConducts: [
      { id: 'rabdo-d1', text: 'Restringir a ingestão de água para evitar sobrecarga de mioglobina.', whyWrong: 'A hipovolemia favorece a precipitação da mioglobina e formação de cilindros nos túbulos renais, causando necrose tubular aguda.' },
      { id: 'rabdo-d2', text: 'Prescrever anti-inflamatórios não esteroidais (AINEs) para aliviar as dores musculares.', whyWrong: 'AINEs inibem prostaglandinas renais vasodilatadoras e precipitam insuficiência renal anúrica na rabdomiólise.' }
    ],
    medications: [
      { genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Expansão volêmica vigorosa e proteção renal' },
      { genericName: 'Dipirona 500mg/mL', route: 'Intravenosa', indication: 'Analgesia segura' }
    ],
    medicationIds: ['soro-fisiologico', 'dipirona'],
    requiresPharmacy: true,
    explanation: 'A hidratação venosa precoce e vigorosa é a medida mais eficaz para prevenir a lesão renal aguda tóxica por mioglobina.',
    possibleComorbidities: ['Hipercalemia com arritmia ventricular'],
    sources: [{ name: 'Diretrizes de Injúria Renal Aguda - Ministério da Saúde/SBN', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hiponatremia-sintomatica-aguda',
    name: 'Hiponatremia Sintomática Aguda',
    area: 'Clínica Médica e UTI',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 20, max: 85 },
    symptoms: ['Sódio sérico < 125 mEq/L', 'Crises convulsivas generalizadas e rebaixamento do nível de consciência', 'Cefaleia intensa e vômitos em jato', 'Edema cerebral agudo'],
    suggestedExams: ['Ionograma sérico urgente', 'Osmolalidade sérica e urinária', 'Tomografia de crânio se trauma associado'],
    suggestedConduct: {
      id: 'hiponat-aguda-c1',
      text: 'Correção imediata com Solução Salina Hipertônica a 3% (bolus de 100 mL em 10 min, até 3 vezes), limitando a elevação do sódio em no máximo 8 a 10 mEq/L em 24h.'
    },
    distractorConducts: [
      { id: 'hiponat-aguda-d1', text: 'Elevar o sódio em 20 mEq/L rapidamente nas primeiras 6 horas.', whyWrong: 'A correção excessivamente rápida provoca a Síndrome de Desmielinização Osmótica (mielinólise pontina) irreversível.' },
      { id: 'hiponat-aguda-d2', text: 'Prescrever água livre oral abundante para hidratar o paciente.', whyWrong: 'Piora o edema cerebral e precipita herniação amigdaliana fatal.' }
    ],
    medications: [{ genericName: 'Solução Salina Hipertônica 3%', route: 'Intravenosa', indication: 'Desidratação osmótica de emergência do tecido cerebral' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A hiponatremia aguda com sintomas neurológicos graves exige salina a 3% para interromper convulsões, com rigoroso limite de velocidade nas 24h.',
    possibleComorbidities: ['SIADH', 'Intoxicação hídrica pós-maratona'],
    sources: [{ name: 'Diretriz de Distúrbios Hidroeletrolíticos - AMIB/SBN', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hipernatremia-desidratacao-idoso',
    name: 'Hipernatremia por Desidratação no Idoso',
    area: 'Clínica Médica e Geriatria',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 70, max: 98 },
    symptoms: ['Sódio sérico > 155 mEq/L', 'Mucosas orais secas e olhos encovados', 'Confusão mental, letargia e fraqueza intensa', 'Hipotensão postural e taquicardia'],
    suggestedExams: ['Eletrólitos e função renal (ureia/creatinina)', 'Cálculo do déficit de água livre'],
    suggestedConduct: {
      id: 'hipernat-c1',
      text: 'Cálculo do déficit de água livre e reposição lenta por via enteral com água pura ou solução hipotônica (Soro Glicosado 5%), limitando redução a 10 mEq/L em 24h.'
    },
    distractorConducts: [
      { id: 'hipernat-d1', text: 'Corrigir o sódio com água destilada pura em bolus intravenoso rápido.', whyWrong: 'A infusão de água destilada pura em veia periférica causa hemólise intravascular massiva e edema cerebral por queda hiperaguda do sódio.' },
      { id: 'hipernat-d2', text: 'Administrar apenas soro fisiológico a 0,9% em grande volume.', whyWrong: 'O soro fisiológico possui 154 mEq/L de sódio e não fornece água livre suficiente para corrigir hipernatremias graves.' }
    ],
    medications: [{ genericName: 'Soro Glicosado 5%', route: 'Intravenosa', indication: 'Aporte controlado de água livre' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'No idoso acamado a perda do mecanismo da sede gera hipernatremia grave, cuja correção lenta evita edema cerebral de rebote.',
    possibleComorbidities: ['Infecção urinária oculta', 'Acamamento crônico'],
    sources: [{ name: 'Manual de Distúrbios Hidroeletrolíticos no Idoso - SBGG/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hipocalemia-moderada-grave',
    name: 'Hipocalemia Moderada a Grave (Reposição de Cloreto de Potássio)',
    area: 'Clínica Médica e Emergência',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 15, max: 85 },
    symptoms: ['Potássio sérico < 3,0 mEq/L', 'Fraqueza muscular generalizada e cãibras', 'Íleo paralítico com distensão abdominal', 'Onda U proeminente e achatamento de onda T no ECG'],
    suggestedExams: ['Eletrocardiograma de 12 derivações', 'Ionograma completo sérico incluindo magnésio', 'Gasometria venosa'],
    suggestedConduct: {
      id: 'hipocal-c1',
      text: 'Reposição intravenosa lenta de Cloreto de Potássio diluído em acesso venoso (velocidade máxima 20 mEq/h) e correção concomitante do magnésio sérico.'
    },
    distractorConducts: [
      { id: 'hipocal-d1', text: 'Injetar ampola de cloreto de potássio concentrado em bolus direto na veia.', whyWrong: 'Potássio em bolus venoso direto causa fibrilação ventricular e parada cardíaca em diástole imediata.' },
      { id: 'hipocal-d2', text: 'Repor potássio sem dosar ou corrigir o magnésio sérico associado.', whyWrong: 'A hipomagnesemia mantém a bomba Na+/K+ disfuncional e torna a hipocalemia refratária a qualquer reposição.' }
    ],
    medications: [{ genericName: 'Cloreto de Potássio 19,1%', route: 'Intravenosa diluída', indication: 'Correção eletrolítica sob monitorização' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A hipocalemia severa predispõe a arritmias cardíacas graves (Torsades de Pointes) e exige infusão venosa diluída com controle de magnésio.',
    possibleComorbidities: ['Uso de diuréticos de alça', 'Vômitos de repetição'],
    sources: [{ name: 'Diretriz de Terapia Intensiva e Eletrolítica - AMIB', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hipocalcemia-tetania-gluconato',
    name: 'Hipocalcemia Aguda com Tetania (Gluconato de Cálcio)',
    area: 'Clínica Médica e Cirurgia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 18, max: 75 },
    symptoms: ['Parestesias periorais e nas pontas dos dedos', 'Espasmo carpopodal ao insuflar manguito (Sinal de Trousseau)', 'Contração dos músculos faciais à percussão do nervo facial (Sinal de Chvostek)', 'Prolongamento do intervalo QT no ECG'],
    suggestedExams: ['Cálcio ionizável e cálcio total corrigido pela albumina', 'Eletrocardiograma de 12 derivações', 'Fósforo, magnésio e PTH'],
    suggestedConduct: {
      id: 'hipocalc-c1',
      text: 'Administração intravenosa lenta de 1 a 2 ampolas de Gluconato de Cálcio a 10% diluídas em 100 mL de SG 5% sob monitorização eletrocardiográfica.'
    },
    distractorConducts: [
      { id: 'hipocalc-d1', text: 'Administrar cloreto de cálcio concentrado em veia periférica fina sem diluição.', whyWrong: 'Causa flebite química grave e necrose tecidual extensa em caso de extravasamento.' },
      { id: 'hipocalc-d2', text: 'Tratar a tetania com ansiolítico benzodiazepínico assumindo crise de ansiedade.', whyWrong: 'Ignora a hipocalcemia que pode evoluir para laringoespasmo obstrutivo e arritmias fatais.' }
    ],
    medications: [{ genericName: 'Gluconato de Cálcio 10%', route: 'Intravenosa lenta', indication: 'Restauração rápida do cálcio ionizável' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A hipocalcemia sintomática pós-tireoidectomia ou em pancreatite aguda exige gluconato de cálcio venoso para prevenir laringoespasmo.',
    possibleComorbidities: ['Pós-operatório de tireoidectomia total'],
    sources: [{ name: 'Diretriz Brasileira de Distúrbios do Metabolismo Ósseo e Mineral - SBEM', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'acidose-metabolica-uti',
    name: 'Acidose Metabólica Grave na UTI',
    area: 'Emergência e UTI',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 18, max: 85 },
    symptoms: ['pH sanguíneo < 7,10 e bicarbonato < 10 mEq/L', 'Respiração rápida e profunda de Kussmaul', 'Vasodilatação periférica refratária a vasopressores', 'Queda importante da contratilidade miocárdica'],
    suggestedExams: ['Gasometria arterial completa', 'Lactato sérico, ureia, creatinina e eletrólitos', 'Cálculo do Ânion Gap sérico e Delta-Delta'],
    suggestedConduct: {
      id: 'acidose-met-c1',
      text: 'Tratamento imediato da causa de base (ressuscitação na sepse, insulina na CAD), indicação criteriosa de bicarbonato de sódio isotônico se pH < 7,10 e hemodiálise precoce.'
    },
    distractorConducts: [
      { id: 'acidose-met-d1', text: 'Administrar bicarbonato de sódio hipertônico maciço para tentar normalizar o pH em 30 minutos.', whyWrong: 'Gera hipernatremia grave, hiperosmolaridade, acidose paradoxal intracelular e piora a curva de dissociação da hemoglobina.' },
      { id: 'acidose-met-d2', text: 'Intubar e reduzir a frequência respiratória no ventilador para 10 rpm.', whyWrong: 'A redução da ventilação acumula CO2 e provoca colapso acidêmico imediato.' }
    ],
    medications: [
      { genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Expansão hemodinâmica' },
      { genericName: 'Bicarbonato de Sódio 8,4%', route: 'Intravenosa diluída', indication: 'Correção emergencial em pH crítico' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'Na acidose metabólica grave, a prioridade absoluta é cessar a fonte geradora de ácido (isquemia, cetoacidose ou toxinas).',
    possibleComorbidities: ['Choque séptico', 'Insuficiência renal dialítica'],
    sources: [{ name: 'Manual de Cuidados Críticos e Gasometria - AMIB/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  }
];
