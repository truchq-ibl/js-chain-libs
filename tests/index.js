import { get } from 'https';

/* eslint-disable promise/always-return */
/* global BigInt */
import { expect } from 'chai';

const rust = import('../pkg/js_chain_libs');

async function makeTransaction(args) {
  const { genesisHash, inputAccount, outputAccount, delegation } = args;
  const {
    StakePoolId,
    OutputPolicy,
    TransactionBuilder,
    Address,
    Input,
    Value,
    Fee,
    PublicKey,
    Certificate,
    TransactionFinalizer,
    Fragment,
    PrivateKey,
    Witness,
    SpendingCounter,
    Hash,
    Account,
    // eslint-disable-next-line camelcase
    uint8array_to_hex
  } = await rust;
  const txbuilder = new TransactionBuilder();

  const accountAddress = Address.from_string(inputAccount.address);
  const account = Account.from_address(accountAddress);

  const input = Input.from_account(
    account,
    Value.from_u64(BigInt(inputAccount.value))
  );

  txbuilder.add_input(input);

  txbuilder.add_output(
    Address.from_string(outputAccount.address),
    Value.from_u64(BigInt(outputAccount.value))
  );

  const certificate = Certificate.stake_delegation(
    StakePoolId.from_hex(delegation.poolId),
    PublicKey.from_bech32(delegation.stakeKey)
  );

  certificate.sign(PrivateKey.from_bech32(delegation.privateKey));

  txbuilder.set_certificate(certificate);

  const feeAlgorithm = Fee.linear_fee(BigInt(20), BigInt(5), BigInt(10));

  const finalizedTx = txbuilder.finalize(
    feeAlgorithm,
    OutputPolicy.one(accountAddress)
  );

  const finalizer = new TransactionFinalizer(finalizedTx);

  const witness = Witness.for_account(
    Hash.from_hex(genesisHash),
    finalizer.get_txid(),
    PrivateKey.from_bech32(inputAccount.privateKey),
    SpendingCounter.zero()
  );

  finalizer.set_witness(0, witness);

  const signedTx = finalizer.build();

  const message = Fragment.from_generated_transaction(signedTx);

  expect(uint8array_to_hex(message.as_bytes())).to.eql(
    '0143030102ff00000000000003e8cbc7ccdb9a51eea4e4c7088353c1a1902dcf685f739194dc9faff26b7f42e21905263a058b2e6817bcb058e1734da381a995e3335c3e150dd2d621b3c136557aa700000000000001f405cbc7ccdb9a51eea4e4c7088353c1a1902dcf685f739194dc9faff26b7f42e21900000000000001c701cbc7ccdb9a51eea4e4c7088353c1a1902dcf685f739194dc9faff26b7f42e219541db50349e2bc1a5b1a73939b9d86fc45067117cc930c36afbb6fb0a9329d41010040faef2a78b53511b598b9484108fff109d1a098558e037c6c04246a7b78557eccfb7f38a774dcf584bb68c99db205f6e95ffde4c42696a8b0d730030aaacad70402c8414c567e866f73a5b89ae434c5f38cb6dc4dca2a9c2f18026aa0123eaa0220aa0ece26a1373cbb8a3568755580835e47ffc33d38a906c359a2c038b15cd709'
  );
}

makeTransaction({
  genesisHash:
    '6a702a181151b772ca0acbdc4d2870ed80c09b626b29fffc2e47abf2330ad0cd',
  inputAccount: {
    address: 'ca1qh9u0nxmnfg7af8ycuygx57p5xgzmnmgtaeer9xun7hly6mlgt3pj2xk344',
    value: 1000,
    privateKey:
      'ed25519e_sk1gz0ff4w444nwejap5shxrllypz5euswq6wn04fffzes02atw99xkd4jn838v3vrfg9eqt7f4sxjlsy0tdcmj0d2dqvwc8ztwgyfnwyszvjg32'
  },
  outputAccount: {
    address: 'ca1q5nr5pvt9e5p009strshxndrsx5etcentslp2rwj6csm8sfk24a2w3swacn',
    value: 500
  },
  delegation: {
    stakeKey:
      'ed25519_pk1e0rueku628h2fex8pzp48sdpjqku76zlwwgefhyl4lexkl6zugvs0uuy0w',
    privateKey:
      'ed25519e_sk1gz0ff4w444nwejap5shxrllypz5euswq6wn04fffzes02atw99xkd4jn838v3vrfg9eqt7f4sxjlsy0tdcmj0d2dqvwc8ztwgyfnwyszvjg32',
    poolId: '541db50349e2bc1a5b1a73939b9d86fc45067117cc930c36afbb6fb0a9329d41'
  }
});

