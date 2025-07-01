import { Badge } from "@/components/ui/badge";

export function SessionItem({ session, type }) {
  const bgColor = type === "labs" ? "bg-blue-50/50" : "bg-green-50/50";
  const dotColor = type === "labs" ? "bg-blue-500" : "bg-green-500";

  return (
    <div data-testid="container" className={`flex items-center justify-between p-3 border rounded-lg ${bgColor}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 ${dotColor} rounded-full`} data-testid="dot"></div>
        <div>
          <div className="font-medium text-sm">{session.section}</div>
          <div className="text-xs text-muted-foreground">
            {session.day} {session.time} • {session.location}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 text-sm">
        {session.taAssigned ? (
          <Badge variant="default" data-testid="badge-default">{session.taAssigned}</Badge>
        ) : (
          <Badge variant="destructive" data-testid="badge-destructive">No TA</Badge>
        )}
      </div>
    </div>
  );
}