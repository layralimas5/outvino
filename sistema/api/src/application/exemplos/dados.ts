import type { CriarProdutoInput } from '../../domain/produtos/Produto.js';

/**
 * Dados de exemplo do sistema.
 *
 * Os vinhos são fictícios: vinícola, safra e nota de degustação foram escritos
 * como amostra, e as avaliações também. Servem pra loja e painel não subirem
 * vazios numa demonstração. Quando o catálogo real do cliente chegar, apagar
 * tudo e cadastrar pelo painel.
 */
export const PRODUTOS: CriarProdutoInput[] = [
  {
    nome: 'Malbec Reserva Alta Cumbre',
    tipo: 'Tinto',
    pais: 'Argentina',
    regiao: 'Valle de Uco, Mendoza',
    uva: 'Malbec',
    vinicola: 'Bodega Alta Cumbre',
    safra: 2021,
    volumeMl: 750,
    teor: '14%',
    classificacao: 'Seco',
    amadurecimento: '12 meses em barricas de carvalho francês',
    temperaturaServico: '16 °C',
    potencialGuarda: '8 anos',
    visual: 'Rubi profundo com reflexos violáceos',
    olfativo: 'Ameixa preta madura, baunilha, violeta e um fundo de especiaria doce',
    gustativo: 'Encorpado e macio, taninos redondos, acidez equilibrada e final longo de fruta preta',
    preco: 189.9,
    precoDe: 229.9,
    custo: 104,
    descricao:
      'Doze meses em carvalho francês numa altitude que segura a acidez. Encorpado, mas sem peso: taninos redondos e um final longo de fruta preta.',
    notas: ['Ameixa preta', 'Baunilha', 'Violeta'],
    harmonizacao: ['Carne vermelha', 'Cordeiro', 'Queijo curado'],
    destaque: true,
    publicadoNoSite: true,
    estoque: 18,
    estoqueMinimo: 6,
  },
  {
    nome: 'Cabernet Sauvignon Piedra Negra',
    tipo: 'Tinto',
    pais: 'Chile',
    regiao: 'Valle del Maipo',
    uva: 'Cabernet Sauvignon',
    vinicola: 'Viña Piedra Negra',
    safra: 2020,
    volumeMl: 750,
    teor: '13,5%',
    classificacao: 'Seco',
    amadurecimento: '10 meses em carvalho americano',
    temperaturaServico: '17 °C',
    potencialGuarda: '6 anos',
    visual: 'Vermelho rubi intenso, quase opaco',
    olfativo: 'Cassis, pimentão maduro, eucalipto e chocolate amargo',
    gustativo: 'Estrutura firme, taninos marcados, corpo médio para encorpado e final persistente',
    preco: 149.9,
    custo: 82,
    descricao:
      'O clássico do Maipo: cassis, pimentão maduro e um toque de eucalipto. Estrutura firme que pede comida na mesa.',
    notas: ['Cassis', 'Eucalipto', 'Chocolate amargo'],
    harmonizacao: ['Costela', 'Massa ao ragu', 'Hambúrguer artesanal'],
    destaque: true,
    publicadoNoSite: true,
    estoque: 24,
    estoqueMinimo: 6,
  },
  {
    nome: 'Chianti Classico Poggio Antico',
    tipo: 'Tinto',
    pais: 'Itália',
    regiao: 'Toscana',
    uva: 'Sangiovese',
    vinicola: 'Tenuta Poggio Antico',
    safra: 2019,
    volumeMl: 750,
    teor: '13,5%',
    classificacao: 'Seco',
    amadurecimento: '12 meses em tonéis de carvalho esloveno',
    temperaturaServico: '16 °C',
    potencialGuarda: '7 anos',
    visual: 'Rubi de intensidade média com borda granada',
    olfativo: 'Cereja ácida, terra molhada, ervas secas e couro',
    gustativo: 'Acidez alta e viva, taninos firmes, corpo médio e final salgado que pede comida',
    preco: 219.9,
    custo: 128,
    descricao:
      'Sangiovese de manual: cereja ácida, ervas secas e aquela acidez que limpa a boca entre uma garfada e outra.',
    notas: ['Cereja', 'Tomate seco', 'Alecrim'],
    harmonizacao: ['Massa ao sugo', 'Pizza', 'Antepastos'],
    destaque: false,
    publicadoNoSite: true,
    estoque: 9,
    estoqueMinimo: 4,
  },
  {
    nome: 'Douro Tinto Quinta do Vale',
    tipo: 'Tinto',
    pais: 'Portugal',
    regiao: 'Douro',
    uva: 'Touriga Nacional',
    vinicola: 'Quinta do Vale Escuro',
    safra: 2020,
    volumeMl: 750,
    teor: '14%',
    classificacao: 'Seco',
    amadurecimento: '9 meses em barricas usadas de carvalho francês',
    temperaturaServico: '16 °C',
    potencialGuarda: '6 anos',
    visual: 'Rubi escuro com centro concentrado',
    olfativo: 'Amora, esteva, grafite e um toque mineral do xisto',
    gustativo: 'Encorpado, taninos de textura fina, boa acidez e final quente',
    preco: 179.9,
    custo: 96,
    descricao:
      'Touriga Nacional em terraço de xisto. Floral no nariz, denso na boca, com mineralidade que segura o conjunto.',
    notas: ['Amora', 'Violeta', 'Grafite'],
    harmonizacao: ['Bacalhau assado', 'Carne de porco', 'Queijo da serra'],
    destaque: false,
    publicadoNoSite: true,
    estoque: 12,
    estoqueMinimo: 4,
  },
  {
    nome: 'Pinot Noir Costa Fria',
    tipo: 'Tinto',
    pais: 'Chile',
    regiao: 'Valle de Casablanca',
    uva: 'Pinot Noir',
    vinicola: 'Viña Costa Fria',
    safra: 2022,
    volumeMl: 750,
    teor: '13%',
    classificacao: 'Seco',
    amadurecimento: '8 meses em carvalho francês de segundo uso',
    temperaturaServico: '14 °C',
    potencialGuarda: '4 anos',
    visual: 'Rubi claro e brilhante, pouca densidade',
    olfativo: 'Framboesa, cereja fresca, cogumelo e leve defumado',
    gustativo: 'Leve e sedoso, taninos delicados, acidez refrescante e final elegante',
    preco: 164.9,
    custo: 91,
    descricao:
      'Leve, translúcido, de fruta vermelha fresca. Tinto pra quem acha tinto pesado, serve levemente gelado.',
    notas: ['Framboesa', 'Rosa', 'Terra molhada'],
    harmonizacao: ['Salmão', 'Cogumelos', 'Risoto'],
    destaque: true,
    publicadoNoSite: true,
    estoque: 3,
    estoqueMinimo: 4,
  },
  {
    nome: 'Sauvignon Blanc Bahía Clara',
    tipo: 'Branco',
    pais: 'Chile',
    regiao: 'Valle de Leyda',
    uva: 'Sauvignon Blanc',
    vinicola: 'Viña Bahía Clara',
    safra: 2023,
    volumeMl: 750,
    teor: '12,5%',
    classificacao: 'Seco',
    amadurecimento: 'Sem passagem por madeira',
    temperaturaServico: '9 °C',
    potencialGuarda: '2 anos',
    visual: 'Amarelo palha com reflexos esverdeados',
    olfativo: 'Maracujá, limão siciliano, capim-limão e um fundo herbáceo',
    gustativo: 'Acidez cortante, corpo leve, muito refrescante e final cítrico',
    preco: 119.9,
    custo: 62,
    descricao:
      'Vinhedo a poucos quilômetros do mar. Acidez cortante, cítrico e herbáceo, com um fundo salino que dá vontade de repetir a taça.',
    notas: ['Limão siciliano', 'Maracujá', 'Capim-limão'],
    harmonizacao: ['Ostras', 'Ceviche', 'Salada de folhas'],
    destaque: true,
    publicadoNoSite: true,
    estoque: 20,
    estoqueMinimo: 6,
  },
  {
    nome: 'Chardonnay Barrica Monte Sereno',
    tipo: 'Branco',
    pais: 'Argentina',
    regiao: 'Mendoza',
    uva: 'Chardonnay',
    vinicola: 'Bodega Monte Sereno',
    safra: 2022,
    volumeMl: 750,
    teor: '13,5%',
    classificacao: 'Seco',
    amadurecimento: '6 meses em barricas de carvalho francês, com bâtonnage',
    temperaturaServico: '11 °C',
    potencialGuarda: '4 anos',
    visual: 'Amarelo dourado de boa intensidade',
    olfativo: 'Pêssego em calda, manteiga, avelã tostada e baunilha',
    gustativo: 'Untuoso e cremoso, corpo médio para encorpado, acidez presente e final tostado',
    preco: 154.9,
    custo: 84,
    descricao:
      'Seis meses em barrica, sem exagero na madeira. Textura cremosa, fruta amarela madura e final amanteigado.',
    notas: ['Pêssego', 'Manteiga', 'Amêndoa'],
    harmonizacao: ['Frango assado', 'Massa com creme', 'Queijo brie'],
    destaque: false,
    publicadoNoSite: true,
    estoque: 14,
    estoqueMinimo: 4,
  },
  {
    nome: 'Vinho Verde Alvarinho da Foz',
    tipo: 'Branco',
    pais: 'Portugal',
    regiao: 'Minho',
    uva: 'Alvarinho',
    vinicola: 'Adega da Foz',
    safra: 2023,
    volumeMl: 750,
    teor: '12%',
    classificacao: 'Seco',
    amadurecimento: 'Sem passagem por madeira',
    temperaturaServico: '8 °C',
    potencialGuarda: '3 anos',
    visual: 'Amarelo citrino pálido com leve agulha',
    olfativo: 'Pêssego branco, flor de laranjeira e casca de limão',
    gustativo: 'Seco e vibrante, acidez alta, corpo leve e final salino',
    preco: 129.9,
    custo: 68,
    descricao:
      'Levemente pétillant, seco e muito fresco. O branco de dia quente, servido bem gelado.',
    notas: ['Lima', 'Pera', 'Flor branca'],
    harmonizacao: ['Frutos do mar', 'Petiscos fritos', 'Sushi'],
    destaque: false,
    publicadoNoSite: true,
    estoque: 16,
    estoqueMinimo: 6,
  },
  {
    nome: 'Rosé Provençal Petit Jardin',
    tipo: 'Rosé',
    pais: 'França',
    regiao: 'Provence',
    uva: 'Grenache, Cinsault',
    vinicola: 'Domaine Petit Jardin',
    safra: 2023,
    volumeMl: 750,
    teor: '12,5%',
    classificacao: 'Seco',
    amadurecimento: 'Sem passagem por madeira',
    temperaturaServico: '10 °C',
    potencialGuarda: '2 anos',
    visual: 'Rosa pálido casca de cebola, muito límpido',
    olfativo: 'Morango branco, pêssego, tangerina e um toque floral',
    gustativo: 'Seco e delicado, acidez fresca, corpo leve e final limpo',
    preco: 174.9,
    precoDe: 199.9,
    custo: 98,
    descricao:
      'Cor pálida de casca de cebola, o rosé seco que virou padrão de verão. Delicado, cítrico e mineral.',
    notas: ['Morango branco', 'Toranja', 'Erva-doce'],
    harmonizacao: ['Salada niçoise', 'Peixe grelhado', 'Queijo de cabra'],
    destaque: true,
    publicadoNoSite: true,
    estoque: 11,
    estoqueMinimo: 4,
  },
  {
    nome: 'Espumante Brut Serra Alta',
    tipo: 'Espumante',
    pais: 'Brasil',
    regiao: 'Serra Gaúcha',
    uva: 'Chardonnay, Pinot Noir',
    vinicola: 'Vinícola Serra Alta',
    safra: 2022,
    volumeMl: 750,
    teor: '12%',
    classificacao: 'Brut',
    amadurecimento: '18 meses sobre borras finas',
    temperaturaServico: '7 °C',
    potencialGuarda: '3 anos',
    visual: 'Amarelo palha com perlage fina e persistente',
    olfativo: 'Maçã verde, pão tostado, castanha e crosta de pão',
    gustativo: 'Seco e cremoso, acidez firme, borbulha delicada e final tostado',
    preco: 98.9,
    custo: 48,
    descricao:
      'Método tradicional, doze meses sobre borras. Perlage fino, maçã verde e pão tostado. Brasileiro que não deve nada pra importado nessa faixa.',
    notas: ['Maçã verde', 'Pão tostado', 'Limão'],
    harmonizacao: ['Aperitivo', 'Frituras', 'Queijos leves'],
    destaque: true,
    publicadoNoSite: true,
    estoque: 30,
    estoqueMinimo: 8,
  },
  {
    nome: 'Prosecco Extra Dry Ca’ Bianca',
    tipo: 'Espumante',
    pais: 'Itália',
    regiao: 'Veneto',
    uva: 'Glera',
    vinicola: 'Ca’ Bianca',
    volumeMl: 750,
    teor: '11%',
    classificacao: 'Extra Dry',
    amadurecimento: 'Método Charmat, 60 dias em autoclave',
    temperaturaServico: '7 °C',
    potencialGuarda: '2 anos',
    visual: 'Amarelo palha claro com borbulha fina',
    olfativo: 'Pera, maçã verde, flor de acácia e casca de cítrico',
    gustativo: 'Levemente adocicado, leve e frutado, acidez refrescante e final curto e limpo',
    preco: 139.9,
    custo: 76,
    descricao:
      'Frutado e levemente açucarado, do jeito que Prosecco tem que ser. Bolha generosa, entra fácil.',
    notas: ['Pera', 'Flor de acácia', 'Maçã'],
    harmonizacao: ['Brunch', 'Frutas', 'Sobremesas leves'],
    destaque: false,
    publicadoNoSite: true,
    estoque: 22,
    estoqueMinimo: 6,
  },
  {
    nome: 'Porto Tawny 10 anos Casa Velha',
    tipo: 'Sobremesa',
    pais: 'Portugal',
    regiao: 'Douro',
    uva: 'Blend tradicional',
    vinicola: 'Casa Velha',
    volumeMl: 750,
    teor: '20%',
    classificacao: 'Doce',
    amadurecimento: '10 anos em cascos de carvalho',
    temperaturaServico: '14 °C',
    potencialGuarda: '10 anos depois de aberto, na geladeira',
    visual: 'Âmbar acastanhado com borda alaranjada',
    olfativo: 'Nozes, figo seco, caramelo, laranja cristalizada e canela',
    gustativo: 'Doce e untuoso, álcool integrado, acidez que segura o açúcar e final muito longo',
    preco: 289.9,
    custo: 168,
    descricao:
      'Dez anos de média em cascos. Cor de âmbar, nozes, caramelo e um final que não acaba. Uma taça pequena resolve a noite.',
    notas: ['Nozes', 'Caramelo', 'Figo seco'],
    harmonizacao: ['Chocolate meio amargo', 'Queijo azul', 'Sobremesas'],
    destaque: false,
    publicadoNoSite: true,
    estoque: 6,
    estoqueMinimo: 3,
  },
  {
    nome: 'Kit Descoberta: 3 tintos do Novo Mundo',
    tipo: 'Kit',
    pais: 'Argentina',
    uva: 'Malbec, Cabernet, Pinot Noir',
    volumeMl: 2250,
    preco: 429.9,
    precoDe: 504.7,
    custo: 268,
    descricao:
      'Três garrafas pra comparar estilos numa noite só: um Malbec encorpado, um Cabernet estruturado e um Pinot Noir leve. Vai com uma ficha de degustação impressa.',
    notas: [],
    harmonizacao: ['Jantar entre amigos', 'Presente'],
    destaque: true,
    publicadoNoSite: true,
    estoque: 8,
    estoqueMinimo: 3,
  },
  {
    nome: 'Kit Espumante + taças',
    tipo: 'Kit',
    pais: 'Brasil',
    volumeMl: 750,
    preco: 219.9,
    custo: 124,
    descricao:
      'Um Brut da Serra Gaúcha com duas taças de cristal, na caixa de presente. Pronto pra entregar.',
    notas: [],
    harmonizacao: ['Presente', 'Comemoração'],
    destaque: false,
    publicadoNoSite: true,
    estoque: 5,
    estoqueMinimo: 2,
  },
];

