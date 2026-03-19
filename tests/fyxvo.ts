import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import type { Fyxvo } from "../target/types/fyxvo";

describe("fyxvo", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Fyxvo as Program<Fyxvo>;
  const projectOwner = Keypair.generate();
  const operator = Keypair.generate();
  const feeBps = 500;
  const projectId = new anchor.BN(1);
  const solDeposit = new anchor.BN(LAMPORTS_PER_SOL);
  const usdcDeposit = new anchor.BN(1_000_000_000);
  const solReward = new anchor.BN(200_000_000);
  const usdcReward = new anchor.BN(100_000_000);

  let usdcMint: PublicKey;
  let ownerUsdcAccount: PublicKey;
  let operatorUsdcAccount: PublicKey;

  const [protocolConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol-config")],
    program.programId
  );
  const [treasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );
  const [operatorRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("operator-registry"), protocolConfigPda.toBuffer()],
    program.programId
  );
  const [projectPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("project"),
      projectOwner.publicKey.toBuffer(),
      projectId.toArrayLike(Buffer, "le", 8)
    ],
    program.programId
  );
  const [operatorAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("operator"), projectPda.toBuffer(), operator.publicKey.toBuffer()],
    program.programId
  );
  const [rewardAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("reward"), operatorAccountPda.toBuffer()],
    program.programId
  );

  before(async () => {
    await airdrop(projectOwner.publicKey, 5 * LAMPORTS_PER_SOL);
    await airdrop(operator.publicKey, 2 * LAMPORTS_PER_SOL);

    usdcMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      6
    );

    ownerUsdcAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        usdcMint,
        projectOwner.publicKey
      )
    ).address;

    operatorUsdcAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        provider.wallet.payer,
        usdcMint,
        operator.publicKey
      )
    ).address;

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      usdcMint,
      ownerUsdcAccount,
      provider.wallet.publicKey,
      Number(usdcDeposit.toString())
    );

    const treasuryUsdcVault = getAssociatedTokenAddressSync(usdcMint, treasuryPda, true);

    await program.methods
      .initializeProtocol(provider.wallet.publicKey, feeBps)
      .accountsPartial({
        authority: provider.wallet.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        operatorRegistry: operatorRegistryPda,
        usdcMint,
        treasuryUsdcVault,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID
      })
      .rpc();

    await program.methods
      .createProject(projectId)
      .accountsPartial({
        projectOwner: projectOwner.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        project: projectPda,
        systemProgram: SystemProgram.programId
      })
      .signers([projectOwner])
      .rpc();
  });

  it("tracks SOL and USDC deposits with protocol fees", async () => {
    const treasuryUsdcVault = getAssociatedTokenAddressSync(usdcMint, treasuryPda, true);

    await program.methods
      .depositSol(solDeposit)
      .accountsPartial({
        funder: projectOwner.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        project: projectPda,
        systemProgram: SystemProgram.programId
      })
      .signers([projectOwner])
      .rpc();

    await program.methods
      .depositUsdc(usdcDeposit)
      .accountsPartial({
        funder: projectOwner.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        project: projectPda,
        usdcMint,
        funderUsdcAccount: ownerUsdcAccount,
        treasuryUsdcVault,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([projectOwner])
      .rpc();

    const project = await program.account.projectAccount.fetch(projectPda);
    const treasury = await program.account.treasury.fetch(treasuryPda);

    expect(project.totalSolFunded.toNumber()).to.equal(950_000_000);
    expect(project.availableSolBalance.toNumber()).to.equal(950_000_000);
    expect(project.totalUsdcFunded.toNumber()).to.equal(950_000_000);
    expect(project.availableUsdcBalance.toNumber()).to.equal(950_000_000);
    expect(treasury.protocolSolFeesOwed.toNumber()).to.equal(50_000_000);
    expect(treasury.protocolUsdcFeesOwed.toNumber()).to.equal(50_000_000);
  });

  it("registers an operator with reward tracking PDAs", async () => {
    await program.methods
      .registerOperator()
      .accountsPartial({
        operator: operator.publicKey,
        protocolConfig: protocolConfigPda,
        operatorRegistry: operatorRegistryPda,
        project: projectPda,
        operatorAccount: operatorAccountPda,
        rewardAccount: rewardAccountPda,
        systemProgram: SystemProgram.programId
      })
      .signers([operator])
      .rpc();

    const registry = await program.account.operatorRegistry.fetch(operatorRegistryPda);
    const operatorAccount = await program.account.operatorAccount.fetch(operatorAccountPda);
    const rewardAccount = await program.account.rewardAccount.fetch(rewardAccountPda);

    expect(registry.totalRegistered.toNumber()).to.equal(1);
    expect(operatorAccount.operator.toBase58()).to.equal(operator.publicKey.toBase58());
    expect(operatorAccount.rewardAccount.toBase58()).to.equal(rewardAccountPda.toBase58());
    expect(rewardAccount.operator.toBase58()).to.equal(operator.publicKey.toBase58());
  });

  it("accrues SOL and USDC rewards against project balances", async () => {
    await program.methods
      .accrueReward({ sol: {} }, solReward)
      .accountsPartial({
        projectOwner: projectOwner.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        project: projectPda,
        operatorAccount: operatorAccountPda,
        rewardAccount: rewardAccountPda
      })
      .signers([projectOwner])
      .rpc();

    await program.methods
      .accrueReward({ usdc: {} }, usdcReward)
      .accountsPartial({
        projectOwner: projectOwner.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        project: projectPda,
        operatorAccount: operatorAccountPda,
        rewardAccount: rewardAccountPda
      })
      .signers([projectOwner])
      .rpc();

    const project = await program.account.projectAccount.fetch(projectPda);
    const treasury = await program.account.treasury.fetch(treasuryPda);
    const rewardAccount = await program.account.rewardAccount.fetch(rewardAccountPda);

    expect(project.availableSolBalance.toNumber()).to.equal(750_000_000);
    expect(project.outstandingSolRewards.toNumber()).to.equal(200_000_000);
    expect(project.availableUsdcBalance.toNumber()).to.equal(850_000_000);
    expect(project.outstandingUsdcRewards.toNumber()).to.equal(100_000_000);
    expect(treasury.reservedSolRewards.toNumber()).to.equal(200_000_000);
    expect(treasury.reservedUsdcRewards.toNumber()).to.equal(100_000_000);
    expect(rewardAccount.accruedSol.toNumber()).to.equal(200_000_000);
    expect(rewardAccount.accruedUsdc.toNumber()).to.equal(100_000_000);
  });

  it("claims accrued SOL and USDC rewards", async () => {
    const preSol = await provider.connection.getBalance(operator.publicKey);
    const preUsdc = Number((await getAccount(provider.connection, operatorUsdcAccount)).amount);
    const treasuryUsdcVault = getAssociatedTokenAddressSync(usdcMint, treasuryPda, true);

    await program.methods
      .claimSolReward()
      .accountsPartial({
        operator: operator.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        project: projectPda,
        operatorAccount: operatorAccountPda,
        rewardAccount: rewardAccountPda
      })
      .signers([operator])
      .rpc();

    await program.methods
      .claimUsdcReward()
      .accountsPartial({
        operator: operator.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        project: projectPda,
        operatorAccount: operatorAccountPda,
        rewardAccount: rewardAccountPda,
        usdcMint,
        treasuryUsdcVault,
        operatorUsdcAccount,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([operator])
      .rpc();

    const postSol = await provider.connection.getBalance(operator.publicKey);
    const postUsdc = Number((await getAccount(provider.connection, operatorUsdcAccount)).amount);
    const treasury = await program.account.treasury.fetch(treasuryPda);
    const project = await program.account.projectAccount.fetch(projectPda);
    const operatorAccount = await program.account.operatorAccount.fetch(operatorAccountPda);
    const rewardAccount = await program.account.rewardAccount.fetch(rewardAccountPda);

    expect(postSol - preSol).to.equal(solReward.toNumber());
    expect(postUsdc - preUsdc).to.equal(usdcReward.toNumber());
    expect(treasury.solBalance.toNumber()).to.equal(750_000_000);
    expect(treasury.usdcBalance.toNumber()).to.equal(850_000_000);
    expect(treasury.reservedSolRewards.toNumber()).to.equal(0);
    expect(treasury.reservedUsdcRewards.toNumber()).to.equal(0);
    expect(project.outstandingSolRewards.toNumber()).to.equal(0);
    expect(project.outstandingUsdcRewards.toNumber()).to.equal(0);
    expect(operatorAccount.totalSolClaimed.toNumber()).to.equal(solReward.toNumber());
    expect(operatorAccount.totalUsdcClaimed.toNumber()).to.equal(usdcReward.toNumber());
    expect(rewardAccount.claimedSol.toNumber()).to.equal(solReward.toNumber());
    expect(rewardAccount.claimedUsdc.toNumber()).to.equal(usdcReward.toNumber());
  });

  it("enforces the pause mechanism", async () => {
    await program.methods
      .setProtocolPause(true)
      .accountsPartial({
        authority: provider.wallet.publicKey,
        protocolConfig: protocolConfigPda
      })
      .rpc();

    let pausedError: string | null = null;
    try {
      await program.methods
        .depositSol(new anchor.BN(100_000_000))
        .accountsPartial({
          funder: projectOwner.publicKey,
          protocolConfig: protocolConfigPda,
          treasury: treasuryPda,
          project: projectPda,
          systemProgram: SystemProgram.programId
        })
        .signers([projectOwner])
        .rpc();
    } catch (error) {
      pausedError = `${error}`;
    }

    expect(pausedError).to.contain("ProgramPaused");

    await program.methods
      .setProtocolPause(false)
      .accountsPartial({
        authority: provider.wallet.publicKey,
        protocolConfig: protocolConfigPda
      })
      .rpc();

    await program.methods
      .depositSol(new anchor.BN(100_000_000))
      .accountsPartial({
        funder: projectOwner.publicKey,
        protocolConfig: protocolConfigPda,
        treasury: treasuryPda,
        project: projectPda,
        systemProgram: SystemProgram.programId
      })
      .signers([projectOwner])
      .rpc();

    const project = await program.account.projectAccount.fetch(projectPda);
    expect(project.totalSolFunded.toNumber()).to.equal(1_045_000_000);
  });

  async function airdrop(destination: PublicKey, lamports: number) {
    const signature = await provider.connection.requestAirdrop(destination, lamports);
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash
      },
      "confirmed"
    );
  }
});