function hexStringToBytes(string) {
  const bytes = [];
  for (let c = 0; c < string.length; c += 2)
    bytes.push(parseInt(string.substr(c, 2), 16));
  return Uint8Array.from(bytes);
}

getBlockMessages({
  binaryBlock:
    '02b600020000009800000000000001690000000acf5d01183ef5ed50d3fedf3e96b1a45cd87bc0c5902092f0de437319cc45d9c61a6809320426eb9be554c73226ae6d635463d1e6fdf3617db2ca9ac4a028da2234d115eed4fea1b61dee0630255139a7600f60cb885ea46d469e9925715aa7f94ea9b98611b5371f9ec378b2dae2d9050f1373b60cd9abf34e497527b6844678eb7c5507f1b77758c203d4553382f95e5110eec2489217bf74a25b9bb3282e0df79ab144a8e1278bc46a0bb28df37c3121b925caa0b601b44f77c47a037ec00800000000823a4d7d530bbdde7dbd684feff4c2f81b03fbd576554011e39919a3606fdbb5469aa1dcf468213f8a77c19670a06570d25d8e379572b6cdcf87235a503e180561bc5f729decb44a15e339f342769ad13a4c2d6508d96fc195833850304964d4c1f040bfd229053e2db491a55596e1d0de9d604ffb6432a0a55d395d7eb85dd50bf04ab074d63fa3e57d0a3b3debbd2e5c146edca18b3acd96196874a8aeae3f47ba546e517735e5ff6d2e3c4ae2784b4faad10f8e5f885f717691e3be16f65c90357ec8cc9a5767abb3038f07880ae06084663622ddb8635c641a826668b31e97427c3b837acbf4419f4d90b413e9b8c50ca5f7f8796eeadd38959566425669c8f5d6ff19182745e7d80b472c814657cd0761372a96965668e89df2e58f0d8c099a49e7f1185393790442aeb74759f5809b13ff5be062104de417935ddb7f971f06b2886d224fa15570e908419c25b21d46f37c10a16706095da2fa94e4e6ecae9dc98d1b2ab9c62d6db3e2447fe2e970c676244259273f23809bd6f5b8c89847a8d1712f3b4fc6753b23eb60fc81f6e958e3b3d6324efa43177ac10dc8440c8cb016a275b5e7ec9b1266b21685e599bdb76885bcccd264fb2ed15f0dd7617701e7f051d5650a317bbd5a59febd2faa461a4d9a6168b606176fcfdf4984d97b0096020101ff000000000000271a975629a823988d0f43e66fdce0ab7d825e3a870f1b60455e83dd433eb74b9d0e85b48e462477a2d1e9e9566e1d1b3b4262f1d4a3161544586998d3ce112fd930890000000000002710026f198f4cda3f0196d91910711058abaa5a2539661a2c7308d1b196b1f86f6d9e73034ff273782670dac048d302293392ed4aaab5ebc5b09c48dbc687353fdc02',
  id: 'c0a74e7b5ee427101c19cc18d3863a8822f1b4bf977648bf4b6a7b288fd9214b'
});

async function getBlockMessages(args) {
  const { binaryBlock, id } = args;
  const { Block, Hash } = await rust;

  const block = Block.from_bytes(hexStringToBytes(binaryBlock));

  expect(block.id().as_bytes()).to.eql(Hash.from_hex(id).as_bytes());
  expect(block.fragments().size()).to.eql(1);
  expect(
    block
      .fragments()
      .get_by_index(0)
      .is_transaction()
  ).to.eql(true);

  const transaction = block
    .fragments()
    .get_by_index(0)
    .get_transaction()
    .transaction();

  const inputs = transaction.inputs();
  const outputs = transaction.outputs();

  expect(inputs.size()).to.eql(1);
  expect(outputs.size()).to.eql(1);

  const input = inputs.get(0);
  expect(input.get_type()).to.eql('Account');

  expect(
    input
      .get_account()
      .to_address()
      .to_string('ca')
  ).to.eql('ca1qkt4v2dgywvg6r6ruehaec9t0kp9uw58pudkq327s0w5x04hfwwsus6xplp');

  const output = outputs.get(0);

  expect(output.address().to_string('ca')).to.eql(
    'ca1sk6gu33yw73dr60f2ehp6xemgf30r49rzc25gkrfnrfuuyf0mycgjvef0dw'
  );
  expect(output.value().to_number()).to.equal(BigInt(10000));
}