export const BANNERS = [
  {
    eyebrow: 'Seleção da semana',
    titulo: 'Vinho bom não precisa de ocasião',
    subtitulo:
      'Curadoria de rótulos de 6 países, escolhidos garrafa por garrafa. Escolhe no site, fecha no WhatsApp.',
    ctaTexto: 'Ver a seleção',
    ctaLink: '/vinhos/',
    ordem: 0,
    ativo: true,
  },
  {
    eyebrow: 'Promoção',
    titulo: 'Malbec Reserva com 17% off',
    subtitulo: 'Alta Cumbre 2021, do Valle de Uco. Enquanto durar o lote.',
    ctaTexto: 'Quero esse',
    ctaLink: '/vinhos/malbec-reserva-alta-cumbre/',
    ordem: 1,
    ativo: true,
  },
];

export const SECOES = [
  {
    titulo: 'Escolhidos a dedo',
    subtitulo: 'O que a gente serviria numa mesa própria.',
    criterio: 'destaques' as const,
    limite: 8,
    ordem: 0,
    ativo: true,
  },
  {
    titulo: 'Em promoção',
    subtitulo: 'Preço menor enquanto o lote durar.',
    criterio: 'promocoes' as const,
    limite: 6,
    ordem: 1,
    ativo: true,
  },
  {
    titulo: 'Brancos e rosés pra dia quente',
    criterio: 'tipo' as const,
    valor: 'Branco',
    limite: 6,
    ordem: 2,
    ativo: true,
  },
];

