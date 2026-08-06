/** Só dígitos, pro telefone virar link de WhatsApp sem tratamento extra. */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/**
 * Telefone brasileiro normalizado com DDI. Guardar sempre no mesmo formato
 * evita cliente duplicado por causa de "(24) 99999-8888" vs "24999998888".
 */
export function normalizarTelefone(valor: string): string {
  const digitos = somenteDigitos(valor);
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return digitos;
}

/** Comparação de busca sem acento e sem caixa. */
export function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function contem(alvo: string | undefined, termo: string): boolean {
  if (!alvo) return false;
  return normalizarBusca(alvo).includes(normalizarBusca(termo));
}

/** Valida o dígito verificador de CPF e CNPJ. Aceita vazio (campo opcional). */
export function documentoValido(valor: string): boolean {
  const digitos = somenteDigitos(valor);
  if (digitos.length === 11) return cpfValido(digitos);
  if (digitos.length === 14) return cnpjValido(digitos);
  return false;
}

function cpfValido(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  for (const [tamanho, posicao] of [
    [9, 9],
    [10, 10],
  ] as const) {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(cpf[posicao])) return false;
  }
  return true;
}

function cnpjValido(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (const posicao of [12, 13] as const) {
    const usados = pesos.slice(pesos.length - posicao);
    let soma = 0;
    for (let i = 0; i < posicao; i += 1) soma += Number(cnpj[i]) * Number(usados[i]);
    const resto = soma % 11;
    if ((resto < 2 ? 0 : 11 - resto) !== Number(cnpj[posicao])) return false;
  }
  return true;
}
