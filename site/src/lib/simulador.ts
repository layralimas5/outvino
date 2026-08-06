import type { Produto } from './catalogo';
import { normalizar } from './texto';

/**
 * Regras do simulador de vinho.
 *
 * A ideia é a mesma conversa que a loja tem no balcão: o que você vai comer,
 * com quem vai beber, quanto quer gastar. Cada resposta dá pontos aos rótulos
 * que se encaixam, e a vitrine ao lado se reordena sozinha.
 *
 * Nada aqui inventa característica de vinho: toda regra lê campo que já existe
 * no catálogo (tipo, uva, classificação, teor, harmonização). Rótulo sem o
 * campo simplesmente não pontua naquela regra, em vez de ganhar um palpite.
 *
 * Este arquivo é puro de propósito — sem React, sem DOM. A ilha só desenha o
 * que `sugerir()` devolve.
 */

export interface Opcao {
  id: string;
  rotulo: string;
  /** Linha de apoio dentro do cartão da opção. */
  ajuda?: string;
}

export interface Pergunta {
  id: string;
  titulo: string;
  ajuda: string;
  opcoes: Opcao[];
}

/** Resposta escolhida por pergunta. Pergunta sem resposta simplesmente não pesa. */
export type Respostas = Record<string, string | undefined>;

export interface Sugestao {
  produto: Produto;
  pontos: number;
  /** Por que esse rótulo subiu. Vira etiqueta no cartão do resultado. */
  motivos: string[];
  /**
   * Falso só quando a pessoa escolheu um teto e o preço passa dele.
   *
   * Orçamento não é gosto, é limite: nenhuma soma de pontos coloca um rótulo
   * de R$ 429 na frente quando o teto era R$ 120. Estes ficam no fim da lista,
   * avisados — sumir com eles esconderia da loja uma venda que a pessoa ainda
   * pode querer ver.
   */
  dentroDoOrcamento: boolean;
}

interface Peso {
  pontos: number;
  motivo?: string;
}

type Regra = (produto: Produto) => Peso;

const NADA: Peso = { pontos: 0 };

/* ---------------------------------------------------------------- leitura */

/** Texto achatado do rótulo: harmonização, notas, uva e descrição num só lugar. */
function perfilDe(produto: Produto): string {
  return normalizar(
    [...produto.harmonizacao, ...produto.notas, produto.uva ?? '', produto.descricao].join(' '),
  );
}

const perfis = new Map<string, string>();

function perfil(produto: Produto): string {
  let texto = perfis.get(produto.id);
  if (texto === undefined) {
    texto = perfilDe(produto);
    perfis.set(produto.id, texto);
  }
  return texto;
}

function fala(produto: Produto, ...termos: string[]): boolean {
  const texto = perfil(produto);
  return termos.some((termo) => texto.includes(normalizar(termo)));
}

/** "13,5%" vira 13.5. Sem teor declarado, ninguém chuta: devolve `undefined`. */
function teor(produto: Produto): number | undefined {
  if (!produto.teor) return undefined;
  const numero = Number(produto.teor.replace('%', '').replace(',', '.').trim());
  return Number.isFinite(numero) ? numero : undefined;
}

type Corpo = 'leve' | 'medio' | 'encorpado';

/**
 * Corpo aproximado do vinho, a partir de tipo e teor alcoólico — que é o que
 * o catálogo tem. Espumante e rosé são leves por natureza; no tinto, o álcool
 * é o melhor indicador disponível de peso na boca.
 */
function corpo(produto: Produto): Corpo {
  const alcool = teor(produto);

  switch (produto.tipo) {
    case 'Espumante':
    case 'Rosé':
      return 'leve';
    case 'Branco':
      return alcool !== undefined && alcool >= 13.5 ? 'medio' : 'leve';
    case 'Sobremesa':
      return 'encorpado';
    case 'Tinto':
      return alcool !== undefined && alcool >= 13.5 ? 'encorpado' : 'medio';
    default:
      return 'medio';
  }
}

