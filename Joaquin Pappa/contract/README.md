# ChessRegistry (contrato Soroban)

Contrato que registra en Stellar el hash de una partida de ajedrez junto con su autor, nombres y resultado.

**Contract ID (testnet):** `CANUKO2PJWIW7WMVEBV7CDETZI2HCPVA7LIGKFBY73LJZZLAKW7Q2QW3`

## Funciones

- `register_game(...)`: registra una partida. Requiere la firma del autor.
- `get_game(hash)`: devuelve la partida registrada para ese hash.
- `games_by(author)`: lista las partidas registradas por una cuenta.

## Errores

| Código | Nombre | Cuándo |
|---|---|---|
| 1 | `AlreadyRegistered` | El hash ya fue registrado |
| 2 | `InvalidResult` | El resultado no es 0, 1 ni 2 |

## Resultado

`0` = 1-0, `1` = 0-1, `2` = ½-½

## Comandos

```bash
cargo test
stellar contract build
stellar contract deploy --wasm target/wasm32v1-none/release/chess_registry.wasm --source <tu-cuenta> --network testnet
```

## Política de TTL

Cada escritura extiende el TTL de las entradas afectadas (~29 días). Si una entrada no se vuelve a escribir, puede expirar.