/**
 * Avaliações de amostra, pro bloco da página de produto não subir vazio.
 *
 * São fictícias, como o resto do seed — e é por isso que ele existe: pra
 * apagar quando o catálogo real entrar. No sistema em produção, avaliação só
 * nasce de cliente escrevendo na página e a loja publicando no painel.
 */
export const AVALIACOES: Array<{
  produtoId: string;
  autor: string;
  nota: number;
  titulo?: string;
  comentario: string;
  resposta?: string;
}> = [
  {
    produtoId: 'malbec-reserva-alta-cumbre',
    autor: 'Camila Rocha',
    nota: 5,
    titulo: 'Virou o vinho da casa',
    comentario:
      'Abri num jantar de sexta com costela e sumiu. Bem macio, nada agressivo, e a fruta aparece sem ser doce. Já pedi de novo.',
    resposta: 'Que bom, Camila! Esse lote de 2021 ficou redondo mesmo. Qualquer coisa chama a gente.',
  },
  {
    produtoId: 'malbec-reserva-alta-cumbre',
    autor: 'Rodrigo Alves',
    nota: 4,
    comentario:
      'Muito bom pelo preço. Achei que precisou de uns 20 minutos aberto pra soltar, depois disso ficou ótimo.',
  },
  {
    produtoId: 'malbec-reserva-alta-cumbre',
    autor: 'Fernanda Lopes',
    nota: 5,
    titulo: 'Presente certeiro',
    comentario: 'Levei de presente pro meu pai e ele adorou. A embalagem veio impecável.',
  },
  {
    produtoId: 'espumante-brut-serra-alta',
    autor: 'Juliana Prado',
    nota: 5,
    titulo: 'Melhor brut nacional que provei',
    comentario:
      'Borbulha fina, bem seco, aquele gostinho de pão tostado. Serviu de aperitivo e ninguém acreditou no preço.',
  },
  {
    produtoId: 'espumante-brut-serra-alta',
    autor: 'Marcelo Dias',
    nota: 4,
    comentario: 'Cumpre o que promete. Gelado na medida certa fica excelente.',
  },
  {
    produtoId: 'sauvignon-blanc-bahia-clara',
    autor: 'Patrícia Nunes',
    nota: 4,
    titulo: 'Refrescante de verdade',
    comentario:
      'Bebi num almoço de domingo com peixe grelhado. Bem cítrico e leve, desce fácil demais no calor.',
  },
  {
    produtoId: 'cabernet-sauvignon-piedra-negra',
    autor: 'André Camargo',
    nota: 5,
    comentario:
      'Estrutura firme, do jeito que eu gosto. Pede comida junto, sozinho fica um pouco fechado.',
  },
  {
    produtoId: 'cabernet-sauvignon-piedra-negra',
    autor: 'Letícia Barros',
    nota: 3,
    titulo: 'Bom, mas esperava mais',
    comentario:
      'Não é ruim, só achei um pouco duro pro meu gosto. Quem gosta de tinto mais leve talvez não curta.',
    resposta:
      'Obrigado pela sinceridade, Letícia. Pro seu gosto o Pinot Noir Costa Fria cai bem melhor — chama a gente que a gente te ajuda a escolher.',
  },
  {
    produtoId: 'rose-provencal-petit-jardin',
    autor: 'Bruno Teixeira',
    nota: 5,
    titulo: 'Rosé sério',
    comentario:
      'Seco de verdade, nada daquele rosé açucarado. Cor linda na taça e ótimo com comida leve.',
  },
];
/**
 * Pedidos de amostra, pra Pedidos, CRM, Clientes e Financeiro não abrirem
 * vazios numa demonstração.
 *
 * São inventados como o resto daqui. Nascem com a data de hoje: o sistema grava
 * `criadoEm` no momento da criação, e forjar data passada seria mentir no
 * histórico só pra deixar o gráfico mais bonito.
 */
