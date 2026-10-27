import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, nomeBackup, validarConfiguracao } from './rifa.js';

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
