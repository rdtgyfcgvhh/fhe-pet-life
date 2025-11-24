import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHEPetLife = await deploy("FHEPetLife", {
    from: deployer,
    args: [deployer], // initialOwner
    log: true,
  });

  console.log(`FHEPetLife contract: `, deployedFHEPetLife.address);
};
export default func;
func.id = "deploy_fhePetLife"; // id required to prevent reexecution
func.tags = ["FHEPetLife"];

