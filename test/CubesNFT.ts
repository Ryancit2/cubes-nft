import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { MerkleTree } from "merkletreejs"
import keccak256 from "keccak256"

describe("CubesNFT", function () {
  async function deployCubesNFTFixture() {
    const [owner, otherAccount, otherAccount2, otherAccount3] = await ethers.getSigners()

    const CubesNFT = await ethers.getContractFactory("CubesNFT")
    const cubesNFT = await CubesNFT.deploy("ipfs://")

    return { cubesNFT, owner, otherAccount, otherAccount2, otherAccount3 }
  }

  describe("Deployment", function () {
    it("Should read public parameters", async function () {
      const { cubesNFT } = await loadFixture(deployCubesNFTFixture)

      const publicSale = await cubesNFT.PUBLIC_SALE_TIME()
      const publicPrice = await cubesNFT.PUBLIC_SALE_PRICE()
      await cubesNFT.mint(1)
      const baseURI = await cubesNFT.tokenURI(0)

      expect(ethers.BigNumber.from(publicSale).toNumber()).to.be.greaterThan((await time.latest()))
      expect(ethers.BigNumber.from(publicPrice)).to.equal(ethers.utils.parseUnits("6", 15))
      expect(baseURI).to.equal("ipfs://0")
    })
  })

  describe("Parameters", function () {
    it("Should change all public parameters", async function () {
      const { cubesNFT } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.mint(1)
      const newSaleTime = (await time.latest()) + 1e5

      await cubesNFT.setPublicSaleTime(newSaleTime)
      await cubesNFT.setPublicSalePrice(ethers.utils.parseUnits("1", 15))
      await cubesNFT.setBaseURI("ipfs2://")

      const publicSale = await cubesNFT.PUBLIC_SALE_TIME()
      const publicPrice = await cubesNFT.PUBLIC_SALE_PRICE()
      const baseURI = await cubesNFT.tokenURI(0)

      expect(ethers.BigNumber.from(publicSale).toNumber()).to.equal(newSaleTime)
      expect(ethers.BigNumber.from(publicPrice)).to.equal(ethers.utils.parseUnits("1", 15))
      expect(baseURI).to.equal("ipfs2://0")
    })
  })

  describe("Mint", function () {
    it("Should not allow multiple mints in presale", async function () {
      const { cubesNFT, otherAccount3 } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.connect(otherAccount3).mint(1)
      await expect(cubesNFT.connect(otherAccount3).mint(1)).to.be.revertedWith('Presale already claimed!')
    })

    it("Should not allow more than 1000 mints in presale", async function () {
      const { cubesNFT, otherAccount3 } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.connect(otherAccount3).mint(1000)
      await expect(cubesNFT.connect(otherAccount3).mint(1)).to.be.revertedWith('Free mint limit reached')
    })

    it("Should allow presale mint for free", async function () {
      const { cubesNFT, owner } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.mint(1)
      expect(await cubesNFT.balanceOf(owner.address)).to.be.equal(1)
    })

    it("Should not allow public mint for free", async function () {
      const { cubesNFT, otherAccount3 } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.setPublicSaleTime(await time.latest() - 100)
      await expect(cubesNFT.connect(otherAccount3).mint(1)).to.be.revertedWith('Insufficient price to purchase')
    })

    it("Should allow public mint for a fee", async function () {
      const { cubesNFT, otherAccount3 } = await loadFixture(deployCubesNFTFixture)

      await cubesNFT.setPublicSaleTime(await time.latest() - 100)
      await cubesNFT.connect(otherAccount3).mint(3, { value: ethers.utils.parseUnits("18", 15) })
      expect(await cubesNFT.balanceOf(otherAccount3.address)).to.be.equal(3)
    })
  })
})
