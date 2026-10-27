import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, totais, normalizarTelefone, nomeBackup, validarConfiguracao, esmaecidos, linkWhatsApp, mensagemCobranca } from './rifa.js';

test('grade lista 1..total; sem linha é livre, com linha usa o estado dela', () => {
  const numeros = [
    { numero: 2, estado: 'reservado' },
    { numero: 4, estado: 'pago' },
  ];
  assert.deepEqual(grade(5, numeros), [
    { numero: 1, estado: 'livre' },
    { numero: 2, estado: 'reservado' },
    { numero: 3, estado: 'livre' },
    { numero: 4, estado: 'pago' },
    { numero: 5, estado: 'livre' },
  ]);
});

test('totais: arrecadado = pagos × preço, a receber = reservados × preço', () => {
  const numeros = [
    { numero: 1, estado: 'pago' },
    { numero: 2, estado: 'reservado' },
    { numero: 3, estado: 'pago' },
    { numero: 7, estado: 'reservado' },
    { numero: 9, estado: 'reservado' },
  ];
  assert.deepEqual(totais(numeros, 12.5), { arrecadado: 25, receber: 37.5 });
  assert.deepEqual(totais([], 10), { arrecadado: 0, receber: 0 });
});

test('normalizarTelefone guarda só dígitos com 55, qualquer que seja a digitação', () => {
  assert.equal(normalizarTelefone('(11) 98765-4321'), '5511987654321');
  assert.equal(normalizarTelefone(' 11 98765 4321 '), '5511987654321');
  assert.equal(normalizarTelefone('+55 (11) 98765-4321'), '5511987654321');
  assert.equal(normalizarTelefone('5511987654321'), '5511987654321');
  // DDD 55 (RS) sem o código do país ainda ganha o 55.
  assert.equal(normalizarTelefone('(55) 99123-4567'), '5555991234567');
});

test('normalizarTelefone devolve vazio se não há DDD + número', () => {
  assert.equal(normalizarTelefone(''), '');
  assert.equal(normalizarTelefone('98765-4321'), '');
  assert.equal(normalizarTelefone('abc'), '');
});

test('nomeBackup usa a data local do dia, com zeros à esquerda', () => {
  // 23h30 local: em UTC já seria o dia seguinte no Brasil
  assert.equal(nomeBackup(new Date(2026, 0, 5, 23, 30)), 'rifa-2026-01-05.json');
});

test('validarConfiguracao recusa total menor que o maior número em uso', () => {
  const numeros = [{ numero: 3, estado: 'pago' }, { numero: 12, estado: 'reservado' }];
  assert.equal(validarConfiguracao({ total: 11, preco: 10 }, numeros),
    'O total não pode ser menor que 12, o maior número em uso.');
  assert.equal(validarConfiguracao({ total: 12, preco: 10 }, numeros), null);
});

test('validarConfiguracao recusa total e preço não positivos ou inválidos', () => {
  const total = 'O total deve ser um número inteiro maior que zero.';
  const preco = 'O preço deve ser maior que zero.';
  assert.equal(validarConfiguracao({ total: 0, preco: 10 }, []), total);
  assert.equal(validarConfiguracao({ total: 2.5, preco: 10 }, []), total);
  assert.equal(validarConfiguracao({ total: NaN, preco: 10 }, []), total);
  assert.equal(validarConfiguracao({ total: 10, preco: 0 }, []), preco);
  assert.equal(validarConfiguracao({ total: 10, preco: -5 }, []), preco);
  assert.equal(validarConfiguracao({ total: 10, preco: NaN }, []), preco);
  assert.equal(validarConfiguracao({ total: 10, preco: 2.5 }, []), null);
});

test('linkWhatsApp abre a conversa com a mensagem codificada', () => {
  assert.equal(linkWhatsApp('5511987654321', 'Oi Ana! Nº 7 & 8?'),
    'https://wa.me/5511987654321?text=Oi%20Ana!%20N%C2%BA%207%20%26%208%3F');
});

test('mensagemCobranca lista os números, a data do sorteio e quanto falta pagar', () => {
  const numeros = [{ numero: 12, estado: 'reservado' }, { numero: 3, estado: 'pago' }, { numero: 7, estado: 'reservado' }];
  assert.equal(mensagemCobranca({ nome: 'Ana', numeros, preco: 10, dataSorteio: '2026-12-24' }),
    'Oi Ana! Seus números da rifa (sorteio 24/12/2026): 3, 7, 12. Falta pagar R$ 20,00 (7, 12).');
});

test('mensagemCobranca diz "tudo pago" quando não há reservados', () => {
  const numeros = [{ numero: 5, estado: 'pago' }, { numero: 2, estado: 'pago' }];
  assert.equal(mensagemCobranca({ nome: 'Bia', numeros, preco: 12.5, dataSorteio: '2026-01-05' }),
    'Oi Bia! Seus números da rifa (sorteio 05/01/2026): 2, 5. Tudo pago, obrigado!');
});

test('mensagemCobranca sem data do sorteio omite a data', () => {
  assert.equal(mensagemCobranca({ nome: 'Bia', numeros: [{ numero: 1, estado: 'pago' }], preco: 10, dataSorteio: null }),
    'Oi Bia! Seus números da rifa: 1. Tudo pago, obrigado!');
});

test('esmaecidos: busca por parte do nome ou do telefone esmaece quem não bate', () => {
  const compradores = [
    { id: 1, nome: 'José Silva', telefone: '5511987654321' },
    { id: 2, nome: 'Maria', telefone: '5521912345678' },
  ];
  const numeros = [
    { numero: 1, estado: 'pago', comprador_id: 1 },
    { numero: 2, estado: 'reservado', comprador_id: 2 },
    { numero: 4, estado: 'reservado', comprador_id: 1 },
  ];
  const dim = termo => [...esmaecidos(5, numeros, compradores, termo, 'todos')].sort((a, b) => a - b);
  assert.deepEqual(dim(''), []);
  assert.deepEqual(dim('  '), []);
  assert.deepEqual(dim('jose'), [2, 3, 5]); // sem acento e sem diferenciar maiúsculas
  assert.deepEqual(dim('MAR'), [1, 3, 4, 5]);
  assert.deepEqual(dim('(21) 91234'), [1, 3, 4, 5]); // telefone com máscara
  assert.deepEqual(dim('xyz'), [1, 2, 3, 4, 5]);
});

test('esmaecidos: filtro esmaece os outros estados e combina com a busca', () => {
  const compradores = [{ id: 1, nome: 'Ana', telefone: '5511987654321' }, { id: 2, nome: 'Bia', telefone: '5511911112222' }];
  const numeros = [
    { numero: 1, estado: 'pago', comprador_id: 1 },
    { numero: 2, estado: 'reservado', comprador_id: 1 },
    { numero: 3, estado: 'pago', comprador_id: 2 },
  ];
  const dim = (termo, filtro) => [...esmaecidos(4, numeros, compradores, termo, filtro)].sort((a, b) => a - b);
  assert.deepEqual(dim('', 'livre'), [1, 2, 3]);
  assert.deepEqual(dim('', 'reservado'), [1, 3, 4]);
  assert.deepEqual(dim('', 'pago'), [2, 4]);
  assert.deepEqual(dim('ana', 'pago'), [2, 3, 4]);
});
