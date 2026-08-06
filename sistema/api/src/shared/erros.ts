/**
 * Erros de aplicação carregam o status HTTP com eles, então o handler de erro
 * do Express traduz sem precisar de if em cadeia. Qualquer erro que NÃO seja
 * um desses é bug: vira 500 e vai pro log com stack.
 */
export class ErroDeAplicacao extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
    readonly detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = new.target.name;
  }
}

export class NaoEncontrado extends ErroDeAplicacao {
  constructor(recurso: string, id?: string) {
    super(404, 'nao_encontrado', id ? `${recurso} ${id} não encontrado.` : `${recurso} não encontrado.`);
  }
}

export class DadoInvalido extends ErroDeAplicacao {
  constructor(mensagem: string, detalhes?: unknown) {
    super(422, 'dado_invalido', mensagem, detalhes);
  }
}

export class Conflito extends ErroDeAplicacao {
  constructor(mensagem: string) {
    super(409, 'conflito', mensagem);
  }
}

/** Operação recusada por regra do negócio (estoque insuficiente, status inválido...). */
export class RegraDeNegocio extends ErroDeAplicacao {
  constructor(mensagem: string) {
    super(409, 'regra_de_negocio', mensagem);
  }
}

export class NaoAutenticado extends ErroDeAplicacao {
  constructor(mensagem = 'Sessão inválida ou expirada.') {
    super(401, 'nao_autenticado', mensagem);
  }
}

export class SemPermissao extends ErroDeAplicacao {
  constructor(mensagem = 'Você não tem permissão para essa ação.') {
    super(403, 'sem_permissao', mensagem);
  }
}

/** Excesso de tentativa de login. 429 pra o front saber que é espera, não erro de senha. */
export class MuitasTentativas extends ErroDeAplicacao {
  constructor(mensagem: string) {
    super(429, 'muitas_tentativas', mensagem);
  }
}

/**
 * O serviço está de pé, mas falta configuração pra ele operar com segurança.
 * 503 e não 403: não é o usuário que não pode, é o servidor que não deveria.
 */
export class ConfiguracaoPendente extends ErroDeAplicacao {
  constructor(mensagem: string) {
    super(503, 'configuracao_pendente', mensagem);
  }
}
