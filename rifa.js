// Módulo de domínio puro: sem DOM, sem Supabase. Testado com `node --test`.

// Números 1..total com o estado de cada um. Livre = número sem linha em `numeros`.
export function grade(total, numeros) {
  const estado = new Map(numeros.map(n => [n.numero, n.estado]));
  return Array.from({ length: total }, (_, i) => ({ numero: i + 1, estado: estado.get(i + 1) ?? 'livre' }));
}
