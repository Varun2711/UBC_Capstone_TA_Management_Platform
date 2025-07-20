"use client"

import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function RequirementsFilters({
  searchQuery,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  selectedYear,
  onYearChange,
  selectedTerm,
  onTermChange,
  departments,
  years,
  terms,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search instructors by Name, ID or Email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTerm} onValueChange={onTermChange}>
          <SelectTrigger className="w-full sm:w-56"> {/* Increased from w-48 to w-56 for "Winter Both Terms" */}
            <SelectValue placeholder="Term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {terms.map((term) => (
              <SelectItem key={term} value={term}>
                {term}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>
          Showing {selectedDepartment !== "all" ? selectedDepartment : "all departments"} • {selectedYear !== "all" ? selectedYear : "all years"} • {selectedTerm !== "all" ? selectedTerm : "all terms"}
        </span>
      </div>
    </div>
  )
}