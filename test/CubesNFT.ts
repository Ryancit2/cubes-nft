import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { MerkleTree } from "merkletreejs"
import keccak256 from "keccak256"

describe("CubesNFT", function () {
  function presetMerkleTree(presetAccounts: string[]) {
    const leafNodes = presetAccounts.map(acc => keccak256(acc))
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
    return merkleTree
  }

  async function deployCubesNFTFixture() {
    const [owner, otherAccount, otherAccount2, otherAccount3] = await ethers.getSigners()
    const tree = presetMerkleTree([owner.address, otherAccount.address, otherAccount2.address])

    const CubesNFT = await ethers.getContractFactory("CubesNFT")
    const cubesNFT = await CubesNFT.deploy(tree.getHexRoot(), "ipfs://")

    return { cubesNFT, owner, otherAccount, otherAccount2, otherAccount3, tree }
  }

  describe("Deployment", function () {
    it("Should read public parameters", async function () {
      const { cubesNFT, owner, tree } = await loadFixture(deployCubesNFTFixture)

      const publicSale = await cubesNFT.PUBLIC_SALE_TIME()
      const publicPrice = await cubesNFT.PUBLIC_SALE_PRICE()
      const whitelistRoot = await cubesNFT.WHITELIST_ROOT()
      await cubesNFT.mint(1, tree.getHexProof(keccak256(owner.address)))
      const baseURI = await cubesNFT.tokenURI(0)

      expect(ethers.BigNumber.from(publicSale).toNumber()).to.be.greaterThan((await time.latest()))
      expect(ethers.BigNumber.from(publicPrice)).to.equal(ethers.utils.parseUnits("6", 15))
      expect(whitelistRoot).to.equal(tree.getHexRoot())
      expect(baseURI).to.equal("ipfs://0")
    })
  })

  describe("Parameters", function () {
    it("Should change all public parameters", async function () {
      const { cubesNFT, owner, tree } = await loadFixture(deployCubesNFTFixture)
      
      await cubesNFT.mint(1, tree.getHexProof(keccak256(owner.address)))
      const newSaleTime = (await time.latest()) + 1e5

      await cubesNFT.setPublicSaleTime(newSaleTime)
      await cubesNFT.setPublicSalePrice(ethers.utils.parseUnits("1", 15))
      await cubesNFT.setWhitelistRoot(ethers.constants.HashZero)
      await cubesNFT.setBaseURI("ipfs2://")

      const publicSale = await cubesNFT.PUBLIC_SALE_TIME()
      const publicPrice = await cubesNFT.PUBLIC_SALE_PRICE()
      const whitelistRoot = await cubesNFT.WHITELIST_ROOT()
      const baseURI = await cubesNFT.tokenURI(0)

      expect(ethers.BigNumber.from(publicSale).toNumber()).to.equal(newSaleTime)
      expect(ethers.BigNumber.from(publicPrice)).to.equal(ethers.utils.parseUnits("1", 15))
      expect(whitelistRoot).to.equal(ethers.constants.HashZero)
      expect(baseURI).to.equal("ipfs2://0")
    })
  })

  describe("Mint", function () {
    it("Should not allow mint before time", async function () {
      const { cubesNFT, otherAccount3 } = await loadFixture(deployCubesNFTFixture)

      await expect(cubesNFT.connect(otherAccount3).mint(1, [ethers.constants.HashZero])).to.be.revertedWith('Wallet not whitelisted')
    })

    it("Should allow early mint for free", async function () {
      const { cubesNFT, owner, tree } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.mint(1, tree.getHexProof(keccak256(owner.address)))
      expect(await cubesNFT.balanceOf(owner.address)).to.be.equal(1)
    })

    it("Should not allow public mint for free", async function () {
      const { cubesNFT, otherAccount3 } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.setPublicSaleTime(await time.latest() - 100)
      await expect(cubesNFT.connect(otherAccount3).mint(1, [ethers.constants.HashZero])).to.be.revertedWith('Insufficient price to purchase')
    })

    it("Should allow public mint for a fee", async function () {
      const { cubesNFT, otherAccount3, tree } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.setPublicSaleTime(await time.latest() - 100)
      await cubesNFT.connect(otherAccount3).mint(3, tree.getHexProof(keccak256(otherAccount3.address)), { value: ethers.utils.parseUnits("18", 15) })
      expect(await cubesNFT.balanceOf(otherAccount3.address)).to.be.equal(3)
    })
  })
})
