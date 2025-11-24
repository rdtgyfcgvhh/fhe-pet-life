"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { FHEPetLifeAddresses } from "@/abi/FHEPetLifeAddresses";
import { FHEPetLifeABI } from "@/abi/FHEPetLifeABI";

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type FHEPetLifeInfoType = {
  abi: typeof FHEPetLifeABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getFHEPetLifeByChainId(
  chainId: number | undefined
): FHEPetLifeInfoType {
  if (!chainId) {
    return { abi: FHEPetLifeABI.abi };
  }

  const entry =
    FHEPetLifeAddresses[chainId.toString() as keyof typeof FHEPetLifeAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: FHEPetLifeABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: FHEPetLifeABI.abi,
  };
}

export type PetStatus = {
  hunger?: ClearValueType;
  happiness?: ClearValueType;
  growth?: ClearValueType;
  level: number;
  lastInteraction: bigint;
};

export const useFHEPetLife = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [petTokenId, setPetTokenId] = useState<number | undefined>(undefined);
  const [hungerHandle, setHungerHandle] = useState<string | undefined>(undefined);
  const [happinessHandle, setHappinessHandle] = useState<string | undefined>(undefined);
  const [growthHandle, setGrowthHandle] = useState<string | undefined>(undefined);
  const [clearHunger, setClearHunger] = useState<ClearValueType | undefined>(undefined);
  const [clearHappiness, setClearHappiness] = useState<ClearValueType | undefined>(undefined);
  const [clearGrowth, setClearGrowth] = useState<ClearValueType | undefined>(undefined);
  const [petInfo, setPetInfo] = useState<{ level: number; lastInteraction: bigint } | undefined>(undefined);
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const petLifeRef = useRef<FHEPetLifeInfoType | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDecryptingRef = useRef<boolean>(isDecrypting);
  const isInteractingRef = useRef<boolean>(isInteracting);
  const isCreatingRef = useRef<boolean>(isCreating);

  const petLife = useMemo(() => {
    const c = getFHEPetLifeByChainId(chainId);
    petLifeRef.current = c;
    // Only show message when chainId is defined and address is missing
    // This prevents false warnings when chainId is undefined
    if (chainId !== undefined && !c.address) {
      setMessage(`FHEPetLife deployment not found for chainId=${chainId}.`);
    } else if (chainId === undefined || c.address) {
      // Clear message when chainId is undefined or address exists
      setMessage("");
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!petLife) {
      return undefined;
    }
    return (Boolean(petLife.address) && petLife.address !== ethers.ZeroAddress);
  }, [petLife]);

  const canGetPetStatus = useMemo(() => {
    return petLife.address && ethersReadonlyProvider && !isRefreshing && petTokenId !== undefined;
  }, [petLife.address, ethersReadonlyProvider, isRefreshing, petTokenId]);

  const refreshPetStatus = useCallback(() => {
    if (isRefreshingRef.current || petTokenId === undefined) {
      return;
    }

    if (
      !petLifeRef.current ||
      !petLifeRef.current?.chainId ||
      !petLifeRef.current?.address ||
      !ethersReadonlyProvider
    ) {
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisChainId = petLifeRef.current.chainId;
    const thisAddress = petLifeRef.current.address;
    const thisTokenId = petTokenId;

    const contract = new ethers.Contract(
      thisAddress,
      petLifeRef.current.abi,
      ethersReadonlyProvider
    );

    Promise.all([
      contract.getHunger(thisTokenId),
      contract.getHappiness(thisTokenId),
      contract.getGrowth(thisTokenId),
      contract.getPetInfo(thisTokenId),
    ])
      .then(([hunger, happiness, growth, info]) => {
        if (
          sameChain.current(thisChainId) &&
          thisAddress === petLifeRef.current?.address &&
          thisTokenId === petTokenId
        ) {
          setHungerHandle(hunger);
          setHappinessHandle(happiness);
          setGrowthHandle(growth);
          setPetInfo({
            level: Number(info.level),
            lastInteraction: BigInt(info.lastInteraction.toString()),
          });
        }
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      })
      .catch((e) => {
        setMessage("Failed to get pet status: " + e);
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      });
  }, [ethersReadonlyProvider, sameChain, petTokenId]);

  useEffect(() => {
    if (petTokenId !== undefined) {
      refreshPetStatus();
    }
  }, [petTokenId, refreshPetStatus]);

  const canDecrypt = useMemo(() => {
    return (
      petLife.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isDecrypting &&
      petTokenId !== undefined &&
      (hungerHandle || happinessHandle || growthHandle)
    );
  }, [
    petLife.address,
    instance,
    ethersSigner,
    isRefreshing,
    isDecrypting,
    petTokenId,
    hungerHandle,
    happinessHandle,
    growthHandle,
  ]);

  const decryptPetStatus = useCallback(() => {
    if (isRefreshingRef.current || isDecryptingRef.current || petTokenId === undefined) {
      return;
    }

    if (!petLife.address || !instance || !ethersSigner) {
      return;
    }

    const thisChainId = chainId;
    const thisAddress = petLife.address;
    const thisTokenId = petTokenId;
    const thisEthersSigner = ethersSigner;
    const thisHungerHandle = hungerHandle;
    const thisHappinessHandle = happinessHandle;
    const thisGrowthHandle = growthHandle;

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage("Starting decryption...");

    const run = async () => {
      const isStale = () =>
        thisAddress !== petLifeRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner) ||
        thisTokenId !== petTokenId;

      try {
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [petLife.address as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        if (isStale()) {
          setMessage("Operation cancelled");
          return;
        }

        setMessage("Decrypting pet status...");

        const handlesToDecrypt: Array<{ handle: string; contractAddress: `0x${string}` }> = [];
        if (thisHungerHandle && thisHungerHandle !== ethers.ZeroHash) {
          handlesToDecrypt.push({ handle: thisHungerHandle, contractAddress: thisAddress });
        }
        if (thisHappinessHandle && thisHappinessHandle !== ethers.ZeroHash) {
          handlesToDecrypt.push({ handle: thisHappinessHandle, contractAddress: thisAddress });
        }
        if (thisGrowthHandle && thisGrowthHandle !== ethers.ZeroHash) {
          handlesToDecrypt.push({ handle: thisGrowthHandle, contractAddress: thisAddress });
        }

        if (handlesToDecrypt.length === 0) {
          setMessage("No encrypted data to decrypt");
          return;
        }

        const res = await instance.userDecrypt(
          handlesToDecrypt,
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        if (isStale()) {
          setMessage("Operation cancelled");
          return;
        }

        const resultByHandle = res as unknown as Record<string, string | bigint | boolean>;

        if (thisHungerHandle && resultByHandle[thisHungerHandle] !== undefined) {
          setClearHunger({ handle: thisHungerHandle, clear: resultByHandle[thisHungerHandle] });
        }
        if (thisHappinessHandle && resultByHandle[thisHappinessHandle] !== undefined) {
          setClearHappiness({ handle: thisHappinessHandle, clear: resultByHandle[thisHappinessHandle] });
        }
        if (thisGrowthHandle && resultByHandle[thisGrowthHandle] !== undefined) {
          setClearGrowth({ handle: thisGrowthHandle, clear: resultByHandle[thisGrowthHandle] });
        }

        setMessage("Decryption completed!");
      } catch (e) {
        setMessage("Decryption failed: " + (e instanceof Error ? e.message : String(e)));
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
      }
    };

    run();
  }, [
    fhevmDecryptionSignatureStorage,
    ethersSigner,
    petLife.address,
    instance,
    chainId,
    petTokenId,
    hungerHandle,
    happinessHandle,
    growthHandle,
    sameChain,
    sameSigner,
  ]);

  const canInteract = useMemo(() => {
    return (
      petLife.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isInteracting &&
      petTokenId !== undefined
    );
  }, [petLife.address, instance, ethersSigner, isRefreshing, isInteracting, petTokenId]);

  const interactWithPet = useCallback(
    (action: "feed" | "play" | "rest", value: number) => {
      if (isRefreshingRef.current || isInteractingRef.current || petTokenId === undefined) {
        return;
      }

      if (!petLife.address || !instance || !ethersSigner || value === 0) {
        return;
      }

      const thisChainId = chainId;
      const thisAddress = petLife.address;
      const thisTokenId = petTokenId;
      const thisEthersSigner = ethersSigner;
      const contract = new ethers.Contract(
        thisAddress,
        petLife.abi,
        thisEthersSigner
      );

      isInteractingRef.current = true;
      setIsInteracting(true);
      setMessage(`Starting ${action}...`);

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisAddress !== petLifeRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner) ||
          thisTokenId !== petTokenId;

        try {
          const input = instance.createEncryptedInput(
            thisAddress,
            thisEthersSigner.address
          );
          input.add32(value);

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage(`Operation cancelled`);
            return;
          }

          setMessage(`Calling ${action}...`);

          let tx: ethers.TransactionResponse;
          if (action === "feed") {
            tx = await contract.feedPet(thisTokenId, enc.handles[0], enc.inputProof);
          } else if (action === "play") {
            tx = await contract.playWithPet(thisTokenId, enc.handles[0], enc.inputProof);
          } else {
            tx = await contract.restPet(thisTokenId, enc.handles[0], enc.inputProof);
          }

          setMessage(`Waiting for transaction ${tx.hash}...`);

          const receipt = await tx.wait();

          setMessage(`${action} completed! Status: ${receipt?.status}`);

          if (isStale()) {
            return;
          }

          refreshPetStatus();
        } catch (e) {
          setMessage(`${action} failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          isInteractingRef.current = false;
          setIsInteracting(false);
        }
      };

      run();
    },
    [
      ethersSigner,
      petLife.address,
      petLife.abi,
      instance,
      chainId,
      petTokenId,
      refreshPetStatus,
      sameChain,
      sameSigner,
    ]
  );

  const canCreatePet = useMemo(() => {
    return (
      petLife.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isCreating &&
      petTokenId === undefined
    );
  }, [petLife.address, instance, ethersSigner, isRefreshing, isCreating, petTokenId]);

  const createPet = useCallback(
    (hunger: number, happiness: number, growth: number, tokenURI: string) => {
      if (isRefreshingRef.current || isCreatingRef.current) {
        return;
      }

      if (!petLife.address || !instance || !ethersSigner) {
        return;
      }

      const thisChainId = chainId;
      const thisAddress = petLife.address;
      const thisEthersSigner = ethersSigner;
      const contract = new ethers.Contract(
        thisAddress,
        petLife.abi,
        thisEthersSigner
      );

      isCreatingRef.current = true;
      setIsCreating(true);
      setMessage("Creating pet...");

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisAddress !== petLifeRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const input = instance.createEncryptedInput(
            thisAddress,
            thisEthersSigner.address
          );
          input.add32(hunger);
          input.add32(happiness);
          input.add32(growth);

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage("Operation cancelled");
            return;
          }

          setMessage("Sending create pet transaction...");

          // Create separate encrypted inputs for each value
          const hungerInput = instance.createEncryptedInput(
            thisAddress,
            thisEthersSigner.address
          );
          hungerInput.add32(hunger);
          const hungerEnc = await hungerInput.encrypt();

          const happinessInput = instance.createEncryptedInput(
            thisAddress,
            thisEthersSigner.address
          );
          happinessInput.add32(happiness);
          const happinessEnc = await happinessInput.encrypt();

          const growthInput = instance.createEncryptedInput(
            thisAddress,
            thisEthersSigner.address
          );
          growthInput.add32(growth);
          const growthEnc = await growthInput.encrypt();

          const tx = await contract.createPet(
            hungerEnc.handles[0],
            happinessEnc.handles[0],
            growthEnc.handles[0],
            hungerEnc.inputProof,
            happinessEnc.inputProof,
            growthEnc.inputProof,
            tokenURI
          );

          setMessage(`Waiting for transaction ${tx.hash}...`);

          const receipt = await tx.wait();

          // Get token ID from PetCreated event
          let tokenId: number | undefined;
          if (receipt.logs) {
            for (const log of receipt.logs) {
              try {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === "PetCreated") {
                  // PetCreated event: (tokenId, owner)
                  tokenId = Number(parsedLog.args[0]);
                  break;
                }
              } catch {
                // Continue searching
              }
            }
          }
          
          // Fallback: try Transfer event
          if (tokenId === undefined && receipt.logs) {
            for (const log of receipt.logs) {
              try {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === "Transfer") {
                  // Transfer event: (from, to, tokenId)
                  tokenId = Number(parsedLog.args[2]);
                  break;
                }
              } catch {
                // Continue searching
              }
            }
          }
          
          if (tokenId === undefined) {
            setMessage("Pet created but could not get token ID. Please refresh.");
            return;
          }

          setMessage(`Pet created! Token ID: ${tokenId}`);

          if (isStale()) {
            return;
          }

          setPetTokenId(tokenId);
          refreshPetStatus();
        } catch (e) {
          setMessage(`Create pet failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          isCreatingRef.current = false;
          setIsCreating(false);
        }
      };

      run();
    },
    [
      ethersSigner,
      petLife.address,
      petLife.abi,
      instance,
      chainId,
      refreshPetStatus,
      sameChain,
      sameSigner,
    ]
  );

  const canLevelUp = useMemo(() => {
    return (
      petLife.address &&
      ethersSigner &&
      petTokenId !== undefined &&
      clearGrowth &&
      typeof clearGrowth.clear === "bigint" &&
      clearGrowth.clear >= BigInt(100) &&
      !isInteracting
    );
  }, [petLife.address, ethersSigner, petTokenId, clearGrowth, isInteracting]);

  const levelUp = useCallback(() => {
    if (petTokenId === undefined || !petLife.address || !ethersSigner) {
      return;
    }

    const contract = new ethers.Contract(
      petLife.address,
      petLife.abi,
      ethersSigner
    );

    setMessage("Leveling up pet...");

    contract
      .levelUp(petTokenId)
      .then((tx: ethers.TransactionResponse) => tx.wait())
      .then(() => {
        setMessage("Pet leveled up!");
        refreshPetStatus();
      })
      .catch((e: Error) => {
        setMessage("Level up failed: " + e.message);
      });
  }, [petLife.address, petLife.abi, ethersSigner, petTokenId, refreshPetStatus]);

  return {
    contractAddress: petLife.address,
    petTokenId,
    canCreatePet,
    canInteract,
    canDecrypt,
    canGetPetStatus,
    canLevelUp,
    createPet,
    interactWithPet,
    decryptPetStatus,
    refreshPetStatus,
    levelUp,
    message,
    isDecrypting,
    isRefreshing,
    isInteracting,
    isCreating,
    isDeployed,
    petStatus: {
      hunger: clearHunger,
      happiness: clearHappiness,
      growth: clearGrowth,
      level: petInfo?.level ?? 0,
      lastInteraction: petInfo?.lastInteraction ?? BigInt(0),
    },
  };
};

