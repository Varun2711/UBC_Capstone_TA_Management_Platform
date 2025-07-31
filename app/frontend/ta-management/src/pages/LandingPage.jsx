import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  getOpenJobPostings, 
  transformJobPostingsData, 
  formatDate, 
  getDaysUntilDeadline
} from "@/logic/landingPage";
import { 
  CalendarDays, 
  AlertCircle,
  CheckCircle,
  GraduationCap,
  ArrowRight,
  Briefcase,
  Users,
  BookOpen
} from "lucide-react";

export function LandingPage() {
    const navigate = useNavigate();
    const [jobData, setJobData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobPostings = async () => {
            try {
                setLoading(true);
                const rawData = await getOpenJobPostings();
                const transformedData = transformJobPostingsData(rawData);
                setJobData(transformedData);
            } catch (err) {
                setError('Failed to load job postings. Please try again later.');
                console.error('Error fetching job postings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchJobPostings();
    }, []);

    // Filter out expired postings
    const activePostings = jobData ? jobData.activePostings.filter(posting => {
        if (!posting.deadline_date) return true;
        const deadline = new Date(posting.deadline_date + 'T23:59:59');
        const now = new Date();
        return deadline > now && posting.status === 'open';
    }) : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6" />
                        <span className="font-semibold">UBC CMPS TA Portal</span>
                    </div>
                </header>
                <main className="flex-1 space-y-6 p-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-64" />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6" />
                        <span className="font-semibold">UBC CMPS TA Portal</span>
                    </div>
                </header>
                <main className="flex-1 space-y-6 p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="text-center">
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6" />
                    <span className="font-semibold">UBC CMPS TA Portal</span>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <Button variant="outline" onClick={() => navigate("/login")}>
                        Login
                    </Button>
                    <Button onClick={() => navigate("/create-account/step1")}>
                        Create Account
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
                        Become a Teaching Assistant
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                        Join the Department of Computer Science, Mathematics, Physics and Statistics 
                        as a Teaching Assistant and make a difference in student education.
                    </p>
                    
                    {/* Application Status */}
                    {activePostings.length > 0 ? (
                        <Alert className="max-w-2xl mx-auto border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                                <span className="font-medium text-green-800">
                                    Applications are currently open! 
                                </span>
                                <span className="text-green-700">
                                    {" "}{activePostings.length} position{activePostings.length > 1 ? 's' : ''} available.
                                </span>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="max-w-2xl mx-auto border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription>
                                <span className="font-medium text-orange-800">
                                    No active applications at this time.
                                </span>
                                <span className="text-orange-700">
                                    {" "}Please check back later for new job openings.
                                </span>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Call to Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                        {activePostings.length > 0 ? (
                            <>
                                <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/create-account/step1")}>
                                    Apply Now
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button variant="outline" size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/login")}>
                                    Login to Existing Account
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/create-account/step1")}>
                                    Create Account to Apply
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button variant="outline" size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/login")}>
                                    Login
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Available Positions Section - Only show if there are active postings */}
            {activePostings.length > 0 && (
                <section className="py-16 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Available Positions
                            </h2>
                            <p className="text-lg text-gray-600">
                                Explore current teaching assistant opportunities
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {activePostings.slice(0, 6).map((posting) => {
                                const daysUntilDeadline = getDaysUntilDeadline(posting.deadline_date);
                                const isUrgent = daysUntilDeadline && daysUntilDeadline <= 7 && daysUntilDeadline > 0;
                                
                                return (
                                    <Card key={posting.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary">
                                                    {posting.department}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {posting.termCode || posting.term}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg">{posting.title}</CardTitle>
                                        </CardHeader>
                                        
                                        <CardContent className="space-y-4">
                                            {posting.deadline_date && (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        <span>Deadline: {formatDate(posting.deadline_date)}</span>
                                                    </div>
                                                    {daysUntilDeadline !== null && (
                                                        <Badge variant={isUrgent ? 'destructive' : 'outline'}>
                                                            {daysUntilDeadline} days left
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {posting.description && (
                                                <CardDescription className="line-clamp-3">
                                                    {posting.description}
                                                </CardDescription>
                                            )}

                                            <Button 
                                                className="w-full" 
                                                onClick={() => navigate("/create-account/step1")}
                                            >
                                                Apply for this Position
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {activePostings.length > 6 && (
                            <div className="text-center mt-8">
                                <Button variant="outline" onClick={() => navigate("/create-account/step1")}>
                                    View All {activePostings.length} Positions
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Why Become a TA Section */}
            <section className="bg-gray-50 py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why Become a Teaching Assistant?
                    </h2>
                    
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Make an Impact</h3>
                            <p className="text-gray-600">
                                Help fellow students succeed in their academic journey and develop your leadership skills.
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Gain Experience</h3>
                            <p className="text-gray-600">
                                Build valuable teaching and communication skills while deepening your subject knowledge.
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Career Development</h3>
                            <p className="text-gray-600">
                                Enhance your resume with teaching experience and earn income while studying.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-white py-8 px-6">
                <div className="max-w-4xl mx-auto text-center text-sm text-gray-600">
                    <p className="mb-2">&copy; 2025 University of British Columbia</p>
                    <p>Department of Computer Science, Mathematics, Physics and Statistics</p>
                </div>
            </footer>
        </div>
    );
}