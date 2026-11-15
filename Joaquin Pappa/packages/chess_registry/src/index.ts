import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CANUKO2PJWIW7WMVEBV7CDETZI2HCPVA7LIGKFBY73LJZZLAKW7Q2QW3",
  }
} as const


export interface Game {
  black: string;
  registrar: string;
  result: u32;
  timestamp: u64;
  white: string;
}

export const Errors = {
  1: {message:"AlreadyRegistered"},
  2: {message:"InvalidResult"}
}

export type DataKey = {tag: "Game", values: readonly [Buffer]} | {tag: "ByRegistrar", values: readonly [string]};

export interface Client {
  /**
   * Construct and simulate a games_by transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  games_by: ({registrar}: {registrar: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Buffer>>>

  /**
   * Construct and simulate a get_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_game: ({pgn_hash}: {pgn_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Game>>>

  /**
   * Construct and simulate a register_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  register_game: ({registrar, pgn_hash, white, black, result}: {registrar: string, pgn_hash: Buffer, white: string, black: string, result: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABEdhbWUAAAAFAAAAAAAAAAVibGFjawAAAAAAABAAAAAAAAAACXJlZ2lzdHJhcgAAAAAAABMAAAAAAAAABnJlc3VsdAAAAAAABAAAAAAAAAAJdGltZXN0YW1wAAAAAAAABgAAAAAAAAAFd2hpdGUAAAAAAAAQ",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAgAAAAAAAAARQWxyZWFkeVJlZ2lzdGVyZWQAAAAAAAABAAAAAAAAAA1JbnZhbGlkUmVzdWx0AAAAAAAAAg==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAABEdhbWUAAAABAAAD7gAAACAAAAABAAAAAAAAAAtCeVJlZ2lzdHJhcgAAAAABAAAAEw==",
        "AAAAAAAAAAAAAAAIZ2FtZXNfYnkAAAABAAAAAAAAAAlyZWdpc3RyYXIAAAAAAAATAAAAAQAAA+oAAAPuAAAAIA==",
        "AAAAAAAAAAAAAAAIZ2V0X2dhbWUAAAABAAAAAAAAAAhwZ25faGFzaAAAA+4AAAAgAAAAAQAAA+gAAAfQAAAABEdhbWU=",
        "AAAAAAAAAAAAAAANcmVnaXN0ZXJfZ2FtZQAAAAAAAAUAAAAAAAAACXJlZ2lzdHJhcgAAAAAAABMAAAAAAAAACHBnbl9oYXNoAAAD7gAAACAAAAAAAAAABXdoaXRlAAAAAAAAEAAAAAAAAAAFYmxhY2sAAAAAAAAQAAAAAAAAAAZyZXN1bHQAAAAAAAQAAAABAAAD6QAAAAIAAAAD" ]),
      options
    )
  }
  public readonly fromJSON = {
    games_by: this.txFromJSON<Array<Buffer>>,
        get_game: this.txFromJSON<Option<Game>>,
        register_game: this.txFromJSON<Result<void>>
  }
}