const CLASSIFICACAO_DOCE = ['doce', 'suave', 'demi-sec', 'meio seco'];
const CLASSIFICACAO_MACIA = ['extra dry', 'demi-sec', 'doce', 'suave', 'moscatel'];

function classificacaoEm(produto: Produto, lista: string[]): boolean {
  if (!produto.classificacao) return false;
  const valor = normalizar(produto.classificacao);
  return lista.some((item) => valor.includes(normalizar(item)));
}

/* ------------------------------------------------------------- perguntas */

/** Termos de harmonização por prato, comparados contra o perfil do rótulo. */
const PRATOS: Record<string, string[]> = {
  carne: ['carne', 'costela', 'cordeiro', 'churrasco', 'hamburguer', 'porco', 'ragu'],
  massa: ['massa', 'pizza', 'sugo', 'ragu', 'risoto', 'antepasto'],
  mar: ['peixe', 'salmao', 'frutos do mar', 'ostras', 'ceviche', 'sushi', 'bacalhau'],
  leve: ['frango', 'salada', 'brunch', 'legumes'],
  petisco: ['queijo', 'petisco', 'aperitivo', 'frituras', 'antepasto', 'tabua'],
  sobremesa: ['sobremesa', 'chocolate', 'frutas', 'doce'],
};

const ROTULO_DO_PRATO: Record<string, string> = {
  carne: 'carne vermelha',
  massa: 'massa e pizza',
  mar: 'peixe e frutos do mar',
  leve: 'frango e saladas',
  petisco: 'queijos e petiscos',
  sobremesa: 'sobremesa',
};

/** Ponto por harmonização declarada no rótulo — a regra mais forte do simulador. */
function harmoniza(prato: string): Regra {
  const termos = PRATOS[prato] ?? [];
  return (produto) =>
    fala(produto, ...termos)
      ? { pontos: 5, motivo: `Harmoniza com ${ROTULO_DO_PRATO[prato]}` }
      : NADA;
}

function porTipo(tipos: Partial<Record<string, number>>, motivo: string): Regra {
  return (produto) => {
    const pontos = tipos[produto.tipo] ?? 0;
    return pontos > 0 ? { pontos, motivo } : { pontos };
  };
}

function porCorpo(desejado: Corpo, motivo: string): Regra {
  return (produto) => {
    if (corpo(produto) === desejado) return { pontos: 4, motivo };
    // Vizinho na escala ainda serve; o extremo oposto atrapalha.
    const distante =
      (desejado === 'leve' && corpo(produto) === 'encorpado') ||
      (desejado === 'encorpado' && corpo(produto) === 'leve');
    return { pontos: distante ? -3 : 1 };
  };
}

/**
 * Tetos de preço, em reais. Não pontuam: separam quem entra de quem fica no
 * fim da lista, porque orçamento estourado não se compensa com harmonização.
 */
const ORCAMENTOS: Record<string, (produto: Produto) => boolean> = {
  'ate-120': (produto) => produto.preco <= 120,
  '120-200': (produto) => produto.preco >= 120 && produto.preco <= 200,
  'acima-200': (produto) => produto.preco >= 200,
  'tanto-faz': () => true,
};

