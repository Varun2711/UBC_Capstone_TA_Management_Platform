import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";


export function LandingPage() {
    const navigate = useNavigate()

    return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
            <h1 className={cn("text-3xl font-extrabold text-center")}>
                TA Application Portal
            </h1>

            <div className="flex gap-4">
            <Button variant="default" onClick = { () => navigate("/login") }>Login</Button>
            <Button variant="secondary" onClick = { () => navigate("/register") }>Create Account</Button>
            </div>

            {/* Important Dates Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Important Dates</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Applications are open for the 2025W academic period!</p>
                    <p>Closing date: April 30, 2025</p>
                </CardContent>
            </Card>
        </main>
    )
}