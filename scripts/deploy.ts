import { ethers } from "hardhat"
import { MerkleTree } from "merkletreejs"
import keccak256 from "keccak256"

function presetMerkleTree(presetAccounts: string[]) {
  const leafNodes = presetAccounts.map(acc => keccak256(acc))
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
  return merkleTree
}

async function main() {
  const [owner, otherAccount, otherAccount2, otherAccount3] = await ethers.getSigners()
  const tree = presetMerkleTree([owner.address, otherAccount.address, otherAccount2.address])

  const CubesNFT = await ethers.getContractFactory("CubesNFT")
  const cubesNFT = await CubesNFT.deploy("ipfs://")

  await cubesNFT.deployed()

  console.log(`CubesNFT with whitelisted root ${tree.getHexRoot()} deployed to ${cubesNFT.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
