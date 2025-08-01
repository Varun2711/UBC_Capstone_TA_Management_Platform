import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchCourseOfferingDetails, editOffer, sendOffer } from "@/logic/coordinator-allocations-page";

const AddedOffersTab = ({
  offers,
  setOffers,
  fetchOffers,
  activeOffers,
  setActiveOffers,
  studentCurrentHours,
  setStudentCurrentHours,
  fetchAndSetOffers,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null); // { offerId, itemIndex }
  const [courseOfferingDetails, setCourseOfferingDetails] = useState({});

  // Declare the function inside the component
  const generateResponseDeadline = () => {
    const now = new Date();
    // Add 7 days to the current date
    now.setDate(now.getDate() + 7);

    // Set the time to 23:59:59 UTC
    now.setUTCHours(23);
    now.setUTCMinutes(59);
    now.setUTCSeconds(59);
    now.setUTCMilliseconds(0); // Ensure milliseconds are zeroed out

    // Format to ISO string and append 'Z' for UTC
    return now.toISOString().slice(0, 19) + 'Z';
  };

  // Initialize responseDeadline with the generated value
  const [responseDeadline, setResponseDeadline] = useState(generateResponseDeadline());
  console.log("responseDeadline in AddedOffersTab: ", responseDeadline);

  const openConfirmDialog = (offerId, itemIndex) => {
    setOfferToDelete({ offerId, itemIndex });
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    const { offerId, itemIndex } = offerToDelete;

    // Find the specific offer being modified
    const offerToModify = offers.find((o) => o.offer_id === offerId);
    if (!offerToModify) {
      console.error("Could not find the offer to modify.");
      setShowConfirmDialog(false);
      setOfferToDelete(null);
      return;
    }

    // Create the updated list of items by filtering out the one to be deleted
    const updatedOfferItems = offerToModify.offer_items.filter((_, idx) => idx !== itemIndex);

    // Prepare the data payload for the API
    const dataToUpdate = {
      offer_items: updatedOfferItems.map(item => ({
        // Re-construct the payload to ensure it matches what the backend expects
        item_type: item.item_type,
        course_offering_id: item.course_offering_id,
        shared_session_id: item.shared_session_id,
        time_slot: item.time_slot, // Ensure this is in the correct format if needed
      })),
      notes: offerToModify.notes, // Preserve existing notes
    };

    setShowConfirmDialog(false);
    setOfferToDelete(null);

    try {
      // If there are still items left, call editOffer.
      // If not, the backend should handle deleting the offer if it's empty,
      // or you could call a deleteOffer function here instead.
      if (updatedOfferItems.length > 0) {
        console.log("Calling editOffer to update items...");
        await editOffer(offerId, dataToUpdate);
      } else {
        // Optional: If the offer is now empty, you might want to delete it entirely.
        // This depends on your application's logic.
        // For now, we'll just update it to be empty.
        console.log("Offer is now empty, updating with no items...");
        await editOffer(offerId, dataToUpdate);
      }

      // Refresh the offers from the backend to ensure UI is in sync
      await fetchAndSetOffers();

    } catch (err) {
      console.error("Failed to update offer after deleting an item:", err);
      alert("An error occurred while removing the item. Please refresh and try again.");
      // Even on error, try to refresh to get the latest state
      await fetchAndSetOffers();
      
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
    // Filter out offers that have no items
    const offersToSend = offers.filter((offer) => offer.status === "draft" && offer.offer_items.length > 0);
    console.log("offersToSend: ", offersToSend);
    if (offersToSend.length === 0) {
      console.warn("No offers with items to send.");
      return;
    }

    // You might want to get the response deadline from a user input here
    // For this example, we're using a default or a state variable `responseDeadline`.
    if (!responseDeadline) {
      alert("Please set a response deadline before sending offers.");
      return;
    }

    for (const offer of offersToSend) {
      try {
        console.log(`Sending offer for student: ${offer.student.name} (Offer ID: ${offer.offer_id})`);
        const response = await sendOffer(responseDeadline, offer.offer_id);
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
        <div className="flex justify-end p-4">
          <Button onClick={handleSendOffers}>Send Offer</Button>
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
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddedOffersTab;
