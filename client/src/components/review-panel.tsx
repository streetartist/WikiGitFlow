import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Review } from "@shared/schema";

interface ReviewPanelProps {
  documentId: string;
  reviews: Review[];
}

export default function ReviewPanel({ reviews }: ReviewPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "needs_revision":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "needs_revision": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="hidden lg:block w-80 bg-white border-l border-gray-200">
      <Card className="h-full rounded-none border-0 shadow-none">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-lg">
            <MessageSquare className="h-5 w-5 mr-2" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={review.id}>
                  {index > 0 && <Separator />}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(review.status)}
                        <Badge className={getStatusColor(review.status)}>
                          {review.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    {review.comments && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{review.comments}</p>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Review by Admin User
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