export interface PedidoDeExemplo {
  cliente: { nome: string; telefone: string; email?: string };
  itens: Array<{ produtoId: string; quantidade: number }>;
  tipoEntrega: 'retirada' | 'entrega';
  endereco?: {
    cep?: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  cupomCodigo?: string;
  observacao?: string;
  /** Falso deixa em rascunho, como chega do site. */
  confirmar: boolean;
  /** Pra onde levar depois de confirmado (separando, enviado, entregue). */
  statusFinal?: 'separando' | 'enviado' | 'entregue';
}

export const PEDIDOS: PedidoDeExemplo[] = [
  {
    cliente: { nome: 'Carla Menezes', telefone: '27998877665', email: 'carla@exemplo.com' },
    itens: [
      { produtoId: 'malbec-reserva-alta-cumbre', quantidade: 2 },
      { produtoId: 'espumante-brut-serra-alta', quantidade: 1 },
    ],
    tipoEntrega: 'retirada',
    observacao: 'Chegou pelo site, ainda não confirmado.',
    confirmar: false,
  },
  {
    cliente: { nome: 'Rafael Antunes', telefone: '27991234500', email: 'rafael@exemplo.com' },
    itens: [{ produtoId: 'kit-descoberta-3-tintos-do-novo-mundo', quantidade: 1 }],
    tipoEntrega: 'entrega',
    endereco: {
      cep: '29055-000',
      logradouro: 'Rua Aleixo Netto',
      numero: '340',
      complemento: 'apto 902',
      bairro: 'Praia do Canto',
      cidade: 'Vitória',
      uf: 'ES',
    },
    confirmar: true,
  },
  {
    cliente: { nome: 'Juliana Prado', telefone: '27992223344', email: 'juliana@exemplo.com' },
    itens: [
      { produtoId: 'sauvignon-blanc-bahia-clara', quantidade: 3 },
      { produtoId: 'rose-provencal-petit-jardin', quantidade: 1 },
    ],
    tipoEntrega: 'entrega',
    endereco: {
      cep: '29102-000',
      logradouro: 'Avenida Central',
      numero: '1180',
      bairro: 'Itaparica',
      cidade: 'Vila Velha',
      uf: 'ES',
    },
    cupomCodigo: 'PRIMEIRACOMPRA',
    confirmar: true,
    statusFinal: 'enviado',
  },
  {
    cliente: { nome: 'Marcos Vieira', telefone: '27993334455' },
    itens: [{ produtoId: 'cabernet-sauvignon-piedra-negra', quantidade: 1 }],
    tipoEntrega: 'retirada',
    confirmar: true,
    statusFinal: 'entregue',
  },
  {
    /** Mesmo telefone do pedido acima: é assim que nasce um recorrente no CRM. */
    cliente: { nome: 'Marcos Vieira', telefone: '27993334455' },
    itens: [
      { produtoId: 'porto-tawny-10-anos-casa-velha', quantidade: 1 },
      { produtoId: 'chianti-classico-poggio-antico', quantidade: 2 },
    ],
    tipoEntrega: 'retirada',
    observacao: 'Cliente da casa, leva sempre tinto italiano.',
    confirmar: true,
    statusFinal: 'entregue',
  },
];
