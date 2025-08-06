import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, User, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import the existing student calendar and new course calendar
import { StudentCalendarTab } from "./StudentCalendarTab";
import { CourseCalendarTab } from "./CourseCalendarTab";

export function CalendarTab({ students, courses }) {
  return (
    <div className="space-y-6">
      {/* Calendar Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Schedules
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Course Schedules
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <StudentCalendarTab students={students} />
            </TabsContent>

            <TabsContent value="courses">
              <CourseCalendarTab courses={courses} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}