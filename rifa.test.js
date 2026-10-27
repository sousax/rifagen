import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, totais, normalizarTelefone, nomeBackup } from './rifa.js';

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
