import { useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";

// Import logic layer constants
import {
  APPLICATION_STATUS_OPTIONS,
  POSITION_TYPE_OPTIONS,
  TERM_CODE_OPTIONS,
  DISCIPLINE_OPTIONS,
  WORKLOAD_OPTIONS,
  YES_NO_OPTIONS,
} from "@/logic/application-management";

export default function SearchFilters({
  searchQuery,
  setSearchQuery,
  filters,
  handleFilterChange,
  clearFilters,
  showAllStatusOptions = false, // Option to show all status options or just submitted/accepted
}) {
  // Filter status options based on context
  const getStatusOptions = () => {
    if (showAllStatusOptions) {
      return APPLICATION_STATUS_OPTIONS;
    }
    // For management page, typically only show submitted and accepted
    return APPLICATION_STATUS_OPTIONS.filter(
      (option) =>
        option.value === "" ||
        option.value === "submitted" ||
        option.value === "accepted"
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Filters & Search</h3>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by student name, number, or posting title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-2 py-2 border text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {getStatusOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Position Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Position Type
            </label>
            <select
              value={filters.positionType || ""}
              onChange={(e) =>
                handleFilterChange("positionType", e.target.value)
              }
              className="w-full px-2 py-2 border text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {POSITION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Discipline Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Discipline
            </label>
            <select
              value={filters.discipline || ""}
              onChange={(e) => handleFilterChange("discipline", e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {DISCIPLINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Term Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Term
            </label>
            <select
              value={filters.term_code || ""}
              onChange={(e) => handleFilterChange("term_code", e.target.value)}
              className="w-full px-2 py-2 border text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {TERM_CODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Workload Filter - Optional */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Workload
            </label>
            <select
              value={filters.workload || ""}
              onChange={(e) => handleFilterChange("workload", e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {WORKLOAD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Additional Filters Row - Optional */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-200">
          {/* Full-time Enrollment Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full-time Enrollment
            </label>
            <select
              value={filters.fullTimeEnrollment || ""}
              onChange={(e) =>
                handleFilterChange("fullTimeEnrollment", e.target.value)
              }
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {YES_NO_OPTIONS.map((option) => (
                <option key={`fullTime-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Has Other Positions Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Has Other Positions
            </label>
            <select
              value={filters.hasOtherPositions || ""}
              onChange={(e) =>
                handleFilterChange("hasOtherPositions", e.target.value)
              }
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {YES_NO_OPTIONS.map((option) => (
                <option
                  key={`otherPositions-${option.value}`}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              {Object.values(filters).filter(Boolean).length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {Object.values(filters).filter(Boolean).length} filter
                  {Object.values(filters).filter(Boolean).length !== 1
                    ? "s"
                    : ""}{" "}
                  active
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                  Search: "{searchQuery.substring(0, 20)}
                  {searchQuery.length > 20 ? "..." : ""}"
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
