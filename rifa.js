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

// Posições (1 = 1º prêmio) ainda sem ganhador, na ordem do sorteio: do último ao 1º.
// Sorteio interrompido continua do primeiro item desta lista.
export function premiosPendentes(premios, ganhadores) {
  const feitos = new Set(ganhadores.map(g => g.posicao));
  return premios.map((_, i) => i + 1).filter(p => !feitos.has(p)).reverse();
}

// Números que concorrem: pagos que ainda não ganharam (um número ganha no máximo um prêmio).
export function concorrentes(numeros, ganhadores) {
  const premiados = new Set(ganhadores.map(g => g.numero));
  return numeros.filter(n => n.estado === 'pago' && !premiados.has(n.numero)).map(n => n.numero).sort((a, b) => a - b);
}

// O sorteio pode acontecer: há prêmio pendente e um concorrente diferente para cada um deles.
// Checado antes do 1º prêmio também: com menos pagos que prêmios, nenhum é sorteado.
export function podeSortear(premios, numeros, ganhadores) {
  const pendentes = premiosPendentes(premios, ganhadores).length;
  return pendentes > 0 && concorrentes(numeros, ganhadores).length >= pendentes;
}

// Índice uniforme em 0..n-1. ponytail: módulo de um uint32 tem viés < n/2³², desprezível para uma rifa.
const aleatorioCripto = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;

// Número sorteado entre os concorrentes, ou null se não há nenhum. `aleatorio(n)` devolve 0..n-1.
export function sortear(numeros, ganhadores, aleatorio = aleatorioCripto) {
  const c = concorrentes(numeros, ganhadores);
  return c.length ? c[aleatorio(c.length)] : null;
}

// Aviso ao ganhador pelo WhatsApp (usar com linkWhatsApp).
export function mensagemGanhador(numero, premio) {
  return `Seu número ${numero} ganhou o ${premio}!`;
}

// Conversa no WhatsApp com a mensagem pronta. Telefone já normalizado (só dígitos com 55).
export function linkWhatsApp(telefone, mensagem) {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

// Cobrança: números do comprador, data do sorteio ('AAAA-MM-DD' ou null) e quanto falta pagar ou "tudo pago".
export function mensagemCobranca({ nome, numeros, preco, dataSorteio }) {
  const lista = ns => ns.map(n => n.numero).sort((a, b) => a - b).join(', ');
  const reservados = numeros.filter(n => n.estado === 'reservado');
  const data = dataSorteio ? ` (sorteio ${dataSorteio.split('-').reverse().join('/')})` : '';
  const falta = (reservados.length * preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return `Oi ${nome}! Seus números da rifa${data}: ${lista(numeros)}.`
    + (reservados.length ? ` Falta pagar ${falta} (${lista(reservados)}).` : ' Tudo pago, obrigado!');
}

// Busca/filtro: números esmaecidos (nunca escondidos) para um termo e um filtro ('todos' | 'livre' | 'reservado' | 'pago').
// Termo bate com parte do nome (sem acento/maiúsculas) ou, se tiver dígitos, com parte do telefone. Livre nunca bate com busca.
export function esmaecidos(total, numeros, compradores, termo, filtro) {
  const simples = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  const q = simples(termo), d = q.replace(/\D/g, '');
  const batem = new Set(compradores
    .filter(c => simples(c.nome).includes(q) || (d && c.telefone.includes(d)))
    .map(c => c.id));
  const dono = new Map(numeros.map(n => [n.numero, n.comprador_id]));
  return new Set(grade(total, numeros)
    .filter(({ numero, estado }) => (filtro !== 'todos' && filtro !== estado) || (q && !batem.has(dono.get(numero))))
    .map(n => n.numero));
}
