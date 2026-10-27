import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, totais, normalizarTelefone, nomeBackup, validarConfiguracao, premiosPendentes, concorrentes, sortear, linkGanhador } from './rifa.js';

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

test('premiosPendentes: posições sem ganhador, do último prêmio ao 1º', () => {
  const premios = ['TV', 'Bicicleta', 'Cesta'];
  assert.deepEqual(premiosPendentes(premios, []), [3, 2, 1]);
  // sorteio interrompido depois do 3º: continua do 2º
  assert.deepEqual(premiosPendentes(premios, [{ posicao: 3, numero: 7 }]), [2, 1]);
  assert.deepEqual(premiosPendentes(premios, [
    { posicao: 1, numero: 2 }, { posicao: 2, numero: 5 }, { posicao: 3, numero: 7 },
  ]), []);
});

test('sortear: só pagos sem prêmio concorrem; reservados e já premiados ficam fora', () => {
  const numeros = [
    { numero: 1, estado: 'pago' },
    { numero: 2, estado: 'reservado' },
    { numero: 3, estado: 'pago' },
    { numero: 4, estado: 'pago' },
  ];
  const ganhadores = [{ posicao: 2, numero: 3 }];
  assert.deepEqual(concorrentes(numeros, ganhadores), [1, 4]);
  const vistos = [];
  const primeiro = n => { vistos.push(n); return 0; };
  const ultimo = n => n - 1;
  assert.equal(sortear(numeros, ganhadores, primeiro), 1);
  assert.equal(sortear(numeros, ganhadores, ultimo), 4);
  assert.deepEqual(vistos, [2]); // o aleatório escolhe entre 2 concorrentes
  assert.equal(sortear([{ numero: 2, estado: 'reservado' }], [], primeiro), null);
});

test('sortear sem aleatório injetado usa crypto e devolve um concorrente', () => {
  const numeros = [{ numero: 5, estado: 'pago' }, { numero: 9, estado: 'pago' }];
  for (let i = 0; i < 20; i++) assert.ok([5, 9].includes(sortear(numeros, [])));
});

test('linkGanhador abre o WhatsApp do comprador com "Seu número X ganhou o <prêmio>!"', () => {
  assert.equal(linkGanhador('5511987654321', 7, 'TV & som'),
    'https://wa.me/5511987654321?text=Seu%20n%C3%BAmero%207%20ganhou%20o%20TV%20%26%20som!');
});
