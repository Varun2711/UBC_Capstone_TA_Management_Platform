import { useState, useEffect } from "react";
import { InstructorSidebar } from "@/components/instructor-dashboard-sidebar";
import { Badge } from "@/components/ui/badge";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import axios from "axios";
import CourseDetails from "@/pages/Instructor/CourseDetails";

export default function MyCourses() {
  const [terms, setTerms] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [currTerm, setCurrTerm] = useState("all");
  const [termType, setTermType] = useState("winter");
  const [selectedYear, setSelectedYear] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionYear, setSessionYear] = useState(
    "All Years Winter - All Terms"
  );
  const [courseOfferings, setCourseOfferings] = useState([]);
  const [termOfferings, setTermOfferings] = useState([]);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const token = sessionStorage.getItem("accessToken"); // or wherever you store it

        const response = await axios.get("/api/course-term-service/terms/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        const termsData = data.results || [];
        setTerms(termsData);

        // Extract unique academic years from terms data
        const years = termsData
          .map((term) => term.academicYear)
          .filter((year, index, self) => self.indexOf(year) === index) // Remove duplicates
          .sort((a, b) => b.localeCompare(a)); // Sort in descending order (newest first)

        setAvailableYears(years);
      } catch (err) {
        console.error("Failed to fetch terms:", err);
      }
    };

    fetchTerms();
  }, []);

  useEffect(() => {
    const fetchCourseOfferings = async () => {
      try {
        // get token from session
        const token = sessionStorage.getItem("accessToken");

        // get instructor Profile
        const profileResponse = await axios.get("/api/profile/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const instructorId = profileResponse.data.id;

        console.log(instructorId);

        const response = await axios.get(
          `/api/course-term-service/course-offerings/by_instructor/?instructor_id=${instructorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;
        console.log("Course offerings API response:", data);
        setCourseOfferings(data || []);
      } catch (err) {
        console.error("Failed to fetch course offerings:", err);
      }
    };

    fetchCourseOfferings();
  }, []);

  // Separate useEffect to monitor terms state changes
  useEffect(() => {
    console.log("Terms state updated:", terms);
  }, [terms]);

  // Monitor course offerings state changes
  useEffect(() => {
    console.log("Course offerings state updated:", courseOfferings);
  }, [courseOfferings]);

  useEffect(() => {
    console.log(
      "Filtering courseOfferings based on currTerm:",
      currTerm,
      "termType:",
      termType,
      "selectedYear:",
      selectedYear,
      "statusFilter:",
      statusFilter,
      "searchQuery:",
      searchQuery
    );
    console.log("Available courseOfferings:", courseOfferings);
    console.log("Available terms:", terms);

    let filteredOfferings = courseOfferings;

    // First filter by academic year
    if (selectedYear !== "all") {
      filteredOfferings = filteredOfferings.filter((offering) => {
        // Find the corresponding term for this offering using term_info
        const term = terms.find((t) => t.code === offering.term_info);
        return term && term.academicYear === selectedYear;
      });
    }

    // Then filter by term type (Winter/Summer)
    if (termType === "winter") {
      filteredOfferings = filteredOfferings.filter((offering) => {
        const term = terms.find((t) => t.code === offering.term_info);
        return term && term.term_type === "winter";
      });
    } else if (termType === "summer") {
      filteredOfferings = filteredOfferings.filter((offering) => {
        const term = terms.find((t) => t.code === offering.term_info);
        return term && term.term_type === "summer";
      });
    }

    // Filter by term (Term 1, Term 2, Both Terms, All Terms)
    if (currTerm === "term1") {
      // Filter for Term 1 courses using term_info that contains "Term 1"
      filteredOfferings = filteredOfferings.filter((offering) => {
        const termCode = offering.term_info?.toLowerCase();
        return termCode?.includes("term 1");
      });
    } else if (currTerm === "term2") {
      // Filter for Term 2 courses using term_info that contains "Term 2"
      filteredOfferings = filteredOfferings.filter((offering) => {
        const termCode = offering.term_info?.toLowerCase();
        return termCode?.includes("term 2");
      });
    } else if (currTerm === "both") {
      // Filter for courses that span both terms (terms without specific "Term 1" or "Term 2")
      filteredOfferings = filteredOfferings.filter((offering) => {
        const termCode = offering.term_info?.toLowerCase();
        return !termCode?.includes("term 1") && !termCode?.includes("term 2");
      });
    }

    // Filter by status (Active/Inactive)
    if (statusFilter === "active") {
      filteredOfferings = filteredOfferings.filter(
        (offering) => offering.is_active === true
      );
    } else if (statusFilter === "inactive") {
      filteredOfferings = filteredOfferings.filter(
        (offering) => offering.is_active === false
      );
    }

    // Finally filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filteredOfferings = filteredOfferings.filter((offering) => {
        return (
          offering.course_info?.toLowerCase().includes(query) ||
          offering.course_description?.toLowerCase().includes(query) ||
          offering.section_number?.toLowerCase().includes(query)
        );
      });
    }

    console.log("Final filtered offerings:", filteredOfferings);
    setTermOfferings([...filteredOfferings]);
  }, [
    currTerm,
    termType,
    selectedYear,
    statusFilter,
    searchQuery,
    courseOfferings,
    terms,
  ]);

  const handleTermSelect = (e) => {
    const newTermValue = e.target.value;
    setCurrTerm(newTermValue);
    updateSessionYearDisplay(newTermValue, termType, selectedYear);
  };

  const handleTermTypeSelect = (e) => {
    const newTermType = e.target.value;
    setTermType(newTermType);
    updateSessionYearDisplay(currTerm, newTermType, selectedYear);
  };

  const handleYearSelect = (e) => {
    const newYear = e.target.value;
    setSelectedYear(newYear);
    updateSessionYearDisplay(currTerm, termType, newYear);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearFilters = () => {
    setCurrTerm("all");
    setTermType("winter");
    setSelectedYear("all");
    setStatusFilter("all");
    setSearchQuery("");
    updateSessionYearDisplay("all", "winter", "all");
  };

  const updateSessionYearDisplay = (term, type, year) => {
    const termTypeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
    const yearDisplay = year === "all" ? "All Years" : year;

    if (term === "all") {
      setSessionYear(`${yearDisplay} ${termTypeCapitalized} - All Terms`);
    } else if (term === "term1") {
      setSessionYear(`${yearDisplay} ${termTypeCapitalized} - Term 1`);
    } else if (term === "term2") {
      setSessionYear(`${yearDisplay} ${termTypeCapitalized} - Term 2`);
    } else if (term === "both") {
      setSessionYear(`${yearDisplay} ${termTypeCapitalized} - Both Terms`);
    }
  };

  // const handleClear = (e) => {
  //   console.log("cleared filters");
  // };

  return (
    <SidebarProvider>
      {/* Instructor Sidebar */}
      <InstructorSidebar activePage="My Courses" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>My Courses</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Main page heading */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {" "}
            My Courses{" "}
          </h1>
          <p className="text-muted-foreground text-sm">
            Current Academic Session: {sessionYear}
            {statusFilter !== "all" && (
              <span className="ml-2 text-blue-600">
                • Showing {statusFilter} courses only
              </span>
            )}
            {searchQuery && (
              <span className="ml-2 text-green-600">
                • Filtered by: "{searchQuery}"
              </span>
            )}
          </p>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
            {/* Search input
            <input
              type="text"
              placeholder="Search by title or course number..."
              className="w-full md:w-1/3 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              // TODO: onChange event here
            /> */}

            {/* Filter by Year */}
            <select
              className="w-full md:w-[150px] px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedYear}
              onChange={handleYearSelect}
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* Filter by Term Type */}
            <select
              className="w-full md:w-[150px] px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={termType}
              onChange={handleTermTypeSelect}
            >
              <option value="winter">Winter</option>
              <option value="summer">Summer</option>
            </select>

            {/* Filter by Term */}
            <select
              className="w-full md:w-[150px] px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={currTerm}
              onChange={handleTermSelect}
            >
              <option value="all">All Terms</option>
              <option value="term1">Term 1</option>
              <option value="term2">Term 2</option>
              <option value="both">Both Terms</option>
            </select>

            {/* Filter by Status */}
            <select
              className="w-full md:w-[150px] px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Search and Clear Filters Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search by course title, course number, or section..."
              className="w-full md:w-1/2 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={handleSearchChange}
            />

            {/* Clear Filters Button */}
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Display term courses (conditionally rendered, show <div> if no courses to display) */}
          <section>
            {/* <h3 className="text-lg font-semibold"> Term 1 </h3> */}

            {termOfferings.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                {termOfferings.map((offering) => (
                  <Card
                    key={offering.course_offering_id}
                    className="w-full min-h-[200px] flex flex-col justify-between transition-shadow hover:shadow-md rounded-xl"
                  >
                    <CardHeader>
                      <CardTitle>
                        {" "}
                        {offering.course_info.substring(9)}{" "}
                      </CardTitle>
                      <CardDescription>
                        {offering.course_info.substring(0, 9)} -{" "}
                        {offering.section_number}{" "}
                      </CardDescription>
                      {offering.course_description}
                    </CardHeader>
                    <CardContent>
                      {/* todo: this should go to the Course Details page that shows TA allocations across the whole course,
                                            but that is a completely separate issue */}
                      <div className="mb-2">
                        <Badge
                          variant={offering.is_active ? "default" : "secondary"}
                          className={
                            offering.is_active
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {offering.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <Link
                        to={`/course-details/${offering.course_id}/${offering.term_info}`}
                        className="text-primary font-medium underline underline-offset-4"
                      >
                        View Details
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p>You are not teaching any courses for the selected term</p>
            )}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
