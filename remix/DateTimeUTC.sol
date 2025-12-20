// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DateTimeUTC {
    uint256 private constant SECONDS_PER_DAY = 86400;

    function getCurrentMonthId() internal view returns (uint256) {
        return getMonthId(block.timestamp);
    }

    function getMonthId(uint256 timestamp) internal pure returns (uint256) {
        (uint256 year, uint256 month, ) = timestampToDate(timestamp);
        return year * 100 + month;
    }

    function timestampToDate(uint256 timestamp)
        internal
        pure
        returns (uint256 year, uint256 month, uint256 day)
    {
        uint256 z = timestamp / SECONDS_PER_DAY;
        z += 719468;
        uint256 era = z / 146097;
        uint256 doe = z - era * 146097;
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        year = yoe + era * 400;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;
        day = doy - (153 * mp + 2) / 5 + 1;
        month = mp < 10 ? mp + 3 : mp - 9;
        if (month <= 2) {
            year += 1;
        }
    }

    function isLeapYear(uint256 year) internal pure returns (bool isLeap) {
        isLeap = (year % 4 == 0) && (year % 100 != 0 || year % 400 == 0);
    }

    function getDaysInMonth(uint256 year, uint256 month) internal pure returns (uint256 daysInMonth) {
        if (month == 2) {
            daysInMonth = isLeapYear(year) ? 29 : 28;
        } else if (month == 4 || month == 6 || month == 9 || month == 11) {
            daysInMonth = 30;
        } else {
            daysInMonth = 31;
        }
    }
}
