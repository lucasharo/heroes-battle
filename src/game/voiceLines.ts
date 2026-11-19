import { HEROES } from './heroes';
import { HeroId } from './types';

export type VoiceLineContext = 'select' | 'match_start' | 'kill';

export type VoiceCadenceStyle =
  | 'sharp'
  | 'heavy'
  | 'mystic'
  | 'energetic'
  | 'robotic';

export interface VoiceToneProfile {
  pitch: number;
  rate: number;
  baseFreqHz: number;
  cadenceStyle: VoiceCadenceStyle;
}

export interface HeroVoiceLines {
  select: readonly [string, string, string];
  match_start: readonly [string, string, string];
  kill: readonly [string, string, string];
}

export interface VoiceLineEvent {
  id: number;
  heroId: HeroId;
  heroName: string;
  context: VoiceLineContext;
  text: string;
  timestampMs: number;
}

export const HERO_VOICE_PROFILES: Record<HeroId, VoiceToneProfile> = {
  raidon: { pitch: 0.94, rate: 1.08, baseFreqHz: 260, cadenceStyle: 'sharp' },
  veinka: { pitch: 1.12, rate: 1.04, baseFreqHz: 330, cadenceStyle: 'sharp' },
  kong: { pitch: 0.68, rate: 0.9, baseFreqHz: 135, cadenceStyle: 'heavy' },
  phoenix: { pitch: 1.08, rate: 1.0, baseFreqHz: 340, cadenceStyle: 'mystic' },
  steelshot: { pitch: 0.9, rate: 1.03, baseFreqHz: 225, cadenceStyle: 'robotic' },
  eldragon: { pitch: 0.86, rate: 1.08, baseFreqHz: 210, cadenceStyle: 'energetic' },
  cluster: { pitch: 0.98, rate: 1.12, baseFreqHz: 250, cadenceStyle: 'energetic' },
  velvet: { pitch: 1.15, rate: 0.98, baseFreqHz: 370, cadenceStyle: 'mystic' },
  meiro: { pitch: 0.82, rate: 0.95, baseFreqHz: 195, cadenceStyle: 'sharp' },
  baston: { pitch: 0.8, rate: 0.94, baseFreqHz: 175, cadenceStyle: 'heavy' },
  nina: { pitch: 1.24, rate: 1.14, baseFreqHz: 400, cadenceStyle: 'energetic' },
  drake: { pitch: 0.85, rate: 0.96, baseFreqHz: 215, cadenceStyle: 'sharp' },
  knox: { pitch: 0.92, rate: 1.1, baseFreqHz: 235, cadenceStyle: 'energetic' },
  kairo: { pitch: 1.02, rate: 1.1, baseFreqHz: 295, cadenceStyle: 'sharp' },
  boulder: { pitch: 0.64, rate: 0.86, baseFreqHz: 120, cadenceStyle: 'heavy' },
  ryder: { pitch: 1.04, rate: 1.12, baseFreqHz: 305, cadenceStyle: 'sharp' },
  solara: { pitch: 1.18, rate: 0.97, baseFreqHz: 385, cadenceStyle: 'mystic' },
  frost: { pitch: 1.06, rate: 0.94, baseFreqHz: 350, cadenceStyle: 'mystic' },
  valkyria: { pitch: 1.16, rate: 1.04, baseFreqHz: 360, cadenceStyle: 'energetic' },
  kronos: { pitch: 0.78, rate: 0.92, baseFreqHz: 185, cadenceStyle: 'mystic' },
  titanx: { pitch: 0.7, rate: 0.92, baseFreqHz: 145, cadenceStyle: 'robotic' },
};