const REGRAS: Record<string, Record<string, Regra>> = {
  ocasiao: {
    jantar: porTipo({ Tinto: 3, Branco: 3, Rosé: 2, Espumante: 1 }, 'Boa pedida pra jantar'),
    comemoracao: porTipo({ Espumante: 5, Kit: 3, Rosé: 2 }, 'Feito pra brindar'),
    presente: (produto) => {
      if (produto.tipo === 'Kit') return { pontos: 5, motivo: 'Já vem pronto pra presentear' };
      if (produto.preco >= 200) return { pontos: 3, motivo: 'Rótulo de presentear' };
      return produto.destaque ? { pontos: 2, motivo: 'Escolhido a dedo pela casa' } : NADA;
    },
    encontro: porTipo({ Espumante: 4, Rosé: 4, Tinto: 2, Branco: 2 }, 'Combina com um a dois'),
    churrasco: (produto) =>
      produto.tipo === 'Tinto' && corpo(produto) === 'encorpado'
        ? { pontos: 5, motivo: 'Aguenta churrasco' }
        : fala(produto, 'carne', 'churrasco', 'costela')
          ? { pontos: 3, motivo: 'Aguenta churrasco' }
          : NADA,
    relaxar: (produto) =>
      produto.tipo === 'Kit'
        ? { pontos: -2 }
        : { pontos: 2, motivo: 'Bom pra abrir sem ocasião' },
  },

  mesa: {
    carne: harmoniza('carne'),
    massa: harmoniza('massa'),
    mar: harmoniza('mar'),
    leve: harmoniza('leve'),
    petisco: harmoniza('petisco'),
    sobremesa: (produto) =>
      produto.tipo === 'Sobremesa' || classificacaoEm(produto, CLASSIFICACAO_DOCE)
        ? { pontos: 5, motivo: 'Vinho de sobremesa' }
        : harmoniza('sobremesa')(produto),
    nada: () => NADA,
  },

  paladar: {
    leve: porCorpo('leve', 'Leve e refrescante, como você pediu'),
    equilibrado: porCorpo('medio', 'Meio-termo: nem leve, nem pesado'),
    encorpado: porCorpo('encorpado', 'Encorpado, como você pediu'),
    doce: (produto) => {
      if (classificacaoEm(produto, CLASSIFICACAO_DOCE)) {
        return { pontos: 6, motivo: 'Doce de verdade' };
      }
      if (classificacaoEm(produto, CLASSIFICACAO_MACIA)) {
        return { pontos: 3, motivo: 'Levemente adocicado' };
      }
      return { pontos: -3 };
    },
    'nao-sei': () => NADA,
  },

  experiencia: {
    iniciante: (produto) => {
      // Começar por um vinho fácil: menos tanino, mais fruta, nada austero.
      if (produto.tipo === 'Espumante' || classificacaoEm(produto, CLASSIFICACAO_MACIA)) {
        return { pontos: 4, motivo: 'Fácil de gostar de primeira' };
      }
      if (produto.tipo === 'Branco' || produto.tipo === 'Rosé') {
        return { pontos: 3, motivo: 'Fácil de gostar de primeira' };
      }
      return corpo(produto) === 'encorpado' ? { pontos: -2 } : { pontos: 1 };
    },
    curioso: (produto) =>
      produto.destaque ? { pontos: 2, motivo: 'Escolhido a dedo pela casa' } : { pontos: 1 },
    entendido: (produto) =>
      produto.potencialGuarda || produto.amadurecimento
        ? { pontos: 4, motivo: 'Tem o que analisar na taça' }
        : NADA,
  },
};

