# Chess Registry (Stellar Soroban)

Registro de partidas de ajedrez on-chain. Permite demostrar que una partida existía en un momento dado, tal como fue registrada, sin depender de la planilla de papel.

Autor: Joaquin Pappa

## Problema

Las planillas de ajedrez en papel se pueden alterar: se pueden reescribir jugadas después de la partida, cambiar un resultado o reemplazar una hoja entera. Nadie puede verificar después si la planilla es la original.

## Solución

- Se toma la lista de jugadas en notación SAN (por ejemplo `e4 e5 Nf3 Nc6 ...`), unidas por espacio, y se calcula su hash **SHA-256**.
- Ese hash, junto con el resultado, se guarda en un **contrato Soroban de escritura única**: una vez registrado, no se puede sobrescribir.
- Los headers PGN (`[Event ...]`, `[White ...]`, fechas, etc.) no afectan el hash, así que se pueden corregir o completar sin cambiar la verificación.
- Para verificar, se pega el PGN en la app: se extraen las jugadas, se recalcula el hash y se busca en el contrato. Si coincide, la secuencia de jugadas existía registrada en ese momento.

## Arquitectura

- **`contract/`**: contrato Soroban en Rust (`contracts/chess-registry`). Guarda el hash de cada partida, impide duplicados y expone `register_game`, `get_game` y `games_by`. Incluye tests.
- **`packages/chess_registry/`**: bindings TypeScript generados a partir del contrato, usados por la app.
- **`app/`**: frontend con Vite + React + TypeScript. Conecta billetera con Freighter, parsea PGN con chess.js, registra partidas, verifica una partida pegando su PGN y muestra el historial.

## Contract ID (testnet)

`CANUKO2PJWIW7WMVEBV7CDETZI2HCPVA7LIGKFBY73LJZZLAKW7Q2QW3`

[Ver en Stellar Expert (testnet)](https://stellar.expert/explorer/testnet/contract/CANUKO2PJWIW7WMVEBV7CDETZI2HCPVA7LIGKFBY73LJZZLAKW7Q2QW3)

## Cómo correr

Requisitos: Rust con target `wasm32v1-none`, Stellar CLI, Node.js y npm, y la extensión Freighter.

1. Contrato y tests:
   ```bash
   cd "Joaquin Pappa/contract" && cargo test && stellar contract build
   ```
2. Deploy en testnet (desde la carpeta `contract`, con una cuenta fondeada):
   ```bash
   stellar contract deploy --wasm target/wasm32v1-none/release/chess_registry.wasm --source <tu-cuenta> --network testnet
   ```
   Si se despliega un contrato nuevo, actualizar el Contract ID en `app/src/lib/config.ts` y en los bindings.
3. Bindings TypeScript:
   ```bash
   cd "Joaquin Pappa/packages/chess_registry" && npm install && npm run build
   ```
4. App:
   ```bash
   cd "Joaquin Pappa/app" && npm install && npm run dev
   ```
5. En el navegador, abrir Freighter, cambiar a **Testnet** y usar una cuenta fondeada (friendbot) para firmar los registros.

## Limitaciones

- **Quien registra primero gana**: cualquiera puede registrar un hash antes que el autor. El registro no prueba autoría, solo que la secuencia de jugadas existía en un momento dado.
- **Entradas persistentes con TTL**: los registros tienen un TTL de ~29 días y se extienden al escribir. Si expiran, pueden restaurarse.
- **Firma de una sola parte**: solo firma quien registra la partida; el otro jugador no confirma el registro.

## RAVEN_LOG

A completar por el autor: mínimo 3 consultas a Stellar Raven y para qué sirvió cada una.

- (vacío)

## Mejoras futuras

- Multi-firma: que ambos jugadores firmen el registro.
- Torneos y árbitros: registro validado por un árbitro o por el organizador del torneo.
- Hash por jugada: registrar hashes incrementales para verificar partidas parciales.
- ELO: calcular y registrar ratings on-chain a partir de partidas verificadas.
