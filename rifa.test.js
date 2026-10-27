import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, nomeBackup } from './rifa.js';

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

test('nomeBackup usa a data local do dia, com zeros à esquerda', () => {
  // 23h30 local: em UTC já seria o dia seguinte no Brasil
  assert.equal(nomeBackup(new Date(2026, 0, 5, 23, 30)), 'rifa-2026-01-05.json');
});
