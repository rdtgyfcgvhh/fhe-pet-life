"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useFHEPetLife } from "../hooks/useFHEPetLife";
import { useState } from "react";

export const PetLifeDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const petLife = useFHEPetLife({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [createHunger, setCreateHunger] = useState(50);
  const [createHappiness, setCreateHappiness] = useState(50);
  const [createGrowth, setCreateGrowth] = useState(0);
  const [createTokenURI, setCreateTokenURI] = useState("https://example.com/pet.json");

  const buttonClass = (disabled: boolean) =>
    `glow-button relative px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
      disabled
        ? "bg-slate-700/50 text-slate-400 cursor-not-allowed border border-slate-600/50"
        : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 border border-purple-400/50"
    }`;

  const cardClass = "glass-card rounded-2xl p-6 sm:p-8 hover:border-purple-400/40 transition-all duration-300";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] py-12">
        <div className={`${cardClass} text-center max-w-lg mx-auto animated-gradient`}>
          <div className="mb-6">
            <div className="text-7xl mb-4 animate-bounce">🐾</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Welcome to FHE Pet Life
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-6"></div>
          </div>
          
          <p className="text-purple-100 text-lg mb-8 leading-relaxed">
            Connect your MetaMask wallet to begin your journey into the world of
            <span className="font-semibold text-white"> encrypted pet care</span>. 
            Your pet&apos;s secrets are safe with homomorphic encryption!
          </p>
          
          <button
            className={buttonClass(false)}
            onClick={connect}
          >
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Connect MetaMask
            </span>
          </button>
          
          <div className="mt-6 text-sm text-purple-200/60">
            🔒 Secure • Private • Decentralized
          </div>
        </div>
      </div>
    );
  }

  // Only show deployment error when chainId is defined and contract is not deployed
  // This prevents false warnings when chainId is undefined
  if (chainId !== undefined && petLife.isDeployed === false) {
    return (
      <div className={`${cardClass} bg-red-900/20 border-red-500/50 max-w-2xl mx-auto`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">⚠️</div>
          <div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Contract Not Deployed</h2>
            <p className="text-red-200/80">
              The FHEPetLife smart contract hasn&apos;t been deployed on chain <span className="font-mono font-bold">{chainId}</span> yet.
            </p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-red-950/30 rounded-lg border border-red-500/30">
          <p className="text-sm text-red-200/60">
            💡 <span className="font-semibold">Next steps:</span> Deploy the contract using the deployment scripts before you can start playing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-transparent rounded-bl-full"></div>
          <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">FHEVM Status</h3>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              fhevmStatus === "ready" ? "bg-green-400 pulse-glow" : 
              fhevmStatus === "error" ? "bg-red-400" : "bg-yellow-400 animate-pulse"
            }`}></div>
            <p className={`text-2xl font-bold ${
              fhevmStatus === "ready" ? "text-green-400" : 
              fhevmStatus === "error" ? "text-red-400" : "text-yellow-400"
            }`}>
              {fhevmStatus.charAt(0).toUpperCase() + fhevmStatus.slice(1)}
            </p>
          </div>
          {fhevmError && (
            <p className="text-xs text-red-300 mt-2 bg-red-900/30 p-2 rounded">{fhevmError.message}</p>
          )}
        </div>
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
          <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">Smart Contract</h3>
          <p className="text-sm font-mono text-white break-all bg-slate-800/50 px-3 py-2 rounded-lg">
            {petLife.contractAddress?.slice(0, 18)}...
          </p>
        </div>
        <div className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full"></div>
          <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">Network ID</h3>
          <p className="text-3xl font-bold text-white">{chainId}</p>
        </div>
      </div>

      {/* Create Pet Section */}
      {petLife.petTokenId === undefined && (
        <div className={`${cardClass} animated-gradient`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">✨</div>
            <h2 className="text-3xl font-bold text-white">Create Your Pet</h2>
          </div>
          
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-purple-200 text-sm leading-relaxed">
              🔐 Your pet&apos;s initial stats will be encrypted on-chain using FHE technology. 
              Choose wisely - these values affect your pet&apos;s behavior and growth!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wide">
                🍖 Initial Hunger (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={createHunger}
                onChange={(e) => setCreateHunger(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/50 border-2 border-purple-400/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              />
              <div className="mt-2 h-2 bg-slate-800/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
                  style={{width: `${createHunger}%`}}
                ></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wide">
                😊 Initial Happiness (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={createHappiness}
                onChange={(e) => setCreateHappiness(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/50 border-2 border-purple-400/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              />
              <div className="mt-2 h-2 bg-slate-800/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-300"
                  style={{width: `${createHappiness}%`}}
                ></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wide">
                🌱 Initial Growth
              </label>
              <input
                type="number"
                min="0"
                value={createGrowth}
                onChange={(e) => setCreateGrowth(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/50 border-2 border-purple-400/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold text-purple-200 mb-3 uppercase tracking-wide">
              🔗 Token URI (NFT Metadata)
            </label>
            <input
              type="text"
              value={createTokenURI}
              onChange={(e) => setCreateTokenURI(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border-2 border-purple-400/30 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all font-mono text-sm"
              placeholder="https://example.com/pet.json"
            />
          </div>
          <button
            className={buttonClass(!petLife.canCreatePet || petLife.isCreating)}
            disabled={!petLife.canCreatePet || petLife.isCreating}
            onClick={() => petLife.createPet(createHunger, createHappiness, createGrowth, createTokenURI)}
          >
            {petLife.isCreating ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Your Pet...
              </span>
            ) : (
              "🐾 Create Pet"
            )}
          </button>
        </div>
      )}

      {/* Pet Status Section */}
      {petLife.petTokenId !== undefined && (
        <>
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="text-5xl">🐾</div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    Your Pet
                  </h2>
                  <p className="text-purple-300 text-sm">Token ID: #{petLife.petTokenId}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-4xl font-bold text-yellow-400">
                  Lv.{petLife.petStatus.level}
                </div>
                <div className="text-xs text-purple-300 mt-1">Level</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="stat-card bg-gradient-to-br from-red-600 to-orange-600 before:from-red-400 before:to-orange-400">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">🍖 Hunger</h3>
                    {petLife.petStatus.hunger?.clear !== undefined && (
                      <div className="text-xs text-red-100 bg-white/20 px-2 py-1 rounded-full">
                        Decrypted
                      </div>
                    )}
                  </div>
                  {petLife.petStatus.hunger?.clear !== undefined ? (
                    <>
                      <p className="text-4xl font-bold text-white mb-2">
                        {String(petLife.petStatus.hunger.clear)}
                      </p>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-500"
                          style={{width: `${Math.min(Number(petLife.petStatus.hunger.clear), 100)}%`}}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-white/80">
                      <div className="text-3xl">🔒</div>
                      <p className="text-lg font-semibold">Encrypted</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="stat-card bg-gradient-to-br from-yellow-600 to-amber-600 before:from-yellow-400 before:to-amber-400">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">😊 Happiness</h3>
                    {petLife.petStatus.happiness?.clear !== undefined && (
                      <div className="text-xs text-yellow-100 bg-white/20 px-2 py-1 rounded-full">
                        Decrypted
                      </div>
                    )}
                  </div>
                  {petLife.petStatus.happiness?.clear !== undefined ? (
                    <>
                      <p className="text-4xl font-bold text-white mb-2">
                        {String(petLife.petStatus.happiness.clear)}
                      </p>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-500"
                          style={{width: `${Math.min(Number(petLife.petStatus.happiness.clear), 100)}%`}}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-white/80">
                      <div className="text-3xl">🔒</div>
                      <p className="text-lg font-semibold">Encrypted</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="stat-card bg-gradient-to-br from-green-600 to-emerald-600 before:from-green-400 before:to-emerald-400">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">🌱 Growth</h3>
                    {petLife.petStatus.growth?.clear !== undefined && (
                      <div className="text-xs text-green-100 bg-white/20 px-2 py-1 rounded-full">
                        Decrypted
                      </div>
                    )}
                  </div>
                  {petLife.petStatus.growth?.clear !== undefined ? (
                    <>
                      <p className="text-4xl font-bold text-white mb-2">
                        {String(petLife.petStatus.growth.clear)}
                      </p>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-500"
                          style={{width: `${Math.min(Number(petLife.petStatus.growth.clear), 100)}%`}}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-white/80">
                      <div className="text-3xl">🔒</div>
                      <p className="text-lg font-semibold">Encrypted</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 text-sm text-purple-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <span className="font-semibold">Last Interaction:</span>
                <span className="text-white">{new Date(Number(petLife.petStatus.lastInteraction) * 1000).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                className={buttonClass(!petLife.canDecrypt || petLife.isDecrypting)}
                disabled={!petLife.canDecrypt || petLife.isDecrypting}
                onClick={petLife.decryptPetStatus}
              >
                {petLife.isDecrypting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Decrypting...
                  </span>
                ) : "🔓 Decrypt Status"}
              </button>
              <button
                className={buttonClass(!petLife.canGetPetStatus || petLife.isRefreshing)}
                disabled={!petLife.canGetPetStatus || petLife.isRefreshing}
                onClick={petLife.refreshPetStatus}
              >
                {petLife.isRefreshing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </span>
                ) : "🔄 Refresh"}
              </button>
            </div>
          </div>

          {/* Interaction Buttons */}
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">🎯</div>
              <h2 className="text-2xl font-bold text-white">Pet Interactions</h2>
            </div>
            <p className="text-purple-200 text-sm mb-6 leading-relaxed">
              Interact with your pet to modify their encrypted stats. Each action affects different attributes!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group">
                <button
                  className={`${buttonClass(!petLife.canInteract || petLife.isInteracting)} w-full`}
                  disabled={!petLife.canInteract || petLife.isInteracting}
                  onClick={() => petLife.interactWithPet("feed", 10)}
                >
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🍖</div>
                    <div className="font-bold">Feed</div>
                    <div className="text-sm opacity-80">-10 Hunger</div>
                  </div>
                </button>
                <div className="mt-2 text-xs text-purple-300 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Keep your pet well-fed and happy
                </div>
              </div>
              <div className="group">
                <button
                  className={`${buttonClass(!petLife.canInteract || petLife.isInteracting)} w-full`}
                  disabled={!petLife.canInteract || petLife.isInteracting}
                  onClick={() => petLife.interactWithPet("play", 15)}
                >
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🎮</div>
                    <div className="font-bold">Play</div>
                    <div className="text-sm opacity-80">+15 Happiness</div>
                  </div>
                </button>
                <div className="mt-2 text-xs text-purple-300 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Boost mood and strengthen your bond
                </div>
              </div>
              <div className="group">
                <button
                  className={`${buttonClass(!petLife.canInteract || petLife.isInteracting)} w-full`}
                  disabled={!petLife.canInteract || petLife.isInteracting}
                  onClick={() => petLife.interactWithPet("rest", 5)}
                >
                  <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">😴</div>
                    <div className="font-bold">Rest</div>
                    <div className="text-sm opacity-80">+5 Growth</div>
                  </div>
                </button>
                <div className="mt-2 text-xs text-purple-300 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Allow your pet to grow stronger
                </div>
              </div>
            </div>
            {petLife.isInteracting && (
              <div className="mt-6 p-4 bg-purple-900/30 rounded-xl border border-purple-500/50 flex items-center gap-3">
                <svg className="animate-spin h-6 w-6 text-purple-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-purple-200">Processing your interaction on the blockchain...</span>
              </div>
            )}
          </div>

          {/* Level Up */}
          {petLife.canLevelUp && (
            <div className={`${cardClass} bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-500/50 pulse-glow`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-6xl animate-bounce">🎉</div>
                <div>
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2">Ready to Level Up!</h2>
                  <p className="text-yellow-200/80 text-lg">
                    Your pet has accumulated enough growth points to advance to the next level!
                  </p>
                </div>
              </div>
              <div className="mb-4 p-4 bg-yellow-950/30 rounded-xl border border-yellow-500/30">
                <p className="text-sm text-yellow-100">
                  ⭐ <span className="font-semibold">Benefits:</span> Leveling up will increase your pet&apos;s overall capabilities and unlock new potential.
                </p>
              </div>
              <button
                className={buttonClass(false)}
                onClick={petLife.levelUp}
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl">⬆️</span>
                  <span>Level Up Now!</span>
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Message Display */}
      {petLife.message && (
        <div className={`${cardClass} bg-blue-900/30 border-blue-500/50`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">💬</div>
            <div className="flex-1">
              <div className="text-xs font-bold text-blue-300 mb-1 uppercase tracking-wider">System Message</div>
              <p className="text-white text-lg">{petLife.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

