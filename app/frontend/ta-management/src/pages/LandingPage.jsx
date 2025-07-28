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
  getApplicationPeriodStatus,
  getDaysUntilDeadline
} from "@/logic/landingPage";
import { 
  CalendarDays, 
  Users, 
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Building,
  User,
  GraduationCap,
  ArrowRight,
  Briefcase
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

    // Calculate truly active (non-expired) postings
    const activeNonExpiredPostings = jobData ? jobData.activePostings.filter(posting => {
        if (!posting.deadline_date) return true;
        const deadline = new Date(posting.deadline_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadline.setHours(23, 59, 59, 999);
        return deadline >= today && posting.status === 'open';
    }) : [];

    // Fix: Filter the active postings first, then get status
    const applicationStatus = jobData ? getApplicationPeriodStatus(activeNonExpiredPostings) : null;

    console.log('Active postings deadlines:', jobData?.activePostings.map(p => ({
      title: p.title,
      deadline: p.deadline_date,
      status: p.status
    })));

    // Add this additional debug log
    console.log('Application status object:', applicationStatus);
    
    // Add this to see the filtered active postings
    if (jobData) {
      const now = new Date();
      const filtered = jobData.activePostings.filter(posting => {
        if (!posting.deadline_date) return true;
        const deadline = new Date(posting.deadline_date + 'T23:59:59');
        console.log(`Checking ${posting.title}: deadline ${deadline} > now ${now}? ${deadline > now}`);
        return deadline > now && posting.status === 'open';
      });
      console.log('Filtered active postings:', filtered.map(p => ({ title: p.title, deadline: p.deadline_date })));
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6" />
                        <span className="font-semibold">UBC CMPS TA Portal</span>
                    </div>
                </header>

                {/* Loading Content */}
                <main className="flex-1 space-y-6 p-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-32" />
                        ))}
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
                {/* Header */}
                <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6" />
                        <span className="font-semibold">UBC CMPS TA Portal</span>
                    </div>
                </header>

                {/* Error Content */}
                <main className="flex-1 space-y-6 p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error}
                        </AlertDescription>
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

            {/* Main Content */}
            <main className="flex-1 space-y-6 p-6">
                {/* Page Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Teaching Assistant Application Portal
                    </h1>
                    <p className="text-muted-foreground">
                        Department of Computer Science, Mathematics, Physics and Statistics
                    </p>
                </div>

                {/* Application Status Alert */}
                {applicationStatus && (
                    <Alert className={applicationStatus.status === 'open' ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
                        {applicationStatus.status === 'open' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                        )}
                        <AlertDescription>
                            <span className="font-medium">
                                Application Period: {applicationStatus.status === 'open' ? 'Open' : 'Closed'}
                            </span>
                            <br />
                            {applicationStatus.message}
                            {applicationStatus.nextDeadline && (
                                <span> • Next deadline: {applicationStatus.nextDeadline}</span>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stats Cards */}
                {jobData && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeNonExpiredPostings.length}</div>
                                <p className="text-xs text-muted-foreground">Available now</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                                <Building className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{jobData.departments.length}</div>
                                <p className="text-xs text-muted-foreground">Offering positions</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Terms</CardTitle>
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{jobData.terms.length}</div>
                                <p className="text-xs text-muted-foreground">Terms available</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Application Status</CardTitle>
                                {applicationStatus?.status === 'open' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold capitalize">
                                    {applicationStatus?.status || 'Unknown'}
                                </div>
                                <p className="text-xs text-muted-foreground">Current period</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Job Postings Section */}
                {jobData && jobData.activePostings.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Available Positions</h2>
                                <p className="text-sm text-muted-foreground">
                                    Explore teaching assistant opportunities
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {jobData.activePostings.map((posting) => {
                                const daysUntilDeadline = getDaysUntilDeadline(posting.deadline_date);
                                const isUrgent = daysUntilDeadline && daysUntilDeadline <= 7 && daysUntilDeadline > 0;
                                const isExpired = daysUntilDeadline && daysUntilDeadline < 0;
                                
                                return (
                                    <Card key={posting.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between -mx-1">
                                                <Badge variant="secondary" className="ml-0">
                                                    {posting.department}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {posting.termCode || posting.term}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg">{posting.title}</CardTitle>
                                            {posting.created_by && (
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <User className="h-3 w-3 mr-1" />
                                                    Posted by {posting.created_by}
                                                </div>
                                            )}
                                        </CardHeader>
                                        
                                        <CardContent className="space-y-4">
                                            {/* Status and Deadline */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Badge 
                                                        variant={posting.status === 'open' ? 'default' : 'secondary'}
                                                        className={posting.status === 'open' ? 'bg-green-100 text-green-800' : ''}
                                                    >
                                                        {posting.status.toUpperCase()}
                                                    </Badge>
                                                    {daysUntilDeadline !== null && (
                                                        <Badge 
                                                            variant={isExpired ? 'destructive' : isUrgent ? 'default' : 'outline'}
                                                        >
                                                            {isExpired ? 'Expired' : `${daysUntilDeadline} days left`}
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                {posting.deadline_date && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        <span>Deadline: {formatDate(posting.deadline_date)}</span>
                                                    </div>
                                                )}
                                                
                                                {posting.post_date && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Posted: {formatDate(posting.post_date)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description */}
                                            {posting.description && (
                                                <CardDescription className="line-clamp-3">
                                                    {posting.description}
                                                </CardDescription>
                                            )}

                                            {/* Requirements */}
                                            {posting.requirements && (
                                                <div className="text-sm">
                                                    <span className="font-medium">Requirements: </span>
                                                    <span className="text-muted-foreground line-clamp-2">
                                                        {posting.requirements}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Apply Button */}
                                            <Button 
                                                className="w-full" 
                                                onClick={() => navigate("/login")}
                                                disabled={isExpired}
                                            >
                                                {isExpired ? 'Application Closed' : (
                                                    <>
                                                        Apply Now
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center text-center p-12">
                            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                            <CardTitle className="mb-2">No Open Positions</CardTitle>
                            <CardDescription className="mb-4 max-w-md">
                                There are currently no teaching assistant positions available. 
                                Please check back later or create an account to be notified of new openings.
                            </CardDescription>
                            <Button onClick={() => navigate("/create-account/step1")}>
                                Create Account for Updates
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/50 py-6 px-6">
                <div className="text-center text-sm text-muted-foreground">
                    <p>&copy; 2025 Department of Computer Science, Mathematics, Physics and Statistics</p>
                    <p>University of British Columbia</p>
                </div>
            </footer>
        </div>
    );
}