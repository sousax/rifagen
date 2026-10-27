// Módulo de domínio puro: sem DOM, sem Supabase. Testado com `node --test`.

// Números 1..total com o estado de cada um. Livre = número sem linha em `numeros`.
export function grade(total, numeros) {
  const estado = new Map(numeros.map(n => [n.numero, n.estado]));
  return Array.from({ length: total }, (_, i) => ({ numero: i + 1, estado: estado.get(i + 1) ?? 'livre' }));
}

// Painel: arrecadado = pagos × preço, a receber = reservados × preço.
export function totais(numeros, preco) {
  const conta = estado => numeros.filter(n => n.estado === estado).length;
  return { arrecadado: conta('pago') * preco, receber: conta('reservado') * preco };
}

// Telefone guardado só com dígitos e 55 (formato do wa.me). '' = inválido (falta DDD + número).
// DDD + número tem 10 ou 11 dígitos; com o 55 na frente, 12 ou 13.
export function normalizarTelefone(texto) {
  const d = texto.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) return '55' + d;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  return '';
}

// rifa-AAAA-MM-DD.json com a data local (toISOString seria UTC e viraria o dia à noite no Brasil).
export function nomeBackup(data) {
  const p = n => String(n).padStart(2, '0');
  return `rifa-${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}.json`;
}

// Mensagem de erro da configuração, ou null se ela pode ser salva.
export function validarConfiguracao({ total, preco }, numeros) {
  if (!Number.isInteger(total) || total <= 0) return 'O total deve ser um número inteiro maior que zero.';
  if (!(preco > 0)) return 'O preço deve ser maior que zero.';
  const maior = numeros.reduce((m, n) => Math.max(m, n.numero), 0);
  if (total < maior) return `O total não pode ser menor que ${maior}, o maior número em uso.`;
  return null;
}
