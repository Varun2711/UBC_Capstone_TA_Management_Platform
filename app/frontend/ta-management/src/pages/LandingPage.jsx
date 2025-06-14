import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";


export function LandingPage() {
    const navigate = useNavigate()

    return (
        <main className="min-h-screen flex flex-col items-left justify-center gap-10 p-10">
            <div>
                <h2 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0">
                    Department of Computer Science, Mathematics, Physics and Statistics
                </h2>

                <h1 className={cn("text-6xl font-extrabold")}>
                    TA Application Portal
                </h1>
            </div>

            <div className="flex gap-4">
                <Button variant="default" onClick = { () => navigate("/login") }>Login</Button>
                <Button variant="secondary" onClick = { () => navigate("/register") }>Create An Account</Button>
            </div>

            {/* Important Dates Section */}

            <Card className="w-2/3">
                <CardHeader>
                    <CardTitle> Active Application Period: Winter 2025 </CardTitle>
                    <CardDescription> Positions available for Term 1: September - December, and Term 2: January - April </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Open date: February 26, 2025</p>
                    <p>Close date: April 30, 2025</p>
                </CardContent>
            </Card>
        </main>
    )
}