export const PERGUNTAS: Pergunta[] = [
  {
    id: 'ocasiao',
    titulo: 'Qual é a ocasião?',
    ajuda: 'É o que mais muda a indicação. Escolhe a que estiver mais perto.',
    opcoes: [
      { id: 'jantar', rotulo: 'Jantar em casa', ajuda: 'Comida à mesa, sem pressa' },
      { id: 'comemoracao', rotulo: 'Comemoração', ajuda: 'Tem brinde envolvido' },
      { id: 'presente', rotulo: 'Presente', ajuda: 'Não é pra mim' },
      { id: 'encontro', rotulo: 'Encontro a dois', ajuda: 'Uma garrafa, duas taças' },
      { id: 'churrasco', rotulo: 'Churrasco ou boteco', ajuda: 'Carne, amigos, barulho' },
      { id: 'relaxar', rotulo: 'Só relaxar', ajuda: 'Uma taça no fim do dia' },
    ],
  },
  {
    id: 'mesa',
    titulo: 'O que vai junto?',
    ajuda: 'Vinho e comida se puxam. Se não tiver comida, tudo bem também.',
    opcoes: [
      { id: 'carne', rotulo: 'Carne vermelha' },
      { id: 'massa', rotulo: 'Massa ou pizza' },
      { id: 'mar', rotulo: 'Peixe e frutos do mar' },
      { id: 'leve', rotulo: 'Frango ou salada' },
      { id: 'petisco', rotulo: 'Queijos e petiscos' },
      { id: 'sobremesa', rotulo: 'Sobremesa' },
      { id: 'nada', rotulo: 'Nada, só o vinho' },
    ],
  },
  {
    id: 'paladar',
    titulo: 'Como você gosta de beber?',
    ajuda: 'Vale o que você costuma gostar, não o que parece mais chique.',
    opcoes: [
      { id: 'leve', rotulo: 'Leve e refrescante', ajuda: 'Desce fácil, gelado' },
      { id: 'equilibrado', rotulo: 'No meio-termo', ajuda: 'Nem leve, nem pesado' },
      { id: 'encorpado', rotulo: 'Encorpado e marcante', ajuda: 'Presença na boca' },
      { id: 'doce', rotulo: 'Adocicado', ajuda: 'Nada de seco demais' },
      { id: 'nao-sei', rotulo: 'Não faço ideia', ajuda: 'Tudo bem, pula essa' },
    ],
  },
  {
    id: 'experiencia',
    titulo: 'Você entende de vinho?',
    ajuda: 'Sem julgamento. Serve só pra calibrar a indicação.',
    opcoes: [
      { id: 'iniciante', rotulo: 'Quase nada', ajuda: 'Quero algo fácil' },
      { id: 'curioso', rotulo: 'Bebo às vezes', ajuda: 'Sei o que gosto' },
      { id: 'entendido', rotulo: 'Manjo bem', ajuda: 'Quero algo pra analisar' },
    ],
  },
  {
    id: 'orcamento',
    titulo: 'Quanto quer gastar?',
    ajuda: 'Por garrafa. A gente respeita o teto.',
    opcoes: [
      { id: 'ate-120', rotulo: 'Até R$ 120' },
      { id: '120-200', rotulo: 'R$ 120 a R$ 200' },
      { id: 'acima-200', rotulo: 'Acima de R$ 200' },
      { id: 'tanto-faz', rotulo: 'Tanto faz', ajuda: 'Mostra tudo' },
    ],
  },
];

export const TOTAL_DE_PERGUNTAS = PERGUNTAS.length;

export function respondidas(respostas: Respostas): number {
  return PERGUNTAS.filter((pergunta) => respostas[pergunta.id]).length;
}

export function rotuloDaResposta(perguntaId: string, opcaoId: string): string | undefined {
  return PERGUNTAS.find((pergunta) => pergunta.id === perguntaId)?.opcoes.find(
    (opcao) => opcao.id === opcaoId,
  )?.rotulo;
}

/**
 * Ordena o catálogo pelas respostas.
 *
 * Sem resposta nenhuma, devolve a vitrine na ordem de sempre — a página abre
 * mostrando a adega inteira, e não uma tela vazia esperando o formulário.
 *
 * Esgotado nunca aparece na frente: indicar o que não dá pra comprar seria
 * pior do que indicar o segundo melhor.
 */
export function sugerir(produtos: Produto[], respostas: Respostas): Sugestao[] {
  const teto = respostas.orcamento ? ORCAMENTOS[respostas.orcamento] : undefined;

  return produtos
    .map((produto) => {
      let pontos = 0;
      const motivos: string[] = [];

      for (const [perguntaId, opcaoId] of Object.entries(respostas)) {
        if (!opcaoId) continue;

        const regra = REGRAS[perguntaId]?.[opcaoId];
        if (!regra) continue;

        const peso = regra(produto);
        pontos += peso.pontos;
        if (peso.motivo && peso.pontos > 0 && !motivos.includes(peso.motivo)) {
          motivos.push(peso.motivo);
        }
      }

      return { produto, pontos, motivos, dentroDoOrcamento: teto ? teto(produto) : true };
    })
    .sort(
      (a, b) =>
        Number(b.produto.disponivel) - Number(a.produto.disponivel) ||
        Number(b.dentroDoOrcamento) - Number(a.dentroDoOrcamento) ||
        b.pontos - a.pontos ||
        Number(b.produto.destaque) - Number(a.produto.destaque) ||
        a.produto.nome.localeCompare(b.produto.nome, 'pt-BR'),
    );
}
