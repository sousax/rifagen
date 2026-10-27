# Rifagen

Site simples para organizar uma rifa familiar: registrar quem comprou cada número e sortear os ganhadores.

## Language

**Rifa**:
O evento único que o site organiza, com um total fixo de números definido na criação.
_Avoid_: Sorteio (quando se refere ao evento todo), campanha

**Número**:
Uma das posições da rifa (1..total). Sempre está em um de três estados: livre, reservado ou pago.
_Avoid_: Bilhete, cota, ticket

**Comprador**:
A pessoa (nome + telefone) a quem um número foi reservado ou pago.
_Avoid_: Cliente, participante

**Reservado**:
Estado de um número já prometido a um comprador que ainda não pagou.
_Avoid_: Vendido

**Pago**:
Estado de um número cujo comprador já pagou. Só números pagos concorrem no sorteio.
_Avoid_: Vendido, confirmado

**Sorteio**:
O ato de escolher ao acaso, entre os números pagos, um ganhador para cada prêmio.
_Avoid_: Rifa

**Prêmio**:
O que um ganhador recebe, podendo reunir vários itens (ex.: "TV e bicicleta"). A rifa tem uma lista ordenada de prêmios (1º, 2º, …); cada prêmio tem exatamente um ganhador.
_Avoid_: Item (quando se refere ao prêmio inteiro)

**Ganhador**:
Um número pago escolhido no sorteio para um prêmio, junto com seu comprador. Um número ganha no máximo um prêmio; um comprador pode ganhar mais de um.

**Organizador**:
Quem tem acesso ao site para registrar compradores e fazer o sorteio (você e seus pais).
_Avoid_: Admin, vendedor