export const HERO_VOICE_LINES: Record<HeroId, HeroVoiceLines> = {
  raidon: {
    select: [
      'Nas sombras, eu já venci.',
      'Duas pistolas e precisão letal.',
      'Raidon pronto para a caçada.',
    ],
    match_start: [
      'Ninguém escapa do Corte Relâmpago!',
      'Hora de desaparecer na névoa.',
      'A arena inteira é o meu território.',
    ],
    kill: [
      'Rápido demais para você.',
      'Mais um alvo eliminado no silêncio.',
      'Lâmina Fantasma nunca erra.',
    ],
  },
  veinka: {
    select: [
      'Mantenha distância ou vire alvo.',
      'Meus virotes atravessam qualquer blindagem.',
      'Caçadora Carmesim na linha de tiro.',
    ],
    match_start: [
      'Alcance máximo ativado!',
      'Nenhuma sombra vai se esconder hoje.',
      'Fique na minha mira por sua conta e risco.',
    ],
    kill: [
      'Tiro limpo à longa distância.',
      'Armadilha armada, alvo abatido.',
      'Ninguém corre mais que minhas flechas.',
    ],
  },
  kong: {
    select: [
      'Ninguém derruba um Titã!',
      'Meu martelo decide quem fica de pé.',
      'Kong pronto para abrir caminho!',
    ],
    match_start: [
      'Segurem a onda sísmica!',
      'Vou partir esta arena ao meio!',
      'Blindagem máxima, força total!',
    ],
    kill: [
      'Esmagado sem esforço!',
      'Sinta o peso do Titã Cibernético!',
      'Mais um que tentou peitar o martelo.',
    ],
  },
  phoenix: {
    select: [
      'Das cinzas nasce a vitória.',
      'As chamas obedecem ao meu comando.',
      'Soberana do Fogo pronta para brilhar.',
    ],
    match_start: [
      'Que a arena arda em chamas!',
      'Cuidado com o meteoro lá de cima!',
      'O calor da batalha acabou de começar.',
    ],
    kill: [
      'Reduzido a cinzas!',
      'O fogo purifica a arena.',
      'Ninguém resiste ao meu meteoro.',
    ],
  },
  steelshot: {
    select: [
      'Canhão 0A carregado e calibrado!',
      'Escudos inimigos? Meu alvo favorito.',
      'Steelshot em posição de combate.',
    ],
    match_start: [
      'Avançando com poder de plasma!',
      'Preparando Granada de Pulso e Hipercarga!',
      'Hora de mostrar disciplina tática.',
    ],
    kill: [
      'Alvo neutralizado com precisão!',
      'Mais um escudo rompido ao meio.',
      'Disparo limpo, vitória garantida.',
    ],
  },
  eldragon: {
    select: [
      'Meus punhos valem por um exército!',
      'Quer encarar o Campeão Biônico?',
      'Hora de botar fogo no ringue!',
    ],
    match_start: [
      'Sente a pressão do Gancho Relâmpago!',
      'O dragão entrou na arena!',
      'Sem recuar, só pancada franca!',
    ],
    kill: [
      'Nocaute fulminante!',
      'Caiu antes mesmo de contar até três!',
      'Fogo nos punhos, vitória no placar!',
    ],
  },
  cluster: {
    select: [
      'Se não explodiu, é porque precisa de mais pólvora!',
      'Morteiro pronto para fazer barulho!',
      'Cluster na área — protejam os ouvidos!',
    ],
    match_start: [
      'Chuva de bombas a caminho!',
      'Quem pisar na minha mina vai voar!',
      'Vamos transformar a arena em fogos!',
    ],
    kill: [
      'Cabum! Fragmentação perfeita!',
      'Explodiu antes de entender o recado!',
      'Nada como uma demolição bem feita!',
    ],
  },
  velvet: {
    select: [
      'As estrelas já previram a sua derrota.',
      'Energia astral sob controle absoluto.',
      'Velvet sintonizada com o cosmos.',
    ],
    match_start: [
      'Que a Supernova ilumine o combate.',
      'Cada disparo drena sua força vital.',
      'O vazio cósmico aguarda vocês.',
    ],
    kill: [
      'Absorvido pela gravidade astral.',
      'Sua energia agora é minha.',
      'Brilho fugaz diante das estrelas.',
    ],
  },
  meiro: {
    select: [
      'Uma lâmina calma corta mais fundo.',
      'Honra e aço na palma da mão.',
      'Meiro pronto para o duelo.',
    ],
    match_start: [
      'Que o vento guie minha katana!',
      'Postura firme diante da tempestade.',
      'O Corte Imperial não vacila.',
    ],
    kill: [
      'Um corte, um destino selado.',
      'Disciplina supera a pressa.',
      'Sua guarda falhou no instante decisivo.',
    ],
  },
  baston: {
    select: [
      'Enquanto meu escudo estiver de pé, ninguém passa!',
      'Defesa impenetrável ativada.',
      'Baston pronto para proteger a linha de frente.',
    ],
    match_start: [
      'Formação tática! Avancem atrás de mim!',
      'Barreira elétrica pronta para o choque.',
      'Vamos segurar o centro da arena!',
    ],
    kill: [
      'Bateu no escudo e caiu duro!',
      'Descarga máxima aplicada!',
      'A muralha nunca cede!',
    ],
  },
  nina: {
    select: [
      'Patins carregados! Tenta me acompanhar!',
      'Rajada neon e veneno em dobro!',
      'Nina na área, velocidade máxima!',
    ],
    match_start: [
      'Acelera tudo que a corrida começou!',
      'Tempestade Neon pronta para colorir a arena!',
      'Devagarinho não dá — bora com tudo!',
    ],
    kill: [
      'Ficou comendo poeira neon!',
      'Tchauzinho! Próximo alvo!',
      'Rápida no gatilho e nas curvas!',
    ],
  },
  drake: {
    select: [
      'Um disparo. Um silêncio definitivo.',
      'Camuflagem checada, mira estável.',
      'Drake assumindo posição elevada.',
    ],
    match_start: [
      'Já estou observando cada movimento.',
      'Não pisque no meu campo de visão.',
      'O predador entrou na caça.',
    ],
    kill: [
      'Alvo abatido em um único projétil.',
      'Você nunca soube de onde veio.',
      'Contrato encerrado.',
    ],
  },
  knox: {
    select: [
      'Magma quente e pólvora fresca!',
      'Quem pediu fogos de artifício na arena?',
      'Knox pronto para aquecer o combate!',
    ],
    match_start: [
      'Cuidado onde pisa, tem pólvora por todo lado!',
      'Canhão de Lava em temperatura máxima!',
      'Hora de acender a Forja Vulcânica!',
    ],
    kill: [
      'Queimou até a última faísca!',
      'Receita explosiva aprovada!',
      'Temperatura alta demais para você!',
    ],
  },
  kairo: {
    select: [
      'Fluxo elétrico em harmonia perfeita.',
      'Meus punhos golpeiam na velocidade do trovão.',
      'Kairo pronto para o combate.',
    ],
    match_start: [
      'Que a descarga do dragão ressoe!',
      'Equilíbrio na mente, raio nos punhos!',
      'Nenhum reflexo acompanha o Passo Relâmpago.',
    ],
    kill: [
      'Atingido pela corrente perfeita.',
      'O trovão sempre chega antes do som.',
      'Mente serena, golpe inevitável.',
    ],
  },
  boulder: {
    select: [
      'Rocha sólida. Nada me move.',
      'A montanha acordou para lutar.',
      'Boulder pronto para esmagar.',
    ],
    match_start: [
      'Avalanche descendo a ladeira!',
      'O terremoto começa agora!',
      'Pedra não sente medo.',
    ],
    kill: [
      'Amassado contra o chão!',
      'Nem arranhou minha pele de basalto.',
      'Soterrado pela força da terra!',
    ],
  },
  ryder: {
    select: [
      'Entre dimensões, eu sou o primeiro a chegar.',
      'Lâminas do Vazio afiadas e prontas.',
      'Ryder entrando em fase.',
    ],
    match_start: [
      'Rasgando o espaço direto para a vitória!',
      'O véu do eclipse vai engolir vocês.',
      'Espiral do Vazio armada!',
    ],
    kill: [
      'Despedaçado entre dimensões.',
      'Nem o espaço pôde proteger você.',
      'Um corte limpo através do vazio.',
    ],
  },
  solara: {
    select: [
      'Que a luz solar guie nossos passos.',
      'Energia radiante para curar e punir.',
      'Solara pronta para iluminar a arena.',
    ],
    match_start: [
      'O santuário ardente protege os justos!',
      'Nenhuma escuridão resiste ao amanhecer.',
      'Brilhem sob a luz do sol!',
    ],
    kill: [
      'Purificado pela luz celestial.',
      'A justiça solar prevaleceu.',
      'Que sua derrota traga equilíbrio.',
    ],
  },
  frost: {
    select: [
      'O inverno não pede permissão para chegar.',
      'Cada movimento seu ficará mais lento.',
      'Frost pronto para congelar a arena.',
    ],
    match_start: [
      'Que a Nevasca Real cubra tudo de gelo!',
      'Sinta o frio absoluto do cristal.',
      'Sem pressa — vocês já estão congelando.',
    ],
    kill: [
      'Congelado no tempo certo.',
      'Estilhaçado como vidro fino.',
      'O gelo nunca perdoa descuidos.',
    ],
  },
  valkyria: {
    select: [
      'Minhas asas cortam os céus da arena!',
      'Alabarda erguida pela vitória suprema.',
      'Valkyria descendo para a batalha!',
    ],
    match_start: [
      'Escudos não vão deter o Juízo Alado!',
      'Avante! Pelos céus da Arena!',
      'A hora da investida chegou!',
    ],
    kill: [
      'Julgado pela lança sagrada!',
      'Nenhum escudo resiste ao voo celestial!',
      'Vitória escrita nas alturas!',
    ],
  },
  kronos: {
    select: [
      'Eu já vi o resultado desta partida.',
      'O tempo é uma arma nas mãos certas.',
      'Kronos no controle do relógio.',
    ],
    match_start: [
      'Tic-tac... seu tempo acabou de começar.',
      'O Paradoxo Temporal vai selar a arena.',
      'Todos se movem devagar diante de mim.',
    ],
    kill: [
      'Seu tempo na arena expirou.',
      'Apagado da linha temporal.',
      'Como eu havia previsto desde o início.',
    ],
  },
  titanx: {
    select: [
      'Reator blindado em 100%. Sistemas prontos.',
      'Protocolo de destruição Titan-X ativado.',
      'Armamento pesado online.',
    ],
    match_start: [
      'Barragem Orbital X pronta para disparo!',
      'Iniciando varredura total da arena!',
      'Blindagem pesada avançando!',
    ],
    kill: [
      'Alvo destruído com eficiência máxima.',
      'Ameaça eliminada do radar.',
      'Poder de fogo superior confirmado.',
    ],
  },
};

export function getHeroVoiceProfile(heroId: HeroId): VoiceToneProfile {
  return HERO_VOICE_PROFILES[heroId];
}

export function pickHeroVoiceLine(
  heroId: HeroId,
  context: VoiceLineContext,
  lastText?: string | null,
  rng: () => number = Math.random
): string {
  const pool: readonly string[] | undefined = HERO_VOICE_LINES[heroId]?.[context];
  if (!pool || pool.length === 0) {
    return `${HEROES[heroId]?.name ?? heroId} pronto para o combate!`;
  }
  const candidates =
    lastText && pool.length > 1 ? pool.filter((line) => line !== lastText) : pool;
  const idx = Math.min(
    candidates.length - 1,
    Math.max(0, Math.floor(rng() * candidates.length))
  );
  return candidates[idx];
}
