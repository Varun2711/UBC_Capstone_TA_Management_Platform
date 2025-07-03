import { useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";

const applicationStatusOptions = [
  { value: "", label: "All Application Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "accepted", label: "Accepted" },
];

const positionTypeOptions = [
  { value: "", label: "All Teaching Positions" }, // Fixed: changed " " to ""
  { value: "UTA", label: "Undergraduate Teaching Assistant" },
  { value: "GTA2", label: "Graduate Teaching Assistant 2 (Masters)" },
  { value: "GTA1", label: "Graduate Teaching Assistant 1 (Ph.D)" },
];

const termCodeOptions = [
  { value: "", label: "All Academic Terms" },
  { value: "W2025BOTH", label: "Winter 2025 Term 1 & 2" },
  { value: "W2025T1", label: "Winter 2025 Term 1" },
  { value: "W2025T2", label: "Winter 2025 Term 2" },
];

const disciplineOptions = [
  { value: "", label: "All Disciplines" },
  { value: "ASTR", label: "ASTR" },
  { value: "COSC", label: "COSC" },
  { value: "DATA", label: "DATA" },
  { value: "MATH", label: "MATH" },
  { value: "PHYS", label: "PHYS" },
  { value: "STAT", label: "STAT" },
];

export default function SearchFilters({
  searchQuery,
  setSearchQuery,
  filters,
  handleFilterChange,
  clearFilters,
}) {
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {applicationStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.positionType}
            onChange={(e) => handleFilterChange("positionType", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {positionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.discipline}
            onChange={(e) => handleFilterChange("discipline", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {disciplineOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Fixed: Changed from termSelection to term_code */}
          <select
            value={filters.term_code}
            onChange={(e) => handleFilterChange("term_code", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {termCodeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.workload}
            onChange={(e) => handleFilterChange("workload", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Workloads</option>
            <option value="6">6 hours</option>
            <option value="12">12 hours</option>
          </select>

          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
