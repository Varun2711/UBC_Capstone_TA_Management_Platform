import { InstructorSidebar } from "@/components/instructor-dashboard-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useCurrentAcademicSession } from "@/hooks/useCurrentAcademicSession";
import { useMyCourses } from "@/hooks/useMyCourses";

export default function MyCourses() {
    // State
    const { data: session, loading: sessionLoading } = useCurrentAcademicSession();
    const { data, loading: coursesLoading } = useMyCourses();
    const courses = data?.courses; // destructure to get courses array
    
    if(sessionLoading || coursesLoading) return <div> Loading... </div>;

    // Light data processing: separate courses into term 1 and term 2 so easier to display
    const term1Courses = courses.filter(course => course.term_number === 1);
    const term2Courses = courses.filter(course => course.term_number === 2);

    return(
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
                                <BreadcrumbPage>
                                    My Courses
                                </BreadcrumbPage>
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
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight"> My Courses </h1>
                    <p className="text-muted-foreground"> Current Session: { session.academic_year + " " + session.term_type } </p>

                    {/* Display term 1 courses (conditionally rendered, show <div> if no courses to display) */}
                    <section>
                        <h3 className="text-lg font-semibold"> Term 1 </h3>

                        {term1Courses.length > 0 ? (

                            <div className="flex flex-row gap-4 flex-wrap">
                                {term1Courses.map(course => (
                                    <Card 
                                        key = { course.id }
                                    >
                                        <CardHeader>
                                            <CardTitle> { course.title } </CardTitle>
                                            <CardDescription> { course.course_number } - { course.section } </CardDescription>  
                                        </CardHeader>
                                        <CardContent>
                                            {/* todo: this should go to the Course Details page that shows TA allocations across the whole course,
                                            but that is a completely separate issue */}
                                            <Link
                                                to={`/`}
                                                className="text-primary font-medium underline underline-offset-4"
                                            >
                                                View Details
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p>You are not teaching any courses in Term 1</p>
                        )}
                    </section>

                    {/* Display term 2 courses (conditionally rendered, show <div> if no courses to display) */}
                    <section>
                        <h3 className="text-lg font-semibold"> Term 2 </h3>
                        
                        {term2Courses.length > 0 ? (

                            <div className="flex flex-row gap-4 flex-wrap">
                                {term2Courses.map(course => (
                                    <Card 
                                        key = { course.id }
                                    >
                                        <CardHeader>
                                            <CardTitle> { course.title } </CardTitle>
                                            <CardDescription> { course.course_number } - { course.section } </CardDescription>  
                                        </CardHeader>                          
                                        <CardContent>
                                            {/* todo: this should go to the Course Details page that shows TA allocations across the whole course */}
                                            <Link
                                                to={`/`}
                                                className="text-primary font-medium underline underline-offset-4"
                                            >
                                                View Details
                                            </Link>
                                    </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p>You are not teaching any courses in Term 2</p>
                        )}
                    </section>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}