const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** A API entrega reais; centavos ficam do lado de lá. */
export function moeda(reais: number): string {
  return brl.format(reais);
}

export function moedaDeCentavos(centavos: number): string {
  return brl.format(centavos / 100);
}

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

export function quando(iso: string): string {
  return dataHora.format(new Date(iso));
}

export function diaCurto(iso: string): string {
  return dataCurta.format(new Date(`${iso}T12:00:00`));
}

/** "5527998541983" vira "(27) 99854-1983". */
export function telefone(valor: string): string {
  const nacional = valor.startsWith('55') ? valor.slice(2) : valor;
  if (nacional.length === 11) {
    return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 7)}-${nacional.slice(7)}`;
  }
  if (nacional.length === 10) {
    return `(${nacional.slice(0, 2)}) ${nacional.slice(2, 6)}-${nacional.slice(6)}`;
  }
  return valor;
}

export function linkWhatsapp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
