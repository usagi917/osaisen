import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SaisenRouter, OfferingsNFT1155, MockERC20 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SaisenRouter", function () {
  const JPYC_DECIMALS = 18;
  const MIN_SAISEN = ethers.parseUnits("115", JPYC_DECIMALS); // 115 JPYC
  const INITIAL_BALANCE = ethers.parseUnits("10000", JPYC_DECIMALS);

  async function deployFixture() {
    const [owner, user, treasury] = await ethers.getSigners();

    // Deploy MockERC20 (JPYC)
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const jpyc = await MockERC20Factory.deploy("JPY Coin", "JPYC", JPYC_DECIMALS);

    // Deploy OfferingsNFT1155
    const NFTFactory = await ethers.getContractFactory("OfferingsNFT1155");
    const nft = await NFTFactory.deploy("https://example.com/metadata/");

    // Deploy SaisenRouter
    const RouterFactory = await ethers.getContractFactory("SaisenRouter");
    const router = await RouterFactory.deploy(
      await jpyc.getAddress(),
      await nft.getAddress(),
      treasury.address,
      MIN_SAISEN
    );

    // Grant MINTER_ROLE to router
    const MINTER_ROLE = await nft.MINTER_ROLE();
    await nft.grantRole(MINTER_ROLE, await router.getAddress());

    // Mint JPYC to user and approve router
    await jpyc.mint(user.address, INITIAL_BALANCE);
    await jpyc.connect(user).approve(await router.getAddress(), ethers.MaxUint256);

    return { router, nft, jpyc, owner, user, treasury };
  }

  describe("Constructor", function () {
    it("should set immutable variables correctly", async function () {
      const { router, jpyc, nft, treasury } = await loadFixture(deployFixture);
      expect(await router.jpyc()).to.equal(await jpyc.getAddress());
      expect(await router.nft()).to.equal(await nft.getAddress());
      expect(await router.treasury()).to.equal(treasury.address);
      expect(await router.minSaisen()).to.equal(MIN_SAISEN);
    });

    it("should revert when jpyc is zero address", async function () {
      const { nft, treasury, router } = await loadFixture(deployFixture);
      const RouterFactory = await ethers.getContractFactory("SaisenRouter");
      await expect(
        RouterFactory.deploy(
          ethers.ZeroAddress,
          await nft.getAddress(),
          treasury.address,
          MIN_SAISEN
        )
      ).to.be.revertedWithCustomError(router, "ZeroAddress");
    });

    it("should revert when nft is zero address", async function () {
      const { jpyc, treasury, router } = await loadFixture(deployFixture);
      const RouterFactory = await ethers.getContractFactory("SaisenRouter");
      await expect(
        RouterFactory.deploy(
          await jpyc.getAddress(),
          ethers.ZeroAddress,
          treasury.address,
          MIN_SAISEN
        )
      ).to.be.revertedWithCustomError(router, "ZeroAddress");
    });

    it("should revert when treasury is zero address", async function () {
      const { jpyc, nft, router } = await loadFixture(deployFixture);
      const RouterFactory = await ethers.getContractFactory("SaisenRouter");
      await expect(
        RouterFactory.deploy(
          await jpyc.getAddress(),
          await nft.getAddress(),
          ethers.ZeroAddress,
          MIN_SAISEN
        )
      ).to.be.revertedWithCustomError(router, "ZeroAddress");
    });
  });

  describe("saisen()", function () {
    it("should revert when amount is below minimum", async function () {
      const { router, user } = await loadFixture(deployFixture);
      const belowMin = MIN_SAISEN - 1n;
      await expect(
        router.connect(user).saisen(belowMin)
      ).to.be.revertedWithCustomError(router, "AmountBelowMinimum");
    });

    it("should transfer JPYC to treasury on first offering", async function () {
      const { router, jpyc, user, treasury } = await loadFixture(deployFixture);
      const amount = MIN_SAISEN;
      const treasuryBalanceBefore = await jpyc.balanceOf(treasury.address);

      await router.connect(user).saisen(amount);

      const treasuryBalanceAfter = await jpyc.balanceOf(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(amount);
    });

    it("should mint NFT on first offering of the month", async function () {
      const { router, nft, user } = await loadFixture(deployFixture);
      const amount = MIN_SAISEN;
      const monthId = await router.getCurrentMonthId();

      await router.connect(user).saisen(amount);

      const balance = await nft.balanceOf(user.address, monthId);
      expect(balance).to.equal(1);
    });

    it("should emit Saisen event with minted=true on first offering", async function () {
      const { router, user } = await loadFixture(deployFixture);
      const amount = MIN_SAISEN;
      const monthId = await router.getCurrentMonthId();

      await expect(router.connect(user).saisen(amount))
        .to.emit(router, "Saisen")
        .withArgs(user.address, amount, monthId, true);
    });

    it("should transfer JPYC but not mint NFT on second offering same month", async function () {
      const { router, nft, jpyc, user, treasury } = await loadFixture(deployFixture);
      const amount = MIN_SAISEN;
      const monthId = await router.getCurrentMonthId();

      // First offering
      await router.connect(user).saisen(amount);
      const nftBalanceAfterFirst = await nft.balanceOf(user.address, monthId);
      expect(nftBalanceAfterFirst).to.equal(1);

      // Second offering
      const treasuryBalanceBefore = await jpyc.balanceOf(treasury.address);
      await router.connect(user).saisen(amount);
      const treasuryBalanceAfter = await jpyc.balanceOf(treasury.address);

      // Treasury should receive JPYC
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(amount);

      // NFT balance should remain 1
      const nftBalanceAfterSecond = await nft.balanceOf(user.address, monthId);
      expect(nftBalanceAfterSecond).to.equal(1);
    });

    it("should emit Saisen event with minted=false on second offering same month", async function () {
      const { router, user } = await loadFixture(deployFixture);
      const amount = MIN_SAISEN;
      const monthId = await router.getCurrentMonthId();

      // First offering
      await router.connect(user).saisen(amount);

      // Second offering
      await expect(router.connect(user).saisen(amount))
        .to.emit(router, "Saisen")
        .withArgs(user.address, amount, monthId, false);
    });

    it("should mint new NFT in next month", async function () {
      const { router, nft, user } = await loadFixture(deployFixture);
      const amount = MIN_SAISEN;

      // Set time to January 2026
      await time.increaseTo(new Date("2026-01-15T12:00:00Z").getTime() / 1000);
      const januaryMonthId = await router.getCurrentMonthId();
      expect(januaryMonthId).to.equal(202601n);

      // First offering in January
      await router.connect(user).saisen(amount);
      expect(await nft.balanceOf(user.address, 202601n)).to.equal(1);

      // Move to February
      await time.increaseTo(new Date("2026-02-01T00:00:00Z").getTime() / 1000);
      const februaryMonthId = await router.getCurrentMonthId();
      expect(februaryMonthId).to.equal(202602n);

      // First offering in February
      await expect(router.connect(user).saisen(amount))
        .to.emit(router, "Saisen")
        .withArgs(user.address, amount, 202602n, true);

      expect(await nft.balanceOf(user.address, 202602n)).to.equal(1);
      // January NFT should still be 1
      expect(await nft.balanceOf(user.address, 202601n)).to.equal(1);
    });
  });

  describe("isEligibleForMint()", function () {
    it("should return true before any offerings", async function () {
      const { router, user } = await loadFixture(deployFixture);
      expect(await router.isEligibleForMint(user.address)).to.be.true;
    });

    it("should return false after offering in current month", async function () {
      const { router, user } = await loadFixture(deployFixture);
      await router.connect(user).saisen(MIN_SAISEN);
      expect(await router.isEligibleForMint(user.address)).to.be.false;
    });

    it("should return true again in next month", async function () {
      const { router, user } = await loadFixture(deployFixture);
      // Set time to January 2026
      await time.increaseTo(new Date("2026-01-15T12:00:00Z").getTime() / 1000);

      await router.connect(user).saisen(MIN_SAISEN);
      expect(await router.isEligibleForMint(user.address)).to.be.false;

      // Move to February
      await time.increaseTo(new Date("2026-02-01T00:00:00Z").getTime() / 1000);
      expect(await router.isEligibleForMint(user.address)).to.be.true;
    });
  });

  describe("getCurrentMonthId()", function () {
    it("should return correct month ID for known timestamps", async function () {
      const { router } = await loadFixture(deployFixture);

      // January 1, 2026 00:00:00 UTC
      await time.increaseTo(new Date("2026-01-01T00:00:00Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202601n);

      // December 31, 2026 23:59:59 UTC
      await time.increaseTo(new Date("2026-12-31T23:59:59Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202612n);

      // January 1, 2027 00:00:00 UTC
      await time.increaseTo(new Date("2027-01-01T00:00:00Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202701n);
    });

    it("should handle month boundary correctly (Jan 31 23:59:59 -> Feb 1 00:00:00)", async function () {
      const { router } = await loadFixture(deployFixture);

      // January 31, 2026 23:59:59 UTC
      await time.increaseTo(new Date("2026-01-31T23:59:59Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202601n);

      // February 1, 2026 00:00:00 UTC
      await time.increaseTo(new Date("2026-02-01T00:00:00Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202602n);
    });

    it("should handle leap year February correctly", async function () {
      const { router } = await loadFixture(deployFixture);

      // Use 2028 (leap year in the future)
      // February 28, 2028 23:59:59 UTC
      await time.increaseTo(new Date("2028-02-28T23:59:59Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202802n);

      // February 29, 2028 00:00:00 UTC
      await time.increaseTo(new Date("2028-02-29T00:00:00Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202802n);

      // February 29, 2028 23:59:59 UTC
      await time.increaseTo(new Date("2028-02-29T23:59:59Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202802n);

      // March 1, 2028 00:00:00 UTC
      await time.increaseTo(new Date("2028-03-01T00:00:00Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202803n);
    });

    it("should handle non-leap year February correctly", async function () {
      const { router } = await loadFixture(deployFixture);

      // Use 2027 (not a leap year, in the future)
      // February 28, 2027 23:59:59 UTC
      await time.increaseTo(new Date("2027-02-28T23:59:59Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202702n);

      // March 1, 2027 00:00:00 UTC
      await time.increaseTo(new Date("2027-03-01T00:00:00Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(202703n);
    });

    it("should handle year 2100 (not a leap year despite divisible by 100)", async function () {
      const { router } = await loadFixture(deployFixture);

      // February 28, 2100 23:59:59 UTC
      await time.increaseTo(new Date("2100-02-28T23:59:59Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(210002n);

      // March 1, 2100 00:00:00 UTC (no Feb 29 in 2100)
      await time.increaseTo(new Date("2100-03-01T00:00:00Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(210003n);
    });

    it("should handle year 2400 (leap year despite divisible by 100, because divisible by 400)", async function () {
      const { router } = await loadFixture(deployFixture);

      // February 29, 2400 exists
      await time.increaseTo(new Date("2400-02-29T12:00:00Z").getTime() / 1000);
      expect(await router.getCurrentMonthId()).to.equal(240002n);
    });
  });

  describe("lastMintMonthId", function () {
    it("should be 0 for new users", async function () {
      const { router, user } = await loadFixture(deployFixture);
      expect(await router.lastMintMonthId(user.address)).to.equal(0);
    });

    it("should be updated after first offering", async function () {
      const { router, user } = await loadFixture(deployFixture);
      await time.increaseTo(new Date("2026-01-15T12:00:00Z").getTime() / 1000);
      await router.connect(user).saisen(MIN_SAISEN);
      expect(await router.lastMintMonthId(user.address)).to.equal(202601n);
    });

    it("should not change on second offering in same month", async function () {
      const { router, user } = await loadFixture(deployFixture);
      await time.increaseTo(new Date("2026-01-15T12:00:00Z").getTime() / 1000);
      await router.connect(user).saisen(MIN_SAISEN);
      await router.connect(user).saisen(MIN_SAISEN);
      expect(await router.lastMintMonthId(user.address)).to.equal(202601n);
    });
  });
});
