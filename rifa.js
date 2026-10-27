// Módulo de domínio puro: sem DOM, sem Supabase. Testado com `node --test`.

// Números 1..total com o estado de cada um. Livre = número sem linha em `numeros`.
export function grade(total, numeros) {
  const estado = new Map(numeros.map(n => [n.numero, n.estado]));
  return Array.from({ length: total }, (_, i) => ({ numero: i + 1, estado: estado.get(i + 1) ?? 'livre' }));
}

// Mensagem de erro da configuração, ou null se ela pode ser salva.
export function validarConfiguracao({ total, preco }, numeros) {
  if (!Number.isInteger(total) || total <= 0) return 'O total deve ser um número inteiro maior que zero.';
  if (!(preco > 0)) return 'O preço deve ser maior que zero.';
  const maior = numeros.reduce((m, n) => Math.max(m, n.numero), 0);
  if (total < maior) return `O total não pode ser menor que ${maior}, o maior número em uso.`;
  return null;
}
