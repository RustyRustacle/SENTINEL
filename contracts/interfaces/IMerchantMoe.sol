// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMerchantMoe — Merchant Moe DEX Router Interface
 * @notice Swap router for executing trades on Merchant Moe (Mantle)
 */
interface IMerchantMoe {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}
