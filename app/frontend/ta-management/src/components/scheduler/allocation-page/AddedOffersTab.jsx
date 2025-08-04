import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchCourseOfferingDetails, editOffer, sendOffer, deleteOffer } from "@/logic/coordinator-allocations-page";

const AddedOffersTab = ({
  offers,
  setOffers,
  fetchOffers,
  activeOffers,
  setActiveOffers,
  studentCurrentHours,
  setStudentCurrentHours,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null); // { offerId, itemIndex }
  const [courseOfferingDetails, setCourseOfferingDetails] = useState({});
  const [isDeleting, setIsDeleting] = useState(false); // Add a loading state
  const [responseDeadline, setResponseDeadline] = useState(""); // State for the date input

  const formatTimeSlots = (timeSlotData) => {
    if (!timeSlotData) return "";

    const slots = Array.isArray(timeSlotData) ? timeSlotData : [timeSlotData];
    if (slots.length === 0) return "";

    const dayAbbreviations = {
      'Monday': 'M', 'Tuesday': 'T', 'Wednesday': 'W', 'Thursday': 'Th', 'Friday': 'F'
    };

    const formattedSlots = slots.map(slot => {
      const dayAbbr = dayAbbreviations[slot.day] || slot.day.slice(0, 2);
      const startTime = slot.start_time.slice(0, 5);
      const endTime = slot.end_time.slice(0, 5);
      return `${dayAbbr} ${startTime}-${endTime}`;
    });

    return ` | ${formattedSlots.join(', ')}`;
  };

  const openConfirmDialog = (offerId, itemIndex) => {
    setOfferToDelete({ offerId, itemIndex });
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    setIsDeleting(true); // Set loading state to true
    const { offerId, itemIndex } = offerToDelete;

    const offerToModify = offers.find((o) => o.offer_id === offerId);
    if (!offerToModify) {
      console.error("Could not find the offer to modify.");
      setShowConfirmDialog(false);
      setIsDeleting(false);
      return;
    }

    const remainingItems = offerToModify.offer_items.filter((_, idx) => idx !== itemIndex);

    const payloadItems = remainingItems.map(item => {
      const basePayload = {
        item_type: item.item_type,
        course_offering_id: item.course_offering_id || null,
        shared_session_id: item.shared_session_id || null,
      };

      if (item.time_slot) {
        const slot = Array.isArray(item.time_slot) ? item.time_slot[0] : item.time_slot;
        if (slot) {
          basePayload.time_slot = {
            day: slot.day_code || (slot.day ? slot.day.toLowerCase() : ''),
            start_time: slot.start_time,
            end_time: slot.end_time,
          };
        }
      }
      return basePayload;
    });

    try {
      if (payloadItems.length === 0) {
        await deleteOffer(offerId);
      } else {
        await editOffer(offerId, { offer_items: payloadItems });
      }

      // This is the crucial step. Calling fetchOffers() will re-fetch the entire
      // list of offers and update the state in the parent component,
      // which then re-renders this component with the fresh data.
      await fetchOffers();

    } catch (err) {
      console.error("Failed to update offer:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setShowConfirmDialog(false);
      setOfferToDelete(null);
      setIsDeleting(false); // Reset loading state
    }
  };


  const transferAddedOffersToActive = () => {
    setActiveOffers((prev) => {
      const merged = [...prev];
      offers.forEach((draftOffer) => {
        const existing = merged.find((o) => o.offer_id === draftOffer.offer_id);
        if (existing) {
          const newItems = draftOffer.offer_items.filter(
            (newItem) =>
              !existing.offer_items.some(
                (existingItem) =>
                  existingItem.sectionId === newItem.sectionId &&
                  existingItem.course_number === newItem.course_number
              )
          );
          existing.offer_items.push(...newItems);
        } else {
          merged.push({ ...draftOffer });
        }
      });
      return merged;
    });

    setOffers([]);
  };

  const handleSendOffers = async () => {
    const offersToSend = offers.filter((offer) => offer.status === "draft" && offer.offer_items.length > 0);
    if (offersToSend.length === 0) {
      console.warn("No offers with items to send.");
      return;
    }

    if (!responseDeadline) {
      alert("Please set a response deadline before sending offers.");
      return;
    }

    // Convert the selected date (YYYY-MM-DD) to a full ISO string for the backend.
    // We'll set the deadline to the end of the selected day in UTC.
    const deadlineISO = new Date(responseDeadline);
    deadlineISO.setUTCHours(23, 59, 59, 999);

    for (const offer of offersToSend) {
      try {
        console.log(`Sending offer for student: ${offer.student.name} (Offer ID: ${offer.offer_id})`);
        const response = await sendOffer(deadlineISO.toISOString(), offer.offer_id);
        console.log("Response from sendOffer:", response);
        if (response.status === "pending") {
          setActiveOffers((prev) => [...prev, response]);
        }
      } catch (error) {
        console.error(`Failed to send offer ${offer.offer_id}:`, error);
        // You could add more sophisticated error handling here, like
        // showing a toast notification or storing failed offers.
      }
    }

    // After attempting to send all offers, refresh the offers list to reflect status changes
    try {
      const refreshedOffers = await fetchOffers();
      console.log("refreshedOffers after sending offers:", refreshedOffers);
      setOffers(refreshedOffers);
      setActiveOffers(refreshedOffers.filter(o => o.status === "pending"));
    } catch (err) {
      console.error("Failed to fetch updated offers after sending:", err);
    }
  };

  const getCourseOfferingDetails = async (courseOfferingId) => {
    try {
      const courseOfferingDetails = await fetchCourseOfferingDetails(courseOfferingId);
      console.log("Course Offering Details in courseOfferingDetails:", courseOfferingDetails);
      return courseOfferingDetails;

    } catch (error) {
      console.error("Error fetching course offering details:", error);
      return null;
    }
  };
  /*
  return (
    <div className="space-y-4">
      {offers.length === 0 && (
        <p className="text-muted-foreground">No offers have been added yet.</p>
      )}
    */
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Draft Offers</CardTitle>
          <CardDescription>
            These are the draft offers that have been created for shortlisted applicants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const filteredOffers = offers.filter(
              (offer) => offer.status === "draft" && offer.offer_items.length > 0
            );

            if (filteredOffers.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center">
                  No draft offers at the moment.
                </p>
              );
            }

            return (
              <div className="space-y-4">
                {filteredOffers.map((offer) => (
                  <Card key={offer.offer_id} className="border border-border">
                    <CardHeader>
                      <CardTitle>{offer.student.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {offer.offer_items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-2 py-1"
                          >
                            <span>
                              {item.course_number} - {item.course_name} (
                              {item.section_type_display} {item.section_number})
                              <span className="text-xs text-gray-500 ml-2">
                                {formatTimeSlots(item.time_slot)}
                              </span>
                            </span>
                            <button
                              onClick={() => openConfirmDialog(offer.offer_id, idx)}
                              title="Remove"
                              className="w-6 h-6 flex items-center justify-center border border-red-300 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" strokeWidth={3} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
      {offers.some((offer) => offer.status === "draft" && offer.offer_items.length > 0) && (
        <div className="flex justify-end items-center gap-4 p-4 border-t">
          <div className="flex items-center gap-2">
            <label htmlFor="deadline-date" className="text-sm font-medium">
              Response Deadline:
            </label>
            <input
              type="date"
              id="deadline-date"
              value={responseDeadline}
              onChange={(e) => setResponseDeadline(e.target.value)}
              // Set min date to today to prevent selecting past dates
              min={new Date().toISOString().split('T')[0]}
              className="p-2 border rounded-md text-sm"
            />
          </div>
          <Button onClick={handleSendOffers} disabled={!responseDeadline}>
            Send All Draft Offers
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Course Section</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this course offering or shared session?</p>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddedOffersTab;
