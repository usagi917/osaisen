// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DateTimeUTC
/// @notice Library to convert Unix timestamp to Gregorian calendar date (UTC).
/// @dev Uses Howard Hinnant's algorithm for civil_from_days.
///      Reference: https://howardhinnant.github.io/date_algorithms.html
library DateTimeUTC {
    uint256 private constant SECONDS_PER_DAY = 86400;

    /// @notice Get the current month ID (YYYYMM) from block.timestamp
    /// @return monthId The month ID in format YYYYMM (e.g., 202601)
    function getCurrentMonthId() internal view returns (uint256) {
        return getMonthId(block.timestamp);
    }

    /// @notice Get month ID (YYYYMM) from a Unix timestamp
    /// @param timestamp Unix timestamp in seconds
    /// @return monthId The month ID in format YYYYMM (e.g., 202601)
    function getMonthId(uint256 timestamp) internal pure returns (uint256) {
        (uint256 year, uint256 month, ) = timestampToDate(timestamp);
        return year * 100 + month;
    }

    /// @notice Convert Unix timestamp to Gregorian date (year, month, day)
    /// @param timestamp Unix timestamp in seconds (UTC)
    /// @return year The year (e.g., 2026)
    /// @return month The month (1-12)
    /// @return day The day of month (1-31)
    function timestampToDate(uint256 timestamp)
        internal
        pure
        returns (uint256 year, uint256 month, uint256 day)
    {
        // Convert timestamp to days since Unix epoch
        uint256 z = timestamp / SECONDS_PER_DAY;

        // Shift epoch from 1970-01-01 to 0000-03-01
        // This simplifies leap year calculations since Feb is now at the end of the year
        z += 719468;

        // Calculate era (400-year period)
        uint256 era = z / 146097;
        uint256 doe = z - era * 146097; // day of era [0, 146096]

        // Calculate year of era
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; // [0, 399]

        // Calculate year
        year = yoe + era * 400;

        // Calculate day of year
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100); // [0, 365]

        // Calculate month and day
        uint256 mp = (5 * doy + 2) / 153; // [0, 11]
        day = doy - (153 * mp + 2) / 5 + 1; // [1, 31]
        month = mp < 10 ? mp + 3 : mp - 9; // [1, 12]

        // Adjust year for months Jan and Feb (they are at the end in the shifted calendar)
        if (month <= 2) {
            year += 1;
        }
    }

    /// @notice Check if a year is a leap year
    /// @param year The year to check
    /// @return isLeap True if the year is a leap year
    function isLeapYear(uint256 year) internal pure returns (bool isLeap) {
        isLeap = (year % 4 == 0) && (year % 100 != 0 || year % 400 == 0);
    }

    /// @notice Get the number of days in a month
    /// @param year The year
    /// @param month The month (1-12)
    /// @return daysInMonth The number of days in the month
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
