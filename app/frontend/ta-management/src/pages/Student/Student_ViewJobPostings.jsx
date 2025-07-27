import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, MapPin, Clock, Users } from "lucide-react";
import axios from "axios";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/student-dashboard-sidebar";
import { getProfile } from "@/logic/student-profile";

const instance = axios.create({
  baseURL: "http://localhost:8080/api",
});

export default function ViewJobPostings() {
  const navigate = useNavigate();
  const [jobPostings, setJobPostings] = useState([]);
  //const [applications, SetApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState();

  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        // Fetch only open/active job postings
        const response = await instance.get("/ajp/jobpostings/", {
          params: {
            status: "open", // Only show open positions
          },
        });
        setJobPostings(response.data);
        //console.log(response.data);
      } catch (err) {
        setError("Failed to load job postings");
        console.error("Error fetching job postings:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      try {
        const profile = await getProfile();
        setUserData(profile);
        console.log("User Profile:", profile);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchJobPostings();
    fetchUserData();
  }, []);

  const handleApply = (postingId) => {
    navigate(`/apply/jobposting/${postingId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading job postings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          name={`${userData.first_name} ${userData.last_Name || ""}`}
          email={userData.email}
          avatar={userData.avatar}
        />

        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
            <div className="min-h-screen bg-gray-50 py-8">
              <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Available TA Positions
                  </h1>
                  <p className="text-gray-600">
                    Browse and apply for Teaching Assistant positions
                  </p>
                </div>

                {/* Job Postings Grid */}
                {jobPostings.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Open Positions
                      </h3>
                      <p className="text-gray-500">
                        There are currently no open TA positions. Check back
                        later!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                    {jobPostings.map((posting) => (
                      <Card
                        key={posting.posting_id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl mb-2">
                                {posting.title ||
                                  `TA Position - ${posting.department?.name}`}
                              </CardTitle>
                              <CardDescription className="text-base">
                                {posting.department?.name}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                posting.status === "open"
                                  ? "default"
                                  : "secondary"
                              }
                              className="ml-2"
                            >
                              {posting.status}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent>
                          {/* Description */}
                          {posting.description && (
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {posting.description}
                            </p>
                          )}

                          {/* Job Details */}
                          <div className="space-y-2 mb-4">
                            {posting.term && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Term: {posting.term.description}</span>
                              </div>
                            )}

                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>
                                Posted: {formatDate(posting.post_date)}
                              </span>
                            </div>

                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>
                                Deadline: {formatDate(posting.deadline_date)}
                              </span>
                            </div>
                          </div>

                          {/* Requirements */}
                          {posting.requirements && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">
                                Requirements:
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {posting.requirements}
                              </p>
                            </div>
                          )}

                          {/* Apply Button */}
                          <div className="flex justify-end pt-4 border-t">
                            {/* <span className="text-sm text-gray-500">
                      ID: #{posting.posting_id}
                    </span> */}
                            <Button
                              onClick={() => handleApply(posting.posting_id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Apply Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Back to Dashboard */}
                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/student-dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
