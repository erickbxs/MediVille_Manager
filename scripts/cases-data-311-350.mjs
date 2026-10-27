/**
 * Arquivo: scripts/cases-data-311-350.mjs
 *
 * 1. O que este arquivo faz?
 * Define 40 casos clínicos especializados do SUS (casos 311 a 350):
 * - 311 a 330: Pediatria, Hebiatria, Ginecologia e Obstetrícia
 * - 331 a 350: Neurologia, Saúde Mental, Saúde do Trabalhador, Dermatologia e ORL/Oftalmo
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Integrar a expansão da Enciclopédia SUS para 350 casos clínicos reais no Prompt 22 do MediVille Manager.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Importado por scripts/generate-cases-350.mjs. Todos os casos contêm justificativas de erro, condutas padrão RENAME e fontes oficiais.
 *
 * Importa: (módulo puro de dados)
 * Conecta-se com: scripts/generate-cases-350.mjs, src/data/cases.json
 */

export const cases311to350 = [
  // 311 a 330 — Pediatria, Hebiatria, Ginecologia e Obstetrícia
  {
    id: 'membrana-hialina-neonatal',
    name: 'Doença da Membrana Hialina / SDR Neonatal',
    area: 'Pediatria e Neonatologia',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 0, max: 0 },
    symptoms: ['Prematuro < 34 semanas com gemência expiratória imediata', 'Batimento de asa de nariz e tiragem intercostal', 'Cianose progressiva refratária em ar ambiente', 'Radiografia de tórax com padrão em "vidro moído" e broncograma aéreo'],
    suggestedExams: ['Radiografia de tórax em leito neonatal', 'Gasometria arterial seriada', 'Ecocardiograma'],
    suggestedConduct: {
      id: 'membrana-hialina-c1',
      text: 'Suporte pressórico inicial com CPAP nasal e administração traqueal precoce de Surfactante Pulmonar Exógeno natural.'
    },
    distractorConducts: [
      { id: 'membrana-hialina-d1', text: 'Prescrever xarope broncodilatador e manter o recém-nascido em berço comum.', whyWrong: 'Sem surfactante os alvéolos imaturos colapsam na expiração gerando atelectasia massiva e asfixia.' },
      { id: 'membrana-hialina-d2', text: 'Administrar antibiótico oral em gotas como conduta isolada.', whyWrong: 'Trata-se de déficit bioquímico de dipalmitoilfosfatidilcolina (surfactante), não curado por antibióticos orais.' }
    ],
    medications: [{ genericName: 'Surfactante Pulmonar Exógeno', route: 'Intratraqueal', indication: 'Restauração da tensão superficial alveolar' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A deficiência de surfactante em prematuros causa colapso alveolar expiratório e exige reposição exógena precoce.',
    possibleComorbidities: ['Prematuridade extrema'],
    sources: [{ name: 'Atenção à Saúde do Recém-Nascido - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'taquipneia-transitoria-recem-nascido',
    name: 'Taquipneia Transitória do Recém-Nascido (TTRN)',
    area: 'Pediatria e Neonatologia',
    typicalUnit: 'Hospital',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 0, max: 0 },
    symptoms: ['Recém-nascido a termo de parto cesárea eletiva sem trabalho de parto', 'Taquipneia precoce (> 60 incursões/min) nas primeiras horas', 'Gemência branda e tiragem leve', 'Evolução favorável autolimitada em 24 a 72h'],
    suggestedExams: ['Radiografia de tórax (Líquido na cisura interlobar e congestão perihilar)', 'Gasometria venosa'],
    suggestedConduct: {
      id: 'ttrn-c1',
      text: 'Oxigenioterapia em baixo fluxo por halo/cateter para manter SatO2 > 92%, controle térmico e dieta zero com hidratação venosa se FR > 80 rpm.'
    },
    distractorConducts: [
      { id: 'ttrn-d1', text: 'Prescrever diurético de alça intravenoso em alta dose para "secar o pulmão".', whyWrong: 'Diuréticos não aceleram a reabsorção do líquido pulmonar fetal pelos canais ENaC e aumentam risco de hipovolemia.' },
      { id: 'ttrn-d2', text: 'Instalar ventilação mecânica invasiva de imediato sem tentar oxigênio em tenda.', whyWrong: 'A TTRN é benigna e autolimitada; intubação precoce desnecessária gera barotrauma.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Manutenção hídrica transitória' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A TTRN decorre de atraso na reabsorção do fluido pulmonar fetal pela ausência da compressão mecânica e liberação de catecolaminas do parto vaginal.',
    possibleComorbidities: ['Cesariana eletiva'],
    sources: [{ name: 'Manual de Neonatologia - Sociedade Brasileira de Pediatria (SBP)', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'sepse-neonatal-precoce',
    name: 'Sepse Neonatal Precoce (Ampicilina + Gentamicina)',
    area: 'Pediatria e Neonatologia',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 0, max: 0 },
    symptoms: ['Hipotermia ou febre nas primeiras 48-72h de vida', 'Letargia, má perfusão periférica e recusa alimentar', 'Desconforto respiratório ou apneias recorrentes', 'Histórico materno de bolsa rota prolongada (> 18h) ou corioamnionite'],
    suggestedExams: ['Hemocultura em dois sítios', 'Hemograma com relação I/T (I/T > 0,2)', 'Punção lombar para líquor e urocultura se tardia'],
    suggestedConduct: {
      id: 'sepse-neo-c1',
      text: 'Início imediato na primeira hora de Ampicilina associada a Gentamicina intravenosas após coleta de hemocultura, além de suporte intensivo.'
    },
    distractorConducts: [
      { id: 'sepse-neo-d1', text: 'Aguardar 48 horas pelo laudo definitivo da hemocultura para iniciar antibióticos.', whyWrong: 'A sepse neonatal precoce é fulminante; atraso na antibioticoterapia empírica eleva a mortalidade para mais de 50%.' },
      { id: 'sepse-neo-d2', text: 'Prescrever antitérmico oral e orientar mãe a amamentar com mais frequência.', whyWrong: 'A instabilidade térmica neonatal é sinal de infecção bacteriana sistêmica grave por Streptococcus agalactiae ou E. coli.' }
    ],
    medications: [
      { genericName: 'Ampicilina 500mg', route: 'Intravenosa', indication: 'Cobertura de Streptococcus do grupo B e Listeria' },
      { genericName: 'Gentamicina', route: 'Intravenosa', indication: 'Cobertura de enterobactérias Gram-negativas' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A associação de Ampicilina com Gentamicina é o esquema padrão do Ministério da Saúde para sepse neonatal precoce.',
    possibleComorbidities: ['Colonização materna por GBS sem profilaxia intraparto'],
    sources: [{ name: 'Diretrizes de Manejo da Sepse Neonatal - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'sifilis-congenita-penicilina',
    name: 'Sífilis Congênita (Benzilpenicilina Cristalina/Procaína)',
    area: 'Pediatria e Neonatologia',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 0, max: 1 },
    symptoms: ['Rinite serossanguinolenta no recém-nascido', 'Pênfigo palmo-plantar (lesões vesicobolhosas)', 'Hepatoesplenomegalia e icterícia', 'Periostite ou osteocondrite em ossos longos (Pseudoparalisia de Parrot)'],
    suggestedExams: ['VDRL sérico pareado (mãe e recém-nascido no sangue periférico)', 'Radiografia de ossos longos', 'Punção lombar para VDRL, citologia e bioquímica no LCR'],
    suggestedConduct: {
      id: 'sif-cong-c1',
      text: 'Tratamento com Benzilpenicilina Cristalina intravenosa por 10 dias (ou Procaína intramuscular se líquor normal) e notificação compulsória no SINAN.'
    },
    distractorConducts: [
      { id: 'sif-cong-d1', text: 'Tratar com dose única de Penicilina Benzatina em recém-nascido sintomático ou com neurosífilis.', whyWrong: 'A penicilina benzatina não atinge níveis terapêuticos no sistema nervoso central e causa falha de tratamento da neurossífilis.' },
      { id: 'sif-cong-d2', text: 'Coletar sangue do cordão umbilical para VDRL do concepto.', whyWrong: 'O sangue de cordão pode dar falso-positivo por contaminação de sangue materno; deve-se colher sangue periférico da criança.' }
    ],
    medications: [{ genericName: 'Benzilpenicilina Cristalina', route: 'Intravenosa', indication: 'Penetração na barreira hematoencefálica' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A sífilis congênita é evento sentinela da qualidade do pré-natal; a penicilina cristalina por 10 dias cura e previne sequelas ósseas e neurológicas tardias.',
    possibleComorbidities: ['Sífilis materna inadequadamente tratada'],
    sources: [{ name: 'PCDT de Prevenção da Transmissão Vertical do HIV, Sífilis e Hepatites - MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'toxoplasmose-congenita',
    name: 'Toxoplasmose Congênita',
    area: 'Pediatria e Neonatologia',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 0, max: 1 },
    symptoms: ['Tétrada clássica de Sabin: Coriorretinite, Hidrocefalia, Calcificações cerebrais periventriculares difusas e Retardo mental/convulsões', 'Microcefalia ou icterícia neonatal'],
    suggestedExams: ['Sorologia pareada materna e infantil (IgM e IgG anti-Toxoplasma)', 'Ultrassonografia transfontanelar ou TC de crânio', 'Mapeamento de retina especializado'],
    suggestedConduct: {
      id: 'toxo-cong-c1',
      text: 'Tratamento por 1 ano completo com Sulfadiazina + Pirimetamina + Ácido Folínico (para prevenir aplasia medular) e Prednisona se coriorretinite ativa.'
    },
    distractorConducts: [
      { id: 'toxo-cong-d1', text: 'Prescrever espiramicina para a criança no primeiro ano de vida.', whyWrong: 'A espiramicina não atravessa a barreira hematoencefálica e é ineficaz para o tratamento da infecção congênita fetal instalada.' },
      { id: 'toxo-cong-d2', text: 'Administrar pirimetamina sem reposição de ácido folínico.', whyWrong: 'A pirimetamina inibe a di-hidrofolato redutase e causa mielossupressão grave com pancitopenia fatal.' }
    ],
    medications: [
      { genericName: 'Sulfadiazina 500mg', route: 'Oral', indication: 'Inibição do Toxoplasma gondii' },
      { genericName: 'Ácido Folínico', route: 'Oral', indication: 'Proteção hematológica' }
    ],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'O tratamento precoce da toxoplasmose congênita reduz sequelas visuais graves e retardo neuromotor no lactente.',
    possibleComorbidities: ['Coriorretinite em atividade'],
    sources: [{ name: 'Atenção à Toxoplasmose Congênita - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'convulsao-febril-simples',
    name: 'Convulsão Febril Simples na Infância',
    area: 'Pediatria',
    typicalUnit: 'UPA e Hospital',
    severity: 'Moderada',
    weight: 3,
    ageRange: { min: 1, max: 5 },
    symptoms: ['Crise tônico-clônica generalizada com duração < 15 minutos em vigência de pico febril', 'Idade entre 6 meses e 5 anos', 'Período pós-ictal breve com recuperação do estado neurológico basal', 'Única crise em 24 horas'],
    suggestedExams: ['Exame clínico detalhado para buscar o foco infeccioso da febre', 'Glicemia capilar e otoscopia/oroscopia'],
    suggestedConduct: {
      id: 'conv-febril-c1',
      text: 'Tratamento do foco infeccioso de base, antitérmico para alívio do desconforto (dipirona/paracetamol), acolhimento dos pais e orientação de benignidade.'
    },
    distractorConducts: [
      { id: 'conv-febril-d1', text: 'Iniciar anticonvulsivante de uso contínuo (fenobarbital/valproato) para uso prolongado.', whyWrong: 'A convulsão febril simples tem prognóstico excelente e não tem indicação de anticonvulsivante profilático crônico.' },
      { id: 'conv-febril-d2', text: 'Colocar o dedo ou colher na boca da criança durante a crise convulsiva.', whyWrong: 'Manobra arriscada que pode quebrar dentes e causar asfixia por trauma e sangramento orofaríngeo.' }
    ],
    medications: [
      { genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Controle de febre' },
      { genericName: 'Paracetamol 500mg', route: 'Oral', indication: 'Antitérmico alternativo' }
    ],
    medicationIds: ['dipirona', 'paracetamol'],
    requiresPharmacy: true,
    explanation: 'A convulsão febril simples é evento benigno frequente na infância que não causa déficit cognitivo nem evolui para epilepsia na grande maioria.',
    possibleComorbidities: ['Infecção viral de vias aéreas superiores'],
    sources: [{ name: 'Diretrizes de Convulsão Febril - Sociedade Brasileira de Pediatria (SBP)', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'doenca-de-kawasaki',
    name: 'Doença de Kawasaki (Imunoglobulina + AAS)',
    area: 'Pediatria',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 1, max: 6 },
    symptoms: ['Febre alta persistente há mais de 5 dias', 'Conjuntivite bilateral não exsudativa', 'Língua em framboesa e lábios fissurados eritematosos', 'Edema e eritema em palmas/plantas com descamação periungueal tardia', 'Linfonodomegalia cervical unilateral > 1,5 cm'],
    suggestedExams: ['Ecocardiograma transtorácico com avaliação de artérias coronárias', 'Provas inflamatórias muito elevadas (PCR e VHS)', 'Plaquetometria seriada (trombocitose tardia)'],
    suggestedConduct: {
      id: 'kawasaki-c1',
      text: 'Imunoglobulina Humana Intravenosa (IVIG 2g/kg em infusão única) associada a Ácido Acetilsalicílico (AAS) em dose anti-inflamatória antes do 10º dia.'
    },
    distractorConducts: [
      { id: 'kawasaki-d1', text: 'Tratar com amoxicilina oral assumindo escarlatina ou amigdalite bacteriana.', whyWrong: 'Não previne o aparecimento de aneurismas coronarianos, principal causa de infarto e morte súbita na infância.' },
      { id: 'kawasaki-d2', text: 'Aguardar a descamação dos dedos para fechar o diagnóstico.', whyWrong: 'A descamação periungueal ocorre na fase de convalescença tardia (> 14 dias), quando a janela de ouro da imunoglobulina já passou.' }
    ],
    medications: [
      { genericName: 'Imunoglobulina Humana Intravenosa', route: 'Intravenosa', indication: 'Bloqueio da vasculite coronariana' },
      { genericName: 'Ácido Acetilsalicílico 100mg', route: 'Oral', indication: 'Ação anti-inflamatória e antiagregante' }
    ],
    medicationIds: ['dipirona', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A administração de Imunoglobulina venosa até o 10º dia de febre reduz o risco de aneurisma de artéria coronária de 25% para menos de 4%.',
    possibleComorbidities: ['Aneurisma de artéria coronária'],
    sources: [{ name: 'Diretriz da Doença de Kawasaki - Sociedade Brasileira de Pediatria / SBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'purpura-henoch-schonlein',
    name: 'Púrpura de Henoch-Schönlein (Vasculite por IgA)',
    area: 'Pediatria',
    typicalUnit: 'UBS e UPA',
    severity: 'Moderada',
    weight: 3,
    ageRange: { min: 2, max: 12 },
    symptoms: ['Púrpura palpável não trombocitopênica em nádegas e membros inferiores', 'Artralgia ou artrite transitória de tornozelos e joelhos', 'Dor abdominal em cólica', 'Hematúria ou proteinúria leve'],
    suggestedExams: ['Plaquetas normais no hemograma (afasta PTI)', 'Sumário de urina (EAS) e função renal', 'Ultrassonografia de abdome se dor intensa (afastar intussuscepção)'],
    suggestedConduct: {
      id: 'henoch-c1',
      text: 'Manejo conservador com repouso, hidratação, analgesia com paracetamol e corticoterapia curta se dor abdominal severa ou nefrite.'
    },
    distractorConducts: [
      { id: 'henoch-d1', text: 'Prescrever anti-inflamatórios não esteroidais (AINEs) de rotina.', whyWrong: 'AINEs aumentam risco de sangramento gastrointestinal e agravam a nefrite por IgA.' },
      { id: 'henoch-d2', text: 'Realizar transfusão de plaquetas de emergência.', whyWrong: 'A contagem de plaquetas na vasculite por IgA é normal; transfusão é completamente desnecessária.' }
    ],
    medications: [
      { genericName: 'Paracetamol 500mg', route: 'Oral', indication: 'Analgesia segura' },
      { genericName: 'Prednisona 20mg', route: 'Oral', indication: 'Manejo de dor abdominal intensa associada' }
    ],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A Púrpura de Henoch-Schönlein é a vasculite sistêmica mais comum na infância, mediada por depósitos de imunoglobulina A.',
    possibleComorbidities: ['Intussuscepção intestinal secundária'],
    sources: [{ name: 'Manual de Reumatologia Pediátrica - SBP', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'artrite-idiopatica-juvenil',
    name: 'Artrite Idiopática Juvenil (AIJ)',
    area: 'Pediatria e Reumatologia',
    typicalUnit: 'UBS e Hospital',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 2, max: 16 },
    symptoms: ['Artrite com edema e calor em uma ou mais articulações por mais de 6 semanas', 'Rigidez matinal prolongada que melhora com movimento', 'Claudicação ao acordar em criança pequena', 'Uveíte anterior insidiosa assintomática'],
    suggestedExams: ['Fator Antinuclear (FAN) para estratificar risco de uveíte', 'Exame com lâmpada de fenda semestral com oftalmologista', 'Radiografia articular'],
    suggestedConduct: {
      id: 'aij-c1',
      text: 'Encaminhamento para reumatologia pediátrica para início de AINEs, metotrexato como DMARD e vigilância oftalmológica ativa de uveíte.'
    },
    distractorConducts: [
      { id: 'aij-d1', text: 'Prescrever repouso absoluto no leito e imobilização gessada da articulação.', whyWrong: 'Imobilização causa anquilose fibrosa, hipotrofia muscular e contraturas articulares graves.' },
      { id: 'aij-d2', text: 'Dar alta sem exame oftalmológico por ausência de queixas nos olhos.', whyWrong: 'A uveíte na AIJ é silenciosa e pode levar a glaucoma, catarata e cegueira sem qualquer olho vermelho ou dor.' }
    ],
    medications: [{ genericName: 'Ibuprofeno 400mg', route: 'Oral', indication: 'Alívio inflamatório e controle da rigidez matinal' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A AIJ engloba artrites crônicas na infância; o acompanhamento com lâmpada de fenda é obrigatório para prevenir cegueira por uveíte silenciosa.',
    possibleComorbidities: ['Uveíte anterior crônica'],
    sources: [{ name: 'PCDT da Artrite Idiopática Juvenil - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'refluxo-vesicoureteral-infancia',
    name: 'Refluxo Vesicoureteral na Infância (RVU)',
    area: 'Pediatria e Nefrologia',
    typicalUnit: 'UBS e Hospital',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 0, max: 7 },
    symptoms: ['Infecções do trato urinário febris de repetição (Pielonefrites)', 'Febre sem foco evidente no lactente', 'Irritabilidade e baixo ganho de peso', 'Histórico de hidronefrose pré-natal'],
    suggestedExams: ['Uretrocistografia miccional (UCRM) para graduação de I a V', 'Cintilografia renal com DMSA para pesquisa de cicatrizes corticais', 'Urocultura'],
    suggestedConduct: {
      id: 'rvu-c1',
      text: 'Profilaxia antibiótica em dose baixa noturna nos graus moderados/graves, correção do hábito miccional e encaminhamento à uropediatria.'
    },
    distractorConducts: [
      { id: 'rvu-d1', text: 'Ignorar pielonefrites de repetição como infecções comuns passageiras.', whyWrong: 'O refluxo de urina infectada causa cicatrizes renais progressivas com hipertensão e insuficiência renal crônica precoce.' },
      { id: 'rvu-d2', text: 'Indicar cirurgia aberta imediata para todos os graus leves (grau I e II).', whyWrong: 'Os graus leves têm altíssima taxa de resolução espontânea com o crescimento ureteral da criança.' }
    ],
    medications: [{ genericName: 'Amoxicilina 250mg/5mL', route: 'Oral', indication: 'Profilaxia antimicrobiana noturna em lactentes' }],
    medicationIds: ['amoxicilina'],
    requiresPharmacy: true,
    explanation: 'O RVU permite a ascensão bacteriana da bexiga aos rins; a prevenção de pielonefrites é essencial para preservar a massa nefronal funcional.',
    possibleComorbidities: ['Bexiga neurogênica', 'Constipação intestinal crônica'],
    sources: [{ name: 'Diretriz de Infecção Urinária na Infância - Sociedade Brasileira de Pediatria', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'criptorquidia-puericultura',
    name: 'Criptorquidia na Puericultura',
    area: 'Pediatria e Cirurgia',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 0, max: 2 },
    symptoms: ['Bolsa escrotal vazia ou hipoplásica unilateral/bilateral', 'Testículo não palpável ou palpável em canal inguinal', 'Ausência de descida testicular espontânea após 6 meses de vida'],
    suggestedExams: ['Exame físico com mãos aquecidas e técnica de ordenha', 'Avaliação hormonal se não palpável bilateral'],
    suggestedConduct: {
      id: 'criptorquidia-c1',
      text: 'Encaminhamento para Orquidopexia cirúrgica entre 6 e 12 a 18 meses de vida para preservação da fertilidade e redução do risco de malignidade.'
    },
    distractorConducts: [
      { id: 'criptorquidia-d1', text: 'Aguardar até a adolescência (12 anos) para ver se o testículo desce com a puberdade.', whyWrong: 'A permanência intra-abdominal causa atrofia das células germinativas após o 1º ano de vida com esterilidade irreversível e câncer.' },
      { id: 'criptorquidia-d2', text: 'Solicitar ultrassonografia para decidir se encaminha ao cirurgião.', whyWrong: 'A ultrassonografia não substitui a exploração cirúrgica laparoscópica em testículo não palpável.' }
    ],
    medications: [{ genericName: 'Paracetamol 200mg/mL gotas', route: 'Oral', indication: 'Analgesia pós-avaliação' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: false,
    explanation: 'A orquidopexia deve ser realizada preferencialmente até o primeiro ano de vida para mitigar a perda de células de Sertoli.',
    possibleComorbidities: ['Hérnia inguinal associada'],
    sources: [{ name: 'Manual de Urologia Pediátrica - SBP', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'fimose-fisiologica-vs-patologica',
    name: 'Fimose Fisiológica vs. Patológica',
    area: 'Pediatria',
    typicalUnit: 'UBS',
    severity: 'Leve',
    weight: 2,
    ageRange: { min: 1, max: 10 },
    symptoms: ['Aderência prepucial fisiológica natural com orifício elástico no lactente', 'Balanopostites de repetição ou abaulamento ("balonamento") miccional no menino mais velho', 'Anel fibrótico esbranquiçado cicatricial (fimose patológica)'],
    suggestedExams: ['Exame físico da genitália masculina sem manobras forçadas'],
    suggestedConduct: {
      id: 'fimose-c1',
      text: 'Fisiológica: higiene suave sem tração forçada; Patológica: pomada de corticoide tópico (betametasona) por 6 a 8 semanas ou postectomia se refratária.'
    },
    distractorConducts: [
      { id: 'fimose-d1', text: 'Realizar tração forçada ("massagem violenta") do prepúcio no bebê.', whyWrong: 'Manobras bruscas causam microrachaduras que cicatrizam como anel fibroso rígido, transformando fimose fisiológica em patológica.' },
      { id: 'fimose-d2', text: 'Indicar cirurgia de postectomia imediata no recém-nascido saudável sem queixas.', whyWrong: 'Mais de 90% das aderências prepuciais resolvem-se espontaneamente até os 3 a 5 anos de vida.' }
    ],
    medications: [{ genericName: 'Valerato de Betametasona 0,1% pomada', route: 'Tópica', indication: 'Amolecimento e lise de adesões prepuciais' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A aderência prepucial é fisiológica na primeira infância; o tratamento clínico com corticoide tópico tem taxa de sucesso superior a 80%.',
    possibleComorbidities: ['Parafimose'],
    sources: [{ name: 'Orientações sobre Fimose e Higiene Genital - SBP', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'gravidez-ectopica-rota',
    name: 'Gravidez Ectópica Rota (Emergência Cirúrgica)',
    area: 'Ginecologia e Obstetrícia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 15, max: 45 },
    symptoms: ['Atraso menstrual associado a teste de gravidez positivo (Beta-hCG)', 'Dor pélvica súbita e excruciante em uma das fossas ilíacas', 'Sangramento vaginal discreto', 'Sinais de choque hipovolêmico e descompressão brusca positiva no abdome'],
    suggestedExams: ['Ultrassonografia transvaginal (útero vazio com massa anexial e líquido livre)', 'Beta-hCG quantitativo sérico', 'Tipagem sanguínea'],
    suggestedConduct: {
      id: 'ectopica-c1',
      text: 'Laparotomia ou laparoscopia de emergência imediata para salpingectomia hemostática, ressuscitação com cristaloides e hemotransfusão.'
    },
    distractorConducts: [
      { id: 'ectopica-d1', text: 'Prescrever metotrexato em dose intramuscular em paciente com abdome agudo e choque.', whyWrong: 'O metotrexato só é indicado em gestação ectópica íntegra em paciente hemodinamicamente estável com critérios laboratoriais rígidos.' },
      { id: 'ectopica-d2', text: 'Liberar a paciente com antiespasmódico atribuindo a dor a cólica menstrual.', whyWrong: 'A ruptura tubária causa hemorragia peritoneal maciça e óbito materno em poucas horas.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Ressuscitação volêmica urgente' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A gravidez ectópica rota é a principal causa de mortalidade materna no primeiro trimestre de gestação, exigindo cirurgia rápida.',
    possibleComorbidities: ['Doença inflamatória pélvica prévia'],
    sources: [{ name: 'Manual de Urgências e Emergências em Obstetrícia - FEBRASGO/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'abortamento-incompleto',
    name: 'Abortamento Incompleto / Inevitável',
    area: 'Ginecologia e Obstetrícia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 14, max: 45 },
    symptoms: ['Sangramento vaginal com eliminação de coágulos e restos ovulares', 'Cólicas uterinas rítmicas de moderada a forte intensidade', 'Colo uterino pérvio ao toque vaginal', 'Altura uterina menor que a esperada para a idade gestacional'],
    suggestedExams: ['Ultrassonografia pélvica/transvaginal (restos ovulares retidos)', 'Hemograma completo e tipagem sanguínea (fator Rh)'],
    suggestedConduct: {
      id: 'abortamento-c1',
      text: 'Esvaziamento uterino por Aspiração Manual Intrauterina (AMIU) ou curetagem uterina, profilaxia com Imunoglobulina Anti-D se mãe Rh negativo.'
    },
    distractorConducts: [
      { id: 'abortamento-d1', text: 'Indicar repouso absoluto domiciliar e progesterona oral na vigência de colo aberto.', whyWrong: 'Colo aberto com eliminação de tecidos caracteriza aborto inevitável ou incompleto; progesterona é inútil.' },
      { id: 'abortamento-d2', text: 'Omitir a imunoglobulina anti-D em gestante Rh negativo.', whyWrong: 'A ausência de profilaxia causa aloimunização Rh materno-fetal com doença hemolítica perinatal em gestações futuras.' }
    ],
    medications: [
      { genericName: 'Dipirona 500mg/mL', route: 'Intravenosa', indication: 'Analgesia' },
      { genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Manutenção hemodinâmica' }
    ],
    medicationIds: ['dipirona', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A AMIU é o método de esvaziamento uterino de escolha preconizado pela OMS e Ministério da Saúde pelo menor risco de perfuração.',
    possibleComorbidities: ['Anemia aguda por perda sanguínea'],
    sources: [{ name: 'Atenção ao Abortamento Seguro - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'mola-hidatiforme',
    name: 'Mola Hidatiforme (Doença Trofoblástica Gestacional)',
    area: 'Ginecologia e Obstetrícia',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 15, max: 48 },
    symptoms: ['Sangramento vaginal escuro ("em suco de ameixa") no 1º trimestre', 'Útero desproporcionalmente aumentado para a IG', 'Hiperêmese gravídica incoercível e pré-eclâmpsia precoce (< 20 semanas)', 'Eliminação de vesículas translúcidas ("em cachos de uva")'],
    suggestedExams: ['Ultrassonografia pélvica (aspecto em "tempestade de neve" ou vesículas)', 'Beta-hCG quantitativo sérico muito elevado (> 100.000 mUI/mL)', 'Radiografia de tórax'],
    suggestedConduct: {
      id: 'mola-c1',
      text: 'Esvaziamento uterino por vácuo-aspiração/AMIU com anatomopatológico e seguimento ambulatorial com dosagens semanais de Beta-hCG até negativação.'
    },
    distractorConducts: [
      { id: 'mola-d1', text: 'Dar alta definitiva logo após a aspiração uterina sem solicitar controle de Beta-hCG.', whyWrong: 'Até 15-20% das molas evoluem para neoplasia trofoblástica gestacional maligna (coriocarcinoma).' },
      { id: 'mola-d2', text: 'Prescrever apenas antiemético e orientar retorno pré-natal de rotina.', whyWrong: 'A mola hidatiforme não é uma gestação viável e acarreta riscos graves de hemorragia e embolização trofoblástica.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Estabilização volêmica' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A doença trofoblástica gestacional exige monitorização sorológica rigorosa com Beta-hCG após esvaziamento para detecção precoce de coriocarcinoma.',
    possibleComorbidities: ['Cistos tecaluteínicos ovarianos'],
    sources: [{ name: 'Manual de Doença Trofoblástica Gestacional - FEBRASGO/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'incompatibilidade-rh-imunoglobulina',
    name: 'Incompatibilidade Rh / Aloimunização Materno-Fetal (Imunoglobulina Anti-D)',
    area: 'Ginecologia e Obstetrícia',
    typicalUnit: 'UBS e Hospital',
    severity: 'Moderada',
    weight: 3,
    ageRange: { min: 16, max: 45 },
    symptoms: ['Gestante com tipagem sanguínea Rh negativo e parceiro Rh positivo', 'Ausência de sensibilização prévia (Coombs Indireto negativo)', 'Episódio de sangramento genital ou idade gestacional de 28 semanas'],
    suggestedExams: ['Tipagem sanguínea com fator Rh e Coombs Indireto (pesquisa de anticorpos irregulares)', 'Teste de Kleihauer-Betke se sangramento materno'],
    suggestedConduct: {
      id: 'incomp-rh-c1',
      text: 'Administração de Imunoglobulina Anti-D (300 mcg) profilática às 28 semanas de gestação e até 72h após o parto de concepto Rh positivo.'
    },
    distractorConducts: [
      { id: 'incomp-rh-d1', text: 'Administrar Imunoglobulina Anti-D em gestante com Coombs Indireto já positivo sensibilizada.', whyWrong: 'A imunoglobulina não tem efeito quando a mãe já desenvolveu anticorpos anti-D (aloimunização já instalada).' },
      { id: 'incomp-rh-d2', text: 'Aguardar o nascimento do bebê para fazer a primeira profilaxia se houve sangramento no 2º trimestre.', whyWrong: 'Qualquer sangramento ou procedimento invasivo pode sensibilizar a gestante, exigindo aplicação imediata de Anti-D.' }
    ],
    medications: [{ genericName: 'Imunoglobulina Humana Anti-D 300mcg', route: 'Intramuscular', indication: 'Prevenção de aloimunização eritrocitária materna' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A profilaxia com imunoglobulina anti-D erradica as hemácias fetais da circulação materna antes do disparo da resposta imunológica.',
    possibleComorbidities: ['Descolamento prematuro de placenta prévio'],
    sources: [{ name: 'Atenção ao Pré-Natal de Baixo e Alto Risco - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'corioamnionite-aguda',
    name: 'Corioamnionite Aguda',
    area: 'Ginecologia e Obstetrícia',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 15, max: 45 },
    symptoms: ['Febre materna (> 38°C) em trabalho de parto ou bolsa rota', 'Taquicardia materna (> 100 bpm) e fetal (> 160 bpm persistente)', 'Líquido amniótico purulento ou de odor fétido', 'Hipersensibilidade e dor à palpação uterina'],
    suggestedExams: ['Cardiotocografia contínua', 'Hemograma com leucocitose importante e neutrofilia', 'PCR'],
    suggestedConduct: {
      id: 'corio-c1',
      text: 'Antibioticoterapia venosa imediata de amplo espectro (Ampicilina + Gentamicina) e interrupção da gestação pela via obstétrica mais rápida.'
    },
    distractorConducts: [
      { id: 'corio-d1', text: 'Administrar tocolítico para tentar inibir o trabalho de parto e postergar o parto.', whyWrong: 'A manutenção do feto infectado em ambiente amniótico séptico causa óbito fetal intrauterino e sepse materna.' },
      { id: 'corio-d2', text: 'Prescrever apenas antitérmico para baixar a temperatura materna.', whyWrong: 'Corioamnionite é infecção bacteriana grave de membranas e placenta que exige parto imediato.' }
    ],
    medications: [
      { genericName: 'Ampicilina 2g', route: 'Intravenosa', indication: 'Antimicrobiano de escolha' },
      { genericName: 'Gentamicina', route: 'Intravenosa', indication: 'Cobertura de bactérias Gram-negativas' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A infecção intra-amniótica não autoriza conduta expectante; a resolução do parto e antibioticoterapia são indispensáveis.',
    possibleComorbidities: ['Rotura prematura de membranas ovulares'],
    sources: [{ name: 'Protocolos de Emergências Obstétricas - FEBRASGO/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'endometrite-puerperal',
    name: 'Endometrite Puerperal (Clindamicina + Gentamicina)',
    area: 'Ginecologia e Obstetrícia',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 15, max: 45 },
    symptoms: ['Febre puerperal persistente após o 2º ou 3º dia de pós-parto cesárea', 'Lóquios fétidos e turvos', 'Útero subinvoluído, amolecido e doloroso à palpação', 'Taquicardia materna'],
    suggestedExams: ['Hemograma e provas inflamatórias', 'Ultrassonografia pélvica para afastar restos ovulares', 'Hemoculturas'],
    suggestedConduct: {
      id: 'endometrite-c1',
      text: 'Esquema padrão-ouro intravenoso com Clindamicina associada a Gentamicina até a paciente permanecer afebril por 48 horas.'
    },
    distractorConducts: [
      { id: 'endometrite-d1', text: 'Prescrever amoxicilina oral simples em ambiente domiciliar.', whyWrong: 'A infecção puerperal é polimicrobiana por anaeróbios estritos e enterobactérias, exigindo cobertura venosa potente.' },
      { id: 'endometrite-d2', text: 'Indicar histerectomia puerperal de urgência no primeiro pico de febre.', whyWrong: 'Mais de 90% dos casos respondem plenamente à antibioticoterapia venosa conservadora.' }
    ],
    medications: [
      { genericName: 'Clindamicina 900mg', route: 'Intravenosa', indication: 'Cobertura anaeróbia potente' },
      { genericName: 'Gentamicina', route: 'Intravenosa', indication: 'Cobertura de bacilos Gram-negativos' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A endometrite pós-parto é a complicação infecciosa puerperal mais comum; o esquema Clinda + Genta é a referência oficial do SUS.',
    possibleComorbidities: ['Parto cesárea'],
    sources: [{ name: 'Manual de Atenção ao Puerpério - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'miomatose-uterina-sintomatica',
    name: 'Miomatose Uterina Sintomática na APS',
    area: 'Ginecologia',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 25, max: 50 },
    symptoms: ['Sangramento uterino anormal volumoso e prolongado (Menorragia)', 'Anemia ferropriva secundária crônica', 'Sensação de peso pélvico e aumento do volume abdominal', 'Útero aumentado e de consistência endurecida/nodular'],
    suggestedExams: ['Ultrassonografia pélvica/transvaginal', 'Hemograma com ferritina sérica'],
    suggestedConduct: {
      id: 'mioma-c1',
      text: 'Reposição de sulfato ferroso oral, manejo medicamentoso do sangramento (DIU de levonorgestrel, progestagênios ou antifibrinolíticos) e encaminhamento cirúrgico se refratário.'
    },
    distractorConducts: [
      { id: 'mioma-d1', text: 'Indicar histerectomia de imediato em mulher jovem com desejo reprodutivo futuro.', whyWrong: 'Existem opções medicamentosas e miomectomia conservadora que preservam o útero e a fertilidade.' },
      { id: 'mioma-d2', text: 'Tratar apenas com anti-inflamatórios sem suplementar ferro na anemia grave.', whyWrong: 'A hemorragia crônica leva a descompensação hemodinâmica e insuficiência cardíaca de alto débito.' }
    ],
    medications: [
      { genericName: 'Sulfato Ferroso 40mg ferro elementar', route: 'Oral', indication: 'Tratamento de anemia ferropriva' },
      { genericName: 'Ibuprofeno 400mg', route: 'Oral', indication: 'Redução do fluxo menstrual' }
    ],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A miomatose é a neoplasia benigna mais comum do trato genital feminino; o manejo na Atenção Básica foca no controle hemorrágico.',
    possibleComorbidities: ['Anemia ferropriva'],
    sources: [{ name: 'Protocolos da Atenção Básica: Saúde das Mulheres - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'endometriose-pelvica',
    name: 'Endometriose Pélvica (Manejo Hormonal e Analgésico)',
    area: 'Ginecologia',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 18, max: 45 },
    symptoms: ['Os 4 "Ds": Dismenorreia progressiva severa, Dispareunia de profundidade, Dor pélvica crônica não cíclica e Dificuldade para engravidar (Infertilidade)', 'Dor ao evacuar durante o período menstrual (Disquezia)'],
    suggestedExams: ['Ultrassonografia pélvica com preparo intestinal especializado', 'Ressonância magnética de pelve', 'Toque ginecológico com nódulos em fundo de saco'],
    suggestedConduct: {
      id: 'endometriose-c1',
      text: 'Terapia hormonal de supressão menstrual contínua (progestagênio oral ou DIU de levonorgestrel), AINEs para dor e equipe multiprofissional.'
    },
    distractorConducts: [
      { id: 'endometriose-d1', text: 'Dizer à paciente que cólicas incapacitantes são "normais de toda mulher" e não investigar.', whyWrong: 'O atraso diagnóstico médio da endometriose é de 7 a 10 anos, gerando perda da fertilidade e lesão de órgãos vizinhos.' },
      { id: 'endometriose-d2', text: 'Indicar laparoscopia cirúrgica mutiladora imediata sem teste terapêutico clínico.', whyWrong: 'O tratamento clínico hormonal é a primeira linha recomendada pelas diretrizes nacionais antes da cirurgia.' }
    ],
    medications: [
      { genericName: 'Ibuprofeno 400mg', route: 'Oral', indication: 'Alívio da dor inflamatória pélvica' },
      { genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Analgesia adjuvante' }
    ],
    medicationIds: ['dipirona', 'paracetamol'],
    requiresPharmacy: true,
    explanation: 'A endometriose é doença inflamatória estrogênio-dependente caracterizada pela presença de estroma endometrial fora do útero.',
    possibleComorbidities: ['Síndrome do intestino irritável', 'Infertilidade conjugal'],
    sources: [{ name: 'PCDT da Endometriose - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },

  // 331 a 350 — Neurologia, Saúde Mental, Saúde do Trabalhador, Dermatologia e ORL/Oftalmo
  {
    id: 'esclerose-lateral-amiotrofica-ela',
    name: 'Esclerose Lateral Amiotrófica (ELA - Suporte Multidisciplinar SUS)',
    area: 'Neurologia',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 2,
    ageRange: { min: 45, max: 75 },
    symptoms: ['Fraqueza muscular assimétrica progressiva de membros', 'Fasciculações musculares espontâneas visíveis e atrofia muscular', 'Sinais concomitantes de primeiro neurônio motor (espasticidade, hiperreflexia, Babinski) e segundo neurônio motor', 'Disartria e disfagia progressivas sem perda de sensibilidade'],
    suggestedExams: ['Eletroneuromiografia dos 4 segmentos corporais', 'Ressonância magnética neuroeixo para exclusão', 'Espirometria seriada'],
    suggestedConduct: {
      id: 'ela-c1',
      text: 'Riluzol 50mg fornecido pelo SUS, suporte ventilatório não invasivo (BiPAP) precoce e acompanhamento multidisciplinar (fisioterapia, fonoaudiologia e nutrição).'
    },
    distractorConducts: [
      { id: 'ela-d1', text: 'Prescrever anti-inflamatório oral e dispensar de seguimento neurológico.', whyWrong: 'A ELA é doença neurodegenerativa fatal do neurônio motor; o suporte ventilatório e fonoaudiológico prolonga a sobrevida com dignidade.' },
      { id: 'ela-d2', text: 'Prescrever corticoterapia crônica em altas doses.', whyWrong: 'Corticoides não têm eficácia na ELA e causam miopatia secundária acelerando a perda funcional.' }
    ],
    medications: [{ genericName: 'Riluzol 50mg', route: 'Oral', indication: 'Inibição da liberação de glutamato' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A ELA combina sinais de 1º e 2º neurônios motores; o PCDT do SUS assegura o Riluzol e os ventiladores mecânicos não invasivos.',
    possibleComorbidities: ['Insuficiência respiratória restritiva'],
    sources: [{ name: 'PCDT da Esclerose Lateral Amiotrófica - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'coreia-de-sydenham',
    name: 'Coreia de Sydenham',
    area: 'Neurologia e Pediatria',
    typicalUnit: 'UBS e Hospital',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 5, max: 15 },
    symptoms: ['Movimentos involuntários rápidos, bruscos e arrítmicos de extremidades e face', 'Labilidade emocional súbita e choro fácil na criança', 'Hipotonia muscular ("língua em saco de vermes")', 'Antecedente de amigdalite estreptocócica'],
    suggestedExams: ['Critérios de Jones para Febre Reumática', 'ASLO sérico e cultura de orofaringe', 'Ecocardiograma para afastar cardite associada'],
    suggestedConduct: {
      id: 'sydenham-c1',
      text: 'Erradicação estreptocócica e profilaxia secundária rigorosa com Penicilina Benzatina a cada 21 dias, e haloperidol ou valproato se movimentos incapacitantes.'
    },
    distractorConducts: [
      { id: 'sydenham-d1', text: 'Tratar apenas como transtorno de ansiedade ou tiques motores sem investigar febre reumática.', whyWrong: 'Ignora a manifestação neurológica da febre reumática e expõe a criança ao risco de cardite reumática grave.' },
      { id: 'sydenham-d2', text: 'Prescrever estimulantes do sistema nervoso central.', whyWrong: 'Agravam intensamente a instabilidade dopaminérgica estriatal e os movimentos coreicos.' }
    ],
    medications: [{ genericName: 'Benzilpenicilina Benzatina 1.200.000 UI', route: 'Intramuscular', indication: 'Profilaxia secundária contra estreptococo' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A Coreia de Sydenham é manifestação maior da febre reumática por mimetismo molecular em gânglios da base.',
    possibleComorbidities: ['Cardite reumática subclínica'],
    sources: [{ name: 'Diretrizes de Febre Reumática - Sociedade Brasileira de Pediatria/SBC', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'distonia-aguda-biperideno',
    name: 'Distonia Aguda Induzida por Neuroléptico (Biperideno)',
    area: 'Neurologia e Psiquiatria',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 16, max: 60 },
    symptoms: ['Contração espasmódica dolorosa da musculatura cervical (Torcicolo espasmódico)', 'Desvio ocular conjugado para cima (Crise oculógira)', 'Protrusão involuntária da língua e trismo', 'Uso recente de antipsicótico típico (Haloperidol) ou antiemético (Metoclopramida)'],
    suggestedExams: ['Histórico farmacológico imediato', 'Glicemia capilar e eletrólitos'],
    suggestedConduct: {
      id: 'distonia-c1',
      text: 'Administração de Biperideno intramuscular ou intravenoso lento (antagonista colinérgico) com reversão dramática dos espasmos em poucos minutos.'
    },
    distractorConducts: [
      { id: 'distonia-d1', text: 'Administrar nova dose de haloperidol acreditando que o quadro é agitação psicótica.', whyWrong: 'Aprofunda o bloqueio dopaminérgico estriatal e pode desencadear laringoespasmo e sufocação.' },
      { id: 'distonia-d2', text: 'Conter fisicamente o paciente e aguardar resolução espontânea.', whyWrong: 'A contratura muscular contínua é extremamente dolorosa e angustiante, exigindo reversão farmacológica imediata.' }
    ],
    medications: [{ genericName: 'Biperideno 5mg/mL', route: 'Intramuscular / Venosa', indication: 'Anticolinérgico específico' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A distonia aguda é efeito extrapiramidal hiperagudo por bloqueio dopaminérgico D2 em gânglios da base, revertido por anticolinérgicos.',
    possibleComorbidities: ['Uso de neurolépticos de alta potência'],
    sources: [{ name: 'Guia de Prescrição em Psiquiatria e Emergência - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'sindrome-neuroleptica-maligna',
    name: 'Síndrome Neuroléptica Maligna (SNM)',
    area: 'Neurologia e Psiquiatria',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 18, max: 70 },
    symptoms: ['Hipertermia grave (> 39°C a 40°C)', 'Rigidez muscular generalizada extrema ("em cano de chumbo")', 'Instabilidade autonômica (pressão arterial oscilante, sudorese, taquicardia)', 'Alteração do sensório (estupor/coma) e CPK sérica muito elevada'],
    suggestedExams: ['CPK sérica urgente (Rabdomiólise)', 'Hemograma, função renal e gasometria', 'Monitorização em leito de UTI'],
    suggestedConduct: {
      id: 'snm-c1',
      text: 'Suspensão imediata de todos os antipsicóticos, resfriamento corporal ativo, hidratação vigorosa e suporte intensivo com Dantrolene ou Bromocriptina.'
    },
    distractorConducts: [
      { id: 'snm-d1', text: 'Manter o antipsicótico acreditando tratar-se apenas de infecção intercorrente.', whyWrong: 'A permanência da droga bloqueadora de dopamina leva a falência multiorgânica e óbito em mais de 20% dos casos.' },
      { id: 'snm-d2', text: 'Prescrever paracetamol e liberar da unidade de pronto atendimento.', whyWrong: 'A SNM é emergência psiquiátrica-neurológica com indicação formal de terapia intensiva imediata.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Expansão volêmica vigorosa contra rabdomiólise' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A SNM é reação adversa idiossincrática grave a neurolépticos caracterizada por hipodopaminergia central aguda.',
    possibleComorbidities: ['Rabdomiólise grave'],
    sources: [{ name: 'Manual de Emergências Psiquiátricas - ABP/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'sindrome-serotoninergica',
    name: 'Síndrome Serotoninérgica',
    area: 'Neurologia e Psiquiatria',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 18, max: 75 },
    symptoms: ['Hiperreflexia e clônus espontâneo ou induzido exuberante', 'Tremores e hipertermia', 'Agitação psicomotora e diaforese intensa', 'Uso combinado de inibidores da recaptação de serotonina com tramadol, triptanos ou IMAO'],
    suggestedExams: ['Aplicação dos critérios de Hunter (presença de clônus)', 'Ionograma, CPK e função renal'],
    suggestedConduct: {
      id: 'serotonin-c1',
      text: 'Suspensão imediata de todos os fármacos serotoninérgicos, sedação com benzodiazepínicos venosos (diazepam), resfriamento e suporte em UTI.'
    },
    distractorConducts: [
      { id: 'serotonin-d1', text: 'Administrar haloperidol para acalmar a agitação motora.', whyWrong: 'Neurolépticos podem inibir a transpiração, piorar a hipertermia e confundir com síndrome neuroléptica maligna.' },
      { id: 'serotonin-d2', text: 'Aumentar a dose do antidepressivo achando que a tremedeira é crise de ansiedade.', whyWrong: 'A superestimulação de receptores 5-HT1A e 5-HT2A em cascata gera convulsões e colapso circulatório.' }
    ],
    medications: [{ genericName: 'Diazepam 10mg', route: 'Intravenosa lenta', indication: 'Controle de agitação e hiperatividade neuromuscular' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A síndrome serotoninérgica é toxidrome potencialmente fatal causada por excesso de atividade serotoninérgica nos receptores pós-sinápticos.',
    possibleComorbidities: ['Polifarmácia psiquiátrica'],
    sources: [{ name: 'Toxicologia Clínica e Notificação de Eventos Adversos - ANVISA/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'transtorno-espectro-autista-tea',
    name: 'Transtorno do Espectro Autista (TEA - Diagnóstico Precoce)',
    area: 'Saúde Mental e Pediatria',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 3,
    ageRange: { min: 1, max: 8 },
    symptoms: ['Déficit persistente na comunicação e interação social recíproca', 'Padrões restritos e repetitivos de comportamento, interesses ou atividades', 'Ausência de contato visual sustentado e de apontar com o indicador aos 18 meses', 'Hipersensibilidade ou hipossensibilidade a estímulos sensoriais'],
    suggestedExams: ['Aplicação do M-CHAT-R/F na consulta de puericultura (18 a 24 meses)', 'Avaliação fonoaudiológica e neuropsicomotora'],
    suggestedConduct: {
      id: 'tea-c1',
      text: 'Encaminhamento precoce para intervenção terapêutica multidisciplinar no CAPS Infantil / CER (Fonoaudiologia, Terapia Ocupacional e ABA).'
    },
    distractorConducts: [
      { id: 'tea-d1', text: 'Dizer aos pais que "cada criança tem seu tempo" e pedir para esperar até os 5 anos para intervir.', whyWrong: 'A neuroplasticidade é máxima nos primeiros 3 anos; a intervenção precoce é determinante para o prognóstico funcional.' },
      { id: 'tea-d2', text: 'Prescrever antipsicótico contínuo como primeira linha para todos os casos leves de TEA.', whyWrong: 'Medicamentos são restritos a sintomas-alvo específicos (agressividade/irritabilidade grave), não sendo tratamento do núcleo do autismo.' }
    ],
    medications: [{ genericName: 'Multivitamínico Pediátrico', route: 'Oral', indication: 'Suporte nutricional se seletividade alimentar extrema' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: false,
    explanation: 'A identificação precoce do TEA na Atenção Primária à Saúde possibilita intervenções intensivas que transformam a autonomia do paciente.',
    possibleComorbidities: ['Atraso no desenvolvimento da fala'],
    sources: [{ name: 'Linha de Cuidado para a Atenção às Pessoas com TEA - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'tdah-infantil',
    name: 'Transtorno de Déficit de Atenção e Hiperatividade (TDAH)',
    area: 'Saúde Mental e Pediatria',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 6, max: 16 },
    symptoms: ['Desatenção persistente, erros por descuido e dificuldade para organizar tarefas', 'Hiperatividade motora ("a mil por hora") e inquietação', 'Impulsividade e dificuldade para esperar a vez', 'Sintomas presentes em pelo menos dois ambientes (casa e escola) com prejuízo funcional'],
    suggestedExams: ['Questionário SNAP-IV preenchido por pais e professores', 'Avaliação pedagógica e neurológica clínica'],
    suggestedConduct: {
      id: 'tdah-c1',
      text: 'Intervenções psicoeducativas e comportamentais na escola/família e indicação de psicoestimulante (Metilfenidato) se prejuízo persistente.'
    },
    distractorConducts: [
      { id: 'tdah-d1', text: 'Prescrever metilfenidato com base exclusiva no relato de um único dia agitado na escola.', whyWrong: 'O diagnóstico exige cronicidade (> 6 meses) e manifestação em múltiplos contextos conforme critérios do DSM-5.' },
      { id: 'tdah-d2', text: 'Recomendar castigos físicos ou isolamento como método de correção pedagógica.', whyWrong: 'Gera comorbidades psiquiátricas graves como transtorno de oposição desafiante e depressão.' }
    ],
    medications: [{ genericName: 'Cloridrato de Metilfenidato 10mg', route: 'Oral', indication: 'Aumento da disponibilidade de dopamina e noradrenalina pré-frontal' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'O TDAH é transtorno do neurodesenvolvimento de etiologia genética com resposta comprovada à psicoeducação e estimulantes no SUS.',
    possibleComorbidities: ['Transtorno desafiador opositivo'],
    sources: [{ name: 'PCDT do TDAH - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'burnout-saude-trabalhador',
    name: 'Síndrome de Burnout / Esgotamento Profissional',
    area: 'Saúde Mental e do Trabalhador',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 20, max: 65 },
    symptoms: ['Exaustão emocional profunda relacionada ao trabalho', 'Despersonalização e atitudes cínicas com colegas e usuários', 'Sentimento de ineficácia e falta de realização profissional', 'Cefaleia tensional e insônia aos domingos'],
    suggestedExams: ['Avaliação clínica ocupacional', 'Questionário de Maslach (MBI)', 'Emissão de Notificação de Agravo Relacionado ao Trabalho (SINAN)'],
    suggestedConduct: {
      id: 'burnout-c1',
      text: 'Afastamento temporário do ambiente de trabalho desencadeante, psicoterapia de apoio e reorganização das condições de trabalho pelo CEREST.'
    },
    distractorConducts: [
      { id: 'burnout-d1', text: 'Prescrever estimulante do SNC para o paciente render mais horas no emprego.', whyWrong: 'Acelera o colapso físico e psíquico, aumentando o risco de suicídio e acidentes ocupacionais graves.' },
      { id: 'burnout-d2', text: 'Tratar exclusivamente com ansiolítico sem intervir nas causas organizacionais do trabalho.', whyWrong: 'O Burnout é fenômeno ocupacional crônico decorrente de sobrecarga e assédio moral no trabalho.' }
    ],
    medications: [{ genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Alívio sintomático de cefaleias tensionais' }],
    medicationIds: ['dipirona'],
    requiresPharmacy: true,
    explanation: 'Reconhecida na CID-11 como fenômeno ocupacional, a Síndrome de Burnout demanda intervenção na organização do trabalho e apoio do CEREST.',
    possibleComorbidities: ['Transtorno depressivo maior'],
    sources: [{ name: 'Manual de Doenças Relacionadas ao Trabalho - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'ler-dort-tunel-carpo',
    name: 'LER / DORT — Síndrome do Túnel do Carpo',
    area: 'Saúde do Trabalhador',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 25, max: 60 },
    symptoms: ['Parestesia e dor no território do nervo mediano (polegar, indicador e médio)', 'Piora noturna dos sintomas acordando o paciente para "sacudir a mão"', 'Sinal de Tinel e Teste de Phalen positivos', 'Perda de força de pinça e atrofia da eminência tenar tardia'],
    suggestedExams: ['Eletroneuromiografia dos membros superiores', 'Ultrassonografia de punho'],
    suggestedConduct: {
      id: 'tunel-carpo-c1',
      text: 'Órtese de imobilização neutra do punho noturna, adaptação ergonômica do posto de trabalho e fisioterapia (ou descompressão cirúrgica se déficit motor).'
    },
    distractorConducts: [
      { id: 'tunel-carpo-d1', text: 'Injeção indiscriminada de corticoide intralesional dentro do nervo mediano.', whyWrong: 'A injeção intraneural acarreta necrose fascicular e dano neurológico permanente.' },
      { id: 'tunel-carpo-d2', text: 'Orientar o trabalhador a continuar digitando com força para fortalecer os tendões.', whyWrong: 'O microtrauma repetitivo aumenta a pressão intracarpeana e piora a isquemia crônica do nervo.' }
    ],
    medications: [{ genericName: 'Ibuprofeno 400mg', route: 'Oral', indication: 'Controle de sinovite flexora no punho' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A compressão do nervo mediano no túnel do carpo é a neuropatia compressiva ocupacional mais prevalente.',
    possibleComorbidities: ['Hipotireoidismo', 'Diabetes Mellitus'],
    sources: [{ name: 'Protocolos de Atenção à Saúde do Trabalhador: LER/DORT - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'perda-auditiva-induzida-por-ruido',
    name: 'Perda Auditiva Induzida por Ruído (PAIR)',
    area: 'Saúde do Trabalhador',
    typicalUnit: 'UBS',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 25, max: 65 },
    symptoms: ['Perda auditiva neurossensorial bilateral, simétrica e insidiosa', 'Zumbido contínuo de alta frequência nos ouvidos', 'Dificuldade para compreender a fala em ambientes ruidosos', 'Histórico de exposição ocupacional a ruído > 85 dB sem EPI adequado'],
    suggestedExams: ['Audiometria tonal por via aérea e óssea com repouso auditivo de 14h ("entalhe acústico" em 3000, 4000 ou 6000 Hz)', 'Imitanciometria'],
    suggestedConduct: {
      id: 'pair-c1',
      text: 'Afastamento imediato da exposição a ruído excessivo, emissão de CAT/notificação no SINAN, uso de protetores auriculares adequados e reabilitação fonoaudiológica.'
    },
    distractorConducts: [
      { id: 'pair-d1', text: 'Prescrever colírio otológico ou antibiótico para "curar" a perda auditiva.', whyWrong: 'A PAIR é decorrente de morte irreversível de células ciliadas da cóclea; não tem cura medicamentosa.' },
      { id: 'pair-d2', text: 'Dizer ao trabalhador que o zumbido é psicológico e não emitir notificação.', whyWrong: 'A PAIR é doença ocupacional de notificação compulsória que exige medidas preventivas no ambiente fabril.' }
    ],
    medications: [{ genericName: 'Cloreto de Sódio 0,9%', route: 'Tópica', indication: 'Higiene suave do conduto se cerume associado' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: false,
    explanation: 'A PAIR é irreversível e prevenível; o dano coclear estabiliza assim que cessa a exposição aos níveis nocivos de pressão sonora.',
    possibleComorbidities: ['Zumbido incapacitante'],
    sources: [{ name: 'Manual de Notificação e Manejo da PAIR - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'intoxicacao-monoxido-carbono',
    name: 'Intoxicação Aguda por Monóxido de Carbono (Oxigênio 100%)',
    area: 'Emergência e Toxicologia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 5, max: 80 },
    symptoms: ['Cefaleia latejante e tontura pós-exposição a geradores, incêndio ou aquecedores a gás', 'Náuseas, vômitos e confusão mental', 'Coloração vermelho-cereja de pele/mucosas (sinal tardio)', 'Oximetria de pulso falsamente normal'],
    suggestedExams: ['Co-oximetria para dosagem de Carboxiemoglobina (COHb)', 'Gasometria arterial com dosagem real de oxigênio', 'Eletrocardiograma'],
    suggestedConduct: {
      id: 'co-toxic-c1',
      text: 'Oxigênio a 100% sob máscara não reinalante com reservatório imediatamente (ou Oxigenoterapia Hiperbárica se gestante ou COHb > 25%).'
    },
    distractorConducts: [
      { id: 'co-toxic-d1', text: 'Confiar na oximetria de pulso comum de 98% e não ofertar oxigênio.', whyWrong: 'O oxímetro de pulso padrão não diferencia oxiemoglobina de carboxiemoglobina, fornecendo leituras falsamente normais.' },
      { id: 'co-toxic-d2', text: 'Induzir vômitos para eliminar o gás inalado.', whyWrong: 'O monóxido de carbono é absorvido pelos pulmões; induzir vômitos gera broncoaspiração química grave.' }
    ],
    medications: [{ genericName: 'Oxigênio Medicinal 100%', route: 'Inalatória com máscara com reservatório', indication: 'Redução da meia-vida da carboxiemoglobina' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: false,
    explanation: 'O oxigênio a 100% reduz a meia-vida da carboxiemoglobina de 320 minutos para cerca de 80 minutos.',
    possibleComorbidities: ['Intoxicação por Cianeto em vítimas de incêndio'],
    sources: [{ name: 'Guia de Toxicologia Clínica - CIATOX/Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'intoxicacao-por-metanol',
    name: 'Intoxicação por Metanol / Etilenoglicol',
    area: 'Emergência e Toxicologia',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 18, max: 70 },
    symptoms: ['Ingestão de bebida adulterada ou anticongelante', 'Distúrbios visuais ("visão em tempestade de neve") com cegueira rápida', 'Acidose metabólica severa com ânion gap elevado', 'Respiração de Kussmaul e coma'],
    suggestedExams: ['Gasometria arterial com cálculo de hiato aniônico e osmolal', 'Fundo de olho com edema de papila óptica', 'Níveis séricos de ácido fórmico'],
    suggestedConduct: {
      id: 'metanol-c1',
      text: 'Antídoto com Fomepizol ou Etanol (para inibir competitivamente a álcool desidrogenase), hemodiálise de urgência e ácido folínico.'
    },
    distractorConducts: [
      { id: 'metanol-d1', text: 'Dar alta diagnosticando como embriaguez alcoólica comum sem dosar gasometria.', whyWrong: 'O metabólito ácido fórmico destrói irreversivelmente a retina e os gânglios da base, levando à morte.' },
      { id: 'metanol-d2', text: 'Realizar lavagem gástrica após 6 horas da ingestão do líquido.', whyWrong: 'Álcoois são absorvidos em minutos no estômago; a lavagem gástrica tardia é inútil e perigosa.' }
    ],
    medications: [
      { genericName: 'Etanol a 10% / Fomepizol', route: 'Intravenosa / Oral', indication: 'Inibição competitiva da formação de ácido fórmico' },
      { genericName: 'Bicarbonato de Sódio 8,4%', route: 'Intravenosa diluída', indication: 'Combate à acidemia crítica' }
    ],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A toxicidade do metanol é mediada pelo ácido fórmico; a inibição da álcool desidrogenase e hemodiálise precoce salvam a visão e a vida.',
    possibleComorbidities: ['Insuficiência renal anúrica'],
    sources: [{ name: 'Protocolos de Tratamento de Intoxicações Graves - CIATOX/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'intoxicacao-por-paracetamol',
    name: 'Intoxicação por Paracetamol (N-Acetilcisteína)',
    area: 'Emergência e Toxicologia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 14, max: 65 },
    symptoms: ['Ingestão intencional ou acidental de altas doses (> 7,5 a 10g de paracetamol)', 'Náuseas e vômitos brandos nas primeiras 24h (Fase 1 enganosamente estável)', 'Dor em hipocôndrio direito e icterícia a partir de 48-72h (Fase 3 hepática)', 'Elevação dramática das transaminases (> 10.000 UI/L) e coagulopatia'],
    suggestedExams: ['Dosagem sérica de paracetamol e aplicação no Nomograma de Rumack-Matthew (entre 4 e 24h da ingestão)', 'TGO, TGP, TAP/INR e bilirrubinas'],
    suggestedConduct: {
      id: 'paracetamol-tox-c1',
      text: 'Administração imediata de N-Acetilcisteína (NAC) por via intravenosa ou oral, idealmente antes de completar 8 horas da ingestão.'
    },
    distractorConducts: [
      { id: 'paracetamol-tox-d1', text: 'Liberar paciente da emergência nas primeiras horas porque os exames iniciais estão normais.', whyWrong: 'A necrose hepática centrolobular por NAPQI instala-se após 48 a 72 horas com insuficiência hepática fulminante.' },
      { id: 'paracetamol-tox-d2', text: 'Aguardar a subida das enzimas hepáticas para começar a acetilcisteína.', whyWrong: 'A eficácia da NAC na reposição de glutationa é máxima quando administrada nas primeiras 8 horas.' }
    ],
    medications: [{ genericName: 'N-Acetilcisteína', route: 'Intravenosa / Oral', indication: 'Antídoto específico / restaurador da glutationa hepática' }],
    medicationIds: ['soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A N-Acetilcisteína previne a ligação do metabólito tóxico NAPQI aos hepatócitos se iniciada precocemente.',
    possibleComorbidities: ['Hepatite fulminante induzida por drogas'],
    sources: [{ name: 'Protocolo de Manejo da Intoxicação por Paracetamol - ANVISA/MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'eritema-nodoso-hansênico',
    name: 'Eritema Nodoso Hansênico (Reação Hansênica Tipo 2)',
    area: 'Dermatologia e Infectologia',
    typicalUnit: 'UBS e UPA',
    severity: 'Moderada',
    weight: 3,
    ageRange: { min: 18, max: 70 },
    symptoms: ['Surgimento agudo de nódulos eritematosos dolorosos e quentes pelo corpo', 'Febre alta, mal-estar geral e mialgias', 'Neurite aguda com dor em trajetos nervosos', 'Paciente em tratamento de Hanseníase Multibacilar'],
    suggestedExams: ['Avaliação neurológica simplificada (palpação de nervos periféricos e monofilamentos de Semmes-Weinstein)', 'Baciloscopia de raspado intradérmico'],
    suggestedConduct: {
      id: 'eritema-hans-c1',
      text: 'Talidomida oral sob termo de responsabilidade no SUS (ou Prednisona se mulher em idade fértil/neurite grave) sem interromper a PQT.'
    },
    distractorConducts: [
      { id: 'eritema-hans-d1', text: 'Suspender a Poliquimioterapia (PQT) da hanseníase achando que os nódulos são alergia ao remédio.', whyWrong: 'A reação hansênica decorre de imunocomplexos contra antígenos do bacilo morto e não de alergia; suspender a PQT favorece a progressão da hanseníase.' },
      { id: 'eritema-hans-d2', text: 'Prescrever Talidomida para mulher em idade fértil sem contracepção segura comprovada.', whyWrong: 'A talidomida possui alto poder teratogênico (focomelia) e tem dispensação controlada no SUS.' }
    ],
    medications: [
      { genericName: 'Talidomida 100mg / Prednisona', route: 'Oral', indication: 'Inibição de TNF-alfa e reação imune' },
      { genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Controle álgico e térmico' }
    ],
    medicationIds: ['dipirona', 'paracetamol'],
    requiresPharmacy: true,
    explanation: 'O eritema nodoso hansênico é reação mediada por imunocomplexos e aumento de TNF-alfa em formas lepromatosas da hanseníase.',
    possibleComorbidities: ['Hanseníase virchowiana'],
    sources: [{ name: 'Diretrizes para Vigilância, Atenção e Eliminação da Hanseníase - MS', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'penfigo-foliaceo-vulgar',
    name: 'Pênfigo Foliáceo / Vulgar (Corticoterapia Sistêmica)',
    area: 'Dermatologia',
    typicalUnit: 'Hospital',
    severity: 'Grave',
    weight: 2,
    ageRange: { min: 20, max: 70 },
    symptoms: ['Bolhas flácidas que se rompem com facilidade deixando áreas erosivas exsudativas dolorosas', 'Descolamento da epiderme por atrito tangencial (Sinal de Nikolsky positivo)', 'Lesões orais erosivas dolorosas precedendo as cutâneas (no Pênfigo Vulgar)'],
    suggestedExams: ['Biópsia de pele com imunofluorescência direta (depósitos intercelulares de IgG/C3 - padrão em rede)', 'Sorologia para anticorpos anti-desmogleína 1 e 3'],
    suggestedConduct: {
      id: 'penfigo-c1',
      text: 'Corticoterapia sistêmica em altas doses (Prednisona 1 a 1,5 mg/kg/dia) associada a imunossupressor poupador (azatioprina) e curativos estéreis não aderentes.'
    },
    distractorConducts: [
      { id: 'penfigo-d1', text: 'Realizar desbridamento mecânico e curetagem das áreas lesadas.', whyWrong: 'Aumenta a área desepitelizada, a perda de proteínas e o risco de sepse cutânea estafilocócica.' },
      { id: 'penfigo-d2', text: 'Tratar apenas com pomada emoliente comum e liberar sem corticoide sistêmico.', whyWrong: 'Sem imunossupressão sistêmica, a acantólise autoimune se generaliza com perda da barreira cutânea e desidratação grave.' }
    ],
    medications: [{ genericName: 'Prednisona 20mg', route: 'Oral', indication: 'Supressão da produção de autoanticorpos anti-desmogleína' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'O pênfigo vulgar é doença bolhosa autoimune grave direcionada às desmogleínas dos desmossomos, exigindo corticoterapia precoce.',
    possibleComorbidities: ['Infecção bacteriana secundária'],
    sources: [{ name: 'Consenso Brasileiro de Doenças Bolhosas Autoimunes - SBD', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'sindrome-stevens-johnson-net',
    name: 'Síndrome de Stevens-Johnson / NET (Internação de Urgência e Suporte)',
    area: 'Dermatologia e UTI',
    typicalUnit: 'Hospital',
    severity: 'Gravíssima',
    weight: 4,
    ageRange: { min: 10, max: 80 },
    symptoms: ['Descolamento epidérmico e necrose cutânea em grandes lâminas (Sinal de Nikolsky)', 'Acometimento mucoso grave de pelo menos duas mucosas (oral, conjuntival, genital)', 'Lesões em alvo atípicas e máculas purpúricas confluentes', 'Histórico recente de uso de anticonvulsivantes, alopurinol ou sulfas'],
    suggestedExams: ['Cálculo do escore de prognóstico SCORTEN', 'Biópsia cutânea de congelação imediata', 'Monitorização estrita em UTI ou Centro de Queimados'],
    suggestedConduct: {
      id: 'ssj-c1',
      text: 'Suspensão imediata de todos os medicamentos não essenciais, suporte térmico e volêmico em leito intensivo, cuidados oculares profiláticos rigorosos e ciclosporina/IVIG.'
    },
    distractorConducts: [
      { id: 'ssj-d1', text: 'Manter anticonvulsivante ou fármaco suspeito por achar que é exantema viral simples.', whyWrong: 'Cada hora de atraso na suspensão da droga indutora agrava a apoptose de queratinócitos e aumenta a mortalidade.' },
      { id: 'ssj-d2', text: 'Desbridar e escarificar cirurgicamente as bolhas soltas da pele.', whyWrong: 'A epiderme necrótica atua como curativo biológico natural; removê-la intensifica a perda hídrica e bacteremia.' }
    ],
    medications: [
      { genericName: 'Cloreto de Sódio 0,9%', route: 'Intravenosa', indication: 'Ressuscitação hidroeletrolítica protetora' },
      { genericName: 'Dipirona 500mg/mL', route: 'Intravenosa', indication: 'Analgesia' }
    ],
    medicationIds: ['soro-fisiologico', 'dipirona'],
    requiresPharmacy: true,
    explanation: 'A SSJ/NET é a farmacodermia mais grave da medicina; a remoção precoce do fármaco e internação em UTI/Centro de Queimados reduzem a mortalidade.',
    possibleComorbidities: ['Sinéquia ocular / Cegueira por simbléfaro'],
    sources: [{ name: 'Diretrizes Clínicas de Farmacodermias Graves - SBD/AMIB', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'hidradenite-supurativa',
    name: 'Hidradenite Supurativa',
    area: 'Dermatologia',
    typicalUnit: 'UBS e UPA',
    severity: 'Moderada',
    weight: 2,
    ageRange: { min: 18, max: 55 },
    symptoms: ['Nódulos inflamatórios dolorosos recorrentes e profundos em axilas, virilhas e região anogenital', 'Presença de fístulas drenantes com secreção purulenta fétida', 'Cicatrizes hipertróficas e cordões fibrosos ("em corda")', 'Comedões duplos característicos'],
    suggestedExams: ['Classificação clínica pelos estágios de Hurley (I, II ou III)', 'Ultrassonografia cutânea de partes moles'],
    suggestedConduct: {
      id: 'hidradenite-c1',
      text: 'Antimicrobianos sistêmicos orais (doxiciclina ou clindamicina + rifampicina nos surtos), medidas de higiene, cessação do tabagismo e avaliação para imunobiológico (adalimumabe no SUS).'
    },
    distractorConducts: [
      { id: 'hidradenite-d1', text: 'Realizar incisões e drenagens repetidas nos nódulos inflamatórios de rotina.', whyWrong: 'Drenagens repetidas não tratam a inflamação folicular e estimulam a formação de novas fístulas e cicatrizes deformantes.' },
      { id: 'hidradenite-d2', text: 'Atribuir as lesões apenas à falta de higiene e dispensar sem tratamento.', whyWrong: 'A hidradenite é doença inflamatória crônica autoimune do folículo pilosebáceo de grande impacto psicossocial.' }
    ],
    medications: [
      { genericName: 'Amoxicilina + Clavulanato', route: 'Oral', indication: 'Controle de superinfecção bacteriana aguda' },
      { genericName: 'Ibuprofeno 400mg', route: 'Oral', indication: 'Anti-inflamatório analgésico' }
    ],
    medicationIds: ['amoxicilina', 'paracetamol'],
    requiresPharmacy: true,
    explanation: 'A hidradenite supurativa exige tratamento clínico anti-inflamatório continuado e imunobiológico nos casos moderados a graves.',
    possibleComorbidities: ['Tabagismo', 'Obesidade / Síndrome metabólica'],
    sources: [{ name: 'PCDT da Hidradenite Supurativa - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'descolamento-retina-regmatogenico',
    name: 'Descolamento de Retina Regmatogênico (Urgência Oftalmológica)',
    area: 'Oftalmologia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 3,
    ageRange: { min: 20, max: 75 },
    symptoms: ['Flashes luminosos repentinos no campo visual (Fotopsias)', 'Aparecimento súbito de múltiplos pontos escuros flutuantes ("Moscas volantes")', 'Perda de campo visual progressiva que avança como uma "cortina ou sombra escura"', 'Queda importante da acuidade visual se acometimento macular'],
    suggestedExams: ['Mapeamento de retina com oftalmologista sob midríase completa', 'Ultrassonografia ocular se opacidade de meios (catarata ou hemorragia vítrea)'],
    suggestedConduct: {
      id: 'descol-retina-c1',
      text: 'Encaminhamento oftalmológico de urgência imediata para cirurgia vítreo-retiniana (vitrectomia posterior, retinopexia pneumática ou introflexão escleral) e repouso cefálico.'
    },
    distractorConducts: [
      { id: 'descol-retina-d1', text: 'Prescrever colírio lubrificante e agendar consulta oftalmológica eletiva em 30 dias.', whyWrong: 'O descolamento da mácula sem reparo cirúrgico rápido leva à perda visual central irreversível permanente.' },
      { id: 'descol-retina-d2', text: 'Orientar o paciente a realizar exercícios oculares e massagem no globo ocular.', whyWrong: 'Movimentos bruscos e compressões aceleram o descolamento da retina e ampliam a rotura retiniana.' }
    ],
    medications: [{ genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Alívio sintomático se cefaleia ocular associada' }],
    medicationIds: ['dipirona'],
    requiresPharmacy: false,
    explanation: 'O descolamento regmatogênico decorre de rotura retiniana que permite a passagem de humor vítreo líquido para o espaço sub-retiniano, exigindo cirurgia urgente.',
    possibleComorbidities: ['Alta miopia', 'Cirurgia prévia de catarata'],
    sources: [{ name: 'Diretrizes de Urgências em Oftalmologia - CBO/Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'oclusao-arteria-central-retina',
    name: 'Oclusão de Artéria Central da Retina (OACR)',
    area: 'Oftalmologia e Neurologia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Gravíssima',
    weight: 3,
    ageRange: { min: 50, max: 85 },
    symptoms: ['Perda visual monocular súbita, indolor e profunda ("amaurose")', 'Pupila de Marcus Gunn (defeito pupilar aferente relativo)', 'Fundo de olho com retina pálida e mancha "vermelho-cereja" na fóvea'],
    suggestedExams: ['Fundoscopia ocular imediata', 'Ecocardiograma e Doppler de artérias carótidas (busca de fonte embólica)', 'Eletrocardiograma para fibrilação atrial'],
    suggestedConduct: {
      id: 'oacr-c1',
      text: 'Tratamento de emergência antes de 4-6 horas (massagem ocular, paracentese de câmara anterior, hipotensores oculares) e investigação sistêmica urgente de AVC.'
    },
    distractorConducts: [
      { id: 'oacr-d1', text: 'Aguardar melhora espontânea atribuindo a perda visual a espasmo transitório.', whyWrong: 'A retina tem tolerância isquêmica menor que 100 minutos; atrasos produzem cegueira monocular definitiva.' },
      { id: 'oacr-d2', text: 'Ocluir o olho afetado com tampão e orientar repouso domiciliar.', whyWrong: 'A OACR é equivalente a um AVC retiniano com altíssimo risco de AVC isquêmico cerebral iminente nas próximas 48h.' }
    ],
    medications: [{ genericName: 'Ácido Acetilsalicílico 100mg', route: 'Oral', indication: 'Antiagregação plaquetária preventiva de novos eventos embólicos' }],
    medicationIds: ['paracetamol'],
    requiresPharmacy: true,
    explanation: 'A OACR é um acidente vascular isquêmico do olho; o tempo para desobstrução da artéria é crucial para a preservação funcional.',
    possibleComorbidities: ['Estenose carotídea aterosclerótica', 'Fibrilação atrial'],
    sources: [{ name: 'Protocolos de Emergência Cerebrovascular e Ocular - CBO/SBCV', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  },
  {
    id: 'neurite-optica-retrobulbar',
    name: 'Neurite Óptica Retrobulbar',
    area: 'Neurologia e Oftalmologia',
    typicalUnit: 'UPA e Hospital',
    severity: 'Grave',
    weight: 2,
    ageRange: { min: 18, max: 45 },
    symptoms: ['Queda subaguda da visão em um olho em mulher jovem', 'Dor ocular que piora com a movimentação dos olhos', 'Discromatopsia marcante (perda da percepção de cores, sobretudo o vermelho)', 'Defeito pupilar aferente com fundo de olho inicialmente normal'],
    suggestedExams: ['Ressonância magnética de crânio e órbitas com contraste (desmielinização e realce do nervo óptico)', 'Campimetria visual computadorizada'],
    suggestedConduct: {
      id: 'neurite-opt-c1',
      text: 'Pulsoterapia intravenosa com Metilprednisolona (1g/dia por 3 a 5 dias) seguida de transição oral com prednisona e investigação para Esclerose Múltipla.'
    },
    distractorConducts: [
      { id: 'neurite-opt-d1', text: 'Iniciar corticoterapia oral com prednisona em baixa dose isolada sem pulsoterapia.', whyWrong: 'O Optic Neuritis Treatment Trial (ONTT) provou que prednisona oral em dose baixa isolada duplica a taxa de recidiva da neurite.' },
      { id: 'neurite-opt-d2', text: 'Tratar com analgésico e liberar sem neuroimagem.', whyWrong: 'A neurite óptica é com frequência a primeira manifestação clínica de Esclerose Múltipla ou Neuromielite Óptica (Doença de Devic).' }
    ],
    medications: [
      { genericName: 'Metilprednisolona 500mg', route: 'Intravenosa', indication: 'Pulsoterapia aceleradora da recuperação visual' },
      { genericName: 'Dipirona 500mg/mL', route: 'Oral', indication: 'Alívio da dor retro-orbitária' }
    ],
    medicationIds: ['dipirona', 'soro-fisiologico'],
    requiresPharmacy: true,
    explanation: 'A neurite óptica é uma afecção inflamatória desmielinizante do nervo óptico com excelente resposta à pulsoterapia de corticoide venoso.',
    possibleComorbidities: ['Esclerose Múltipla'],
    sources: [{ name: 'PCDT da Esclerose Múltipla - Ministério da Saúde', url: 'https://bvsms.saude.gov.br', accessedOn: '2026-10-26' }],
    version: '2.0.0', reviewedOn: '2026-10-26', reviewStatus: 'approved'
  }
];
